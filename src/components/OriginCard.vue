<script setup lang="ts">
import { computed, ref } from 'vue'
import { drawCard, canvasToBlob } from '../utils/card'

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
  await drawCard(cv, props.char, props.frames, props.meanings, props.phonetics, props.analysis)
  const blob = await canvasToBlob(cv)
  busy.value = false
  if (!blob) return
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `字源卡-${props.char}.png`
  a.click()
  URL.revokeObjectURL(a.href)
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
