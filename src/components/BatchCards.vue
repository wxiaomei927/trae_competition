<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { drawCard, canvasToBlob } from '../utils/card'
import analysisData from '../data/char_analysis.json'

interface IndexItem {
  id: string
  file: string
  frames: number
  meanings: number
  phonetics: number
  gloss: string
  modern: string
}

const props = defineProps<{
  index: Record<string, IndexItem>
  initial?: string[]
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'pick', c: string): void }>()

const picked = ref<string[]>(props.initial ? [...props.initial] : [])
const cursor = ref(0)
const drawing = ref(false)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const currentEntry = ref<any>(null)

const chars = computed(() => Object.keys(props.index))

/** 勾选/取消 */
function toggle(c: string) {
  const i = picked.value.indexOf(c)
  if (i >= 0) picked.value.splice(i, 1)
  else if (picked.value.length < 10) picked.value.push(c)
  else {
    // 已满，替换最早选中的
    picked.value.shift()
    picked.value.push(c)
  }
}

/** 载入当前卡的完整数据并绘制 */
async function render(index: number) {
  const c = picked.value[index]
  if (!c) return
  drawing.value = true
  try {
    const meta = props.index[c]
    const mod = await import(`../data/chars/${meta.file}.json`)
    currentEntry.value = mod.default
    const cv = canvasRef.value
    if (cv) {
      await drawCard(
        cv,
        c,
        currentEntry.value.frames,
        currentEntry.value.meanings,
        currentEntry.value.phonetics,
        (analysisData as any)[c]
      )
    }
  } finally {
    drawing.value = false
  }
}

watch(cursor, i => render(i))
watch(picked, () => {
  if (cursor.value >= picked.value.length) cursor.value = Math.max(0, picked.value.length - 1)
  else render(cursor.value)
}, { deep: true })

/** 下载当前卡 */
async function downloadCurrent() {
  const cv = canvasRef.value
  if (!cv) return
  const blob = await canvasToBlob(cv)
  if (!blob) return
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `字源卡-${picked.value[cursor.value]}.png`
  a.click()
  URL.revokeObjectURL(a.href)
}

/** 依次下载全部 */
async function downloadAll() {
  for (let i = 0; i < picked.value.length; i++) {
    cursor.value = i
    await new Promise(r => setTimeout(r, 700))
    await downloadCurrent()
  }
}

function confirm() {
  emit('close')
}
</script>

<template>
  <div class="bc-mask" @click.self="emit('close')">
    <div class="bc">
      <header class="bc-head">
        <div>
          <h3 class="bc-title">批量出卡</h3>
          <p class="bc-sub">勾选最多 10 个字，批量生成字源卡</p>
        </div>
        <button class="bc-close" @click="emit('close')">×</button>
      </header>

      <div class="bc-body">
        <!-- 选字区 -->
        <div class="bc-pick">
          <div class="bc-count">
            已选 <b>{{ picked.length }}</b> / 10
          </div>
          <div class="bc-chars">
            <button
              v-for="c in chars"
              :key="c"
              class="bcc"
              :class="{ on: picked.includes(c), first: picked[0] === c }"
              @click="toggle(c)"
            >
              {{ c }}
            </button>
          </div>
        </div>

        <!-- 卡片预览 -->
        <div class="bc-preview" v-if="picked.length">
          <div class="bc-nav">
            <button class="bc-arrow" :disabled="cursor === 0" @click="cursor--">‹</button>
            <span class="bc-pos">{{ cursor + 1 }} / {{ picked.length }}</span>
            <button
              class="bc-arrow"
              :disabled="cursor === picked.length - 1"
              @click="cursor++"
            >
              ›
            </button>
          </div>

          <div class="bc-canvas-wrap">
            <canvas ref="canvasRef" class="bc-canvas" />
            <div class="bc-loading" v-if="drawing">绘制中…</div>
          </div>

          <div class="bc-actions">
            <button class="bc-act" @click="downloadCurrent">下载这张</button>
            <button class="bc-act" @click="downloadAll" :disabled="picked.length < 2">
              全部下载（{{ picked.length }} 张）
            </button>
            <button
              class="bc-act"
              v-if="currentEntry"
              @click="emit('pick', picked[cursor]); emit('close')"
            >
              查看详情
            </button>
          </div>
        </div>

        <div class="bc-empty" v-else>
          先在左侧勾选要出卡的字
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bc-mask {
  position: fixed;
  inset: 0;
  background: rgba(35, 32, 28, 0.42);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  z-index: 700;
  padding: 22px;
}

