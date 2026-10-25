<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import InkBackdrop from './components/InkBackdrop.vue'
import GlyphTunnel from './components/GlyphTunnel.vue'
import InfoPanel from './components/InfoPanel.vue'
import OriginCard from './components/OriginCard.vue'
import charactersData from './data/characters.json'
import analysisData from './data/char_analysis.json'

interface GlyphFrame {
  era: string
  type: 'svg' | 'png'
  src: string
}

interface CharEntry {
  char: string
  frames: GlyphFrame[]
  meanings: any[]
  phonetics: any[]
}

const all = charactersData as unknown as Record<string, CharEntry>
const list = Object.values(all)

const currentChar = ref('人')
const frameIndex = ref(0)
const showCard = ref(false)
const showBatch = ref(false)
const keyword = ref('')
const batch = ref<string[]>([])

const entry = computed<CharEntry>(() => all[currentChar.value] ?? list[0])
const analysis = computed(() => (analysisData as any)[currentChar.value] ?? undefined)

const results = computed(() => {
  const k = keyword.value.trim()
  if (!k) return []
  return list.filter(c => c.char.includes(k)).slice(0, 12)
})

function pick(c: string) {
  currentChar.value = c
  keyword.value = ''
}

watch(currentChar, () => {
  frameIndex.value = 0
})

function toggleBatch(c: string) {
  const i = batch.value.indexOf(c)
  if (i >= 0) batch.value.splice(i, 1)
  else if (batch.value.length < 10) batch.value.push(c)
}

function exportBatch() {
  const chars = batch.value
  if (!chars.length) return
  const lines = chars.map(c => {
    const e = all[c]
    const m = e.meanings[0]
    const p = e.phonetics[0]
    return `【${c}】${p?.modern ?? ''}　${m?.gloss ?? ''}\n　义项${e.meanings.length}条 · 读音${e.phonetics.length}个`
  })
  const text = `汉字字源卡 · 生词本（${chars.length} 字）\n${'—'.repeat(24)}\n\n${lines.join('\n\n')}\n\n由「字源卡」生成`
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `字源卡-生词本-${chars.join('')}.txt`
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>

<template>
  <div class="shell">
    <InkBackdrop />

    <header class="topbar">
      <div class="brand">
        <span class="brand-char">字源</span>
        <span class="brand-sub">汉字形音义溯源</span>
      </div>

      <div class="search">
        <input
          v-model="keyword"
          type="text"
          placeholder="输入汉字"
          class="search-input"
          spellcheck="false"
        />
        <div class="dropdown" v-if="results.length">
          <button v-for="r in results" :key="r.char" class="drop-item" @click="pick(r.char)">
            <span class="drop-char">{{ r.char }}</span>
            <span class="drop-gloss">{{ r.meanings[0]?.gloss ?? '' }}</span>
          </button>
        </div>
      </div>

      <nav class="tools">
        <button class="tool" @click="showBatch = true">生词本</button>
        <button class="tool" @click="showCard = true">字源卡</button>
      </nav>
    </header>

    <main class="stage">
      <section class="left">
        <GlyphTunnel v-model="frameIndex" :frames="entry.frames" />
      </section>

      <div class="divider"></div>

      <section class="right">
        <InfoPanel
          :char="entry.char"
          :meanings="entry.meanings"
          :phonetics="entry.phonetics"
          :analysis="analysis"
        />
      </section>
    </main>

    <OriginCard
      v-if="showCard"
      :char="entry.char"
      :frames="entry.frames"
      :meanings="entry.meanings"
      :phonetics="entry.phonetics"
      :analysis="analysis"
      @close="showCard = false"
    />

    <div class="modal-mask" v-if="showBatch" @click.self="showBatch = false">
      <div class="modal">
        <h3 class="modal-title">生词本</h3>
        <p class="modal-tip">勾选要批量出卡的字，最多 10 个</p>
        <div class="batch-grid">
          <button
            v-for="c in list"
            :key="c.char"
            class="batch-item"
            :class="{ on: batch.includes(c.char) }"
            @click="toggleBatch(c.char)"
          >
            {{ c.char }}
          </button>
        </div>
        <div class="modal-foot">
          <span class="batch-count">已选 {{ batch.length }} / 10</span>
          <button class="do-btn" :disabled="!batch.length" @click="exportBatch">导出字源卡</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  flex-shrink: 0;
  height: 66px;
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 0 30px;
  border-bottom: 1px solid var(--line-soft);
  position: relative;
  z-index: 300;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 13px;
}

