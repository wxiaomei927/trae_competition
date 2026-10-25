<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DECOMPOSITIONS, PART_TRANSFORM } from '../data/decomposition'

const props = defineProps<{
  current: string
  libraryChars: string[]
  /** 部件字形表，用于在拆解态展示每个部件的真实字形 */
  partGlyphs: Record<string, string>
  /** 位图（PNG）部件名单 */
  rasterParts: string[]
  /** 字形加载器：由父组件提供，按字取该字的楷书字形 */
  loadGlyph: (char: string) => Promise<string>
}>()

const emit = defineEmits<{ (e: 'pick', c: string): void }>()

/** 当前选中的字自身的字形 */
const charGlyph = ref('')

async function refreshGlyph(c: string) {
  charGlyph.value = ''
  try {
    charGlyph.value = await props.loadGlyph(c)
  } catch {
    charGlyph.value = ''
  }
}

/** 当前字是否有拆解数据；无则回退到库内可拆的字 */
const currentDec = computed(() => DECOMPOSITIONS[props.current] ?? null)

/** 可拆解的字列表：优先当前字，其后是库内的字 */
const candidates = computed(() => {
  const keys = Object.keys(DECOMPOSITIONS)
  const inLib = keys.filter(k => props.libraryChars.includes(k))
  const outLib = keys.filter(k => !props.libraryChars.includes(k))
  return [...new Set([props.current, ...inLib, ...outLib].filter(k => DECOMPOSITIONS[k]))]
})

/** 当前选中的字：若当前字无拆解数据，则取列表首个 */
const active = ref<string>(
  DECOMPOSITIONS[props.current] ? props.current : Object.keys(DECOMPOSITIONS)[0]
)

watch(() => props.current, c => {
  if (DECOMPOSITIONS[c]) active.value = c
})

watch(active, c => refreshGlyph(c), { immediate: true })

const dec = computed(() => DECOMPOSITIONS[active.value] ?? null)

/** exploded: 合体态；exploded: 拆解态 */
const exploded = ref(false)
const animating = ref(false)

function toggle() {
  if (!dec.value) return
  animating.value = true
  exploded.value = !exploded.value
  setTimeout(() => (animating.value = false), 700)
}

/** 部件在拆解态的位移 */
function partStyle(pos: keyof typeof PART_TRANSFORM, i: number, total: number) {
  const t = PART_TRANSFORM[pos]
  if (!exploded.value) {
    // 合体态：部件隐去，由背后的整字幽灵承担显示
    return {
      transform: `translate3d(-50%, -50%, 0) scale(0.82)`,
      opacity: 0,
      zIndex: 10 + i,
    }
  }
  // 拆解态：按位置散开
  const dir = total > 2 && pos === 'left' ? -1 : 1
  return {
    transform: `translate3d(calc(-50% + ${t.x * dir}px), calc(-50% + ${t.y}px), ${i * 40}px) scale(${t.scale})`,
    opacity: 1,
    zIndex: 10 + i,
  }
}

/** 连线起点（部件散开后的位置） */
function linkFrom(pos: keyof typeof PART_TRANSFORM) {
  const t = PART_TRANSFORM[pos]
  return { x: t.x * 0.62, y: t.y * 0.62 }
}

/** 单部件（独体字）特殊处理 */
const isSingle = computed(() => (dec.value?.parts.length ?? 0) === 1)

const partFont = computed(() => {
  const parts = dec.value?.parts ?? []
  const n = parts.length
  if (n >= 3) return 190
  if (n === 2) {
    // 上下结构需要更紧凑，否则舞台装不下
    const vertical = parts[0].pos === 'top' || parts[0].pos === 'bottom'
    return vertical ? 186 : 248
  }
  return 300
})
</script>

