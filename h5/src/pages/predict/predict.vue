<template>
  <view>
    <TopBar showWin />

    <PageBody>
      <!-- 逻辑说明 -->
      <view class="section fade-up">
        <view class="sec-head">
          <text class="h2">预测逻辑说明</text>
          <text class="sub">估计每个号码「本期不被开出」的概率</text>
        </view>
        <view class="strategy">
          <view class="s-row">
            <text class="s-ball s1">40%</text>
            <view>
              <text class="s-name" style="color:#ff6b81">遗漏回补</text>
              <text class="s-desc">依据 P(下期开出 | 当期遗漏 g 期)，深冷到均值时被视为「待回补」。</text>
            </view>
          </view>
          <view class="s-row">
            <text class="s-ball s2">25%</text>
            <view>
              <text class="s-name" style="color:#ffab2e">近期热度</text>
              <text class="s-desc">近 8 期出现频次，热号有顺延惯性、冬眠号被视为走冷。</text>
            </view>
          </view>
          <view class="s-row">
            <text class="s-ball s3">20%</text>
            <view>
              <text class="s-name" style="color:#7f9cff">大数频率</text>
              <text class="s-desc">与理论期望次数比对，识别「历史欠账」或「透支」。</text>
            </view>
          </view>
          <view class="s-row">
            <text class="s-ball s4">15%</text>
            <view>
              <text class="s-name" style="color:#37e0c0">形态均衡</text>
              <text class="s-desc">奇偶 / 大小近期占比的均衡调校。</text>
            </view>
          </view>
        </view>
        <view class="scoring">
          <view class="big-hint" style="margin:0">
            每个号码得到一个 <text class="w">0–100 的「排除置信分」</text>（在各自号码池内归一化）：
            分数越高 = 越有把握认为本期不会开出、建议排除；分数越低 = 相对更可能出现，需保留关注。
          </view>
          <view class="legend">
            <view class="lg-item">
              <view class="flag" :style="{ background: scoreColor(5) }" />
              <text>可能出现（低排除）</text>
            </view>
            <view class="lg-item">
              <view class="flag" :style="{ background: scoreColor(90) }" />
              <text>建议排除（高置信）</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 主号排除预测 -->
      <view class="section fade-up">
        <view class="sec-head">
          <text class="h2">{{ tag === 'dlt' ? '前区' : '主号' }}排除预测</text>
          <text class="badge">{{ game.mainCount }} 选 {{ game.mainRange }}</text>
        </view>

        <view class="cand-block">
          <text class="cand-label">推荐保留（候选开出）</text>
          <view class="balls">
            <Ball v-for="x in p.mainLikely" :key="'k' + x.n" :num="x.n" :color="tag === 'dlt' ? 'orange' : 'red'" size="md" cand />
          </view>
        </view>

        <view class="cand-block">
          <text class="cand-label">
            建议排除
            <text class="cand-n">{{ game.mainRange - game.mainCount }} 个</text>
          </text>
          <text class="cand-desc">剩余号码按排除置信分排列</text>
        </view>

        <view class="slider-row">
          <text class="sl-label">排除划线：按分数取最高的 {{ exclPct }}%</text>
          <text class="sl-val">{{ mainExclCount }} 个标红</text>
        </view>
        <uni-slider
          :value="exclPct"
          :min="45"
          :max="90"
          :step="5"
          :active-color="'#ff6b81'"
          :background-color="'var(--surface3)'"
          :block-color="'#ff8aa0'"
          :block-size="26"
          @changing="onSlider"
          @change="onSlider"
        />

        <view class="heat" :style="{ gridTemplateColumns: 'repeat(8, 1fr)' }">
          <view
            v-for="(it, i) in p.mainNot"
            :key="'g' + it.n"
            class="cell"
            :style="mainCellStyle(it, i)"
            @click="open(it.n)"
          >
            <text>{{ pad2(it.n) }}</text>
            <text class="cs">{{ candSet.has(it.n) ? '保留' : (excluded(i) ? '排除' : '保留') }}</text>
          </view>
        </view>

        <view class="big-hint">点击任一号码查看其排除置信分与判定理由。绿色描边 = 预测较可能开出。</view>
      </view>

      <!-- 排名与明细 -->
      <view class="section fade-up">
        <view class="sec-head">
          <text class="h2">排除置信排名</text>
          <text class="sub">分数从高到底（高 = 越有把握不会开出）</text>
        </view>
        <RankScore :items="top15" :color-for="scoreColor" @pick="open" />
      </view>

      <!-- 后区 / 蓝球 -->
      <view class="section fade-up">
        <view class="sec-head">
          <text class="h2">{{ tag === 'dlt' ? '后区' : '蓝球' }}排除预测</text>
          <text class="badge">{{ game.extraCount }} 中 {{ game.extraRange }}</text>
        </view>

        <view class="cand-block">
          <text class="cand-label">候选开出</text>
          <view class="balls">
            <Ball v-for="x in p.extraLikely" :key="'e' + x.n" :num="x.n" color="blue" size="md" cand />
          </view>
        </view>

        <view class="heat" :style="{ gridTemplateColumns: 'repeat(8, 1fr)' }">
          <view
            v-for="it in p.extraNot"
            :key="'gx' + it.n"
            class="cell"
            :style="extraCellStyle(it)"
            @click="open(it.n)"
          >
            <text>{{ pad2(it.n) }}</text>
            <text class="cs">{{ extraCand.has(it.n) ? '保留' : '排除' }}</text>
          </view>
        </view>
      </view>

      <view class="disclaimer">
        <text class="d-title">重要提示：</text>开奖均为随机独立事件，历史数据不构成对未来结果的确定性依据。本页「排除打分」仅是统计学上对「较不容易开出」的相对排序，不能保证命中，亦不构成任何投注建议。请理性看待、量力而行。
      </view>
    </PageBody>

    <!-- 号码判定弹层 -->
    <uni-popup ref="popup" type="bottom" @maskClick="close">
      <view class="popup-slot">
        <view class="tip-panel">
          <view class="tip-head" v-if="selRec">
            <Ball :num="selRec.n" :color="selExtra ? 'blue' : mainBallColor" size="xl" />
            <view style="flex:1">
              <view class="t">号码 {{ pad2(selRec.n) }} 的判定</view>
              <view class="score-line">
                <text class="score-badge" :style="{ background: scoreColor(selRec.score) }">排除置信 {{ selRec.score }}</text>
                <text v-if="candSet.has(selRec.n)" class="cand-badge">预测可能开出</text>
              </view>
            </view>
          </view>

          <view class="hint" style="font-size:22rpx;line-height:1.7">
            基于「遗漏回补 + 近期热度 + 大数频率 + 形态均衡」四因子加权估计的「不被开出」置信分。
          </view>

          <view class="tip-rows" v-if="selRec">
            <view v-for="r in selRec.reasons" :key="r.k" class="tip-row">
              <text>{{ r.label }}</text>
              <text class="w-pt">权重 {{ Math.round(r.w * 100) }}%</text>
            </view>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import TopBar from '../../components/TopBar.vue';
