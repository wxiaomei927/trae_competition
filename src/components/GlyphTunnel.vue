<script setup lang="ts">
import { computed, ref, watch } from 'vue'

export interface GlyphFrame {
  era: string
  type: 'svg' | 'png'
  src: string
}

const props = defineProps<{
  frames: GlyphFrame[]
  modelValue: number
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()

const DEPTH = 340          // 相邻帧 Z 轴间距
const BASE_Z = 150         // 当前帧 Z 基准
const ARC = 186            // 横向展开量
const PERSPECTIVE = 1500   // 与 CSS perspective 保持一致

const pointer = ref({ x: 0, y: 0 })
const hovering = ref<number | null>(null)
const stage = ref<HTMLElement | null>(null)

const placed = computed(() => {
  // 链条整体在画面中居中：让"当前帧 + 两侧字形"的分布重心落在中央
  const meanOff = (props.frames.length - 1) / 2 - props.modelValue
  return props.frames.map((f, i) => {
    const off = i - props.modelValue
    const depth = Math.abs(off)
    const z = BASE_Z - depth * DEPTH
    // 期望屏幕位置：以链条重心为基准，当前帧随时间轴移动
    const wantX = (off - meanOff) * ARC
    // 透视反向补偿：CSS 透视会把远处元素拉向中心，需反解 3D 坐标
    const x = wantX * ((PERSPECTIVE - z) / PERSPECTIVE)
    return {
      ...f,
      index: i,
      off,
      z,
      x,
      scale: Math.max(0.36, 1 - depth * 0.17),
      opacity: Math.max(0.2, 1 - depth * 0.2),
      blur: Math.min(depth * 1.0, 4),
      rotateY: -(off - meanOff) * 12 + pointer.value.x * 7,
      rotateX: pointer.value.y * -4,
      glow: off === 0 ? 1 : 0,
      isCurrent: off === 0,
      isPast: off < 0,
    }
  })
})

/** 中央光晕：当前字所处的"聚光" */
const halo = computed(() => {
  const cur = placed.value.find(p => p.isCurrent)
  return cur ? cur.x : 0
})

function onPointerMove(e: MouseEvent) {
  const el = stage.value
  if (!el) return
  const r = el.getBoundingClientRect()
  pointer.value = {
    x: (e.clientX - r.left) / r.width - 0.5,
    y: (e.clientY - r.top) / r.height - 0.5,
  }
}

function select(i: number) {
  if (i === props.modelValue) return
  emit('update:modelValue', i)
}

function step(d: number) {
  const next = props.modelValue + d
  if (next < 0 || next > props.frames.length - 1) return
  emit('update:modelValue', next)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') step(-1)
  else if (e.key === 'ArrowRight') step(1)
}

watch(
  () => props.modelValue,
  () => {
    hovering.value = null
  }
)
</script>

<template>
  <div
    ref="stage"
    class="tunnel"
    @pointermove="onPointerMove"
    @pointerleave="pointer = { x: 0, y: 0 }"
    tabindex="0"
    @keydown="onKey"
  >
    <!-- 中央聚光 -->
    <div
      class="halo"
      :style="{ transform: `translate3d(calc(-50% + ${halo}px), -50%, 0)` }"
      aria-hidden="true"
    />

    <div class="tunnel-scene">
      <div
        v-for="p in placed"
        :key="p.index"
        class="glyph-node"
        :class="{ current: p.isCurrent, past: p.isPast }"
        :style="{
          transform: `translate3d(${p.x}px, -50%, ${p.z}px) rotateY(${p.rotateY}deg) rotateX(${p.rotateX}deg) scale(${p.scale})`,
          opacity: p.opacity,
          filter: `blur(${p.blur}px) drop-shadow(0 ${p.glow * 12}px ${p.glow * 30}px rgba(180, 67, 47, ${p.glow * 0.32}))`,
          zIndex: 100 - Math.round(Math.abs(p.off) * 10),
        }"
        @click="select(p.index)"
        @mouseenter="hovering = p.index"
        @mouseleave="hovering = null"
      >
        <!-- 卡片衬底：给字形一个载体，不再是浮在空中的裸字 -->
        <div class="glyph-card">
          <span class="card-era">{{ p.era }}</span>
          <img :src="p.src" :alt="p.era" class="glyph-img" />
          <span class="card-index" v-if="p.isCurrent">今</span>
        </div>
      </div>
    </div>

    <!-- 纵深雾 -->
    <div class="depth-veil" aria-hidden="true" />

    <!-- 时间刻度 -->
    <div class="timeline">
      <button
        v-for="(f, i) in frames"
        :key="i"
        class="tick"
        :class="{ active: i === modelValue, passed: i < modelValue }"
        @click="select(i)"
      >
        <span class="tick-line" />
        <span class="tick-label">{{ f.era }}</span>
      </button>
    </div>

    <button class="nav prev" @click="step(-1)" :disabled="modelValue === 0" aria-label="上一朝代">‹</button>
    <button
      class="nav next"
      @click="step(1)"
      :disabled="modelValue === frames.length - 1"
      aria-label="下一朝代"
    >
      ›
    </button>
  </div>
