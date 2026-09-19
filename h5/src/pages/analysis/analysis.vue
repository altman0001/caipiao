<template>
  <view>
    <TopBar showWin />

    <PageBody>
      <!-- 概览 -->
      <view class="section fade-up">
        <view class="sec-head">
          <text class="h2">分析概览</text>
          <text class="sub">近 {{ a.nDraws }} 期统计</text>
        </view>

        <view class="metrics">
          <view class="m-card">
            <text class="label">平均和值</text>
            <view class="value">{{ avgSum.toFixed(1) }}</view>
          </view>
          <view class="m-card">
            <text class="label">平均跨度</text>
            <view class="value">{{ avgSpan.toFixed(1) }}</view>
          </view>
          <view class="m-card">
            <text class="label">连号期占比</text>
            <view class="value">{{ (a.consecDraws / a.nDraws * 100).toFixed(0) }}<small>%</small></view>
          </view>
          <view class="m-card">
            <text class="label">平均重号数</text>
            <view class="value">{{ repeatPer.toFixed(2) }}</view>
          </view>
          <view class="m-card">
            <text class="label">重号期占比</text>
            <view class="value">{{ (a.repeatDraws / a.nDraws * 100).toFixed(0) }}<small>%</small></view>
          </view>
          <view class="m-card">
            <text class="label">{{ tag === 'dlt' ? '后区' : '蓝球' }}均出频</text>
            <view class="value">{{ extAvg.toFixed(1) }}<small>次</small></view>
          </view>
        </view>

        <view class="tagline" style="margin-top:18rpx">
          近 {{ a.nDraws }} 期最热主号
          <text class="hot">{{ hot.join('、') }}</text>，最冷主号
          <text class="cold">{{ cold.join('、') }}</text>；最常见的奇偶形态为
          <text class="w">{{ topOdd[0] }}</text>（{{ topOdd[1] }} 期），大小形态
          <text class="w">{{ topBig[0] }}</text>（{{ topBig[1] }} 期）。
        </view>
      </view>

      <!-- 12 个分析维度（手风琴） -->
      <view class="section fade-up">
        <view class="sec-head">
          <text class="h2">12 个分析维度</text>
          <view class="btn tiny" @click="toggleAll">{{ openSet.length === PANELS.length ? '全部收起' : '展开全部' }}</view>
        </view>
      </view>

      <uni-collapse v-model="openSet" class="collapse">
        <uni-collapse-item
          v-for="p in PANELS"
          :key="p.name"
          :name="p.name"
          :title="p.n + '. ' + p.title"
        >
          <view class="panel-body">
            <view class="collapse-hint">{{ p.note }}</view>

            <template v-if="p.name === 'd1'">
              <HeatGrid :R="a.R" :values="a.freqArr" />
            </template>

            <template v-else-if="p.name === 'd2'">
              <HeatGrid :R="a.R" :values="a.om" :om-hist="a.omHist" mode="omaha" />
              <view class="big-hint">当前遗漏最深的 5 个主号：{{ due.map((d) => d.n + '号' + d.o + '期').join('、') }}。「遗漏 + 均值回补」是最流行的守号策略。</view>
            </template>

            <template v-else-if="p.name === 'd3'">
              <RatioBars :data="a.oddEven" />
            </template>

            <template v-else-if="p.name === 'd4'">
              <RatioBars :data="a.bigSmall" />
              <view class="big-hint">大小以 {{ a.bigBound }} 为界：≤{{ a.bigBound }} 为小，> {{ a.bigBound }} 为大。</view>
            </template>

            <template v-else-if="p.name === 'd5'">
              <BarChart :data="entries(a.primeComp)" color="linear-gradient(180deg,#b497ff,#8b5ff5)" />
            </template>

            <template v-else-if="p.name === 'd6'">
              <ZoneBars :z1="a.zones.z1" :z2="a.zones.z2" :z3="a.zones.z3" :boundary="a.zones.boundary" :R="a.R" />
            </template>

            <template v-else-if="p.name === 'd7'">
              <BarChart :data="a.sumHist" color="linear-gradient(180deg,#37e0c0,#17b8a0)" />
              <view class="big-hint">主号和值在 {{ sumMin }}~{{ sumMax }} 之间，平均 {{ avgSum.toFixed(1) }} 附近期数最多，是评断偏大 / 偏小形态的标尺。</view>
            </template>

            <template v-else-if="p.name === 'd8'">
              <BarChart :data="a.spanHist" color="linear-gradient(180deg,#ffab2e,#ff7b1c)" />
              <view class="big-hint">跨度 = 最大主号 − 最小主号，反映号码分散度。</view>
            </template>

            <template v-else-if="p.name === 'd9'">
              <view class="metrics">
                <view class="m-card">
                  <text class="label">含连号期占比</text>
                  <view class="value">{{ (a.consecDraws / a.nDraws * 100).toFixed(0) }}<small>%</small></view>
                </view>
                <view class="m-card">
                  <text class="label">平均连号对数/期</text>
                  <view class="value">{{ (a.consecPairs / a.nDraws).toFixed(2) }}</view>
                </view>
              </view>
              <view class="big-hint">超过一半的期次都开了连号——「相邻号码对」确实频繁出现。</view>
            </template>

            <template v-else-if="p.name === 'd10'">
              <BarChart :data="a.repeatHist" color="linear-gradient(180deg,#ff6b81,#e04463)" :height="200" />
              <view class="big-hint">平均每期重上期 <text class="w">{{ repeatPer.toFixed(2) }}</text> 个，约 <text class="w">{{ (a.repeatDraws / a.nDraws * 100).toFixed(0) }}%</text> 的期次至少重 1 个。</view>
            </template>

            <template v-else-if="p.name === 'd11'">
              <BarChart :data="a.tailBar" color="linear-gradient(180deg,#52d6ff,#2b8bff)" />
            </template>

            <template v-else-if="p.name === 'd12'">
              <HeatGrid :R="a.extra.R" :values="a.extra.freq" :cols="6" :label-for="extraLabel" />
              <view class="big-hint" v-if="extraDue.length">
                当前遗漏较深：{{ extraDue }}
              </view>
            </template>
          </view>
        </uni-collapse-item>
      </uni-collapse>

      <view class="disclaimer">
        <text class="d-title">重要提示：</text>体彩 / 福彩开奖均为随机独立事件，历史数据不构成对未来结果的确定性依据。本页统计仅用于研究开奖数据的分布规律，不构成投注建议。
      </view>
    </PageBody>
  </view>
