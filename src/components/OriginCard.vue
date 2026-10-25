<script setup lang="ts">
import { computed, ref } from 'vue'

interface GlyphFrame {
  era: string
  type: 'svg' | 'png'
  src: string
}

const props = defineProps<{
  char: string
  frames: GlyphFrame[]
  meanings: any[]
  phonetics: any[]
  analysis?: any
}>()

defineEmits<{ (e: 'close'): void }>()

const busy = ref(false)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const topMeanings = computed(() => props.meanings.slice(0, 3))

/** 画一张可分享的字源卡（导出 PNG） */
async function exportCard() {
  const cv = canvasRef.value
  if (!cv) return
  busy.value = true
  const ctx = cv.getContext('2d')
  if (!ctx) return

  const W = 750
  const H = 1060
  cv.width = W * 2
  cv.height = H * 2
  cv.style.width = W + 'px'
  cv.style.height = H + 'px'
  const g = ctx as CanvasRenderingContext2D
  g.scale(2, 2)

  // 宣纸底
  g.fillStyle = '#f3ece0'
  g.fillRect(0, 0, W, H)
  const vg = g.createRadialGradient(W / 2, H * 0.36, 60, W / 2, H * 0.36, W * 0.8)
  vg.addColorStop(0, 'rgba(250,246,238,1)')
  vg.addColorStop(1, 'rgba(233,223,205,1)')
  g.fillStyle = vg
  g.fillRect(0, 0, W, H)

  // 边框
  g.strokeStyle = 'rgba(35,32,28,0.2)'
  g.lineWidth = 1
  g.strokeRect(28.5, 28.5, W - 57, H - 57)
  g.strokeStyle = 'rgba(35,32,28,0.09)'
  g.strokeRect(40.5, 40.5, W - 81, H - 81)

  // 标题
  g.fillStyle = '#23201c'
  g.font = '400 62px "Kaiti SC","STKaiti","KaiTi",serif'
  g.textBaseline = 'top'
  g.fillText(props.char, 76, 84)

  g.fillStyle = '#b4432f'
  g.font = '400 21px "Kaiti SC","STKaiti","KaiTi",serif'
  g.fillText(props.analysis?.method ?? '造字法待考', 160, 104)

  if (props.analysis?.methodNote) {
    g.fillStyle = '#8a8175'
    g.font = '15px "Microsoft YaHei",sans-serif'
    g.fillText(props.analysis.methodNote, 160, 133)
  }

  // 字形演变带
  const stripY = 208
  const cellW = 128
  const startX = 76
  for (let i = 0; i < props.frames.length; i++) {
    const f = props.frames[i]
    const x = startX + i * cellW
    g.fillStyle = 'rgba(35,32,28,0.045)'
    g.fillRect(x, stripY, 112, 132)
    g.strokeStyle = 'rgba(35,32,28,0.1)'
    g.strokeRect(x + 0.5, stripY + 0.5, 111, 131)

    const img = new Image()
    img.src = f.src
    await new Promise(res => {
      img.onload = () => res(null)
      img.onerror = () => res(null)
    })
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

  // 读音
  let y = 392
  g.fillStyle = '#23201c'
  g.font = '400 19px "Kaiti SC","STKaiti","KaiTi",serif'
  g.fillText('读音', 76, y)
  y += 32
  for (const p of props.phonetics.slice(0, 3)) {
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

  // 分隔
  g.strokeStyle = 'rgba(35,32,28,0.12)'
  g.beginPath()
  g.moveTo(76, y + 6)
  g.lineTo(W - 76, y + 6)
  g.stroke()
  y += 32

  // 义项
  g.fillStyle = '#23201c'
  g.font = '400 19px "Kaiti SC","STKaiti","KaiTi",serif'
  g.fillText('义项', 76, y)
  y += 32
  for (const m of topMeanings.value) {
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

  // 页脚
  g.fillStyle = '#8a8175'
  g.font = '13px "Microsoft YaHei",sans-serif'
  g.fillText('字源卡 · 汉字形音义溯源', 76, H - 84)
  g.fillStyle = '#b4432f'
  g.font = '14px "Microsoft YaHei",sans-serif'
  g.fillText('字形与书证取自公有领域文献', 76, H - 62)

  // 印章
  g.fillStyle = '#b4432f'
  g.fillRect(W - 130, H - 112, 46, 46)
  g.fillStyle = '#f3ece0'
  g.font = '400 20px "Kaiti SC","STKaiti","KaiTi",serif'
  g.textAlign = 'center'
  g.fillText('字源', W - 107, H - 100)
  g.textAlign = 'left'

  busy.value = false
  cv.toBlob(blob => {
    if (!blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `字源卡-${props.char}.png`
    a.click()
    URL.revokeObjectURL(a.href)
  })
}
</script>

<template>
  <div class="card-mask" @click.self="$emit('close')">
    <div class="card-wrap">
      <div class="card-actions">
        <button class="act primary" :disabled="busy" @click="exportCard">
          {{ busy ? '生成中…' : '导出为图片' }}
        </button>
        <button class="act" @click="$emit('close')">关闭</button>
      </div>
      <canvas ref="canvasRef" class="card-canvas" />
    </div>
  </div>
</template>

<style scoped>
.card-mask {
  position: fixed;
  inset: 0;
  background: rgba(35, 32, 28, 0.42);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  z-index: 600;
  padding: 24px;
}

.card-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  max-height: 92vh;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.act {
  font-family: var(--font-title);
  font-size: 15px;
  letter-spacing: 0.14em;
  color: var(--ink-soft);
  background: var(--paper-light);
  border: 1px solid var(--line);
  padding: 8px 20px;
  border-radius: 2px;
  transition: all 0.25s ease;
}

.act.primary {
  color: var(--paper-light);
  background: var(--cinnabar);
  border-color: var(--cinnabar);
}

.act:hover:not(:disabled) {
  opacity: 0.88;
}

.act:disabled {
  opacity: 0.5;
  cursor: default;
}

.card-canvas {
  max-width: 88vw;
  max-height: 78vh;
  object-fit: contain;
  box-shadow: var(--shadow-deep);
  border: 1px solid var(--line);
}
</style>
