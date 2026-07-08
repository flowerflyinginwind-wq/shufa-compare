# Gitee Pages 部署指南（完全免费）

将「书法临摹对比」免费部署到 Gitee Pages，国内可访问，支持手机 HTTPS 拍照。

**项目路径：** `C:\AI_ML\shuFa`  
**GitHub：** https://github.com/flowerflyinginwind-wq/shufa-compare

---

## 最终效果

部署成功后访问地址形如：

```
https://你的Gitee用户名.gitee.io/shufa-compare
```

---

## 整体流程

```
注册 Gitee → 创建仓库 → 推送源码 → 构建 dist → 推送 gh-pages 分支 → 开启 Pages
```

首次约 **15～20 分钟**；以后更新约 **3 分钟**。

---

## 第一步：注册 Gitee

1. 打开 https://gitee.com
2. 注册并登录（可用手机号）
3. 完成实名认证（可选，但建议完成）

---

## 第二步：在 Gitee 创建仓库

1. 右上角 **+** → **新建仓库**
2. 填写：

   | 项 | 值 |
   |----|-----|
   | 仓库名称 | `shufa-compare`（建议与 GitHub 一致） |
   | 路径 | `shufa-compare` |
   | 是否开源 | **公开**（免费 Pages 通常要求公开仓库） |
   | 初始化 | **不要**勾选 README、.gitignore、License |

3. 点击 **创建**

4. 记下仓库地址，形如：

   ```
   https://gitee.com/你的用户名/shufa-compare.git
   ```

---

## 第三步：把源码推到 Gitee（main 分支）

在 PowerShell 中执行（保留 GitHub 的 `origin` 不变，额外增加 `gitee`）：

```powershell
cd C:\AI_ML\shuFa
git remote add gitee https://gitee.com/你的用户名/shufa-compare.git
git push -u gitee main
```

若提示 `gitee` 已存在，可先查看：

```powershell
git remote -v
```

首次 push 会要求登录 Gitee（浏览器或账号密码）。

---

## 第四步：构建 Gitee 专用版本

Gitee Pages 地址带仓库名子路径（`/shufa-compare/`），需用专用构建命令：

```powershell
cd C:\AI_ML\shuFa
npm install
npm run build:gitee
```

> 不要用普通 `npm run build`，否则部署后可能页面空白或样式丢失。

本地预览 Gitee 版本（可选）：

```powershell
npm run preview:gitee
```

浏览器打开 `http://localhost:4173/shufa-compare/` 检查。

---

## 第五步：把 dist 推到 gh-pages 分支

Gitee Pages 部署的是 **已构建好的静态文件**，放在 `gh-pages` 分支。

### 方式 A：一键脚本（推荐）

```powershell
powershell -ExecutionPolicy Bypass -File scripts\deploy-gitee.ps1 -GiteeUrl "https://gitee.com/你的用户名/shufa-compare.git"
```

脚本会自动 `build:gitee` 并推送到 `gh-pages` 分支。

### 方式 B：手动执行

```powershell
cd C:\AI_ML\shuFa
npm run build:gitee

cd dist
git init
git add .
git commit -m "deploy"
git branch -M gh-pages
git remote add gitee https://gitee.com/你的用户名/shufa-compare.git
git push -f gitee gh-pages
cd ..
```

---

## 第六步：开启 Gitee Pages

1. 打开 Gitee 仓库页面
2. 顶部 **服务** → **Gitee Pages**
3. 配置：

   | 项 | 值 |
   |----|-----|
   | 部署分支 | `gh-pages` |
   | 部署目录 | `/`（根目录） |

4. 点击 **启动**（首次）或 **更新**（以后每次推送后）
5. 等待 1～2 分钟，页面显示访问地址

---

## 第七步：测试

### 电脑浏览器

打开 `https://你的用户名.gitee.io/shufa-compare`

检查：

- [ ] 页面正常显示，不是空白
- [ ] 能上传图片
- [ ] 叠加 / 差异模式可切换
- [ ] 能导出 PNG

### 手机

1. 手机浏览器打开同一地址
2. 允许相机权限 → 点「拍照」测试
3. **添加到主屏幕**：
   - iPhone：Safari → 分享 → 添加到主屏幕
   - Android：Chrome → 安装应用 / 添加到主屏幕

---

## 以后更新网站

每次改完代码：

```powershell
cd C:\AI_ML\shuFa
git add .
git commit -m "更新说明"
git push origin main          # 同步到 GitHub（可选）
git push gitee main           # 同步源码到 Gitee（可选）

powershell -ExecutionPolicy Bypass -File scripts\deploy-gitee.ps1 -GiteeUrl "https://gitee.com/你的用户名/shufa-compare.git"
```

然后在 Gitee 仓库 → **服务 → Gitee Pages** → 点 **更新**。

> 免费版 Pages 通常需要 **手动点「更新」** 才会刷新线上内容，不会自动部署。

---

## 费用说明

| 项目 | 费用 |
|------|------|
| Gitee 账号 | 免费 |
| 公开仓库 | 免费 |
| Gitee Pages | 免费（有流量限制，个人小工具够用） |
| 域名 | 不需要（用 gitee.io 二级域名） |
| 备案 | 不需要（gitee.io 域名已备案） |

---

## 常见问题

**Q：页面空白或样式错乱？**  
A：确认用了 `npm run build:gitee`（不是 `npm run build`），且 `gh-pages` 分支根目录直接是 `index.html`。

**Q：推送 gh-pages 失败？**  
A：检查 Gitee 登录；确认对仓库有写权限。

**Q：更新了代码但网站没变？**  
A：重新运行部署脚本后，到 Gitee Pages 页面点 **更新**。

**Q：免费版有什么限制？**  
A：需公开仓库；更新需手动触发；有流量上限，个人使用一般足够。

**Q：仓库名不是 shufa-compare 怎么办？**  
A：构建时指定路径：

```powershell
npm run build:gitee -- --base /你的仓库名/
```

**Q：和 GitHub 怎么同步？**  
A：`origin` 指向 GitHub，`gitee` 指向 Gitee，两边分别 push 即可。

---

## 快速命令备忘

```powershell
# 首次：添加 Gitee 远程
git remote add gitee https://gitee.com/你的用户名/shufa-compare.git
git push -u gitee main

# 部署
powershell -ExecutionPolicy Bypass -File scripts\deploy-gitee.ps1 -GiteeUrl "https://gitee.com/你的用户名/shufa-compare.git"

# 然后在 Gitee 网页点 Pages → 更新
```

---

## 相关文档

- 其他国内方案：[DEPLOY-CN.md](DEPLOY-CN.md)
- 阿里云部署：[DEPLOY-ALIYUN.md](DEPLOY-ALIYUN.md)
- 本地测试：[TESTING.md](TESTING.md)
