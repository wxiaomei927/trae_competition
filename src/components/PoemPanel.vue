<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { makePoems } from '../data/poetry'

const props = defineProps<{ char: string }>()

const poems = computed(() => makePoems(props.char))
const picked = ref(0)

watch(() => props.char, () => (picked.value = 0))

const speaking = ref(false)

function speak(text: string) {
  if (speaking.value) {
    window.speechSynthesis?.cancel()
    speaking.value = false
    return
  }
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-CN'
  u.rate = 0.8
  u.onend = () => (speaking.value = false)
  u.onerror = () => (speaking.value = false)
  window.speechSynthesis?.speak(u)
  speaking.value = true
}
</script>

<template>
  <div class="poem-sec" v-if="poems.length">
    <h3 class="sec-title">字题</h3>

    <div class="poems">
      <button
        v-for="(p, i) in poems"
        :key="i"
        class="poem"
        :class="{ on: picked === i }"
        @click="picked = i"
      >
        <span class="poem-style">{{ p.style }}</span>
        <span class="poem-text">{{ p.text }}</span>
      </button>
    </div>

    <div class="poem-foot">
      <button class="poem-act" :class="{ on: speaking }" @click="speak(poems[picked].text)">
        {{ speaking ? '停止' : '朗读' }}
      </button>
      <span class="poem-src">AI 生成 · 意象取自本字义项与书证</span>
    </div>
  </div>
</template>

<style scoped>
.poem-sec {
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px dashed var(--line-soft);
}

.sec-title {
  font-family: var(--font-title);
  font-size: 19px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: 0.24em;
  margin-bottom: 15px;
  padding-left: 13px;
  border-left: 2px solid var(--cinnabar);
}

.poems {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.poem {
  display: flex;
  align-items: baseline;
  gap: 11px;
  text-align: left;
  padding: 11px 13px;
  border: 1px solid var(--line-soft);
  background: rgba(250, 246, 238, 0.6);
  transition: all 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
  position: relative;
}

.poem:hover {
  border-color: rgba(180, 67, 47, 0.34);
  transform: translateX(3px);
}

.poem.on {
  border-color: var(--cinnabar);
  background: rgba(180, 67, 47, 0.05);
}

.poem-style {
  font-size: 17.5px;
  color: var(--ink-ghost);
  border: 1px solid var(--line-soft);
  padding: 0 5px;
  line-height: 1.6;
  flex-shrink: 0;
}

.poem.on .poem-style {
  color: var(--cinnabar);
  border-color: rgba(180, 67, 47, 0.3);
}

.poem-text {
  font-family: var(--font-quote);
  font-size: 17.5px;
  color: var(--ink);
  line-height: 1.75;
}

.poem-foot {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 12px;
}

.poem-act {
  font-size: 19.5px;
  color: var(--ink-faint);
  border: 1px solid var(--line);
  padding: 2px 10px;
  transition: all 0.24s ease;
}

.poem-act:hover {
  color: var(--cinnabar);
  border-color: rgba(180, 67, 47, 0.4);
}

.poem-act.on {
  color: var(--paper-light);
  background: var(--cinnabar);
  border-color: var(--cinnabar);
}

.poem-src {
  font-size: 17.5px;
  color: var(--ink-ghost);
}
</style>
