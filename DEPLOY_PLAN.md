# 发布到 GitHub Pages — 执行清单

> 本文件用于在拿到 GitHub 凭据的会话中，把 `caipiao` 应用公开发布到 GitHub Pages。
> 本地端已全部就绪（源码、构建、每日自动刷新工作流、README），只需完成"建仓库 + 推送 + 开 Pages"三步。

## 前提
- 已通过 GitHub 连接器授权（如未授权：调用 `RequestAuthorization`，service=`trae-remote-official:github::github`）。
- 用户已确认：仓库与网址**全部公开**，需保留每日自动刷新入口。

## 状态（2026-09-14 更新）
- [x] 本地 git 已初始化（`main` 分支），初始提交 `08ee5c5` 已创建（24 文件）。
- [x] 已创建公开仓库 `altman0001/caipiao` 并推送 `main`。
- [x] 首次 Actions 构建成功（run 34853718869, conclusion=success），已发布到 `gh-pages`。
- [x] 已启用 GitHub Pages（Source = gh-pages / root）。
- [x] 在线验证通过：<https://altman0001.github.io/caipiao/>（标题与资源均正常）。
- [x] README 占位链接已替换为真实 URL。

## 步骤

1. 确认工作目录 `d:\DEV\caipiao` 是非 git 仓库（`Get-ChildItem -Force` 无 `.git`），若有则跳过 init。

2. 初始化并推送源到公开仓库（仓库名建议 `caipiao`）：
   ```bash
   cd d:/DEV/caipiao
   git init -b main
   # 把 origin 指向新公开仓库（用连接器/已配置凭据）
   git add -A
   git commit -m "init: 大乐透/双色球开奖数据分析应用 + 每日自动刷新部署"
   git branch -M main
   git push -u origin main
   ```
   - `.gitignore` 已排除 `node_modules/`、`webapp/dist/`、`caipiao.db`、`__pycache__/`，避免误推大文件/密钥。
   - 若用 `gh`：`gh repo create caipiao --public --source . --remote origin --push` 可一步完成建库。

3. 确认仓库为公开。

4. 触发首次构建（推送 main 会触发 `.github/workflows/deploy.yml`，其 `build-and-deploy` 任务会自动把 `webapp/dist` 发布到 `gh-pages` 分支）。

5. 启用 GitHub Pages：
   - 仓库 → Settings → Pages → Build and deployment 的 **Source** 选「Deploy from a branch」；Branch 选 **`gh-pages` / `(root)`**。
   - 或者在平台 Connection 可用时用 API 设：`POST /repos/{owner}/caipiao/pages` body `{"source":{"branch":"gh-pages","path":"/"}}`。

6. 等 Actions 跑完，访问 `https://<owner>.github.io/caipiao/` 验证（用 `base:'./'` 构建，支持子路径）。

7. 把 `README.md` 中的在线地址占位替换为真实 URL。

## 说明
- 每日 02:20 (UTC) 自动重抓数据并重新发布；`.github/workflows/deploy.yml` 即自动刷新入口。
- 若首次流程遇到推送凭据/连接器问题，检查授权状态后再重试。
- 预测仅为统计分析，站点内已含免责声明。