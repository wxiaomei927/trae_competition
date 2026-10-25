<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CLANS } from '../data/clans'

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
  /** 字形加载器 */
  loadGlyph: (char: string) => Promise<string>
}>()

const emit = defineEmits<{ (e: 'pick', c: string): void }>()

const active = ref(0)
const clan = computed(() => CLANS[active.value])

/** 每个族的字形：形旁 + 成员 */
const glyphs = ref<Record<string, string>>({})

async function loadClan() {
  const c = clan.value
  const need = [c.radical, ...c.members]
  const map: Record<string, string> = {}
  await Promise.all(
    need.map(async ch => {
      if (!props.index[ch]) return
      try {
        map[ch] = await props.loadGlyph(ch)
      } catch {
        /* 略过 */
      }
    })
  )
  glyphs.value = map
}

watch(active, loadClan, { immediate: true })
</script>

<template>
  <div class="clan">
    <header class="clan-head">
      <div>
        <h3 class="clan-title">字族</h3>
        <p class="clan-sub">同一部件的字，长在同一棵树上</p>
      </div>
      <div class="clan-tabs">
        <button
          v-for="(c, i) in CLANS"
          :key="c.radicalName"
          class="ct"
          :class="{ on: i === active }"
          @click="active = i"
        >
          {{ c.radicalName }}
          <span class="ct-n">{{ c.members.length }}</span>
        </button>
      </div>
    </header>

    <div class="clan-body">
      <!-- 字族树 -->
      <div class="tree">
        <!-- 形旁：根 -->
        <div class="node root">
          <div class="glyph-box root-box">
            <img v-if="glyphs[clan.radical]" :src="glyphs[clan.radical]" :alt="clan.radical" />
            <span v-else class="glyph-txt">{{ clan.radical }}</span>
          </div>
          <div class="node-label">
            <span class="nl-name">{{ clan.radicalName }}</span>
            <span class="nl-mean">形旁：{{ clan.meaning }}</span>
          </div>
        </div>

        <!-- 连线 -->
        <svg class="branches" viewBox="0 0 600 200" preserveAspectRatio="none">
          <path
            v-for="(m, i) in clan.members"
            :key="m"
            :d="`M 300 40 C 300 90, ${120 + i * (360 / Math.max(1, clan.members.length - 1))} 90, ${120 + i * (360 / Math.max(1, clan.members.length - 1))} 130`"
          />
        </svg>

        <!-- 成员：枝 -->
        <div class="leaves">
          <button
            v-for="m in clan.members"
            :key="m"
            class="node leaf"
            :class="{ cur: m === current }"
            @click="emit('pick', m)"
          >
            <div class="glyph-box">
              <img v-if="glyphs[m]" :src="glyphs[m]" :alt="m" />
              <span v-else class="glyph-txt">{{ m }}</span>
            </div>
            <div class="node-label">
              <span class="nl-char">{{ m }}</span>
              <span class="nl-gloss">{{ props.index[m]?.gloss ?? '' }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- 说明 -->
      <aside class="clan-info">
        <h4 class="ci-title">{{ clan.radicalName }}小传</h4>
        <p class="ci-note">{{ clan.note }}</p>

        <div class="ci-list">
          <button
            v-for="m in clan.members"
            :key="m"
            class="ci-item"
            @click="emit('pick', m)"
          >
            <span class="ci-char">{{ m }}</span>
            <span class="ci-gloss">{{ props.index[m]?.gloss ?? '' }}</span>
            <span class="ci-modern">{{ props.index[m]?.modern ?? '' }}</span>
          </button>
        </div>

        <p class="ci-tip">点击任意字，查看它的完整字源卡</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.clan {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.clan-head {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  gap: 26px;
  padding: 22px 30px 16px;
  border-bottom: 1px solid var(--line-soft);
}

.clan-title {
  font-family: var(--font-title);
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0.2em;
  color: var(--ink);
}

.clan-sub {
  font-size: 18.5px;
  color: var(--ink-faint);
  margin-top: 4px;
}

.clan-tabs {
  margin-left: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 560px;
  justify-content: flex-end;
}

.ct {
  font-family: var(--font-title);
  font-size: 17.5px;
  color: var(--ink-soft);
  border: 1px solid var(--line-soft);
  padding: 4px 11px;
  transition: all 0.24s ease;
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.ct:hover {
  border-color: var(--ink-faint);
  color: var(--ink);
}

.ct.on {
  color: var(--paper-light);
  background: var(--ink);
  border-color: var(--ink);
}

.ct-n {
  font-size: 17.5px;
  opacity: 0.7;
}

.clan-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* 树 */
.tree {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 30px 26px;
  min-width: 0;
}

.node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
}

.glyph-box {
  width: 104px;
  height: 104px;
  background: linear-gradient(155deg, rgba(252, 249, 242, 0.95), rgba(240, 232, 217, 0.88));
  border: 1px solid var(--line);
  box-shadow: 0 8px 22px rgba(35, 32, 28, 0.08);
  display: grid;
  place-items: center;
  padding: 12px;
}

.root-box {
  width: 122px;
  height: 122px;
  border-color: rgba(180, 67, 47, 0.4);
  box-shadow: 0 10px 28px rgba(35, 32, 28, 0.12);
}

.glyph-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
  filter: contrast(1.25) brightness(0.68);
}

.glyph-txt {
  font-family: var(--font-title);
  font-size: 58px;
  color: var(--ink);
  line-height: 1;
}

.node-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.nl-name {
  font-family: var(--font-title);
  font-size: 17.5px;
  color: var(--cinnabar);
  letter-spacing: 0.12em;
}

.nl-mean {
  font-size: 19.5px;
  color: var(--ink-faint);
}

.nl-char {
  font-family: var(--font-title);
  font-size: 19.5px;
  color: var(--ink);
}

.nl-gloss {
  font-size: 17.5px;
  color: var(--ink-faint);
  max-width: 92px;
  text-align: center;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 连线 */
.branches {
  width: 600px;
  height: 92px;
  flex-shrink: 0;
  overflow: visible;
}

.branches path {
  fill: none;
  stroke: rgba(35, 32, 28, 0.22);
  stroke-width: 1.2;
}

/* 枝 */
.leaves {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
  justify-content: center;
}

.leaf {
  transition: transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.leaf:hover {
  transform: translateY(-4px);
}

.leaf.cur .glyph-box {
  border-color: var(--cinnabar);
  box-shadow: 0 0 0 2px rgba(180, 67, 47, 0.12);
}

/* 说明 */
.clan-info {
  width: 336px;
  flex-shrink: 0;
  padding: 26px 26px 30px;
  border-left: 1px solid var(--line-soft);
  overflow-y: auto;
  background: linear-gradient(to bottom, rgba(250, 246, 238, 0.6), rgba(243, 236, 224, 0.75));
}

.ci-title {
  font-family: var(--font-title);
  font-size: 19px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: 0.16em;
  margin-bottom: 12px;
}

.ci-note {
  font-family: var(--font-quote);
  font-size: 19.5px;
  line-height: 1.9;
  color: var(--ink-soft);
  text-align: justify;
  padding-bottom: 16px;
  border-bottom: 1px dashed var(--line-soft);
}

.ci-list {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
}

.ci-item {
  display: flex;
  align-items: baseline;
  gap: 11px;
  padding: 9px 0;
  border-bottom: 1px solid var(--line-soft);
  text-align: left;
  transition: all 0.24s ease;
}

.ci-item:hover {
  padding-left: 5px;
  background: rgba(180, 67, 47, 0.04);
}

.ci-char {
  font-family: var(--font-title);
  font-size: 22px;
  color: var(--ink);
  min-width: 34px;
}

.ci-gloss {
  font-size: 17.5px;
  color: var(--ink-soft);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ci-modern {
  font-size: 18.5px;
  color: var(--jade);
}

.ci-tip {
  margin-top: 16px;
  font-size: 19.5px;
  color: var(--ink-ghost);
}
</style>