</template>

<script>
import TopBar from '../../components/TopBar.vue';
import PageBody from '../../components/PageBody.vue';
import HeatGrid from '../../components/HeatGrid.vue';
import BarChart from '../../components/BarChart.vue';
import ZoneBars from '../../components/ZoneBars.vue';
import RatioBars from '../../components/RatioBars.vue';
import { DATA } from '../../common/data.js';
import { store } from '../../common/store.js';
import { computeAnalysis } from '../../common/lib/analysis.js';

const PANELS = [
  { name: 'd1', n: '1', title: '号码冷热频率', note: '统计每个主号在该窗口内开出的总次数，红 = 热号，蓝 = 冷号。' },
  { name: 'd2', n: '2', title: '遗漏走势', note: '每个主号距上次开出的期数（遗漏值）。值越大越久未开，深红高危、浅红接近均值（可能回补）。' },
  { name: 'd3', n: '3', title: '奇偶比分布', note: '每期主号的 奇数:偶数 比值出现频率，多数集中在 2:4 / 3:3 / 4:2。' },
  { name: 'd4', n: '4', title: '大小比分布', note: '按界值分大小后统计各大小比出现次数，均衡形态更常见。' },
  { name: 'd5', n: '5', title: '质数个数分布', note: '每期主号中质数(2/3/5/7/11/13/17/19/23/29/31…)个数的分布。' },
  { name: 'd6', n: '6', title: '区间分布（三区）', note: '主号等分三区，观察出号偏移，判断「断区 / 守区」。' },
  { name: 'd7', n: '7', title: '和值分布', note: '主号和值分布，平均和值附近期数最多。' },
  { name: 'd8', n: '8', title: '跨度分布', note: '跨度 = 最大 − 最小主号，跨度过大过小都是相对少见形态。' },
  { name: 'd9', n: '9', title: '连号统计', note: '统计每期是否出现相邻连号（如 12·13）以及连号对数。' },
  { name: 'd10', n: '10', title: '重号统计', note: '与上一期重复出现主号的个数分布。' },
  { name: 'd11', n: '11', title: '尾数分布', note: '所有主号码个位尾数(0-9)的累计次数，了解同尾号冷热。' },
  { name: 'd12', n: '12', title: '后区 / 蓝球号码分析', note: '独立选号区，单独看频率与遗漏。' },
];