</template>

<style scoped>
.tunnel {
  position: relative;
  height: 100%;
  outline: none;
  perspective: 1500px;
  perspective-origin: 50% 46%;
}

.tunnel-scene {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}

/* 中央聚光：暖金晕，衬托当前字 */
.halo {
  position: absolute;
  left: 50%;
  top: 44%;
  width: 620px;
  height: 620px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(233, 200, 130, 0.19) 0%,
    rgba(226, 186, 110, 0.1) 34%,
    rgba(220, 180, 100, 0.03) 58%,
    transparent 72%
  );
  pointer-events: none;
  transition: transform 0.75s cubic-bezier(0.22, 0.61, 0.36, 1);
  z-index: 0;
}

.glyph-node {
  position: absolute;
  left: 50%;
  top: 44%;
  width: 268px;
  height: 336px;
  margin: -168px 0 0 -134px;
  transform-style: preserve-3d;
  cursor: pointer;
  transition:
    transform 0.75s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.62s ease,
    filter 0.62s ease;
  will-change: transform, opacity, filter;
}

/* 字卡：宣纸质感方卡，让字形有依托 */
.glyph-card {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(155deg, rgba(252, 249, 242, 0.94), rgba(240, 232, 217, 0.86));
  border: 1px solid rgba(35, 32, 28, 0.16);
  box-shadow:
    0 1px 2px rgba(35, 32, 28, 0.05),
    0 12px 34px rgba(35, 32, 28, 0.09);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 24px 46px;
  transition:
    border-color 0.4s ease,
    box-shadow 0.4s ease;
}

.glyph-node.current .glyph-card {
  border-color: rgba(180, 67, 47, 0.34);
  box-shadow:
    0 1px 2px rgba(35, 32, 28, 0.06),
    0 20px 52px rgba(35, 32, 28, 0.14),
    0 0 0 4px rgba(180, 67, 47, 0.05);
}

/* 卡片四角的古籍标记 */
.glyph-card::before,
.glyph-card::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: rgba(35, 32, 28, 0.2);
  border-style: solid;
}

.glyph-card::before {
  top: 7px;
  left: 7px;
  border-width: 1px 0 0 1px;
}

.glyph-card::after {
  bottom: 7px;
  right: 7px;
  border-width: 0 1px 1px 0;
}

.card-era {
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: var(--font-title);
  font-size: 14px;
  letter-spacing: 0.32em;
  text-indent: 0.32em;
  color: var(--ink-faint);
}

.glyph-node.current .card-era {
  color: var(--cinnabar);
}

.glyph-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
  filter: contrast(1.2) brightness(0.74);
}

.glyph-node.current .glyph-img {
  filter: contrast(1.3) brightness(0.62);
}

/* 卡片上的"今"字标记 */
.card-index {
  position: absolute;
  bottom: 9px;
  right: 11px;
  font-family: var(--font-title);
  font-size: 12px;
  color: var(--paper-light);
  background: var(--cinnabar);
  padding: 1px 5px;
  line-height: 1.4;
  letter-spacing: 0;
}

/* 纵深雾 */
.depth-veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 74% 64% at 50% 44%,
    transparent 0%,
    rgba(243, 236, 224, 0.28) 62%,
    rgba(240, 233, 220, 0.78) 100%
  );
}

/* 时间刻度 */
.timeline {
  position: absolute;
  left: 50%;
  bottom: 34px;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  z-index: 200;
}

.tick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  padding: 0 20px;
  opacity: 0.4;
  transition: opacity 0.4s ease;
}

.tick:hover {
  opacity: 0.76;
}

.tick.active {
  opacity: 1;
}

.tick-line {
  width: 1px;
  height: 14px;
  background: var(--ink);
  transition:
    height 0.45s cubic-bezier(0.22, 0.61, 0.36, 1),
    background 0.4s ease;
}

.tick.active .tick-line {
  height: 28px;
  background: var(--cinnabar);
}

.tick.passed .tick-line {
  background: var(--ink-faint);
}

.tick-label {
  font-family: var(--font-title);
  font-size: 15px;
  letter-spacing: 0.16em;
  color: var(--ink);
  white-space: nowrap;
}

.tick.active .tick-label {
  color: var(--cinnabar);
}

.nav {
  position: absolute;
  top: 44%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--ink-soft);
  font-size: 25px;
  line-height: 1;
  display: grid;
  place-items: center;
  background: rgba(250, 246, 238, 0.62);
  transition: all 0.3s ease;
  z-index: 200;
}

.nav:hover:not(:disabled) {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
  background: rgba(250, 246, 238, 0.94);
}

.nav:disabled {
  opacity: 0.18;
  cursor: default;
}

.nav.prev {
  left: 26px;
}

.nav.next {
  right: 26px;
}
</style>