.bc {
  width: min(1080px, 95vw);
  max-height: 92vh;
  background: var(--paper-light);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-deep);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bc-head {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 22px 28px 16px;
  border-bottom: 1px solid var(--line-soft);
}

.bc-title {
  font-family: var(--font-title);
  font-size: 23px;
  font-weight: 400;
  letter-spacing: 0.2em;
  color: var(--ink);
}

.bc-sub {
  font-size: 18.5px;
  color: var(--ink-faint);
  margin-top: 4px;
}

.bc-close {
  margin-left: auto;
  font-size: 26px;
  line-height: 1;
  color: var(--ink-faint);
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
}

.bc-close:hover {
  color: var(--cinnabar);
}

.bc-body {
  flex: 1;
  display: flex;
  gap: 24px;
  padding: 20px 28px 26px;
  min-height: 0;
}

/* 选字 */
.bc-pick {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.bc-count {
  font-size: 17.5px;
  color: var(--ink-faint);
  margin-bottom: 12px;
}

.bc-count b {
  font-family: var(--font-title);
  font-size: 19.5px;
  color: var(--cinnabar);
}

.bc-chars {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(46px, 1fr));
  gap: 6px;
  align-content: start;
  padding-right: 4px;
}

.bcc {
  font-family: var(--font-title);
  font-size: 19px;
  color: var(--ink);
  border: 1px solid var(--line-soft);
  padding: 6px 0;
  transition: all 0.2s ease;
}

.bcc:hover {
  border-color: var(--ink-faint);
}

.bcc.on {
  background: var(--cinnabar);
  color: var(--paper-light);
  border-color: var(--cinnabar);
}

.bcc.first {
  box-shadow: 0 0 0 2px rgba(201, 162, 39, 0.35);
}

/* 预览 */
.bc-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.bc-nav {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}

.bc-arrow {
  width: 30px;
  height: 30px;
  border: 1px solid var(--line);
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 19.5px;
  color: var(--ink-soft);
  transition: all 0.24s ease;
}

.bc-arrow:hover:not(:disabled) {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.bc-arrow:disabled {
  opacity: 0.22;
  cursor: default;
}

.bc-pos {
  font-family: var(--font-title);
  font-size: 19.5px;
  color: var(--ink-soft);
  letter-spacing: 0.1em;
  min-width: 52px;
  text-align: center;
}

.bc-canvas-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
}

.bc-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border: 1px solid var(--line);
  box-shadow: 0 10px 30px rgba(35, 32, 28, 0.12);
}

.bc-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(250, 246, 238, 0.55);
  font-family: var(--font-title);
  font-size: 19.5px;
  color: var(--ink-faint);
  letter-spacing: 0.2em;
}

.bc-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.bc-act {
  font-family: var(--font-title);
  font-size: 17.5px;
  letter-spacing: 0.1em;
  color: var(--ink-soft);
  border: 1px solid var(--line);
  padding: 7px 16px;
  border-radius: 2px;
  transition: all 0.26s ease;
}

.bc-act:hover:not(:disabled) {
  color: var(--cinnabar);
  border-color: rgba(180, 67, 47, 0.42);
}

.bc-act:disabled {
  opacity: 0.32;
  cursor: default;
}

.bc-empty {
  flex: 1;
  display: grid;
  place-items: center;
  font-family: var(--font-title);
  font-size: 19.5px;
  color: var(--ink-ghost);
  letter-spacing: 0.12em;
}
</style>
