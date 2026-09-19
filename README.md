# 彩研 · 大乐透 / 双色球 规律分析

基于公开历史开奖数据的查询、多维分析与"下期不易开出号码"排除打分工具。

- **数据**：双色球（2003 至今）、大乐透（2007 至今），来自 `datachart.500.com`，存入 `caipiao.db`（SQLite）。
- **前端（PC）**：React + Vite，纯静态，目录 `webapp/`，构建产物 `webapp/dist/`。
- **前端（手机 H5）**：UniApp（Vue3 + uni-ui），目录 `h5/`，构建产物 `h5/dist/build/h5/`。
- **在线访问**：PC 版 <https://altman0001.github.io/caipiao/pc> · 手机 H5 版 <https://altman0001.github.io/caipiao/h5> · 落地页 <https://altman0001.github.io/caipiao/>

> ⚠️ 体彩 / 福彩开奖为随机独立事件，本页依据历史数据做统计学分析，**不构成中奖保证，更不构成投注建议**。请理性看待、量力而行。

## 功能

| 模块 | 说明 |
| --- | --- |
| 查询 | 按期号 / 日期 / 必含主号 / 必含蓝球过滤，全量分页表格 |
| 分析 | 12 个大众常用维度：号码冷热频率、遗漏走势、奇偶比、大小比、质数分布、三区分布、和值、跨度、连号、重号、尾数、蓝球 / 后区 |
| 预测 | 基于大众策略（遗漏回补 40% + 近期热度 25% + 大数频率 20% + 形态均衡 15%）对**每个号码**输出"排除置信分 0–100"，给出推荐排除集合与候选开出号码，且可查看每个号码的打分理由 |

## 本地运行

```bash
cd webapp
npm install
npm run dev          # 开发模式，浏览器打开 Vite 给出的地址
# 或
npm run build && npm run preview   # 预览生产构建
```

## 手机 H5 版（UniApp）

功能与 PC 版同步（查询 / 分析 / 预测 / 预测结果），页面适配手机，使用 UniApp + uni-ui 开发，可用 HBuilderX 直接打开 `h5/` 目录运行，或命令行开发：

```bash
cd h5
npm install
npm run dev:h5       # 浏览器调试（默认 http://localhost:5174）
npm run build:h5     # 产物输出到 h5/dist/build/h5/
```

> 数据获取与 PC 版同源：`export.py` 同时导出 `webapp/src/data.js` 与 `h5/src/common/data.js`；`scripts/update_predictions.mjs` 同时回写两者的预测历史。

## 数据刷新与发布（自动）

仓库内置 GitHub Actions 工作流 `.github/workflows/deploy.yml`：

- **触发**：push 到 `main`、或 **每天 04:30 / 14:30 / 22:30 (UTC) 定时（北京时间 12:30 / 22:30 / 次日 06:30）**、或手动 `workflow_dispatch`。
- **流程**：抓取最新开奖 → 重建 `caipiao.db` → 导出两份 `data.js`（PC/H5）→ 构建 PC（React）与 H5（UniApp）→ 发布 `pc/`、`h5/` 与落地页 `index.html` 到 `gh-pages` 分支。
- **手动刷新**：本地执行 `python build_db.py && python export.py`，再分别 `cd webapp && npm run build`、`cd h5 && npm run build:h5`，提交后 push 即可。

## 本地脚本

| 脚本 | 作用 |
| --- | --- |
| `scrape.py` | 从 500.com 抓取该页原始表格（带重试/编码容错） |
| `build_db.py` | 抓取全量历史并写入 `caipiao.db` |
| `export.py` | 导出 `caipiao.db` → `webapp/src/data.js` |
| `verify.py` | 核对数据库期数 / 去重 / 样例 |

## 目录结构

```
caipiao/
├── .github/workflows/deploy.yml   # 每日自动刷新 + 发布 GitHub Pages
├── build_db.py / scrape.py / export.py / verify.py
├── caipiao.db                     # SQLite 数据
├── webapp/                        # React + Vite 前端（PC）
└── h5/                            # UniApp + uni-ui 前端（手机 H5）
```