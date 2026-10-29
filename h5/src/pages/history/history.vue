<template>
  <view>
    <TopBar />

    <PageBody>
      <!-- 排除效果报表 -->
      <view class="section fade-up">
        <view class="sec-head">
          <text class="h2">预测结果 · 排除效果报表</text>
          <text class="badge">{{ stats.total }} 期记录</text>
        </view>
        <text class="hint">正式快照 {{ stats.total - stats.legacy }} 期 · 历史重建 {{ stats.legacy }} 期；正式快照须有可验证的开奖前生成时间才纳入评估，历史重建记录生成时间不可考证，结果仅供参考。</text>

        <view class="metrics">
          <view class="m-card">
            <text class="label">已开奖判定</text>
            <view class="value">{{ stats.done }}<small> / {{ stats.total }}</small></view>
            <view class="dim">待开奖 {{ stats.pending }} 期<text v-if="stats.unevaluable"> · 无法评估 {{ stats.unevaluable }} 期</text></view>
          </view>
          <view class="m-card">
            <text class="label">单号排除准确率</text>
            <view class="value">{{ (stats.overall.accuracy * 100).toFixed(1) }}<small>%</small></view>
            <view class="dim">主号 {{ (stats.main.accuracy * 100).toFixed(1) }}% · {{ tag === 'dlt' ? '后区' : '蓝球' }} {{ (stats.extra.accuracy * 100).toFixed(1) }}%</view>
            <view class="dim">随机基线 {{ (stats.overall.baselineAccuracy * 100).toFixed(1) }}%</view>
          </view>
          <view class="m-card">
            <text class="label">整期零误排率</text>
            <view class="value">{{ (stats.overall.zeroRate * 100).toFixed(1) }}<small>%</small></view>
            <view class="dim">零误排 {{ stats.overall.zero }} / 已开奖 {{ stats.done }}</view>
            <view class="dim">随机基线 {{ (stats.overall.baselineZeroRate * 100).toFixed(2) }}%</view>
          </view>
          <view class="m-card">
            <text class="label">平均误排</text>
            <view class="value">{{ stats.done ? stats.overall.avgFalse.toFixed(2) : '—' }}<small> 个/期</small></view>
            <view class="dim">主号 {{ stats.main.avgFalse.toFixed(2) }} · {{ tag === 'dlt' ? '后区' : '蓝球' }} {{ stats.extra.avgFalse.toFixed(2) }}</view>
          </view>
          <view class="m-card">
            <text class="label">平均排除</text>
            <view class="value">{{ stats.done ? stats.overall.avgExcluded.toFixed(1) : '—' }}<small> 个/期</small></view>
            <view class="dim">主号 {{ stats.main.avgExcluded.toFixed(1) }} · {{ tag === 'dlt' ? '后区' : '蓝球' }} {{ stats.extra.avgExcluded.toFixed(1) }}</view>
          </view>
        </view>

        <view v-if="stats.done > 0" class="chips">
          <text class="chips-label">误排分布：</text>
          <view v-for="([t, c], i) in stats.dist" :key="i" class="chip">
            误排 {{ t }} 个 ×{{ c }}
          </view>
        </view>
      </view>

      <!-- 逐期明细 -->
      <view class="section fade-up">
        <view class="sec-head">
          <text class="h2">逐期明细</text>
        </view>

        <view class="filter-row">
          <view
            v-for="f in FILTERS"
            :key="f[0]"
            class="seg-chip"
            :class="{ on: filter === f[0] }"
            @click="filter = f[0]"
          >{{ f[1] }}</view>
        </view>
        <view class="filter-row" style="margin-top:12rpx">
          <view
            v-for="l in LIMITS"
            :key="l[1]"
            class="seg-chip"
            :class="{ on: limit === l[0] }"
            @click="limit = l[0]"
          >{{ l[1] }}</view>
        </view>

        <view v-if="!view.length" class="empty">暂无记录</view>

        <view v-for="r in view" :key="r.issue" class="rec" :class="recCls(r)">
          <view class="rec-top">
            <text class="issue">{{ r.issue }}</text>
            <text class="date">{{ drawByIssue.get(r.issue) || r.actualDate || '—' }}</text>
            <uni-tag
              class="vt"
              :text="verdictText(r)"
              :custom-style="verdictStyle(r)"
              size="small"
            />
          </view>
          <view class="dim source-line">{{ r.snapshotSource === 'generated' ? '来源：正式快照' : '来源：历史重建（生成时间不可考证）' }}</view>

          <view class="pair">
            <text class="pair-label">排除号</text>
            <view class="balls">
              <Ball
                v-for="(n, i) in r.excludedMain"
                :key="'em' + i"
                :num="n"
                :color="tag === 'dlt' ? 'orange' : 'red'"
                size="xs"
              />
              <text class="xsep" />
              <Ball v-for="(n, i) in r.excludedExtra" :key="'ee' + i" :num="n" color="blue" size="xs" />
            </view>
          </view>

          <view class="pair" v-if="r.actualMain && r.actualMain.length">
            <text class="pair-label">开奖号</text>
            <view class="balls">
              <Ball
                v-for="(n, i) in r.actualMain"
                :key="'am' + i"
                :num="n"
                :color="tag === 'dlt' ? 'orange' : 'red'"
                :cand="isHit(r.falseExcludedMain, n)"
                size="xs"
              />
              <text class="xsep" />
              <Ball
                v-for="(n, i) in r.actualExtra"
                :key="'ae' + i"
                :num="n"
                :color="'blue'"
                :cand="isHit(r.falseExcludedExtra, n)"
                size="xs"
              />
            </view>
          </view>

          <view class="pair" v-if="r.status === 'evaluated'">
            <text class="pair-label">误排号</text>
            <view class="balls" v-if="r.falseExcludedMain.length + r.falseExcludedExtra.length">
              <Ball
                v-for="(n, i) in r.falseExcludedMain"
                :key="'fm' + i"
                :num="n"
                :color="tag === 'dlt' ? 'orange' : 'red'"
                size="xs"
              />
              <text class="xsep" />
              <Ball v-for="(n, i) in r.falseExcludedExtra" :key="'fe' + i" :num="n" color="blue" size="xs" />
            </view>
            <text v-else class="dim">无</text>
          </view>

          <view class="rec-stats" v-if="r.status === 'evaluated'">
            <text class="stat-chip">主号误排 <b>{{ r.falseExcludedMain.length }}</b></text>
            <text class="stat-chip">{{ tag === 'dlt' ? '后区' : '蓝球' }}误排 <b>{{ r.falseExcludedExtra.length }}</b></text>
          </view>
          <view class="rec-stats" v-else>
            <text class="stat-chip dim-chip">{{ r.status === 'pending' ? '待开奖，暂无判定' : r.unevaluableReason === 'snapshot-not-provably-pre-draw' ? '无法证明快照生成于开奖前，不纳入评估' : '无法评估，开奖数据缺失' }}</text>
          </view>

          <!-- 本期照片：拍照 / 上传 -->
          <view class="attach">
            <view v-if="hasPhotos(r.issue)" class="attach-imgs">
              <view
                v-for="(p, i) in recPhotos(r.issue)"
                :key="i"
                class="attach-item"
                @click="preview(r.issue, i)"
              >
                <image class="attach-img" :src="p" mode="aspectFill" />
                <view class="attach-del" @click.stop="removePhoto(r.issue, i)">✕</view>
              </view>
            </view>
            <view class="attach-btns">
              <view class="attach-btn" @click="takePhoto(r.issue)">
                <uni-icons type="camera" size="14" :color="iconMuted" />
                <text>拍照</text>
              </view>
              <view class="attach-btn" @click="uploadPhoto(r.issue)">
                <uni-icons type="image" size="14" :color="iconMuted" />
                <text>上传照片</text>
              </view>
              <text class="attach-count">{{ recPhotos(r.issue).length }}/3</text>
            </view>
          </view>
        </view>
      </view>

      <view class="disclaimer">
        <text class="d-title">重要提示：</text>历史排除表现仅用于检验统计方法，不构成对未来开奖的预测能力证明。随机基线按相同号码池、开奖数量和排除数量计算；开奖为随机独立事件，请理性看待。
      </view>
    </PageBody>
  </view>