import PageBody from '../../components/PageBody.vue';
import Ball from '../../components/Ball.vue';
import RankScore from '../../components/RankScore.vue';
import { DATA } from '../../common/data.js';
import { store } from '../../common/store.js';
import { predict } from '../../common/lib/predict.js';
import { pad, lerpColor } from '../../common/lib/format.js';

const GR2 = '34,208,129'; // 绿 = 希望开出（低排除）
const RD2 = '255,77,109'; // 红 = 高排除

export default {
  components: { TopBar, PageBody, Ball, RankScore },
  data() {
    return {
      store,
      exclPct: 72,
      sel: null,
    };
  },
  computed: {
    game() { return { ...DATA[store.game], tag: store.game }; },
    tag() { return this.game.tag; },
    winNum() { return store.win === 'all' ? this.game.draws.length : parseInt(store.win, 10); },
    p() { return predict(this.game, this.winNum); },
    mainBallColor() { return this.tag === 'dlt' ? 'orange' : 'red'; },
    mainExclCount() { return Math.round(this.game.mainRange * (this.exclPct / 100)); },
    candSet() { return new Set(this.p.mainLikely.map((x) => x.n)); },
    extraCand() { return new Set(this.p.extraLikely.map((x) => x.n)); },
    top15() {
      return this.p.mainNot.slice(0, 15).map((it) => ({ ...it, cls: this.mainBallColor }));
    },
    selRec() { return this.sel === null ? null : this.p.mainNot.concat(this.p.extraNot).find((x) => x.n === this.sel); },
    selExtra() {
      if (!this.selRec) return false;
      return this.p.extraNot.some((x) => x.n === this.selRec.n);
    },
  },
  methods: {
    pad2(n) { return pad(n); },
    onSlider(e) {
      const v = e && (e.detail && e.detail.value != null ? e.detail.value : e.value);
      if (typeof v === 'number') this.exclPct = v;
    },
    scoreColor(s) { return lerpColor(GR2, RD2, s / 100); },
    excluded(i) { return i < this.mainExclCount; },
    mainCellStyle(it, i) {
      const isCand = this.candSet.has(it.n);
      const ex = this.excluded(i);
      if (isCand) {
        return {
          background: 'var(--surface3)',
          color: 'var(--teal-text)',
          boxShadow: 'inset 0 0 0 2rpx var(--teal)',
        };
      }
      return {
        background: lerpColor(GR2, RD2, it.score / 100) + (ex ? '' : '22'),
        color: ex ? '#fff' : 'inherit',
      };
    },
    extraCellStyle(it) {
      const isCand = this.extraCand.has(it.n);
      if (isCand) {
        return {
          background: 'var(--surface3)',
          color: 'var(--blue-text)',
          boxShadow: 'inset 0 0 0 2rpx var(--blue-strong)',
        };
      }
      return { background: 'var(--cell-bg)', color: 'var(--muted)' };
    },
    open(n) {
      this.sel = n;
      if (this.$refs.popup) this.$refs.popup.open();
    },
    close() {
      if (this.$refs.popup) this.$refs.popup.close();
      this.sel = null;
    },
  },
};
</script>

