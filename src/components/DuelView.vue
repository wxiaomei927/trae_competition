<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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
  current: string
}>()

const emit = defineEmits<{ (e: 'pick', c: string): void }>()

const leftChar = ref(props.current)
const rightChar = ref('')

const left = ref<any>(null)
const right = ref<any>(null)

const libraryChars = computed(() => Object.keys(props.index))

async function load(char: string, side: 'left' | 'right') {
  const meta = props.index[char]
  if (!meta) return
  const mod = await import(`../data/chars/${meta.file}.json`)
  const entry = mod.default as any
  if (side === 'left') left.value = entry
  else right.value = entry
}

async function init() {
  await load(leftChar.value, 'left')
  if (rightChar.value) await load(rightChar.value, 'right')
  else {
    // 默认选一个形近/义近的字做对比：取义项数最多且不同的字
    const alt = libraryChars.value.find(c => c !== leftChar.value)
    if (alt) {
      rightChar.value = alt
      await load(alt, 'right')
    }
  }
}

watch(() => props.current, c => {
  leftChar.value = c
  init()
}, { immediate: true })

function swap() {
  const t = leftChar.value
  leftChar.value = rightChar.value
  rightChar.value = t
  init()
}

/** 对比维度 */
const compare = computed(() => {
  if (!left.value || !right.value) return []
  const L = left.value
  const R = right.value
  return [
    {
      label: '本义',
      l: L.meanings.find((m: any) => m.type === '本义')?.gloss ?? '—',
      r: R.meanings.find((m: any) => m.type === '本义')?.gloss ?? '—',
    },
    {
      label: '义项数',
      l: `${L.meanings.length} 条`,
      r: `${R.meanings.length} 条`,
      num: true,
    },
    {
      label: '读音',
      l: L.phonetics.map((p: any) => p.modern).join(' / ') || '—',
      r: R.phonetics.map((p: any) => p.modern).join(' / ') || '—',
    },
    {
      label: '声调',
      l: L.phonetics[0]?.tone ?? '—',
      r: R.phonetics[0]?.tone ?? '—',
    },
    {
      label: '字形帧',
      l: `${L.frames.length} 帧`,
      r: `${R.frames.length} 帧`,
      num: true,
    },
    {
      label: '书证出处',
      l: L.meanings.find((m: any) => m.source)?.source ?? '—',
      r: R.meanings.find((m: any) => m.source)?.source ?? '—',
    },
  ]
})
</script>

