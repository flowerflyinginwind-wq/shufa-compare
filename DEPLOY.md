# 部署到 GitHub + Vercel（手机可用）

## 前提

- 已安装 [Git](https://git-scm.com/)
- 已注册 [GitHub](https://github.com) 账号
- 已注册 [Vercel](https://vercel.com) 账号（可用 GitHub 登录）

---

## 第一步：本地构建测试

```powershell
cd C:\AI_ML\shuFa
npm install
npm run build
```

无报错即说明可以部署。

---

## 第二步：推送到 GitHub

### 1. 在 GitHub 网站新建仓库

- 打开 https://github.com/new
- 仓库名例如：`shufa-compare`
- 选 **Public** 或 Private
- **不要**勾选「Add a README」（本地已有代码）
- 点 Create repository

### 2. 在本地初始化并推送

把下面命令里的 `你的用户名` 换成你的 GitHub 用户名：

```powershell
cd C:\AI_ML\shuFa
git init
git add .
git commit -m "书法临摹对比工具初版"
git branch -M main
git remote add origin https://github.com/你的用户名/shufa-compare.git
git push -u origin main
```

首次 push 会要求登录 GitHub（浏览器或 Personal Access Token）。

---

## 第三步：连接 Vercel 部署

1. 打开 https://vercel.com ，用 **GitHub 登录**
2. 点击 **Add New… → Project**
3. 在列表里找到 `shufa-compare`，点 **Import**
4. 配置一般会自动识别，确认如下：

   | 项 | 值 |
   |----|-----|
   | Framework Preset | Vite |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

5. 点 **Deploy**，等待 1～2 分钟
6. 完成后得到地址，例如：`https://shufa-compare.vercel.app`

---

## 第四步：手机使用

1. 手机浏览器打开 Vercel 给的 `https://xxx.vercel.app`
2. **iPhone**：Safari → 分享 →「添加到主屏幕」
3. **Android**：Chrome → 菜单 →「安装应用」或「添加到主屏幕」

之后从桌面图标打开，可拍照上传、对比、导出。

---

## 以后更新代码

改完本地代码后：

```powershell
cd C:\AI_ML\shuFa
git add .
git commit -m "更新说明"
git push
```

Vercel 会自动重新部署，手机刷新或重新打开即可。

---

## 常见问题

**Q：push 时提示认证失败？**  
A：GitHub 已不支持密码推送，需用 [Personal Access Token](https://github.com/settings/tokens) 代替密码，或使用 GitHub Desktop。

**Q：Vercel 构建失败？**  
A：先在本地执行 `npm run build`，根据报错修复后再 push。

**Q：手机摄像头打不开？**  
A：必须使用 **HTTPS**（Vercel 默认就是），并允许浏览器相机权限。