</template>

<script>
import TopBar from '../../components/TopBar.vue';
import PageBody from '../../components/PageBody.vue';
import Ball from '../../components/Ball.vue';
import { DATA } from '../../common/data.js';
import { store } from '../../common/store.js';
import { PRED_HISTORY } from '../../common/predHistory.js';
import { summarizePredictionRecords } from '../../common/lib/analysis.js';

const FILTERS = [['all', '全部'], ['done', '已开奖'], ['zero', '仅零误排']];
const LIMITS = [[20, '最近 20 期'], [50, '最近 50 期'], [0, '全部']];

export default {
  components: { TopBar, PageBody, Ball },
  data() {
    return {
      store,
      FILTERS,
      LIMITS,
      filter: 'all',
      limit: 20,
      photos: {}, // { "tag-issue": [dataURL,...] }
      iconMuted: '#93a0bf',
    };
  },
  created() {
    this.loadPhotos();
  },
  watch: {
    'store.game'() {
      this.loadPhotos();
    },
  },
  computed: {
    game() { return { ...DATA[store.game], tag: store.game }; },
    tag() { return this.game.tag; },
    records() { return (PRED_HISTORY[this.tag] || []).slice().reverse(); },
    drawByIssue() { return new Map(this.game.draws.map((d) => [d.i, d.d])); },
    stats() { return summarizePredictionRecords(this.records, this.game); },
    view() {
      return this.records
        .filter((r) => (this.filter === 'all' ? true : this.filter === 'done' ? r.status === 'evaluated' : r.zeroFalseExclusion))
        .slice(0, this.limit || undefined);
    },
  },
  methods: {
    verdictText(r) {
      if (r.status === 'pending') return '待开奖';
      if (r.status === 'unevaluable') return '无法评估';
      if (r.zeroFalseExclusion) return '零误排';
      const t = r.falseExcludedMain.length + r.falseExcludedExtra.length;
      return `误排 ${t} 个`;
    },
    verdictStyle(r) {
      if (r.status === 'pending' || r.status === 'unevaluable') return 'background-color:var(--surface3);color:var(--muted);border:none';
      if (r.zeroFalseExclusion) return 'background-color:var(--teal-soft);color:var(--teal-text);border:none';
      return 'background-color:var(--red-bg);color:var(--brand);border:none';
    },
    recCls(r) {
      if (r.status !== 'evaluated') return '';
      return r.zeroFalseExclusion ? 'zero-false' : 'has-false';
    },
    isHit(hitArr, n) { return hitArr && hitArr.includes(n); },

    // ---------- 本期照片：拍照 / 上传 ----------
    photoKey(issue) { return this.tag + '-' + issue; },
    recPhotos(issue) { return this.photos[this.photoKey(issue)] || []; },
    hasPhotos(issue) { return this.recPhotos(issue).length > 0; },
    loadPhotos() {
      const m = {};
      for (const r of this.records) {
        const k = this.photoKey(r.issue);
        try {
          const v = uni.getStorageSync('cp-photo-' + k);
          if (v && v.length) m[k] = v;
        } catch (e) { /* ignore */ }
      }
      this.photos = m;
    },
    savePhotos(issue, arr) {
      const k = 'cp-photo-' + this.photoKey(issue);
      try {
        if (arr.length) uni.setStorageSync(k, arr);
        else uni.removeStorageSync(k);
      } catch (e) {
        // 存储失败（如超出配额）：仅本次会话内保留
        this.photoQuotaWarned || (uni.showToast({ title: '本地存储已满，照片仅本次有效', icon: 'none' }), this.photoQuotaWarned = true);
      }
    },
    takePhoto(issue) { this.choose(issue, ['camera']); },
    uploadPhoto(issue) { this.choose(issue, ['album']); },
    choose(issue, sourceType) {
      const cur = this.recPhotos(issue);
      if (cur.length >= 3) {
        uni.showToast({ title: '每期最多 3 张', icon: 'none' });
        return;
      }
      uni.chooseImage({
        count: 3 - cur.length,
        sourceType,
        sizeType: ['compressed'],
        success: (res) => this.handleChosen(issue, res.tempFilePaths),
        fail: (err) => {
          if (err && err.errMsg && err.errMsg.indexOf('cancel') === -1) {
            uni.showToast({ title: '未获取到照片', icon: 'none' });
          }
        },
      });
    },
    async handleChosen(issue, paths) {
      const arr = [...this.recPhotos(issue)];
      for (const p of paths) {
        try {
          const dataUrl = await this.toDataUrl(p);
          if (dataUrl) arr.push(dataUrl);
        } catch (e) { /* 单张失败跳过 */ }
      }
      if (!arr.length) return;
      this.photos = { ...this.photos, [this.photoKey(issue)]: arr };
      this.savePhotos(issue, arr);
    },
    toDataUrl(path) {
      // #ifdef H5
      return this.h5ToDataUrl(path);
      // #endif
      // #ifndef H5
      return new Promise((resolve, reject) => {
        uni.getFileSystemManager().readFile({
          filePath: path,
          encoding: 'base64',
          success: (r) => resolve('data:image/jpeg;base64,' + r.data),
          fail: reject,
        });
      });
      // #endif
    },
    h5ToDataUrl(blobUrl) {
      return new Promise((resolve, reject) => {
        fetch(blobUrl)
          .then((r) => r.blob())
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
              const MAX = 900;
              const s = Math.min(1, MAX / Math.max(img.width, img.height));
              const w = Math.round(img.width * s);
              const h = Math.round(img.height * s);
              const c = document.createElement('canvas');
              c.width = w;
              c.height = h;
              c.getContext('2d').drawImage(img, 0, 0, w, h);
              URL.revokeObjectURL(url);
              resolve(c.toDataURL('image/jpeg', 0.72));
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load img fail')); };
            img.src = url;
          })
          .catch(reject);
      });
    },
    removePhoto(issue, i) {
      const arr = [...this.recPhotos(issue)];
      arr.splice(i, 1);
      this.photos = { ...this.photos, [this.photoKey(issue)]: arr };
      this.savePhotos(issue, arr);
    },
    preview(issue, i) {
      const urls = this.recPhotos(issue);
      uni.previewImage({ urls, current: urls[i] });
    },
  },
};
</script>

