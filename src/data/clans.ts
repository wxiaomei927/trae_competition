/**
 * 字族数据：按形旁归类，同族字共享一个语义部件。
 * 归类依据汉字学通行的形旁系统，部件取数据集内字形。
 */
export interface Clan {
  /** 形旁本身 */
  radical: string
  /** 形旁的名称 */
  radicalName: string
  /** 该部件的含义 */
  meaning: string
  /** 同族字（不含形旁本身） */
  members: string[]
  /** 该族的共同点说明 */
  note: string
}

export const CLANS: Clan[] = [
  {
    radical: '水',
    radicalName: '水部',
    meaning: '水',
    members: ['沈', '湛', '漢'],
    note: '三点水旁，皆与水有关。沈为水名，湛为水深清，漢本义亦水名。',
  },
  {
    radical: '日',
    radicalName: '日部',
    meaning: '太阳',
    members: ['明', '春', '曰'],
    note: '日旁，皆与日相关。明为日月之光，春为春日，曰为说话。',
  },
  {
    radical: '王',
    radicalName: '玉部',
    meaning: '玉',
    members: ['玉', '璧', '環'],
    note: '王字旁，实为玉字旁，是汉字中唯一以"王"作形旁的玉类字群。',
  },
  {
    radical: '貝',
    radicalName: '贝部',
    meaning: '贝壳',
    members: ['賜', '賞'],
    note: '貝字旁，与财物有关。賜为赏赐，賞为赏赐、酬赏。',
  },
  {
    radical: '木',
    radicalName: '木部',
    meaning: '树木',
    members: ['初', '牧'],
    note: '木字旁，与树木相关。初从衣刀声，牧从牛攴声，形旁皆取其义。',
  },
  {
    radical: '心',
    radicalName: '心部',
    meaning: '心思',
    members: ['念'],
    note: '心字底，与心理活动相关。念从心今声。',
  },
  {
    radical: '牛',
    radicalName: '牛部',
    meaning: '牛',
    members: ['牧'],
    note: '牛字旁，与畜牧相关。牧从牛，攴声。',
  },
  {
    radical: '辵',
    radicalName: '辵部',
    meaning: '行走',
    members: ['過'],
    note: '辵字底，与行走相关。過从辵咼声。',
  },
  {
    radical: '量',
    radicalName: '量部',
    meaning: '计量',
    members: ['重'],
    note: '与度量相关。重本义为重斤两，与量度相系。',
  },
]

/** 形旁本身在数据集内的字（用于取字形图） */
export const RADICAL_CHARS = CLANS.map(c => c.radical)
