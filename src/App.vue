<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import InkBackdrop from './components/InkBackdrop.vue'
import GlyphTunnel from './components/GlyphTunnel.vue'
import InfoPanel from './components/InfoPanel.vue'
import OriginCard from './components/OriginCard.vue'
import GlyphGrid from './components/GlyphGrid.vue'
import PuzzleView from './components/PuzzleView.vue'
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
const showPuzzle = ref(false)
const keyword = ref('')
const batch = ref<string[]>([])
const view = ref<'detail' | 'grid'>('detail')

const entry = computed<CharEntry>(() => all[currentChar.value] ?? list[0])
const analysis = computed(() => (analysisData as any)[currentChar.value] ?? undefined)

const results = computed(() => {
  const k = keyword.value.trim()
  if (!k) return []
  return list.filter(c => c.char.includes(k)).slice(0, 12)
})

const totalMeanings = list.reduce((n, c) => n + c.meanings.length, 0)
const totalPhonetics = list.reduce((n, c) => n + c.phonetics.length, 0)

function pick(c: string) {
  currentChar.value = c
  keyword.value = ''
  view.value = 'detail'
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
    const a = (analysisData as any)[c]
    return `【${c}】${p?.modern ?? ''}　${a?.method ?? ''}\n　${m?.gloss ?? ''}\n　义项${e.meanings.length}条 · 读音${e.phonetics.length}个\n　${a?.analysis ?? ''}`
  })
  const text = `字源卡 · 生词本（${chars.length} 字）\n${'—'.repeat(26)}\n\n${lines.join('\n\n')}\n\n由「字源 · 汉字形音义溯源」生成\n字形与书证取自公有领域文献　AI 生成内容已标注`
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
      <div class="brand" @click="view = 'detail'">
        <span class="brand-char">字源</span>
        <span class="brand-sub">汉字形音义溯源</span>
      </div>

      <div class="search">
        <input
          v-model="keyword"
          type="text"
          placeholder="输入汉字，如 日、水、行"
          class="search-input"
          spellcheck="false"
        />
        <div class="dropdown" v-if="results.length">
          <button v-for="r in results" :key="r.char" class="drop-item" @click="pick(r.char)">
            <span class="drop-char">{{ r.char }}</span>
            <span class="drop-gloss">{{ r.meanings[0]?.gloss ?? '' }}</span>
            <span class="drop-era">{{ r.frames.length }} 帧</span>
          </button>
        </div>
      </div>

      <nav class="tools">
        <button class="tool" :class="{ on: view === 'grid' }" @click="view = view === 'grid' ? 'detail' : 'grid'">
          {{ view === 'grid' ? '详情' : '字表' }}
        </button>
        <button class="tool" @click="showPuzzle = true">猜字</button>
        <button class="tool" @click="showBatch = true">生词本</button>
        <button class="tool primary" @click="showCard = true">字源卡</button>
      </nav>
    </header>

    <main class="stage">
      <section class="overview" v-if="view === 'grid'">
        <div class="ov-head">
          <h2 class="ov-title">字表</h2>
          <p class="ov-sub">
            {{ list.length }} 字 · {{ totalMeanings }} 条义项 · {{ totalPhonetics }} 个读音 ·
            覆盖甲骨文至楷书的字形演变
          </p>
        </div>
        <GlyphGrid :list="list" :current="currentChar" @pick="pick" />
      </section>

      <template v-else>
        <section class="left">
          <div class="prologue">
            <span class="prologue-era">{{ entry.frames[frameIndex]?.era ?? '' }}</span>
            <p class="prologue-text">拖动下方时间轴，看这个字从甲骨文长成楷书</p>
          </div>

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
      </template>
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

    <PuzzleView v-if="showPuzzle" :list="list" @close="showPuzzle = false" @pick="pick" />

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
  height: 64px;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 28px;
  border-bottom: 1px solid var(--line-soft);
  position: relative;
  z-index: 300;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 12px;
  cursor: pointer;
}

.brand-char {
  font-family: var(--font-title);
  font-size: 26px;
  letter-spacing: 0.24em;
  color: var(--ink);
}

.brand-sub {
  font-size: 13px;
  color: var(--ink-faint);
  letter-spacing: 0.18em;
}

.search {
  position: relative;
  flex: 1;
  max-width: 320px;
}

.search-input {
  width: 100%;
  padding: 8px 13px;
  border: 1px solid var(--line);
  border-radius: 2px;
  background: rgba(250, 246, 238, 0.6);
  font-size: 15px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: var(--cinnabar);
}

.search-input::placeholder {
  color: var(--ink-ghost);
  font-size: 14px;
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
  gap: 11px;
  width: 100%;
  padding: 8px 13px;
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
  font-size: 20px;
  color: var(--ink);
  flex-shrink: 0;
}

.drop-gloss {
  font-size: 13px;
  color: var(--ink-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.drop-era {
  font-size: 11.5px;
  color: var(--ink-ghost);
  flex-shrink: 0;
}

.tools {
  margin-left: auto;
  display: flex;
  gap: 7px;
}

.tool {
  font-family: var(--font-title);
  font-size: 14.5px;
  letter-spacing: 0.12em;
  color: var(--ink-soft);
  border: 1px solid var(--line);
  padding: 6px 15px;
  border-radius: 2px;
  transition: all 0.28s ease;
}

.tool:hover {
  color: var(--cinnabar);
  border-color: rgba(180, 67, 47, 0.42);
  background: rgba(180, 67, 47, 0.04);
}

.tool.on {
  color: var(--paper-light);
  background: var(--ink);
  border-color: var(--ink);
}

.tool.primary {
  color: var(--paper-light);
  background: var(--cinnabar);
  border-color: var(--cinnabar);
}

.tool.primary:hover {
  opacity: 0.88;
  color: var(--paper-light);
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

.prologue {
  position: absolute;
  left: 30px;
  top: 26px;
  z-index: 210;
  pointer-events: none;
  max-width: 260px;
}

.prologue-era {
  display: inline-block;
  font-family: var(--font-title);
  font-size: 12.5px;
  letter-spacing: 0.26em;
  color: var(--cinnabar);
  border: 1px solid rgba(180, 67, 47, 0.28);
  padding: 2px 9px 2px 11px;
  margin-bottom: 8px;
}

.prologue-text {
  font-family: var(--font-title);
  font-size: 15px;
  color: var(--ink-faint);
  letter-spacing: 0.05em;
  line-height: 1.75;
}

.divider {
  width: 1px;
  background: linear-gradient(to bottom, transparent, var(--line) 15%, var(--line) 85%, transparent);
}

.right {
  width: 424px;
  flex-shrink: 0;
}

.overview {
  flex: 1;
  overflow-y: auto;
  padding: 34px 40px 60px;
}

.ov-head {
  margin-bottom: 26px;
}

.ov-title {
  font-family: var(--font-title);
  font-size: 26px;
  font-weight: 400;
  letter-spacing: 0.2em;
  color: var(--ink);
  margin-bottom: 8px;
}

.ov-sub {
  font-size: 14px;
  color: var(--ink-faint);
  letter-spacing: 0.04em;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(35, 32, 28, 0.3);
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