<style lang="scss" scoped>
.chips {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 16rpx;
}

.chips-label { font-size: 22rpx; color: var(--faint); }
.chip {
  background: var(--surface3);
  border-radius: 999rpx;
  padding: 6rpx 18rpx;
  font-size: 20rpx;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.filter-row {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
}

.seg-chip {
  padding: 10rpx 26rpx;
  border-radius: 14rpx;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--muted);
  font-size: 24rpx;
  font-weight: 600;
}

.seg-chip.on {
  background: var(--surface3);
  color: var(--text);
  border-color: var(--border2);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.06);
}

.source-line { margin-top: 8rpx; font-size: 20rpx; }
.pair { display: flex; gap: 16rpx; margin-top: 14rpx; align-items: center; }
.pair-label { font-size: 20rpx; color: var(--faint); flex: none; width: 74rpx; }
.balls { display: flex; gap: 8rpx; flex-wrap: wrap; align-items: center; flex: 1; }
.xsep {
  width: 6rpx;
  height: 36rpx;
  border-radius: 6rpx;
  background: var(--border2);
  flex: none;
  margin: 0 4rpx;
}

.rec.zero-false { border-color: rgba(55, 224, 193, 0.45); }
.rec.has-false { border-color: rgba(255, 77, 109, 0.3); }
.dim-chip { color: var(--faint); background: var(--surface3); }

/* 本期照片附件 */
.attach {
  margin-top: 16rpx;
  border: 1rpx dashed var(--border2);
  border-radius: 14rpx;
  padding: 14rpx;
}

.attach-imgs {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  margin-bottom: 12rpx;
}

.attach-item {
  position: relative;
  width: 128rpx;
  height: 128rpx;
}

.attach-img {
  width: 128rpx;
  height: 128rpx;
  border-radius: 12rpx;
  background: var(--surface3);
}

.attach-del {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  width: 38rpx;
  height: 38rpx;
  border-radius: 50%;
  background: var(--brand-deep);
  color: #fff;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.92;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}

.attach-btns {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.attach-btn {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  border: 1rpx solid var(--border2);
  background: var(--surface3);
  color: var(--muted);
  border-radius: 10rpx;
  padding: 8rpx 20rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.attach-btn:active { opacity: 0.8; }

.attach-count {
  margin-left: auto;
  color: var(--faint);
  font-size: 20rpx;
  font-variant-numeric: tabular-nums;
}

.vt { flex: none; }
.d-title { color: var(--muted); font-weight: 700; }
</style>