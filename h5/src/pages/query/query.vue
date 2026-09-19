<template>
  <view>
    <TopBar />

    <PageBody>
      <view class="section fade-up">
        <view class="sec-head">
          <text class="h2">开奖记录查询</text>
          <text class="sub">按期号 / 日期检索，或指定包含号码筛选</text>
        </view>

        <view class="q-search">
          <uni-search-bar
            v-model="q"
            placeholder="期号 或 日期，如 24001 / 2026-09"
            :cancelButton="'none'"
            :showLoading="false"
            @confirm="apply"
          />
        </view>

        <view class="search-grid">
          <view class="field">
            <text class="ph">主号</text>
            <input v-model="include" placeholder="必含，如 06,23" />
          </view>
          <view class="field">
            <text class="ph">{{ tag === 'dlt' ? '后区' : '蓝球' }}</text>
            <input v-model="xinclude" placeholder="必含，如 14" />
          </view>
        </view>

        <view class="btn primary apply-btn" @click="apply">筛 选</view>
      </view>

      <view class="section fade-up">
        <view class="sec-head">
          <text class="h2">开奖记录</text>
          <text class="badge">{{ rows.length }} 条匹配</text>
        </view>

        <view v-if="!view.length" class="empty">没有匹配的记录</view>

        <view v-for="r in view" :key="r.issue" class="rec">
          <view class="rec-top">
            <text class="issue">{{ r.issue }}</text>
            <text class="year">{{ r.date.slice(0, 4) }}</text>
            <text class="date">{{ r.date }}</text>
          </view>
          <view class="balls nowrap">
            <text
              v-for="n in r.m"
              :key="'m' + n"
              class="ball xs"
              :class="tag === 'dlt' ? 'orange' : 'red'"
            >{{ pad2(n) }}</text>
            <text class="xsep" />
            <text
              v-for="n in r.x"
              :key="'x' + n"
              class="ball xs blue"
            >{{ pad2(n) }}</text>
          </view>
          <view class="rec-stats">
            <text class="stat-chip">和值 <b>{{ r.sum }}</b></text>
            <text class="stat-chip">跨度 <b>{{ r.span }}</b></text>
            <text class="stat-chip">奇偶 <b>{{ r.odd }}:{{ r.m.length - r.odd }}</b></text>
          </view>
        </view>

        <view v-if="view.length" class="pager">
          <view class="pg-btn" :class="{ on: safe > 0 }" @click="prev" >上一页</view>
          <text class="pg-info">{{ safe + 1 }} / {{ pages }}</text>
          <view class="pg-btn" :class="{ on: safe < pages - 1 }" @click="next">下一页</view>
        </view>
      </view>
    </PageBody>
  </view>
</template>

<script>
import TopBar from '../../components/TopBar.vue';
import PageBody from '../../components/PageBody.vue';
import { DATA } from '../../common/data.js';
import { store } from '../../common/store.js';
import { pad } from '../../common/lib/format.js';

const PAGE = 20;

export default {
  components: { TopBar, PageBody },
  data() {
    return {
      store,
      q: '',
      include: '',
      xinclude: '',
      page: 0,
    };
  },
  computed: {
    game() { return { ...DATA[store.game], tag: store.game }; },
    tag() { return this.game.tag; },
    rows() {
      const inc = parseNums(this.include);
      const xinc = parseNums(this.xinclude);
      const kw = this.q.trim().toLowerCase();
      const out = [];
      for (let i = this.game.draws.length - 1; i >= 0; i--) {
        const d = this.game.draws[i];
        if (kw && !(d.i.includes(kw) || d.d.includes(kw))) continue;
        if (inc.length && !inc.every((n) => d.m.includes(n))) continue;
        if (xinc.length && !xinc.every((n) => d.x.includes(n))) continue;
        out.push({
          issue: d.i,
          date: d.d,
          m: d.m,
          x: d.x,
          sum: d.m.reduce((a, b) => a + b, 0),
          span: Math.max(...d.m) - Math.min(...d.m),
          odd: d.m.filter((n) => n % 2).length,
        });
      }
      return out;
    },
    pages() { return Math.max(1, Math.ceil(this.rows.length / PAGE)); },
    safe() { return Math.min(this.page, this.pages - 1); },
    view() { return this.rows.slice(this.safe * PAGE, this.safe * PAGE + PAGE); },
  },
  methods: {
    pad2(n) { return pad(n); },
    apply() { this.page = 0; },
    prev() {
      if (this.safe > 0) { this.page = this.safe - 1; }
    },
    next() {
      if (this.safe < this.pages - 1) { this.page = this.safe + 1; }
    },
  },
};

function parseNums(s) {
  return (s || '').split(/[,，\s]+/)
    .map((x) => parseInt(x, 10))
    .filter((x) => !isNaN(x) && x > 0);
}
</script>

<style lang="scss" scoped>
.q-search {
  margin-bottom: 14rpx;
}

.search-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.field {
  display: flex;
  align-items: center;
  gap: 10rpx;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 14rpx;
  padding: 0 20rpx;
  min-width: 0;
}

.field input {
  flex: 1;
  height: 72rpx;
  font-size: 24rpx;
  color: var(--text);
  min-width: 0;
}

.ph { color: var(--faint); font-size: 20rpx; flex: none; }

.apply-btn { width: 100%; padding: 18rpx 0; }

.year { font-size: 22rpx; color: var(--faint); }
.xsep {
  width: 6rpx;
  height: 44rpx;
  border-radius: 6rpx;
  background: var(--border2);
  flex: none;
  margin: 0 4rpx;
}

/* uni-search-bar 暗色适配 */
:deep(.uni-searchbar__box) {
  background: var(--input-bg) !important;
  border: 1px solid var(--border);
  border-radius: 14rpx;
}

:deep(.uni-searchbar__box-placeholder) { color: var(--faint); }
:deep(.uni-searchbar__textbox) { color: var(--text); }
:deep(.uni-icons) { color: var(--muted) !important; }
</style>