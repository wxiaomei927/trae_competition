<script setup lang="ts">
import { computed, ref } from 'vue'

interface Entry {
  char: string
  frames: { era: string; type: string; src: string }[]
  meanings: any[]
  phonetics: any[]
}

const props = defineProps<{ list: Entry[] }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'pick', c: string): void }>()

const round = ref(0)
const target = ref<Entry | null>(null)
const options = ref<Entry[]>([])
const answered = ref(false)
const picked = ref<string>('')
const score = ref(0)
const streak = ref(0)

/** 可用题库：帧数 ≥3 的字 */
const pool = computed(() => props.list.filter(c => c.frames.length >= 3))

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function nextQuestion() {
  answered.value = false
  picked.value = ''
  if (!pool.value.length) return
  const t = pool.value[Math.floor(Math.random() * pool.value.length)]
  target.value = t
  const others = shuffle(pool.value.filter(c => c.char !== t.char)).slice(0, 3)
  options.value = shuffle([t, ...others])
  round.value++
}

function choose(c: Entry) {
  if (answered.value) return
  picked.value = c.char
  answered.value = true
  if (c.char === target.value?.char) {
    score.value++
    streak.value++
  } else {
    streak.value = 0
  }
}

function useHint() {
  if (!target.value) return
  const m = target.value.meanings[0]
  if (m) {
    hint.value = `本义：${m.gloss}`
  }
}

const hint = ref('')

nextQuestion()
</script>

<template>
  <div class="pz-mask" @click.self="emit('close')">
    <div class="pz">
      <header class="pz-head">
        <div>
          <h3 class="pz-title">猜字</h3>
          <p class="pz-sub">看甲骨文，猜它是今天的哪个字</p>
        </div>
        <div class="pz-score">
          <span><i>答对</i>{{ score }}</span>
          <span><i>连击</i>{{ streak }}</span>
          <span><i>题次</i>{{ round }}</span>
        </div>
        <button class="pz-close" @click="emit('close')">×</button>
      </header>

      <div class="pz-body">
        <div class="pz-stage">
          <div class="pz-glyph" v-if="target">
            <img :src="target.frames[0].src" alt="字形" />
          </div>
          <p class="pz-era">甲骨文</p>
        </div>

        <div class="pz-side">
          <div class="pz-opts">
            <button
              v-for="o in options"
              :key="o.char"
              class="opt"
              :class="{
                right: answered && o.char === target?.char,
                wrong: answered && o.char === picked && o.char !== target?.char,
                dim: answered && o.char !== target?.char && o.char !== picked,
              }"
              @click="choose(o)"
            >
              {{ o.char }}
            </button>
          </div>

          <p class="pz-hint" v-if="hint">{{ hint }}</p>

          <div class="pz-actions">
            <button class="act" @click="useHint">提示</button>
            <button class="act" @click="nextQuestion" :disabled="!answered">下一题</button>
          </div>

          <p class="pz-note" v-if="answered">
            <template v-if="picked === target?.char">对了。这个字{{ target?.meanings[0]?.gloss }}。</template>
            <template v-else>正确答案是「{{ target?.char }}」——{{ target?.meanings[0]?.gloss }}。</template>
            <button class="link" @click="emit('pick', target!.char); emit('close')">查看字源卡 →</button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pz-mask {
  position: fixed;
  inset: 0;
  background: rgba(35, 32, 28, 0.4);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  z-index: 700;
  padding: 24px;
}

.pz {
  width: min(860px, 94vw);
  background: var(--paper-light);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-deep);
  padding: 28px 32px 32px;
}

.pz-head {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line-soft);
  margin-bottom: 24px;
}

.pz-title {
  font-family: var(--font-title);
  font-size: 25px;
  font-weight: 400;
  letter-spacing: 0.2em;
  color: var(--ink);
}

.pz-sub {
  font-size: 13.5px;
  color: var(--ink-faint);
  margin-top: 5px;
}

.pz-score {
  margin-left: auto;
  display: flex;
  gap: 18px;
}

.pz-score span {
  font-family: var(--font-title);
  font-size: 22px;
  color: var(--cinnabar);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pz-score i {
  font-style: normal;
  font-family: var(--font-body);
  font-size: 11.5px;
  color: var(--ink-faint);
  letter-spacing: 0.12em;
}

.pz-close {
  font-size: 26px;
  line-height: 1;
  color: var(--ink-faint);
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
}

.pz-close:hover {
  color: var(--cinnabar);
}

.pz-body {
  display: flex;
  gap: 34px;
  align-items: flex-start;
}

.pz-stage {
  width: 280px;
  flex-shrink: 0;
  text-align: center;
}

.pz-glyph {
  width: 280px;
  height: 280px;
  background: linear-gradient(155deg, rgba(252, 249, 242, 0.95), rgba(238, 229, 213, 0.88));
  border: 1px solid var(--line);
  box-shadow: 0 12px 34px rgba(35, 32, 28, 0.1);
  display: grid;
  place-items: center;
  padding: 34px;
}

.pz-glyph img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
  filter: contrast(1.24) brightness(0.68);
}

.pz-era {
  font-family: var(--font-title);
  font-size: 14px;
  letter-spacing: 0.24em;
  color: var(--ink-faint);
  margin-top: 12px;
}

.pz-side {
  flex: 1;
}

.pz-opts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.opt {
  font-family: var(--font-title);
  font-size: 34px;
  color: var(--ink);
  background: linear-gradient(155deg, rgba(252, 249, 242, 0.9), rgba(240, 232, 217, 0.8));
  border: 1px solid var(--line);
  padding: 18px 0;
  transition: all 0.26s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.opt:hover:not(.dim):not(.right):not(.wrong) {
  border-color: var(--cinnabar);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(35, 32, 28, 0.1);
}

.opt.right {
  background: rgba(90, 122, 106, 0.16);
  border-color: var(--jade);
  color: var(--jade);
}

.opt.wrong {
  background: rgba(180, 67, 47, 0.12);
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.opt.dim {
  opacity: 0.34;
}

.pz-hint {
  margin-top: 16px;
  font-size: 14.5px;
  color: var(--ink-soft);
  border-left: 2px solid var(--gold);
  padding: 7px 0 7px 13px;
  line-height: 1.7;
}

.pz-actions {
  display: flex;
  gap: 9px;
  margin-top: 20px;
}

.act {
  font-family: var(--font-title);
  font-size: 15px;
  letter-spacing: 0.12em;
  color: var(--ink-soft);
  border: 1px solid var(--line);
  padding: 7px 20px;
  border-radius: 2px;
  transition: all 0.26s ease;
}

.act:hover:not(:disabled) {
  color: var(--cinnabar);
  border-color: rgba(180, 67, 47, 0.42);
}

.act:disabled {
  opacity: 0.32;
  cursor: default;
}

.pz-note {
  margin-top: 18px;
  padding-top: 15px;
  border-top: 1px dashed var(--line-soft);
  font-size: 14.5px;
  color: var(--ink-soft);
  line-height: 1.75;
}

.link {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  color: var(--cinnabar);
  border-bottom: 1px solid rgba(180, 67, 47, 0.3);
  padding-bottom: 1px;
}
</style>
