/**
 * 字源卡绘制：可复用于单张导出与批量出卡。
 * 输出 750×1060 的 PNG 画布内容，含字形演变带、读音、义项与印章。
 */

export interface CardFrame {
  era: string
  type: string
  src: string
}

export interface CardMeaning {
  seq: number
  type: string
  gloss: string
  era: string
  quote: string
  source: string
  translation: string
}

export interface CardPhonetic {
  seq: number
  modern: string
  fanqie: string
  shengmu: string
  yunmu: string
  tone: string
  guangyun: string
  meaningRef: string
}

export interface CardAnalysis {
  method: string
  methodNote: string
  analysis: string
  narration: string
  narrationSeconds: number
}

const W = 750
const H = 1060

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(img)
    img.src = src
  })
}

export async function drawCard(
  canvas: HTMLCanvasElement,
  char: string,
  frames: CardFrame[],
  meanings: CardMeaning[],
  phonetics: CardPhonetic[],
  analysis?: CardAnalysis
): Promise<void> {
  canvas.width = W * 2
  canvas.height = H * 2
  canvas.style.width = W + 'px'
  canvas.style.height = H + 'px'
  const g = canvas.getContext('2d')
  if (!g) return
  g.scale(2, 2)
  g.textBaseline = 'top'

  /* ---- 宣纸底 ---- */
  g.fillStyle = '#f3ece0'
  g.fillRect(0, 0, W, H)
  const vg = g.createRadialGradient(W / 2, H * 0.36, 60, W / 2, H * 0.36, W * 0.8)
  vg.addColorStop(0, 'rgba(250,246,238,1)')
  vg.addColorStop(1, 'rgba(233,223,205,1)')
  g.fillStyle = vg
  g.fillRect(0, 0, W, H)

  /* ---- 边框 ---- */
  g.strokeStyle = 'rgba(35,32,28,0.2)'
  g.lineWidth = 1
  g.strokeRect(28.5, 28.5, W - 57, H - 57)
  g.strokeStyle = 'rgba(35,32,28,0.09)'
  g.strokeRect(40.5, 40.5, W - 81, H - 81)

  /* ---- 字头 ---- */
  g.fillStyle = '#23201c'
  g.font = '400 62px "Kaiti SC","STKaiti","KaiTi",serif'
  g.fillText(char, 76, 84)

  g.fillStyle = '#b4432f'
  g.font = '400 21px "Kaiti SC","STKaiti","KaiTi",serif'
  g.fillText(analysis?.method ?? '造字法待考', 160, 104)

  if (analysis?.methodNote) {
    g.fillStyle = '#8a8175'
    g.font = '15px "Microsoft YaHei",sans-serif'
    g.fillText(analysis.methodNote, 160, 133)
  }

  /* ---- 字形演变带 ---- */
  const stripY = 208
  const cellW = 128
  const startX = 76
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i]
    const x = startX + i * cellW
    g.fillStyle = 'rgba(35,32,28,0.045)'
    g.fillRect(x, stripY, 112, 132)
    g.strokeStyle = 'rgba(35,32,28,0.1)'
    g.strokeRect(x + 0.5, stripY + 0.5, 111, 131)

    const img = await loadImage(f.src)
    g.save()
    g.globalCompositeOperation = 'multiply'
    try {
      g.drawImage(img, x + 16, stripY + 14, 80, 80)
    } catch {
      /* ignore */
    }
    g.restore()

    g.fillStyle = '#4a443c'
    g.font = '15px "Kaiti SC","STKaiti","KaiTi",serif'
    g.textAlign = 'center'
    g.fillText(f.era, x + 56, stripY + 104)
    g.textAlign = 'left'
  }

  /* ---- 读音 ---- */
  let y = 392
  g.fillStyle = '#23201c'
  g.font = '400 19px "Kaiti SC","STKaiti","KaiTi",serif'
  g.fillText('读音', 76, y)
  y += 32
  for (const p of phonetics.slice(0, 3)) {
    g.fillStyle = '#23201c'
    g.font = '400 22px "Kaiti SC","STKaiti","KaiTi",serif'
    g.fillText(p.modern, 76, y)
    g.fillStyle = '#8a8175'
    g.font = '16px "FangSong","STFangsong",serif'
    g.fillText(`${p.fanqie}　${p.shengmu}${p.yunmu}　${p.tone}`, 128, y + 2)
    if (p.meaningRef) {
      g.fillStyle = '#5a7a6a'
      g.font = '14px "Microsoft YaHei",sans-serif'
      g.fillText(p.meaningRef, 128, y + 24)
    }
    y += 52
  }

  /* ---- 分隔 ---- */
  g.strokeStyle = 'rgba(35,32,28,0.12)'
  g.beginPath()
  g.moveTo(76, y + 6)
  g.lineTo(W - 76, y + 6)
  g.stroke()
  y += 32

  /* ---- 义项 ---- */
  g.fillStyle = '#23201c'
  g.font = '400 19px "Kaiti SC","STKaiti","KaiTi",serif'
  g.fillText('义项', 76, y)
  y += 32
  for (const m of meanings.slice(0, 3)) {
    g.fillStyle = '#b4432f'
    g.font = '14px "Microsoft YaHei",sans-serif'
    g.fillText(`${m.type}　${m.era}`, 76, y)
    g.fillStyle = '#23201c'
    g.font = '19px "FangSong","STFangsong",serif'
    g.fillText(m.gloss, 76, y + 24)
    if (m.quote) {
      g.fillStyle = '#4a443c'
      g.font = '17px "Songti SC","SimSun",serif'
      const q = m.quote.length > 22 ? m.quote.slice(0, 22) + '…' : m.quote
      g.fillText(q, 76, y + 52)
      g.fillStyle = '#8a8175'
      g.font = '13px "Microsoft YaHei",sans-serif'
      g.fillText(m.source ?? '', 76, y + 74)
    }
    y += 108
  }

  /* ---- 页脚 ---- */
  g.fillStyle = '#8a8175'
  g.font = '13px "Microsoft YaHei",sans-serif'
  g.fillText('字源卡 · 汉字形音义溯源', 76, H - 84)
  g.fillStyle = '#b4432f'
  g.font = '14px "Microsoft YaHei",sans-serif'
  g.fillText('字形与书证取自公有领域文献', 76, H - 62)

  /* ---- 印章 ---- */
  g.fillStyle = '#b4432f'
  g.fillRect(W - 130, H - 112, 46, 46)
  g.fillStyle = '#f3ece0'
  g.font = '400 20px "Kaiti SC","STKaiti","KaiTi",serif'
  g.textAlign = 'center'
  g.fillText('字源', W - 107, H - 100)
  g.textAlign = 'left'
}

/** 画布转 Blob */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve))
}