<template>
  <div class="duel">
    <header class="duel-head">
      <div>
        <h3 class="duel-title">双字对决</h3>
        <p class="duel-sub">两个字并排，看形、音、义的异同</p>
      </div>
      <button class="swap" @click="swap">⇄ 对调</button>
    </header>

    <div class="duel-pick">
      <div class="dp-side">
        <span class="dp-tag">甲</span>
        <select v-model="leftChar" class="dp-select" @change="load(leftChar, 'left')">
          <option v-for="c in libraryChars" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <span class="dp-vs">对</span>
      <div class="dp-side">
        <span class="dp-tag">乙</span>
        <select v-model="rightChar" class="dp-select" @change="load(rightChar, 'right')">
          <option v-for="c in libraryChars" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
    </div>

    <div class="duel-body">
      <!-- 字形演变对照 -->
      <div class="glyphs">
        <div class="gs" v-if="left">
          <div class="gs-title">{{ left.char }}</div>
          <div class="gs-strip">
            <div class="gs-item" v-for="(f, i) in left.frames" :key="i">
              <img :src="f.src" :alt="f.era" />
              <span>{{ f.era }}</span>
            </div>
          </div>
        </div>

        <div class="gs-mid">
          <span class="gs-eq">=</span>
        </div>

        <div class="gs" v-if="right">
          <div class="gs-title">{{ right.char }}</div>
          <div class="gs-strip">
            <div class="gs-item" v-for="(f, i) in right.frames" :key="i">
              <img :src="f.src" :alt="f.era" />
              <span>{{ f.era }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 维度对照表 -->
      <div class="table">
        <div class="tr head">
          <span class="td dim"></span>
          <span class="td l">{{ left?.char ?? '' }}</span>
          <span class="td dim"></span>
          <span class="td r">{{ right?.char ?? '' }}</span>
        </div>
        <div class="tr" v-for="row in compare" :key="row.label">
          <span class="td dim">{{ row.label }}</span>
          <span class="td l" :class="{ num: row.num }">{{ row.l }}</span>
          <span class="td dim"></span>
          <span class="td r" :class="{ num: row.num }">{{ row.r }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.duel {
  height: 100%;
  overflow-y: auto;
  padding: 24px 30px 40px;
}

.duel-head {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 16px;
}

.duel-title {
  font-family: var(--font-title);
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0.2em;
  color: var(--ink);
}

.duel-sub {
  font-size: 13px;
  color: var(--ink-faint);
  margin-top: 4px;
}

.swap {
  margin-left: auto;
  font-family: var(--font-title);
  font-size: 14px;
  letter-spacing: 0.1em;
  color: var(--ink-soft);
  border: 1px solid var(--line);
  padding: 6px 15px;
  border-radius: 2px;
  transition: all 0.26s ease;
}

.swap:hover {
  color: var(--cinnabar);
  border-color: rgba(180, 67, 47, 0.42);
}

/* 选字 */
.duel-pick {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 24px;
}

.dp-side {
  display: flex;
  align-items: center;
  gap: 9px;
}

.dp-tag {
  font-family: var(--font-title);
  font-size: 13px;
  color: var(--paper-light);
  background: var(--ink);
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 50%;
}

.dp-side:last-child .dp-tag {
  background: var(--cinnabar);
}

.dp-select {
  font-family: var(--font-title);
  font-size: 18px;
  color: var(--ink);
  border: 1px solid var(--line);
  background: rgba(250, 246, 238, 0.7);
  padding: 5px 11px;
  cursor: pointer;
}

.dp-vs {
  font-family: var(--font-title);
  font-size: 15px;
  color: var(--ink-ghost);
}

/* 字形对照 */
.glyphs {
  display: flex;
  align-items: flex-start;
  gap: 22px;
  justify-content: center;
  margin-bottom: 30px;
}

.gs {
  flex: 1;
  max-width: 480px;
}

.gs-title {
  font-family: var(--font-title);
  font-size: 34px;
  color: var(--ink);
  text-align: center;
  margin-bottom: 12px;
}

.gs-strip {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.gs-item {
  width: 74px;
  text-align: center;
}

.gs-item img {
  width: 100%;
  height: 74px;
  object-fit: contain;
  mix-blend-mode: multiply;
  filter: contrast(1.2) brightness(0.74);
  background: rgba(252, 249, 242, 0.55);
  border: 1px solid var(--line-soft);
  padding: 4px;
}

.gs-item span {
  display: block;
  font-family: var(--font-title);
  font-size: 11.5px;
  color: var(--ink-faint);
  letter-spacing: 0.08em;
  margin-top: 4px;
}

.gs-mid {
  padding-top: 96px;
}

.gs-eq {
  font-family: var(--font-title);
  font-size: 24px;
  color: var(--ink-ghost);
}

/* 对照表 */
.table {
  border-top: 1px solid var(--line-soft);
}

.tr {
  display: grid;
  grid-template-columns: 110px 1fr 44px 1fr;
  border-bottom: 1px solid var(--line-soft);
}

.tr.head {
  background: rgba(35, 32, 28, 0.03);
}

.td {
  padding: 11px 14px;
  font-size: 14.5px;
  color: var(--ink-soft);
  line-height: 1.7;
}

.td.dim {
  font-size: 12.5px;
  color: var(--ink-faint);
  letter-spacing: 0.1em;
  background: rgba(35, 32, 28, 0.02);
}

.tr.head .td.l,
.tr.head .td.r {
  font-family: var(--font-title);
  font-size: 19px;
  color: var(--ink);
  text-align: center;
}

.td.l {
  border-right: 1px solid var(--line-soft);
}

.td.r {
  border-left: 1px solid var(--line-soft);
}

.td.num {
  font-family: var(--font-title);
  font-size: 17px;
  color: var(--cinnabar);
  text-align: center;
}
</style>
