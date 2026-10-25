/**
 * 部件拆解数据。
 * 说明：字形部件的边界来自汉字学界公认的构形分析，
 * 与数据集 SVG 的描摹路径无关——SVG 描摹的是整字轮廓，
 * 部件动画采用"部件实体单独绘制 + 组合位移"的方式实现。
 * 每条注明造字法；有学术争议处标注"一说"。
 */
export interface Part {
  name: string
  note: string
  /** 部件在合成字中的位置：left / right / top / bottom / center */
  pos: 'left' | 'right' | 'top' | 'bottom' | 'center'
}

export interface Decomposition {
  char: string
  method: string
  methodNote: string
  /** 一句话构形解析 */
  gloss: string
  parts: Part[]
  /** 该字是否在数据集 60 字内（决定能否跳转到字源卡） */
  inLibrary: boolean
}

export const DECOMPOSITIONS: Record<string, Decomposition> = {
  人: {
    char: '人',
    method: '象形',
    methodNote: '一说指事',
    gloss: '独体象形。摹人侧身而立之状，一撇为脊，一竖为躯，不可拆为更小的部件。',
    parts: [{ name: '人', note: '独体象形，不可拆解', pos: 'center' }],
    inLibrary: true,
  },
  明: {
    char: '明',
    method: '会意',
    methodNote: '一说形声，从日，月声',
    gloss: '日月光辉，明亮之意。左右双声，字形取日月并列为明。',
    parts: [
      { name: '日', note: '太阳之光', pos: 'left' },
      { name: '月', note: '月亮之光', pos: 'right' },
    ],
    inLibrary: true,
  },
  休: {
    char: '休',
    method: '会意',
    methodNote: '',
    gloss: '人倚于树，引申为歇息、停止。',
    parts: [
      { name: '人', note: '人之形', pos: 'left' },
      { name: '木', note: '树木', pos: 'right' },
    ],
    inLibrary: false,
  },
  男: {
    char: '男',
    method: '会意',
    methodNote: '',
    gloss: '田与力并用，谓田间出力耕作之人。',
    parts: [
      { name: '田', note: '农田', pos: 'top' },
      { name: '力', note: '耕作之力', pos: 'bottom' },
    ],
    inLibrary: true,
  },
  牧: {
    char: '牧',
    method: '形声',
    methodNote: '',
    gloss: '从牛，攴声，本义放牧牲畜。',
    parts: [
      { name: '牛', note: '所牧之牛', pos: 'left' },
      { name: '攵', note: '声符，击打之形', pos: 'right' },
    ],
    inLibrary: true,
  },
  初: {
    char: '初',
    method: '形声',
    methodNote: '',
    gloss: '从刀，衣声，本义裁衣之始。',
    parts: [
      { name: '衤', note: '衣字旁', pos: 'left' },
      { name: '刀', note: '声符', pos: 'right' },
    ],
    inLibrary: true,
  },
  清: {
    char: '清',
    method: '形声',
    methodNote: '',
    gloss: '从水，青声，水清则澄。',
    parts: [
      { name: '氵', note: '水形旁', pos: 'left' },
      { name: '青', note: '声符', pos: 'right' },
    ],
    inLibrary: false,
  },
  情: {
    char: '情',
    method: '形声',
    methodNote: '',
    gloss: '从心，青声，心之所感为情。',
    parts: [
      { name: '忄', note: '心形旁', pos: 'left' },
      { name: '青', note: '声符', pos: 'right' },
    ],
    inLibrary: false,
  },
  想: {
    char: '想',
    method: '会意',
    methodNote: '一说形声，从心，相声',
    gloss: '相心而思，谓心中有所想。',
    parts: [
      { name: '相', note: '省形，察视', pos: 'top' },
      { name: '心', note: '心形', pos: 'bottom' },
    ],
    inLibrary: false,
  },
  林: {
    char: '林',
    method: '会意',
    methodNote: '',
    gloss: '二木并峙为林，树木成群。',
    parts: [
      { name: '木', note: '树木', pos: 'left' },
      { name: '木', note: '树木', pos: 'right' },
    ],
    inLibrary: false,
  },
  好: {
    char: '好',
    method: '会意',
    methodNote: '',
    gloss: '女子为美，男子为善，会意为美好。',
    parts: [
      { name: '女', note: '女子', pos: 'left' },
      { name: '子', note: '男子', pos: 'right' },
    ],
    inLibrary: false,
  },
  安: {
    char: '安',
    method: '会意',
    methodNote: '',
    gloss: '宀覆女于下，谓居家安宁。',
    parts: [
      { name: '宀', note: '屋顶', pos: 'top' },
      { name: '女', note: '女子', pos: 'bottom' },
    ],
    inLibrary: false,
  },
  和: {
    char: '和',
    method: '形声',
    methodNote: '一说会意',
    gloss: '从口，禾声，本义音声相和。',
    parts: [
      { name: '口', note: '口形旁', pos: 'left' },
      { name: '禾', note: '声符', pos: 'right' },
    ],
    inLibrary: false,
  },
  眾: {
    char: '众',
    method: '会意',
    methodNote: '',
    gloss: '三人成众，人多则力大。',
    parts: [
      { name: '人', note: '人', pos: 'top' },
      { name: '人', note: '人', pos: 'left' },
      { name: '人', note: '人', pos: 'right' },
    ],
    inLibrary: false,
  },
  沐: {
    char: '沐',
    method: '形声',
    methodNote: '',
    gloss: '从水，木声，本义洗发。',
    parts: [
      { name: '氵', note: '水形旁', pos: 'left' },
      { name: '木', note: '声符', pos: 'right' },
    ],
    inLibrary: false,
  },
  相: {
    char: '相',
    method: '会意',
    methodNote: '',
    gloss: '木与目相接，谓省视、观察。',
    parts: [
      { name: '木', note: '树', pos: 'left' },
      { name: '目', note: '眼', pos: 'right' },
    ],
    inLibrary: false,
  },
  尖: {
    char: '尖',
    method: '会意',
    methodNote: '',
    gloss: '上小下大，谓尖锐。',
    parts: [
      { name: '小', note: '小', pos: 'top' },
      { name: '大', note: '大', pos: 'bottom' },
    ],
    inLibrary: false,
  },
  从: {
    char: '从',
    method: '会意',
    methodNote: '',
    gloss: '二人相随为从，本义跟随。',
    parts: [
      { name: '人', note: '人', pos: 'left' },
      { name: '人', note: '人', pos: 'right' },
    ],
    inLibrary: false,
  },
  兵: {
    char: '兵',
    method: '会意',
    methodNote: '',
    gloss: '双手持斤，本义兵器。',
    parts: [
      { name: '斤', note: '兵器', pos: 'top' },
      { name: '廾', note: '双手', pos: 'bottom' },
    ],
    inLibrary: false,
  },
  環: {
    char: '环',
    method: '形声',
    methodNote: '',
    gloss: '从玉，睘声，本义玉环。',
    parts: [
      { name: '王', note: '玉形旁', pos: 'left' },
      { name: '睘', note: '声符', pos: 'right' },
    ],
    inLibrary: true,
  },
  漢: {
    char: '汉',
    method: '形声',
    methodNote: '',
    gloss: '从水，堇声，本义水名。',
    parts: [
      { name: '氵', note: '水形旁', pos: 'left' },
      { name: '堇', note: '声符', pos: 'right' },
    ],
    inLibrary: true,
  },
  車: {
    char: '车',
    method: '象形',
    methodNote: '',
    gloss: '画车之形，中为车厢，两轮在外。',
    parts: [
      { name: '车', note: '独体象形，不可拆', pos: 'center' },
    ],
    inLibrary: true,
  },
  雨: {
    char: '雨',
    method: '象形',
    methodNote: '一说会意',
    gloss: '一横为天，四点为雨滴，象天空落雨之形。',
    parts: [
      { name: '一', note: '天', pos: 'top' },
      { name: '灬', note: '雨滴', pos: 'bottom' },
    ],
    inLibrary: true,
  },
  樂: {
    char: '乐',
    method: '形声',
    methodNote: '',
    gloss: '从木，幺声，本义丝弦木柱乐器。',
    parts: [
      { name: '木', note: '乐器之柄', pos: 'bottom' },
      { name: '幺', note: '声符，丝弦', pos: 'top' },
    ],
    inLibrary: true,
  },
  念: {
    char: '念',
    method: '形声',
    methodNote: '一说会意',
    gloss: '从心，今声，本义诵读。',
    parts: [
      { name: '今', note: '声符', pos: 'top' },
      { name: '心', note: '心形', pos: 'bottom' },
    ],
    inLibrary: true,
  },
  武: {
    char: '武',
    method: '会意',
    methodNote: '',
    gloss: '止戈为武，谓止戈为武。',
    parts: [
      { name: '止', note: '止', pos: 'left' },
      { name: '戈', note: '戈', pos: 'right' },
    ],
    inLibrary: true,
  },
}

/** 部件位置对应的 CSS 变换 */
export const PART_TRANSFORM: Record<Part['pos'], { x: number; y: number; scale: number }> = {
  left: { x: -170, y: 0, scale: 0.82 },
  right: { x: 170, y: 0, scale: 0.82 },
  top: { x: 0, y: -120, scale: 0.82 },
  bottom: { x: 0, y: 120, scale: 0.82 },
  center: { x: 0, y: 0, scale: 1 },
}
