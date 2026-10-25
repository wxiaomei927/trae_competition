<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import InkBackdrop from './components/InkBackdrop.vue'
import GlyphTunnel from './components/GlyphTunnel.vue'
import InfoPanel from './components/InfoPanel.vue'
import OriginCard from './components/OriginCard.vue'
import GlyphGrid from './components/GlyphGrid.vue'
import PuzzleView from './components/PuzzleView.vue'
import BatchCards from './components/BatchCards.vue'
import ClanView from './components/ClanView.vue'
import ForgeView from './components/ForgeView.vue'
import DuelView from './components/DuelView.vue'
import { DECOMPOSITIONS } from './data/decomposition'
import charsIndex from './data/chars-index.json'
import analysisData from './data/char_analysis.json'

interface GlyphFrame {
  era: string
  type: string
  src: string
}

interface CharEntry {
  char: string
  frames: GlyphFrame[]
  meanings: any[]
  phonetics: any[]
}

interface IndexItem {
  id: string
  file: string
  frames: number
  meanings: number
  phonetics: number
  gloss: string
  modern: string
}

const index = charsIndex as unknown as Record<string, IndexItem>

/** 字表总览用的轻量列表 */
const list = Object.entries(index).map(([char, meta]) => ({
  char,
  frames: new Array(meta.frames).fill(0).map((_, i) => ({ era: '', type: 'svg', src: '' })),
  frameCount: meta.frames,
  meanings: new Array(meta.meanings).fill(0).map(() => ({ gloss: '' })),
  meaningCount: meta.meanings,
  phonetics: new Array(meta.phonetics).fill(0).map(() => ({})),
  phoneticCount: meta.phonetics,
  gloss: meta.gloss,
  modern: meta.modern,
}))

const currentChar = ref('人')
const frameIndex = ref(0)
const showCard = ref(false)
const showBatch = ref(false)
const showPuzzle = ref(false)
const keyword = ref('')
const batch = ref<string[]>([])
const view = ref<'detail' | 'grid' | 'forge' | 'duel' | 'clan'>('detail')

/** 按字取该字的楷书字形（拆字工坊用） */
async function loadGlyph(char: string): Promise<string> {
  const meta = index[char]
  if (!meta) return ''
  const mod = await import(`./data/chars/${meta.file}.json`)
  const e = mod.default as any
  const last = e.frames[e.frames.length - 1]
  return last?.src ?? ''
}

/** 部件字形表：部件名 → 该部件的楷书字形（取自数据集） */
const partGlyphs = ref<Record<string, string>>({})
/** 位图（PNG）部件名单：需反相着色才能显出朱红 */
const rasterParts = ref<string[]>([])

/** 预载所有可能用到的部件字形 */
async function loadPartGlyphs() {
  const names = new Set<string>()
  for (const d of Object.values(DECOMPOSITIONS)) {
    for (const p of d.parts) names.add(p.name)
  }
  const map: Record<string, string> = {}
  const raster: string[] = []
  await Promise.all(
    [...names].map(async n => {
      const meta = index[n]
      if (!meta) return
      try {
        const mod = await import(`./data/chars/${meta.file}.json`)
        const entry = mod.default as any
        const last = entry.frames[entry.frames.length - 1]
        if (last) {
          map[n] = last.src
          // 楷书帧内含 PNG base64（白底黑字），需特殊着色
          if (last.src.includes('png')) raster.push(n)
        }
      } catch {
        /* 部件不在库内，用文字表示 */
      }
    })
  )
  partGlyphs.value = map
  rasterParts.value = raster
}

const entry = ref<CharEntry | null>(null)
const loading = ref(false)

const analysis = computed(() => (analysisData as any)[currentChar.value] ?? undefined)

const results = computed(() => {
  const k = keyword.value.trim()
  if (!k) return []
  return Object.entries(index)
    .filter(([c]) => c.includes(k))
    .slice(0, 12)
    .map(([c, m]) => ({ char: c, gloss: m.gloss, frames: m.frames }))
})

/** 按需加载该字的完整数据 */
async function loadChar(char: string) {
  const meta = index[char]
  if (!meta) return
  loading.value = true
  try {
    const mod = await import(`./data/chars/${meta.file}.json`)
    entry.value = mod.default as CharEntry
  } finally {
    loading.value = false
  }
}

function pick(c: string) {
  currentChar.value = c
  keyword.value = ''
  view.value = 'detail'
}

watch(
  currentChar,
  c => {
    frameIndex.value = 0
    loadChar(c)
  },
  { immediate: true }
)

