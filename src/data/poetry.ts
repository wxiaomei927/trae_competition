/**
 * 字题：给一个字配一句诗。
 * 思路：从数据集的义项与书证中抽取意象词，再按格律模板组合，
 * 生成一句可朗读的短诗。全部本地计算，无网络依赖。
 */

/** 意象词库：按字归类，每个字给出可用意象与情绪基调 */
export interface Imagery {
  images: string[]
  mood: string
  scenes: string[]
}

export const IMAGERY: Record<string, Imagery> = {
  人: { images: ['归人', '孤影', '灯下人'], mood: '孤寂', scenes: ['长街尽头', '雪夜归途', '空屋独坐'] },
  日: { images: ['斜阳', '日影', '白日'], mood: '苍茫', scenes: ['黄昏原野', '深山古寺', '荒漠孤烟'] },
  月: { images: ['月色', '桂影', '清辉'], mood: '清冷', scenes: ['西窗夜话', '江上孤舟', '雪夜小院'] },
  水: { images: ['寒潭', '细流', '江水'], mood: '澄澈', scenes: ['石上清泉', '大江东去', '雨后池塘'] },
  火: { images: ['炉火', '烛照', '星火'], mood: '炽烈', scenes: ['深夜灶前', '荒原篝火', '寒窗一豆'] },
  木: { images: ['古木', '枯枝', '年轮'], mood: '苍劲', scenes: ['深山老林', '古道瘦马', '庭前新绿'] },
  心: { images: ['心事', '旧梦', '灯花'], mood: '幽微', scenes: ['夜半不寐', '对影自怜', '风雪客舍'] },
  山: { images: ['远山', '乱石', '云雾'], mood: '高远', scenes: ['空谷回声', '登临远眺', '雪岭孤峰'] },
  女: { images: ['红袖', '罗衣', '素手'], mood: '含蓄', scenes: ['楼头凝望', '西窗剪烛', '灯下缝衣'] },
  雨: { images: ['细雨', '疏帘', '檐溜'], mood: '潮湿', scenes: ['烟雨江南', '寒夜听雨', '荷塘烟色'] },
  马: { images: ['骏马', '长嘶', '蹄声'], mood: '奔放', scenes: ['古道西风', '边关落照', '春草初生'] },
  走: { images: ['远行', '尘迹', '归途'], mood: '奔波', scenes: ['古道长亭', '异乡月明', '负剑独行'] },
  见: { images: ['重逢', '故人', '窗外'], mood: '怅然', scenes: ['久别重逢', '蓦然回首', '故园东望'] },
  言: { images: ['低语', '书信', '旧约'], mood: '含蓄', scenes: ['灯下题诗', '临别赠言', '隔墙听语'] },
  力: { images: ['筋骨', '弓弦', '田垄'], mood: '坚韧', scenes: ['负薪而行', '农田深耕', '角力场中'] },
  念: { images: ['心事', '旧简', '灯花'], mood: '缠绵', scenes: ['长夜相思', '书斋独坐', '檐雨滴阶'] },
  春: { images: ['新柳', '桃符', '暖阳'], mood: '明快', scenes: ['东风解冻', '江南烟雨', '田间初绿'] },
  明: { images: ['月华', '灯火', '曙色'], mood: '澄明', scenes: ['雪夜挑灯', '月到中庭', '破晓推窗'] },
  城: { images: ['孤城', '暮鼓', '长堞'], mood: '苍凉', scenes: ['边关落照', '城下夜宿', '雁过危楼'] },
  衣: { images: ['素衣', '寒裘', '旧襟'], mood: '清苦', scenes: ['天涯羁旅', '寒江独钓', '空室衣香'] },
  食: { images: ['粗粮', '粥香', '炊烟'], mood: '平淡', scenes: ['寒夜煮饭', '灶前小儿', '陋室三餐'] },
  车: { images: ['车辙', '铃铎', '长路'], mood: '驰骋', scenes: ['古道行车', '雪原辇车', '渡口停驻'] },
}

/** 诗句模板：{i} 意象、{s} 场景、{m} 情绪 */
const TEMPLATES: { t: string; style: string }[] = [
  { t: '{s}，{i}落如霜。', style: '五言' },
  { t: '{i}照{s}，{m}入字中。', style: '五言' },
  { t: '{s}无人问，{i}自成双。', style: '五言' },
  { t: '{m}在{s}，{i}落纸上。', style: '五言' },
  { t: '字里有{i}，{s}见{m}。', style: '短句' },
  { t: '{i}落纸上，{s}起{m}。', style: '短句' },
  { t: '欲问{i}深处，{s}是{m}。', style: '七言' },
  { t: '{s}风忽起，{i}自飘零。', style: '七言' },
  { t: '{i}藏此字，{m}几人知。', style: '七言' },
  { t: '问此字何意，{s}见{m}。', style: '七言' },
  { t: '{s}无人问，{i}照谁人。', style: '七言' },
  { t: '{i}在{s}，{m}字中生。', style: '七言' },
]

/** 确定性伪随机：同一字每次结果一致，避免刷新就变 */
function seededRandom(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Poem {
  text: string
  style: string
  char: string
}

/** 为一个字生成三句候选诗 */
export function makePoems(char: string): Poem[] {
  const img = IMAGERY[char]
  if (!img) return []
  const rand = seededRandom(char)

  // 为三句诗分别分配不重复的意象与场景
  const images = shuffleWith(img.images, rand)
  const scenes = shuffleWith(img.scenes, rand)

  const picked = TEMPLATES.slice()
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[picked[i], picked[j]] = [picked[j], picked[i]]
  }

  return picked.slice(0, 3).map((tp, k) => {
    const image = images[k % images.length]
    const scene = scenes[k % scenes.length]
    const text = tp.t
      .split('{i}').join(image)
      .split('{s}').join(scene)
      .split('{m}').join(img.mood)
    return { text, style: tp.style, char }
  })
}

/** 带种子的洗牌，保证同一字每次结果一致 */
function shuffleWith<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
