<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

const props = withDefaults(defineProps<{ intensity?: number }>(), { intensity: 1 })

const canvasRef = ref<HTMLCanvasElement | null>(null)
let raf = 0
let t = 0

interface Mote {
  x: number
  y: number
  z: number
  r: number
  vx: number
  vy: number
  ph: number
}

interface InkBlob {
  x: number
  y: number
  r: number
  a: number
  drift: number
  phase: number
}

let motes: Mote[] = []
let blobs: InkBlob[] = []
let W = 0
let H = 0

function resize() {
  const c = canvasRef.value
  if (!c) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = c.clientWidth
  H = c.clientHeight
  c.width = W * dpr
  c.height = H * dpr
  const ctx = c.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  seed()
}

function seed() {
  const count = Math.round((W * H) / 26000)
  motes = []
  for (let i = 0; i < count; i++) {
    motes.push({
      x: Math.random() * W,
      y: Math.random() * H,
      z: 0.25 + Math.random() * 0.75,
      r: 0.4 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.16,
      vy: -0.05 - Math.random() * 0.22,
      ph: Math.random() * Math.PI * 2,
    })
  }
  blobs = []
  for (let i = 0; i < 6; i++) {
    blobs.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 200 + Math.random() * 380,
      a: 0.05 + Math.random() * 0.05,
      drift: 0.1 + Math.random() * 0.16,
      phase: Math.random() * Math.PI * 2,
    })
  }
}

/* 墨晕：多层低透明度径向渐变，缓慢漂移，像墨在纸上洇开 */
function drawInk(ctx: CanvasRenderingContext2D, time: number) {
  ctx.globalCompositeOperation = 'multiply'
  for (const b of blobs) {
    const wobble = Math.sin(time * b.drift + b.phase) * 46
    const wobbleY = Math.cos(time * b.drift * 0.77 + b.phase) * 34
    const cx = b.x + wobble
    const cy = b.y + wobbleY
    const pulse = b.r * (0.92 + Math.sin(time * b.drift * 0.55 + b.phase) * 0.12)

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulse)
    g.addColorStop(0, `rgba(52, 44, 36, ${b.a * props.intensity})`)
    g.addColorStop(0.5, `rgba(52, 44, 36, ${b.a * 0.5 * props.intensity})`)
    g.addColorStop(1, 'rgba(52, 44, 36, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, pulse, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'
}

/* 光尘：暖金微粒，缓慢上浮。
   浅色宣纸底上不能用 lighter（会加成白色，反而看不见），
   改用 source-over + 深金，才能在纸上显出尘粒。 */
function drawMotes(ctx: CanvasRenderingContext2D, time: number, mx: number, my: number) {
  ctx.globalCompositeOperation = 'source-over'
  for (const m of motes) {
    m.x += m.vx
    m.y += m.vy
    if (m.y < -12) {
      m.y = H + 10
      m.x = Math.random() * W
    }
    if (m.x < -12) m.x = W + 10
    if (m.x > W + 12) m.x = -10

    const twinkle = 0.34 + Math.sin(time * 0.7 + m.ph) * 0.3
    const dx = (m.x - mx) * 0.06
    const dy = (m.y - my) * 0.06
    const px = m.x + dx * m.z
    const py = m.y + dy * m.z

    const alpha = twinkle * m.z * 0.55 * props.intensity
    if (alpha <= 0.012) continue

    const r = m.r * m.z
    const g = ctx.createRadialGradient(px, py, 0, px, py, r * 4.5)
    g.addColorStop(0, `rgba(150, 112, 34, ${alpha})`)
    g.addColorStop(0.34, `rgba(176, 138, 52, ${alpha * 0.4})`)
    g.addColorStop(1, 'rgba(176, 138, 52, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(px, py, r * 4.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'
}

function loop() {
  const c = canvasRef.value
  const ctx = c?.getContext('2d')
  if (!c || !ctx) {
    raf = requestAnimationFrame(loop)
    return
  }
  t += 0.006
  ctx.clearRect(0, 0, W, H)
  drawInk(ctx, t)
  drawMotes(ctx, t, W / 2, H / 2)
  raf = requestAnimationFrame(loop)
}

let onMove = (e: MouseEvent) => {}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  loop()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <div class="backdrop" aria-hidden="true">
    <!-- 纸纤维纹理 -->
    <svg class="grain" xmlns="http://www.w3.org/2000/svg">
      <filter id="fibers">
        <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" seed="7" result="n" />
        <feColorMatrix in="n" type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.5" intercept="0" />
        </feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" filter="url(#fibers)" opacity="0.055" />
    </svg>

    <!-- 墨晕与光尘 -->
    <canvas ref="canvasRef" class="ink-canvas" />

    <!-- 四周压暗，让中心字形浮出来 -->
    <div class="vignette" />
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background:
    radial-gradient(ellipse 120% 90% at 50% 42%, #faf6ee 0%, #f3ece0 46%, #e9dfcd 100%);
}

.grain {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  mix-blend-mode: multiply;
}

.ink-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 78% 68% at 50% 45%,
    transparent 0%,
    transparent 52%,
    rgba(74, 63, 50, 0.07) 82%,
    rgba(58, 50, 42, 0.15) 100%
  );
  pointer-events: none;
}
</style>