export default {
  components: { TopBar, PageBody, HeatGrid, BarChart, ZoneBars, RatioBars },
  data() {
    return {
      store,
      PANELS,
      openSet: ['d1'],
    };
  },
  computed: {
    game() { return { ...DATA[store.game], tag: store.game }; },
    tag() { return this.game.tag; },
    winNum() { return store.win === 'all' ? this.game.draws.length : parseInt(store.win, 10); },
    a() { return computeAnalysis(this.game, this.winNum); },
    avgSum() {
      const n = this.a.nDraws;
      return n ? this.a.sumHist.reduce((s, it) => s + Number(it.k) * it.v, 0) / n : 0;
    },
    avgSpan() {
      const n = this.a.nDraws;
      return n ? this.a.spanHist.reduce((s, it) => s + Number(it.k) * it.v, 0) / n : 0;
    },
    extAvg() { return this.a.extra.freq.slice(1).reduce((s, v) => s + v, 0) / this.a.extra.R; },
    repeatPer() { return this.a.totalRepeats / this.a.nDraws; },
    hot() { return [...this.a.hot].slice(0, 3).map((x) => x.n); },
    cold() { return [...this.a.cold].slice(0, 3).map((x) => x.n); },
    topOdd() { return Object.entries(this.a.oddEven).sort((x, y) => y[1] - x[1])[0] || ['—', 0]; },
    topBig() { return Object.entries(this.a.bigSmall).sort((x, y) => y[1] - x[1])[0] || ['—', 0]; },
    sumMin() { return this.a.sumHist.length ? Math.min(...this.a.sumHist.map((it) => +it.k)) : 0; },
    sumMax() { return this.a.sumHist.length ? Math.max(...this.a.sumHist.map((it) => +it.k)) : 0; },
    due() {
      return Array.from({ length: this.a.R }, (_, i) => {
        const x = i + 1; // 统计引擎 omHist 只为 1..R 建索引，跳过下标 0
        return { n: x, o: this.a.om[x], a: this.a.omHist[x].avg };
      })
        .filter((x) => x.o > 0)
        .sort((x, y) => y.o - x.o)
        .slice(0, 5);
    },
    extraDue() {
      const s = this.a.extra.om.slice(1)
        .map((v, i) => [i + 1, v])
        .filter((x) => x[1] >= 5)
        .map((x) => x[0] + '号' + x[1] + '期')
        .join(' · ');
      return s || '';
    },
  },
  methods: {
    entries(o) { return Object.entries(o).map(([k, v]) => ({ k, v })).sort((a, b) => Number(a.k) - Number(b.k)); },
    extraLabel(n) { return Math.round((this.a.extra.freq[n] / this.a.nDraws) * 100) + '%'; },
    toggleAll() {
      this.openSet = this.openSet.length === PANELS.length ? [] : PANELS.map((p) => p.name);
    },
  },
};
</script>

<style lang="scss" scoped>
.collapse {
  border-radius: var(--radius);
  overflow: hidden;
}

.panel-body { padding: 6rpx 26rpx 26rpx; }

.collapse-hint {
  color: var(--faint);
  font-size: 22rpx;
  margin-bottom: 14rpx;
  line-height: 1.7;
}

.btn.tiny {
  margin-left: auto;
  padding: 8rpx 20rpx;
  font-size: 22rpx;
}

.tagline .hot { color: #ff6b81; font-weight: 700; }
.tagline .cold { color: #4dabff; font-weight: 700; }
.tagline .w { font-weight: 700; color: var(--text); }

.d-title { color: var(--muted); font-weight: 700; }
</style>