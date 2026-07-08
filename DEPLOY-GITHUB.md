# GitHub Pages 部署

适用于仓库：`https://github.com/flowerflyinginwind-wq/shufa-compare`

## 一次性设置

1. 打开仓库 `Settings` -> `Pages`
2. 在 `Build and deployment` 中选择 `Source: GitHub Actions`
3. 确认默认分支是 `main`

本项目已内置自动部署工作流：`.github/workflows/deploy-pages.yml`。每次 push 到 `main` 会自动构建并发布 `dist`。

## 发布步骤

```powershell
cd C:\AI_ML\shuFa
git add .
git commit -m "配置 GitHub Pages 自动部署"
git push origin main
```

推送后到仓库 `Actions` 页面查看 `Deploy to GitHub Pages` 是否成功。

## 访问地址

部署成功后访问：

`https://flowerflyinginwind-wq.github.io/shufa-compare/`

## 常见问题

- 页面空白：确认 URL 末尾包含 `/shufa-compare/`
- 首次访问 404：等待 1-3 分钟后刷新
- 更新未生效：浏览器强制刷新（`Ctrl+F5`）或清理 Service Worker 缓存
