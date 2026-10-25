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

const DEPTH = 330          // 相邻帧 Z 轴间距
const BASE_Z = 130         // 当前帧的 Z 基准（正值=靠近观众）
const ARC = 128            // 弧线横向展开量
const PERSPECTIVE = 1400   // 必须与 CSS .tunnel 的 perspective 一致
const DRIFT = 0.085        // 鼠标视差强度

const pointer = ref({ x: 0, y: 0 })
const hovering = ref<number | null>(null)
const stage = ref<HTMLElement | null>(null)

/** 每帧相对当前帧的偏移：负=更早（远处），正=更晚（近处） */
function offsetOf(i: number) {
  return i - props.modelValue
}

const placed = computed(() =>
  props.frames.map((f, i) => {
    const off = i - props.modelValue
    const depth = Math.abs(off)
    // 沿 Z 轴后退，形成"字形演变链"
    const z = BASE_Z - depth * DEPTH
    // 期望的屏幕横向位置：当前帧恒在中央。
    // 已演变的朝代（off<0）在左且更深，未来朝代（off>0）在右且更近——
    // 形成一条从远古（左）流向当代（右）的单向时间河。
    const wantX = off >= 0 ? off * ARC * 1.06 : off * ARC * 0.94
    // 透视补偿：CSS 透视会把 z 越远的元素向画面中心拉伸，
    // 反解出元素所需的 3D 坐标 x，使各帧最终落在预期位置
    const x = wantX * ((PERSPECTIVE - z) / PERSPECTIVE)
    return {
      ...f,
      index: i,
      off,
      z,
      x,
      // 越远越小
      scale: Math.max(0.42, 1 - depth * 0.14),
      // 越远越淡，但保留可读性，让整条演变链都在视野里
      opacity: Math.max(0.2, 1 - depth * 0.17),
      // 越远越模糊
      blur: Math.min(depth * 0.9, 4),
      // 朝向中心内转，形成弧
      rotateY: -off * 13 + pointer.value.x * 8,
      rotateX: pointer.value.y * -5,
      // 当前帧才发光
      glow: off === 0 ? 1 : 0,
      isCurrent: off === 0,
    }
  })
)

/** 前景遮罩：远处字形自然隐入纸面。数值须克制，否则会盖掉纵深 */
const veilOpacity = computed(() => {
  const d = Math.abs(props.modelValue - (props.frames.length - 1))
  return Math.min(0.34, d * 0.11)
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
  (v) => {
    hovering.value = null
    void v
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
    <!-- 纵深轨道：暗示这是一条可以走进去的隧道 -->
    <div class="track" aria-hidden="true">
      <span
        v-for="p in placed"
        :key="'t' + p.index"
        class="track-dot"
        :style="{
          transform: `translate3d(${p.x}px, -50%, ${p.z}px)`,
          opacity: Math.max(0.08, 0.42 - Math.abs(p.off) * 0.08),
        }"
      />
    </div>

    <div class="tunnel-scene">
      <div
        v-for="p in placed"
        :key="p.index"
        class="glyph-node"
        :class="{ current: p.isCurrent }"
        :style="{
          transform: `translate3d(${p.x}px, -50%, ${p.z}px) rotateY(${p.rotateY}deg) rotateX(${p.rotateX}deg) scale(${p.scale})`,
          opacity: p.opacity,
          filter: `blur(${p.blur}px) drop-shadow(0 ${p.glow * 10}px ${p.glow * 26}px rgba(180, 67, 47, ${p.glow * 0.3}))`,
          zIndex: 100 - Math.round(Math.abs(p.off) * 10),
        }"
        @click="select(p.index)"
        @mouseenter="hovering = p.index"
        @mouseleave="hovering = null"
      >
        <img v-if="p.type === 'png'" :src="p.src" :alt="p.era" class="glyph-img" />
        <img v-else :src="p.src" :alt="p.era" class="glyph-img" />

        <div class="era-tag" :class="{ show: hovering === p.index || p.isCurrent }">
          <span class="era-name">{{ p.era }}</span>
        </div>
      </div>
    </div>

    <!-- 纵深雾：远处字形隐入纸面 -->
    <div class="depth-veil" :style="{ opacity: veilOpacity }" />

    <!-- 底部时间刻度 -->
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
  perspective: 1400px;
  perspective-origin: 50% 46%;
}

