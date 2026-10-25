<script setup lang="ts">
import { computed } from 'vue'

export interface Meaning {
  seq: number
  type: string
  gloss: string
  era: string
  quote: string
  source: string
  translation: string
  note: string
}

export interface Phonetic {
  seq: number
  modern: string
  fanqie: string
  shengmu: string
  yunmu: string
  tone: string
  guangyun: string
  meaningRef: string
  note: string
}

export interface Analysis {
  method: string
  methodNote: string
  analysis: string
  parts: { name: string; note: string }[]
  narration: string
  narrationSeconds: number
  lifeExamples: { text: string; tip: string }[]
}

const props = defineProps<{
  char: string
  meanings: Meaning[]
  phonetics: Phonetic[]
  analysis?: Analysis
}>()

const typeTag = (t: string) => {
  if (t === '本义') return 'origin'
  if (t === '引申义') return 'extend'
  return 'loan'
}

const toneName = computed(() => {
  const map: Record<string, string> = { 平: '平声', 上: '上声', 去: '去声', 入: '入声' }
  const t = props.phonetics[0]?.tone ?? ''
  return map[t] ?? t
})
</script>

<template>
  <aside class="panel">
    <div class="panel-scroll">
      <!-- 字头 -->
      <header class="head">
        <div class="head-row">
          <h2 class="big-char">{{ char }}</h2>
          <div class="head-meta">
            <div class="method" v-if="analysis">
              <span class="method-label">造字法</span>
              <span class="method-value">{{ analysis.method }}</span>
              <span class="method-note" v-if="analysis.methodNote">{{ analysis.methodNote }}</span>
            </div>
            <div class="method" v-else>
              <span class="method-label">造字法</span>
              <span class="method-value faint">待考</span>
            </div>
          </div>
        </div>
        <p class="analysis" v-if="analysis?.analysis">{{ analysis.analysis }}</p>
        <p class="analysis faint" v-else>该字的构形解析待补充。</p>
      </header>

      <div class="rule"></div>

      <!-- 读音 -->
      <section class="sec">
        <h3 class="sec-title">读音流变</h3>
        <div class="phon-list">
          <div class="phon" v-for="p in phonetics" :key="p.seq">
            <div class="phon-head">
              <span class="modern">{{ p.modern }}</span>
              <span class="fanqie">{{ p.fanqie }}</span>
            </div>
            <div class="phon-grid">
              <span><i>声母</i>{{ p.shengmu }}</span>
              <span><i>韵目</i>{{ p.yunmu }}</span>
              <span><i>声调</i>{{ p.tone }}</span>
              <span><i>拟音</i>{{ p.guangyun }}</span>
            </div>
            <div class="phon-ref" v-if="p.meaningRef">对应 {{ p.meaningRef }}</div>
            <div class="phon-note" v-if="p.note">{{ p.note }}</div>
          </div>
          <p class="empty" v-if="!phonetics.length">读音数据待补充。</p>
        </div>
        <p class="tone-hint" v-if="toneName">中古 {{ toneName }} · 共 {{ phonetics.length }} 个读音</p>
      </section>

      <div class="rule"></div>

      <!-- 义项 -->
      <section class="sec">
        <h3 class="sec-title">义项时间轴</h3>
        <div class="timeline">
          <article class="mean" v-for="m in meanings" :key="m.seq">
            <div class="mean-rail">
              <span class="mean-dot" :class="typeTag(m.type)" />
              <span class="mean-line" />
            </div>
            <div class="mean-body">
              <div class="mean-head">
                <span class="mean-type" :class="typeTag(m.type)">{{ m.type }}</span>
                <span class="mean-era">{{ m.era }}</span>
              </div>
              <p class="mean-gloss">{{ m.gloss }}</p>
              <blockquote class="quote" v-if="m.quote">
                <p class="quote-text">{{ m.quote }}</p>
                <cite class="quote-src">{{ m.source }}</cite>
              </blockquote>
              <p class="quote-trans" v-if="m.translation">{{ m.translation }}</p>
              <p class="mean-note" v-if="m.note">{{ m.note }}</p>
            </div>
          </article>
          <p class="empty" v-if="!meanings.length">义项数据待补充。</p>
        </div>
      </section>

      <div class="rule"></div>

      <!-- 60 秒故事 -->
      <section class="sec" v-if="analysis?.narration">
        <h3 class="sec-title">六十秒故事</h3>
        <div class="narration">
          <p class="narr-text">{{ analysis.narration }}</p>
          <div class="narr-foot">
            <span class="narr-sec">{{ analysis.narrationSeconds }} 秒</span>
            <span class="ai-tag">AI 生成</span>
          </div>
        </div>
      </section>

      <div class="rule"></div>

      <!-- 生活例句 -->
      <section class="sec" v-if="analysis?.lifeExamples?.length">
        <h3 class="sec-title">今世用例</h3>
        <div class="ex-list">
          <div class="ex" v-for="(e, i) in analysis.lifeExamples" :key="i">
            <p class="ex-text">{{ e.text }}</p>
            <p class="ex-tip" v-if="e.tip">{{ e.tip }}</p>
          </div>
        </div>
        <p class="ai-note">以上用例由 AI 生成，仅作参考</p>
      </section>

      <div class="rule"></div>

      <!-- 部件 -->
      <section class="sec" v-if="analysis?.parts?.length">
        <h3 class="sec-title">部件</h3>
        <div class="parts">
          <span class="part" v-for="(p, i) in analysis.parts" :key="i">
            {{ p.name }}<i v-if="p.note">{{ p.note }}</i>
          </span>
        </div>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.panel {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    to bottom,
    rgba(250, 246, 238, 0.72),
    rgba(243, 236, 224, 0.86)
  );
  backdrop-filter: blur(6px);
}