<template>
  <div class="forge">
    <header class="forge-head">
      <div>
        <h3 class="forge-title">拆字工坊</h3>
        <p class="forge-sub">把一个字拆开，看它由哪些部件构成</p>
      </div>
      <div class="forge-pick">
        <button
          v-for="c in candidates"
          :key="c"
          class="fp"
          :class="{ on: c === active, inlib: libraryChars.includes(c) }"
          @click="active = c"
        >
          {{ c }}
        </button>
      </div>
    </header>

    <div class="forge-body">
      <!-- 合成台 -->
      <div class="stage" :class="{ exploded, busy: animating }">
        <div class="stage-glow" />

        <!-- 合体态：显示整字作为背景幽灵 -->
        <div class="ghost" :class="{ show: !exploded && (dec?.parts.length ?? 0) > 1 }">
          <img v-if="charGlyph" :src="charGlyph" :alt="dec?.char" class="ghost-img" />
          <span v-else>{{ dec?.char }}</span>
        </div>

        <!-- 拆解态：部件之间的连线 -->
        <svg class="links" :class="{ show: exploded && (dec?.parts.length ?? 0) > 1 }" viewBox="-310 -260 620 520">
          <line
            v-for="(p, i) in dec?.parts ?? []"
            :key="'l' + i"
            :x1="linkFrom(p.pos).x"
            :y1="linkFrom(p.pos).y"
            x2="0"
            y2="0"
          />
        </svg>

        <div class="parts">
          <div
            v-for="(p, i) in dec?.parts ?? []"
            :key="p.name + i"
            class="part"
            :class="{ standalone: isSingle && !exploded }"
            :style="{
              ...partStyle(p.pos, i, dec?.parts.length ?? 1),
              fontSize: partFont + 'px',
            }"
          >
            <!-- 部件有字形资源时，展示真实字形 -->
            <div class="part-body">
              <img
                v-if="partGlyphs[p.name]"
                :src="partGlyphs[p.name]"
                :alt="p.name"
                class="part-img"
                :class="{ raster: rasterParts.includes(p.name) }"
              />
              <span v-else class="part-char">{{ p.name }}</span>
            </div>
            <span class="part-label">{{ p.name }} · {{ p.note }}</span>
          </div>
        </div>

        <!-- 合体提示 -->
        <div class="combo-hint" v-if="!exploded && (dec?.parts.length ?? 0) > 1">
          <span class="combo-eq">{{ dec?.parts.map(p => p.name).join(' + ') }} = {{ dec?.char }}</span>
        </div>

        <div class="single-note" v-else-if="isSingle && exploded">
          独体象形字，不可拆解
        </div>
      </div>

      <!-- 信息栏 -->
      <aside class="forge-info">
        <div class="fi-head">
          <span class="fi-char">{{ dec?.char }}</span>
          <div class="fi-meta">
            <div class="fi-method">
              <span class="fi-label">造字法</span>
              <span class="fi-value">{{ dec?.method ?? '—' }}</span>
              <span class="fi-note" v-if="dec?.methodNote">{{ dec.methodNote }}</span>
            </div>
            <span class="fi-lib" v-if="dec?.inLibrary">库内可查</span>
            <span class="fi-lib out" v-else>不在数据包内</span>
          </div>
        </div>

        <p class="fi-gloss">{{ dec?.gloss ?? '该字暂无拆解数据' }}</p>

        <div class="fi-parts" v-if="dec && dec.parts.length > 1">
          <div class="fi-part" v-for="(p, i) in dec.parts" :key="i">
            <span class="fp-name">{{ p.name }}</span>
            <span class="fp-note">{{ p.note }}</span>
          </div>
        </div>

        <div class="fi-actions">
          <button class="fa" :class="{ on: exploded }" @click="toggle" :disabled="!dec">
            {{ exploded ? '合体' : '拆解' }}
          </button>
          <button
            class="fa"
            v-if="dec?.inLibrary"
            @click="emit('pick', dec!.char)"
          >
            查看字源卡
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.forge {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.forge-head {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  gap: 26px;
  padding: 22px 30px 16px;
  border-bottom: 1px solid var(--line-soft);
}

.forge-title {
  font-family: var(--font-title);
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0.2em;
  color: var(--ink);
}

.forge-sub {
  font-size: 18.5px;
  color: var(--ink-faint);
  margin-top: 4px;
}

.forge-pick {
  margin-left: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-width: 460px;
  justify-content: flex-end;
}

.fp {
  font-family: var(--font-title);
  font-size: 19.5px;
  color: var(--ink-soft);
  border: 1px solid var(--line-soft);
  padding: 3px 9px;
  transition: all 0.24s ease;
  line-height: 1.5;
}

.fp:hover {
  border-color: var(--ink-faint);
  color: var(--ink);
}

.fp.on {
  color: var(--paper-light);
  background: var(--cinnabar);
  border-color: var(--cinnabar);
}

.fp.inlib::after {
  content: '';
  display: inline-block;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--jade);
  margin-left: 4px;
  vertical-align: middle;
}

.forge-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* 合成台 */
.stage {
  flex: 1;
  position: relative;
  display: grid;
  place-items: center;
  perspective: 1200px;
  overflow: hidden;
}

.stage-glow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 680px;
  height: 680px;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    rgba(233, 200, 130, 0.17) 0%,
    rgba(226, 186, 110, 0.075) 38%,
    transparent 70%
  );
  transition: opacity 0.6s ease;
  pointer-events: none;
}

.stage.exploded .stage-glow {
  opacity: 0.4;
}

/* 合体态的整字幽灵 */
.ghost {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-title);
  font-size: 210px;
  line-height: 1;
  color: var(--ink);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.6s ease;
  z-index: 1;
  width: 340px;
  height: 340px;
  display: grid;
  place-items: center;
}

.ghost-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
  filter: contrast(1.2) brightness(0.72);
}

.ghost.show {
  opacity: 0.13;
}