loadPartGlyphs()


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
            <span class="drop-gloss">{{ r.gloss }}</span>
            <span class="drop-era">{{ r.frames }} 帧</span>
          </button>
        </div>
      </div>

      <nav class="tools">
        <button class="tool" :class="{ on: view === 'grid' }" @click="view = view === 'grid' ? 'detail' : 'grid'">
          {{ view === 'grid' ? '详情' : '字表' }}
        </button>
        <button class="tool" :class="{ on: view === 'forge' }" @click="view = view === 'forge' ? 'detail' : 'forge'">
          拆字
        </button>
        <button class="tool" :class="{ on: view === 'duel' }" @click="view = view === 'duel' ? 'detail' : 'duel'">
          对照
        </button>
        <button class="tool" :class="{ on: view === 'clan' }" @click="view = view === 'clan' ? 'detail' : 'clan'">
          字族
        </button>
        <button class="tool" @click="showPuzzle = true">猜字</button>
        <button class="tool" @click="showBatch = true">批量出卡</button>
        <button class="tool primary" @click="showCard = true">字源卡</button>
      </nav>
    </header>

    <main class="stage">
      <section class="overview" v-if="view === 'grid'">
        <div class="ov-head">
          <h2 class="ov-title">字表</h2>
          <p class="ov-sub">
            {{ list.length }} 字 ·
            {{ list.reduce((n, c) => n + c.meaningCount, 0) }} 条义项 ·
            {{ list.reduce((n, c) => n + c.phoneticCount, 0) }} 个读音 ·
            覆盖甲骨文至楷书的字形演变
          </p>
        </div>
        <GlyphGrid :list="list as any" :current="currentChar" @pick="pick" />
      </section>

      <!-- 拆字工坊 -->
      <section class="full-view" v-else-if="view === 'forge'">
        <ForgeView
          :current="currentChar"
          :library-chars="Object.keys(index)"
          :part-glyphs="partGlyphs"
          :raster-parts="rasterParts"
          :load-glyph="loadGlyph"
          @pick="pick"
        />
      </section>

      <!-- 字族 -->
      <section class="full-view" v-else-if="view === 'clan'">
        <ClanView :index="index as any" :current="currentChar" :load-glyph="loadGlyph" />
      </section>

      <!-- 字族 -->
      <section class="full-view" v-else-if="view === 'clan'">
        <ClanView :index="index as any" :current="currentChar" :load-glyph="loadGlyph" />
      </section>

      <!-- 双字对照 -->
      <section class="full-view" v-else-if="view === 'duel'">
        <DuelView :index="index as any" :current="currentChar" @pick="pick" />
      </section>

      <template v-else>
        <section class="left">
          <div class="prologue">
            <span class="prologue-era">{{ entry?.frames[frameIndex]?.era ?? '' }}</span>
            <p class="prologue-text">拖动下方时间轴，看这个字从甲骨文长成楷书</p>
          </div>

          <div class="tunnel-wrap" :class="{ loading }">
            <GlyphTunnel
              v-if="entry"
              v-model="frameIndex"
              :frames="entry.frames"
            />
            <div class="loading-mark" v-if="loading">取字中…</div>
          </div>
        </section>

        <div class="divider"></div>

        <section class="right">
          <InfoPanel
            v-if="entry"
            :char="entry.char"
            :meanings="entry.meanings"
            :phonetics="entry.phonetics"
            :analysis="analysis"
          />
        </section>
      </template>
    </main>

    <OriginCard
      v-if="showCard && entry"
      :char="entry.char"
      :frames="entry.frames"
      :meanings="entry.meanings"
      :phonetics="entry.phonetics"
      :analysis="analysis"
      @close="showCard = false"
    />

    <PuzzleView
      v-if="showPuzzle"
      :index="index as any"
      @close="showPuzzle = false"
      @pick="pick"
    />

    <!-- 批量出卡 -->
    <BatchCards
      v-if="showBatch"
      :index="index as any"
      :initial="batch"
      @close="showBatch = false"
      @pick="pick"
    />
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
  font-size: 18.5px;
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
  font-size: 19.5px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: var(--cinnabar);
}

.search-input::placeholder {
  color: var(--ink-ghost);
  font-size: 17.5px;
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
  font-size: 18.5px;
  color: var(--ink-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.drop-era {
  font-size: 17.5px;
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
  font-size: 17.5px;
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

.tunnel-wrap {
  height: 100%;
  position: relative;
  transition: opacity 0.3s ease;
}

.tunnel-wrap.loading {
  opacity: 0.45;
}

.loading-mark {
  position: absolute;
  left: 50%;
  top: 44%;
  transform: translate(-50%, -50%);
  font-family: var(--font-title);
  font-size: 19.5px;
  color: var(--ink-faint);
  letter-spacing: 0.2em;
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
  font-size: 19.5px;
  letter-spacing: 0.26em;
  color: var(--cinnabar);
  border: 1px solid rgba(180, 67, 47, 0.28);
  padding: 2px 9px 2px 11px;
  margin-bottom: 8px;
}

.prologue-text {
  font-family: var(--font-title);
  font-size: 19.5px;
  color: var(--ink-faint);
  letter-spacing: 0.05em;
  line-height: 1.75;
}

.divider {
  width: 1px;
  background: linear-gradient(to bottom, transparent, var(--line) 15%, var(--line) 85%, transparent);
}

.right {
  width: 500px;
  flex-shrink: 0;
}

.overview {
  flex: 1;
  overflow-y: auto;
  padding: 34px 40px 60px;
}

.full-view {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  font-size: 17.5px;
  color: var(--ink-faint);
  letter-spacing: 0.04em;
}

</style>