.brand-char {
  font-family: var(--font-title);
  font-size: 27px;
  letter-spacing: 0.24em;
  color: var(--ink);
}

.brand-sub {
  font-size: 13.5px;
  color: var(--ink-faint);
  letter-spacing: 0.18em;
}

.search {
  position: relative;
  flex: 1;
  max-width: 340px;
}

.search-input {
  width: 100%;
  padding: 8px 14px;
  border: 1px solid var(--line);
  border-radius: 2px;
  background: rgba(250, 246, 238, 0.6);
  font-size: 15.5px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: var(--cinnabar);
}

.search-input::placeholder {
  color: var(--ink-ghost);
  font-size: 14.5px;
}

.dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--paper-light);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-lift);
  z-index: 400;
  max-height: 340px;
  overflow-y: auto;
}

.drop-item {
  display: flex;
  align-items: baseline;
  gap: 12px;
  width: 100%;
  padding: 9px 14px;
  text-align: left;
  border-bottom: 1px solid var(--line-soft);
}

.drop-item:last-child {
  border-bottom: none;
}

.drop-item:hover {
  background: rgba(180, 67, 47, 0.06);
}

.drop-char {
  font-family: var(--font-title);
  font-size: 21px;
  color: var(--ink);
  flex-shrink: 0;
}

.drop-gloss {
  font-size: 13.5px;
  color: var(--ink-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tools {
  margin-left: auto;
  display: flex;
  gap: 9px;
}

.tool {
  font-family: var(--font-title);
  font-size: 15px;
  letter-spacing: 0.14em;
  color: var(--ink-soft);
  border: 1px solid var(--line);
  padding: 7px 17px;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.tool:hover {
  color: var(--cinnabar);
  border-color: rgba(180, 67, 47, 0.42);
  background: rgba(180, 67, 47, 0.04);
}

.stage {
  flex: 1;
  display: flex;
  min-height: 0;
}

.left {
  flex: 1;
  min-width: 0;
  position: relative;
}

.divider {
  width: 1px;
  background: linear-gradient(to bottom, transparent, var(--line) 15%, var(--line) 85%, transparent);
}

.right {
  width: 430px;
  flex-shrink: 0;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(35, 32, 28, 0.28);
  backdrop-filter: blur(3px);
  display: grid;
  place-items: center;
  z-index: 500;
}

.modal {
  width: min(680px, 92vw);
  max-height: 84vh;
  background: var(--paper-light);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-deep);
  padding: 30px 34px;
  display: flex;
  flex-direction: column;
}

.modal-title {
  font-family: var(--font-title);
  font-size: 24px;
  font-weight: 400;
  letter-spacing: 0.2em;
  color: var(--ink);
}

.modal-tip {
  font-size: 13.5px;
  color: var(--ink-faint);
  margin: 7px 0 18px;
}

.batch-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
  gap: 7px;
  padding: 2px;
}

.batch-item {
  font-family: var(--font-title);
  font-size: 20px;
  color: var(--ink);
  border: 1px solid var(--line);
  padding: 7px 0;
  transition: all 0.22s ease;
}

.batch-item:hover {
  border-color: var(--ink-faint);
}

.batch-item.on {
  background: var(--cinnabar);
  color: var(--paper-light);
  border-color: var(--cinnabar);
}

.modal-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--line-soft);
}

.batch-count {
  font-size: 14px;
  color: var(--ink-faint);
}

.do-btn {
  font-family: var(--font-title);
  font-size: 15.5px;
  letter-spacing: 0.14em;
  color: var(--paper-light);
  background: var(--cinnabar);
  border: none;
  padding: 9px 24px;
  border-radius: 2px;
  transition: opacity 0.25s ease;
}

.do-btn:disabled {
  background: var(--ink-ghost);
  cursor: default;
}

.do-btn:hover:not(:disabled) {
  opacity: 0.88;
}
</style>