<style lang="scss" scoped>
.strategy {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.s-row {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}

.s-ball {
  flex: none;
  width: 84rpx;
  text-align: center;
  border-radius: 12rpx;
  font-size: 22rpx;
  font-weight: 750;
  padding: 10rpx 0;
  font-variant-numeric: tabular-nums;
}

.s1 { background: rgba(255, 107, 129, 0.16); color: #ff6b81; }
.s2 { background: rgba(255, 171, 46, 0.16); color: #ffab2e; }
.s3 { background: rgba(127, 156, 255, 0.16); color: #7f9cff; }
.s4 { background: rgba(55, 224, 193, 0.16); color: #37e0c0; }

.s-name { font-size: 26rpx; font-weight: 700; display: block; }
.s-desc { font-size: 22rpx; color: var(--muted); line-height: 1.6; }

.scoring { margin-top: 22rpx; padding-top: 20rpx; border-top: 1px dashed var(--border2); }

.legend {
  display: flex;
  gap: 26rpx;
  margin-top: 18rpx;
}

.lg-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 22rpx;
  color: var(--muted);
}

.flag {
  width: 28rpx;
  height: 28rpx;
  border-radius: 8rpx;
  flex: none;
}

.cand-block { margin-top: 14rpx; }
.cand-label { font-size: 22rpx; color: var(--faint); letter-spacing: 1rpx; }
.cand-n { color: var(--muted); font-weight: 700; }
.cand-desc { font-size: 20rpx; color: var(--faint); margin-left: 14rpx; }

.slider-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
  font-size: 24rpx;
}

.sl-label { color: var(--text); }
.sl-val { color: var(--brand); font-weight: 700; font-variant-numeric: tabular-nums; }

.heat { display: grid; gap: 8rpx; margin-top: 10rpx; }
.cell {
  border-radius: 12rpx;
  padding: 10rpx 0 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.15;
}
.cell:active { transform: scale(0.92); }
.cell text { font-size: 26rpx; font-weight: 700; font-variant-numeric: tabular-nums; }
.cell .cs { font-size: 18rpx; font-weight: 400; opacity: 0.85; margin-top: 2rpx; }

.tip-panel { padding: 34rpx 30rpx 60rpx; }
.tip-head { display: flex; gap: 22rpx; align-items: center; margin-bottom: 20rpx; }
.tip-head .t { font-size: 30rpx; font-weight: 750; }
.score-line { display: flex; align-items: center; gap: 14rpx; margin-top: 8rpx; }
.score-badge {
  color: #fff;
  border-radius: 999rpx;
  padding: 4rpx 18rpx;
  font-size: 22rpx;
  font-weight: 700;
}
.cand-badge {
  background: var(--teal-soft);
  color: var(--teal-text);
  border-radius: 999rpx;
  padding: 4rpx 18rpx;
  font-size: 22rpx;
  font-weight: 600;
}
.tip-rows { display: flex; flex-direction: column; gap: 14rpx; margin-top: 18rpx; }
.tip-row {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  padding-bottom: 12rpx;
}
.w-pt { color: var(--faint); font-size: 20rpx; font-variant-numeric: tabular-nums; }
.w { font-weight: 700; }
.d-title { color: var(--muted); font-weight: 700; }
</style>