.tunnel-scene {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}

/* 纵深轨道点 */
.track {
  position: absolute;
  left: 50%;
  top: 47%;
  width: 0;
  height: 0;
  transform-style: preserve-3d;
  pointer-events: none;
}

.track-dot {
  position: absolute;
  left: 0;
  top: 0;
  width: 7px;
  height: 7px;
  margin: -3.5px 0 0 -3.5px;
  border-radius: 50%;
  border: 1px solid var(--ink-faint);
  background: var(--paper-light);
  transition:
    transform 0.72s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.6s ease;
}

.glyph-node {
  position: absolute;
  left: 50%;
  top: 47%;
  width: 340px;
  height: 340px;
  margin: -170px 0 0 -170px;
  transform-style: preserve-3d;
  cursor: pointer;
  transition:
    transform 0.72s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.62s ease,
    filter 0.62s ease;
  will-change: transform, opacity, filter;
}

.glyph-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  /* 古文字是黑墨，落到宣纸上；楷书 PNG 是黑字白底，用混合模式压成墨色 */
  mix-blend-mode: multiply;
  filter: contrast(1.16) brightness(0.82);
  -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 62%, transparent 88%);
  mask-image: radial-gradient(circle at 50% 50%, #000 62%, transparent 88%);
}

.glyph-node.current .glyph-img {
  filter: contrast(1.24) brightness(0.7);
}

/* 朝代标签 */
.era-tag {
  position: absolute;
  left: 50%;
  bottom: -8px;
  transform: translateX(-50%) translateY(6px);
  opacity: 0;
  transition: all 0.4s ease;
  pointer-events: none;
  white-space: nowrap;
}

.era-tag.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.era-name {
  display: inline-block;
  font-family: var(--font-title);
  font-size: 15px;
  letter-spacing: 0.28em;
  color: var(--ink-soft);
  padding: 0.16em 0.5em 0.16em 0.78em;
  border: 1px solid var(--line);
  background: rgba(250, 246, 238, 0.86);
  backdrop-filter: blur(3px);
}

.glyph-node.current .era-name {
  color: var(--cinnabar);
  border-color: rgba(180, 67, 47, 0.32);
}

/* 纵深雾 */
.depth-veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 60% 52% at 50% 47%,
    rgba(243, 236, 224, 0) 0%,
    rgba(243, 236, 224, 0.55) 58%,
    var(--paper) 92%
  );
  transition: opacity 0.6s ease;
}

/* 时间刻度 */
.timeline {
  position: absolute;
  left: 50%;
  bottom: 42px;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  gap: 0;
  z-index: 200;
}

.tick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  padding: 0 18px;
  opacity: 0.42;
  transition: opacity 0.4s ease;
}

.tick:hover {
  opacity: 0.78;
}

.tick.active {
  opacity: 1;
}

.tick-line {
  width: 1px;
  height: 15px;
  background: var(--ink);
  transition:
    height 0.45s cubic-bezier(0.22, 0.61, 0.36, 1),
    background 0.4s ease;
}

.tick.active .tick-line {
  height: 30px;
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

/* 左右导航 */
.nav {
  position: absolute;
  top: 47%;
  transform: translateY(-50%);
  width: 46px;
  height: 46px;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--ink-soft);
  font-size: 26px;
  line-height: 1;
  display: grid;
  place-items: center;
  background: rgba(250, 246, 238, 0.5);
  transition: all 0.3s ease;
  z-index: 200;
}

.nav:hover:not(:disabled) {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
  background: rgba(250, 246, 238, 0.9);
}

.nav:disabled {
  opacity: 0.2;
  cursor: default;
}

.nav.prev {
  left: 34px;
}

.nav.next {
  right: 34px;
}
</style>
