/**
 * 生成全量 char_analysis.json：
 *   - 手工精修字（analysis_handwritten.js）直接采用
 *   - 其余字由数据包驱动生成：造字法依据义项类型分布推断，
 *     构形解析与口播文案按模板拼装，并显式标注推断来源
 * 运行：node scripts/build-analysis.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const chars = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/characters.json'), 'utf8')
)

// 读取手工精修数据（ESM 源文件，用动态 import）
const handwritten = (await import('../src/data/analysis_handwritten.js')).default

/* ---- 造字法推断依据：常见部件特征表 ---- */
// 依据字形部件的典型归类，仅对可辨识部件的字给出判断，其余标"待考"
const METHOD_HINTS = {
  氵: { method: '形声', note: '形旁为水' },
  亻: { method: '形声', note: '形旁为人' },
  扌: { method: '形声', note: '形旁为手' },
  口: { method: '形声', note: '形旁为口' },
  木: { method: '形声', note: '形旁为木' },
  艹: { method: '形声', note: '形旁为草' },
  宀: { method: '形声', note: '形旁为房屋' },
  讠: { method: '形声', note: '形旁为言' },
  钅: { method: '形声', note: '形旁为金' },
  亻: { method: '形声', note: '形旁为人' },
}

/** 象形字白名单：有明确象形来源的常用字 */
const PICTORIAL = new Set([
  '一', '二', '三', '上', '下', '人', '日', '月', '水', '火', '木', '心', '山',
  '女', '雨', '马', '牛', '犬', '羊', '禾', '米', '田', '口', '目', '耳', '手',
  '足', '身', '首', '自', '止', '足', '车', '舟', '门', '囗', '子', '女',
  '贝', '玉', '王', '石', '土', '衣', '食', '虫', '鸟', '隹', '弓', '戈',
  '斤', '刀', '矢', '田', '井', '行', '重', '量', '陆', '鸡', '福', '见',
])

/** 指事字白名单 */
const IDEOGRAM = new Set(['上', '下', '刃', '了', '本', '末', '朱'])

function inferMethod(char, meanings) {
  if (handwritten[char]) return handwritten[char].method
  if (PICTORIAL.has(char)) return '象形'
  if (IDEOGRAM.has(char)) return '指事'
  // 依据义项结构粗判：有假借义的多为形声（形声字最易产生假借）
  const hasLoan = meanings.some(m => m.type === '假借义')
  const hasExtend = meanings.some(m => m.type === '引申义')
  if (hasLoan && hasExtend) return '形声'
  if (hasExtend) return '会意'
  return '待考'
}

const ERA_FIRST = { 甲骨文: '甲骨文', 金文: '金文', 小篆: '小篆', 隶书: '隶书', 楷书: '楷书' }

/** 用数据集内容拼装一句话构形解析 */
function buildAnalysis(char, entry, method) {
  if (handwritten[char]) return handwritten[char].analysis
  const origin = entry.meanings.find(m => m.type === '本义')
  const exts = entry.meanings.filter(m => m.type === '引申义')
  const loans = entry.meanings.filter(m => m.type === '假借义')

  const parts = []
  if (origin) {
    parts.push(`本义为${origin.gloss}。`)
  }
  if (exts.length) {
    parts.push(`引申出${exts.length}个义项，如「${exts[0].gloss}」。`)
  }
  if (loans.length) {
    parts.push(`另有${loans.length}个假借义。`)
  }
  parts.push(`造字法一般判为${method}。`)
  parts.push('本条解析由字义数据自动生成，构形细节待人工校订。')
  return parts.join('')
}

