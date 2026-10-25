<script setup lang="ts">
import { computed, ref } from 'vue'

interface Entry {
  char: string
  frames: { era: string; type: string; src: string }[]
  meanings: any[]
  phonetics: any[]
}

const props = defineProps<{
  list: Entry[]
  current: string
}>()

const emit = defineEmits<{ (e: 'pick', c: string): void }>()

const filter = ref<'all' | 'multi' | 'complete'>('all')

const shown = computed(() => {
  if (filter.value === 'multi') return props.list.filter(c => c.phonetics.length > 1)
  if (filter.value === 'complete') return props.list.filter(c => c.frames.length >= 4)
  return props.list
})
</script>

<template>
  <div class="grid-wrap">
    <div class="filters">
      <button class="f" :class="{ on: filter === 'all' }" @click="filter = 'all'">
        全部 {{ list.length }}
      </button>
      <button class="f" :class="{ on: filter === 'multi' }" @click="filter = 'multi'">
        多音字 {{ list.filter(c => c.phonetics.length > 1).length }}
      </button>
      <button class="f" :class="{ on: filter === 'complete' }" @click="filter = 'complete'">
        帧数齐全 {{ list.filter(c => c.frames.length >= 4).length }}
      </button>
    </div>

    <div class="grid">
      <button
        v-for="c in shown"
        :key="c.char"
        class="cell"
        :class="{ cur: c.char === current, warn: c.frames.length < 4 }"
        @click="emit('pick', c.char)"
      >
        <span class="cell-char">{{ c.char }}</span>
        <span class="cell-gloss">{{ c.meanings[0]?.gloss ?? '' }}</span>
        <span class="cell-foot">
          <i v-if="c.phonetics.length > 1" class="tag multi">{{ c.phonetics.length }} 音</i>
          <i class="tag">{{ c.meanings.length }} 义</i>
          <i v-if="c.frames.length < 4" class="tag warn">{{ c.frames.length }} 帧</i>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 22px;
}

.f {
  font-size: 13.5px;
  color: var(--ink-faint);
  border: 1px solid var(--line);
  padding: 5px 14px;
  border-radius: 2px;
  transition: all 0.26s ease;
}

.f:hover {
  color: var(--ink);
  border-color: var(--ink-faint);
}

.f.on {
  color: var(--paper-light);
  background: var(--ink);
  border-color: var(--ink);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 12px;
}

.cell {
  position: relative;
  background: linear-gradient(158deg, rgba(252, 249, 242, 0.9), rgba(240, 232, 217, 0.82));
  border: 1px solid var(--line-soft);
  padding: 15px 12px 11px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  transition: all 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
  min-height: 118px;
}

.cell:hover {
  border-color: rgba(180, 67, 47, 0.4);
  transform: translateY(-3px);
  box-shadow: 0 10px 26px rgba(35, 32, 28, 0.1);
}

.cell.cur {
  border-color: var(--cinnabar);
  background: linear-gradient(158deg, rgba(253, 250, 244, 0.98), rgba(244, 234, 220, 0.9));
  box-shadow: 0 0 0 2px rgba(180, 67, 47, 0.1);
}

.cell.warn {
  border-style: dashed;
}

.cell-char {
  font-family: var(--font-title);
  font-size: 38px;
  line-height: 1.1;
  color: var(--ink);
}

.cell.cur .cell-char {
  color: var(--cinnabar);
}

.cell-gloss {
  font-size: 12px;
  color: var(--ink-faint);
  text-align: center;
  line-height: 1.45;
  max-height: 34px;
  overflow: hidden;
}

.cell-foot {
  display: flex;
  gap: 4px;
  margin-top: auto;
  padding-top: 5px;
}

.tag {
  font-style: normal;
  font-size: 10.5px;
  color: var(--ink-ghost);
  border: 1px solid var(--line-soft);
  padding: 0 5px;
  line-height: 1.6;
}

.tag.multi {
  color: var(--jade);
  border-color: rgba(90, 122, 106, 0.3);
}

.tag.warn {
  color: var(--cinnabar-soft);
  border-color: rgba(201, 112, 92, 0.35);
}
</style>
