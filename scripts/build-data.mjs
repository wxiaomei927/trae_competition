import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const PACK = 'D:/竞赛/Trae/“AI x 文学”数据包/“AI x 文学”数据包/题四_字源_一个汉字的形音义溯源/【发放给参赛队伍】汉字形音义溯源数据包'
const IMG = path.join(PACK, 'glyph_evolution', 'images')
const PUBLIC_GLYPH = path.join(ROOT, 'public', 'glyphs')

function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const src = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c === '\r') { /* skip */ }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  const header = rows.shift()
  return rows
    .filter(r => r.length > 1 && r.some(v => v.trim() !== ''))
    .map(r => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}

const meaningRows = parseCSV(fs.readFileSync(path.join(PACK, 'meaning_evolution.csv'), 'utf8'))
const phonologyRows = parseCSV(fs.readFileSync(path.join(PACK, 'phonology.csv'), 'utf8'))

const ERA_ORDER = [
  { era: '甲骨文', file: '01_甲骨文.svg' },
  { era: '金文', file: '02_金文.svg' },
  { era: '小篆', file: '03_小篆.svg' },
  { era: '隶书', file: '04_隶书.svg' },
  { era: '楷书', file: '05_楷书.png' },
]

const chars = fs.existsSync(IMG) ? fs.readdirSync(IMG) : []
const result = {}

for (const dir of chars) {
  const dirPath = path.join(IMG, dir)
  if (!fs.statSync(dirPath).isDirectory()) continue

  const frames = []
  for (const { era, file } of ERA_ORDER) {
    const src = path.join(dirPath, file)
    if (!fs.existsSync(src)) continue
    const ext = path.extname(file).slice(1)
    const outName = `${dir}/${file}`
    const dest = path.join(PUBLIC_GLYPH, outName)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
    frames.push({ era, type: ext, src: `/glyphs/${outName}` })
  }
  if (!frames.length) continue

  const meanings = meaningRows
    .filter(r => r['字头'] === dir)
    .sort((a, b) => Number(a['义项序号']) - Number(b['义项序号']))
    .map(r => ({
      seq: Number(r['义项序号']),
      type: r['类型'],
      gloss: r['释义'],
      era: r['年代'],
      quote: r['书证原句'],
      source: r['出处'],
      translation: r['白话翻译'],
      note: r['备注'],
    }))

  const phonetics = phonologyRows
    .filter(r => r['字头'] === dir)
    .sort((a, b) => Number(a['读音序']) - Number(b['读音序']))
    .map(r => ({
      seq: Number(r['读音序']),
      modern: r['现代读音'],
      fanqie: r['广韵反切'],
      shengmu: r['中古声母'],
      yunmu: r['中古韵目'],
      tone: r['中古声调'],
      guangyun: r['郑张上古拟音'],
      meaningRef: r['对应义项'],
      note: r['备注'],
    }))

  result[dir] = { char: dir, frames, meanings, phonetics, hasAnalysis: false }
}

const outDir = path.join(ROOT, 'src', 'data')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'characters.json'), JSON.stringify(result, null, 0), 'utf8')

const frameStat = {}
for (const c of Object.values(result)) frameStat[c.frames.length] = (frameStat[c.frames.length] || 0) + 1
console.log(`字总数: ${Object.keys(result).length}`)
console.log(`帧数分布:`, frameStat)
console.log(`有义项: ${Object.values(result).filter(c => c.meanings.length).length}`)
console.log(`有读音: ${Object.values(result).filter(c => c.phonetics.length).length}`)
console.log(`多音字: ${Object.values(result).filter(c => c.phonetics.length > 1).length}`)
console.log(`帧不满4: ${Object.values(result).filter(c => c.frames.length < 4).map(c => c.char).join(' ')}`)
console.log(`→ src/data/characters.json 已生成`)