.panel-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 30px 32px 48px;
}

.head-row {
  display: flex;
  align-items: flex-start;
  gap: 18px;
}

.big-char {
  font-family: var(--font-title);
  font-size: 72px;
  line-height: 0.94;
  color: var(--ink);
  font-weight: 400;
  flex-shrink: 0;
}

.head-meta {
  padding-top: 8px;
  flex: 1;
}

.method {
  display: flex;
  align-items: baseline;
  gap: 9px;
  flex-wrap: wrap;
}

.method-label {
  font-size: 13px;
  color: var(--ink-faint);
  letter-spacing: 0.16em;
}

.method-value {
  font-family: var(--font-title);
  font-size: 21px;
  color: var(--cinnabar);
  letter-spacing: 0.1em;
}

.method-value.faint {
  color: var(--ink-ghost);
}

.method-note {
  font-size: 13px;
  color: var(--ink-faint);
  border: 1px solid var(--line);
  padding: 1px 7px;
}

.analysis {
  margin-top: 16px;
  font-size: 15.5px;
  color: var(--ink-soft);
  line-height: 1.85;
  text-align: justify;
}

.analysis.faint {
  color: var(--ink-ghost);
}

.rule {
  height: 1px;
  background: linear-gradient(to right, var(--line), transparent);
  margin: 26px 0;
}

.sec-title {
  font-family: var(--font-title);
  font-size: 19px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: 0.24em;
  margin-bottom: 16px;
  padding-left: 13px;
  border-left: 2px solid var(--cinnabar);
}

/* 读音 */
.phon {
  padding: 12px 0;
  border-bottom: 1px dashed var(--line-soft);
}

.phon:last-child {
  border-bottom: none;
}

.phon-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 7px;
}

.modern {
  font-family: var(--font-title);
  font-size: 27px;
  color: var(--ink);
}

.fanqie {
  font-size: 15px;
  color: var(--ink-soft);
  letter-spacing: 0.08em;
}

.phon-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 14px;
  font-size: 13.5px;
  color: var(--ink-soft);
}

.phon-grid i {
  font-style: normal;
  color: var(--ink-ghost);
  margin-right: 6px;
  font-size: 12.5px;
}

.phon-ref {
  margin-top: 5px;
  font-size: 13.5px;
  color: var(--jade);
}