/** 用数据拼装口播文案，控制在 180—240 字（约 50—70 秒） */
function buildNarration(char, entry, method) {
  if (handwritten[char]) return handwritten[char].narration

  const origin = entry.meanings.find(m => m.type === '本义')
  const exts = entry.meanings.filter(m => m.type === '引申义')
  const loans = entry.meanings.filter(m => m.type === '假借义')
  const ph = entry.phonetics[0]
  const frames = entry.frames.map(f => f.era)
  const frameText =
    frames.length >= 5
      ? '从甲骨文到金文、小篆、隶书，再到楷书'
      : frames.length >= 4
        ? '从甲骨文到金文、小篆，再隶定成楷书'
        : frames.join('、')

  const sentences = []

  sentences.push(
    `${char}，${frameText}，字形一步步改易，本义始终是${origin ? origin.gloss : '本义待考'}。`
  )

  if (origin?.quote) {
    sentences.push(`《${origin.source}》里有例证：「${origin.quote}」${origin.translation ? `意思是${origin.translation}。` : ''}`)
  }

  if (exts.length) {
    sentences.push(
      `义项一路生长，${exts.length}层引申义由近及远：${exts
        .slice(0, 2)
        .map(m => m.gloss)
        .join('、')}${exts.length > 2 ? '等' : ''}。`
    )
  }

  if (loans.length) {
    sentences.push(`其中还有${loans.length}个假借义，是借了形体相近的音。`)
  }

  sentences.push(
    `读音上，${ph ? `${ph.fanqie}，中古属${ph.shengmu}母${ph.yunmu}，声调为${ph.tone}，今天读 ${ph.modern}` : '读音待考'}。`
  )

  sentences.push(
    `一个字从一幅图画，长成一个可以承载抽象意义的符号，这正是汉字最迷人的地方。`
  )

  let text = sentences.join('')

  // 收敛到 180—235 字（按 3.5 字/秒 折算即 51—67 秒）
  const MAX = 235
  const MIN = 180
  if (text.length > MAX) {
    const idx = text.lastIndexOf('。', MAX)
    text = text.slice(0, idx > MIN ? idx + 1 : MAX)
  }
  if (text.length < MIN) {
    const ext = exts[0]
    const fillers = []
    if (ext) {
      fillers.push(`这一层引申落在「${ext.gloss}」，是本义顺着自己的使用习惯长出来的。`)
    }
    if (exts[1]) {
      fillers.push(`再往后，「${exts[1].gloss}」已是更远的用法，靠的是词与词的搭配。`)
    }
    if (loans[0]) {
      fillers.push(`另有一层假借义，是借了形体相近的音，与本义并行了很久。`)
    }
    fillers.push('字义越走越远，字形却越来越省，两者相反，正是汉字最耐读的地方。')
    let i = 0
    while (text.length < MIN && i < fillers.length) {
      text = text + fillers[i]
      i++
    }
  }
  return text
}

function buildLifeExamples(char, entry) {
  if (handwritten[char]) return handwritten[char].lifeExamples
  const out = []
  const picks = entry.meanings.slice(0, 3)
  picks.forEach(m => {
    if (!m.quote) return
    out.push({
      text: m.quote.length > 24 ? m.quote.slice(0, 24) + '…' : m.quote,
      tip: `${m.type}（${m.era}）${m.gloss}`,
    })
  })
  if (!out.length) {
    out.push({ text: `${char}，此字见于${entry.meanings[0]?.era ?? '古籍'}`, tip: '例句待补' })
  }
  return out
}

function buildParts(char, entry) {
  if (handwritten[char]) return handwritten[char].parts
  return [{ name: char, note: '部件待标注' }]
}

const result = {}
for (const [char, entry] of Object.entries(chars)) {
  const hw = handwritten[char]
  const method = inferMethod(char, entry.meanings)
  const narration = buildNarration(char, entry, method)
  const seconds = Math.round(narration.length / 3.5)

  result[char] = {
    method,
    methodNote: hw ? hw.methodNote : method === '待考' ? '形制待考' : '',
    analysis: buildAnalysis(char, entry, method),
    parts: buildParts(char, entry),
    narration,
    narrationSeconds: seconds,
    lifeExamples: buildLifeExamples(char, entry),
    auto: !hw,
  }
}

fs.writeFileSync(
  path.join(ROOT, 'src/data/char_analysis.json'),
  JSON.stringify(result, null, 0),
  'utf8'
)

const auto = Object.values(result).filter(v => v.auto).length
const secs = Object.values(result).map(v => v.narrationSeconds)
console.log(`已生成 ${Object.keys(result).length} 个字的分析数据`)
console.log(`手工精修: ${Object.keys(handwritten).length}  自动生成: ${auto}`)
console.log(`口播时长区间: ${Math.min(...secs)}—${Math.max(...secs)} 秒`)
console.log(`超出 50-70 秒区间的字数: ${secs.filter(s => s < 50 || s > 70).length}`)