/* 独体字：合体态直接显示部件本身 */
.part.standalone {
  opacity: 1 !important;
}

/* 部件连线 */
.links {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 620px;
  height: 520px;
  margin: -260px 0 0 -310px;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
  z-index: 2;
  overflow: visible;
}

.links.show {
  opacity: 1;
}

.links line {
  stroke: var(--cinnabar);
  stroke-width: 1;
  stroke-dasharray: 4 5;
  opacity: 0.4;
}

.parts {
  position: relative;
  width: 620px;
  height: 480px;
  margin-top: -50px;
  transform-style: preserve-3d;
  display: grid;
  place-items: center;
}

.part {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: 50% 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition:
    transform 0.68s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.5s ease;
  will-change: transform;
  pointer-events: none;
}

.part-char {
  font-family: var(--font-title);
  color: var(--ink);
  line-height: 1;
  text-shadow: 0 2px 10px rgba(35, 32, 28, 0.12);
}

.part-body {
  width: 1.05em;
  height: 1.05em;
  display: grid;
  place-items: center;
}
.part-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
  filter: contrast(1.3) brightness(0.58);
}

/* 楷书帧为"白底黑字"的 PNG 包装 SVG：反相去掉白底，用双层滤镜着色 */
.part-img.raster {
  filter: invert(1) grayscale(1) sepia(1) saturate(9) hue-rotate(-42deg) brightness(0.62) contrast(1.5);
  opacity: 0.92;
}

.stage.exploded .part-char {
  color: var(--cinnabar);
}

.part-label {
  font-size: 17.5px;
  color: var(--ink-soft);
  letter-spacing: 0.08em;
  white-space: nowrap;
  background: rgba(250, 246, 238, 0.78);
  padding: 1px 8px;
  border-bottom: 1px solid var(--line);
}

.combo-hint {
  position: absolute;
  bottom: 34px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-title);
  font-size: 19.5px;
  color: var(--ink-faint);
  letter-spacing: 0.12em;
}

.combo-eq {
  border-bottom: 1px solid var(--line);
  padding-bottom: 3px;
}

.single-note {
  position: absolute;
  bottom: 34px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 17.5px;
  color: var(--ink-ghost);
}

/* 信息栏 */
.forge-info {
  width: 330px;
  flex-shrink: 0;
  padding: 26px 26px 30px;
  border-left: 1px solid var(--line-soft);
  overflow-y: auto;
  background: linear-gradient(to bottom, rgba(250, 246, 238, 0.6), rgba(243, 236, 224, 0.75));
}

.fi-head {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 16px;
}

.fi-char {
  font-family: var(--font-title);
  font-size: 54px;
  line-height: 1;
  color: var(--ink);
}

.fi-meta {
  flex: 1;
  padding-top: 6px;
}

.fi-method {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.fi-label {
  font-size: 19.5px;
  color: var(--ink-faint);
  letter-spacing: 0.14em;
}

.fi-value {
  font-family: var(--font-title);
  font-size: 19px;
  color: var(--cinnabar);
  letter-spacing: 0.1em;
}

.fi-note {
  font-size: 19.5px;
  color: var(--ink-faint);
  border: 1px solid var(--line);
  padding: 0 6px;
}

.fi-lib {
  display: inline-block;
  margin-top: 7px;
  font-size: 17.5px;
  color: var(--jade);
  border: 1px solid rgba(90, 122, 106, 0.32);
  padding: 0 7px;
}

.fi-lib.out {
  color: var(--ink-ghost);
  border-color: var(--line-soft);
}

.fi-gloss {
  font-family: var(--font-quote);
  font-size: 18.5px;
  line-height: 1.9;
  color: var(--ink-soft);
  text-align: justify;
  padding-bottom: 18px;
  border-bottom: 1px dashed var(--line-soft);
}

.fi-parts {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 16px 0;
}

.fi-part {
  display: flex;
  align-items: baseline;
  gap: 11px;
}

.fp-name {
  font-family: var(--font-title);
  font-size: 21px;
  color: var(--ink);
  min-width: 42px;
  text-align: center;
  border: 1px solid var(--line);
  padding: 1px 6px;
}

.fp-note {
  font-size: 17.5px;
  color: var(--ink-faint);
}

.fi-actions {
  display: flex;
  gap: 9px;
  margin-top: 8px;
}

.fa {
  font-family: var(--font-title);
  font-size: 17.5px;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  border: 1px solid var(--line);
  padding: 8px 16px;
  white-space: nowrap;
  border-radius: 2px;
  transition: all 0.26s ease;
}

.fa:hover:not(:disabled) {
  color: var(--cinnabar);
  border-color: rgba(180, 67, 47, 0.42);
}

.fa.on {
  color: var(--paper-light);
  background: var(--cinnabar);
  border-color: var(--cinnabar);
}

.fa:disabled {
  opacity: 0.3;
  cursor: default;
}
</style>