.phon-note {
  margin-top: 4px;
  font-size: 12.5px;
  color: var(--ink-faint);
  line-height: 1.6;
}

.tone-hint {
  margin-top: 12px;
  font-size: 13px;
  color: var(--ink-faint);
}

/* 义项时间轴 */
.mean {
  display: flex;
  gap: 14px;
}

.mean-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding-top: 6px;
}

.mean-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1.5px solid var(--ink-faint);
  background: var(--paper-light);
  flex-shrink: 0;
}

.mean-dot.origin {
  border-color: var(--cinnabar);
  background: var(--cinnabar);
}

.mean-dot.extend {
  border-color: var(--ink);
  background: var(--ink);
}

.mean-dot.loan {
  border-style: dashed;
}

.mean-line {
  width: 1px;
  flex: 1;
  background: var(--line);
  margin-top: 5px;
}

.mean:last-child .mean-line {
  display: none;
}

.mean-body {
  flex: 1;
  padding-bottom: 22px;
}

.mean-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 5px;
}

.mean-type {
  font-size: 12.5px;
  letter-spacing: 0.12em;
  padding: 1px 8px;
  border: 1px solid var(--line);
  color: var(--ink-soft);
}

.mean-type.origin {
  color: var(--cinnabar);
  border-color: rgba(180, 67, 47, 0.4);
}

.mean-type.extend {
  color: var(--ink);
  border-color: var(--ink);
}

.mean-era {
  font-size: 13px;
  color: var(--ink-faint);
}

.mean-gloss {
  font-size: 16.5px;
  color: var(--ink);
  line-height: 1.7;
  margin-bottom: 7px;
}

.quote {
  margin: 9px 0 5px;
  padding-left: 13px;
  border-left: 2px solid var(--line);
}

.quote-text {
  font-family: var(--font-quote);
  font-size: 16px;
  line-height: 1.85;
  color: var(--ink-soft);
}

.quote-src {
  display: block;
  font-style: normal;
  font-size: 13px;
  color: var(--ink-faint);
  margin-top: 5px;
  letter-spacing: 0.06em;
}

.quote-trans {
  font-size: 14px;
  color: var(--ink-faint);
  line-height: 1.75;
  padding-left: 15px;
}

.mean-note {
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--ink-faint);
  line-height: 1.6;
}

.empty {
  font-size: 14px;
  color: var(--ink-ghost);
}

/* 口播 */
.narration {
  background: rgba(250, 246, 238, 0.8);
  border: 1px solid var(--line-soft);
  padding: 16px 18px;
}

.narr-text {
  font-family: var(--font-quote);
  font-size: 15.5px;
  line-height: 2;
  color: var(--ink-soft);
  text-align: justify;
}

.narr-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 13px;
  padding-top: 10px;
  border-top: 1px dashed var(--line-soft);
}

.narr-sec {
  font-size: 13px;
  color: var(--ink-faint);
}

.ai-tag {
  font-size: 11.5px;
  color: var(--cinnabar);
  border: 1px solid rgba(180, 67, 47, 0.34);
  padding: 1px 7px;
  letter-spacing: 0.1em;
}

/* 例句 */
.ex {
  padding: 9px 0;
  border-bottom: 1px dashed var(--line-soft);
}

.ex:last-child {
  border-bottom: none;
}

.ex-text {
  font-family: var(--font-quote);
  font-size: 16px;
  color: var(--ink);
  line-height: 1.7;
}

.ex-tip {
  font-size: 13px;
  color: var(--cinnabar-soft);
  margin-top: 3px;
  line-height: 1.6;
}

.ai-note {
  margin-top: 9px;
  font-size: 12px;
  color: var(--ink-ghost);
}

/* 部件 */
.parts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.part {
  font-family: var(--font-title);
  font-size: 17px;
  color: var(--ink);
  border: 1px solid var(--line);
  padding: 3px 12px;
  display: inline-flex;
  align-items: baseline;
  gap: 7px;
}

.part i {
  font-style: normal;
  font-family: var(--font-body);
  font-size: 12.5px;
  color: var(--ink-faint);
}
</style>
