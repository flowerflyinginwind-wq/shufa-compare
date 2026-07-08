# 部署到国内静态托管

本工具是纯前端应用，构建产物在 `dist` 目录，可部署到任意支持静态文件的国内云服务。

**GitHub 仓库：** https://github.com/flowerflyinginwind-wq/shufa-compare

---

## 部署前准备

### 1. 本地构建

```powershell
cd C:\AI_ML\shuFa
npm install
npm run build
```

成功后会在项目下生成 `dist` 文件夹，里面就是要上传的全部文件。

### 2. 本地预览（可选）

```powershell
npm run preview
```

浏览器打开 `http://localhost:4173`，确认功能正常后再上传。

### 3. 重要说明

| 项目 | 说明 |
|------|------|
| **HTTPS** | 手机拍照功能要求 HTTPS，生产环境务必开启 |
| **备案** | 使用**自定义域名**在国内访问，通常需要 [ICP 备案](https://beian.miit.gov.cn/) |
| **默认页** | 静态托管的默认首页设为 `index.html` |
| **无需后端** | 图片不上传服务器，全部在浏览器本地处理 |

---

## 方案对比

| 方案 | 适合场景 | 费用 | 国内访问 | 难度 |
|------|----------|------|----------|------|
| **阿里云 OSS + CDN** | 长期稳定、可绑域名 | 按量，新用户有免费额度 | 很好 | 中等 |
| **腾讯云 COS + CDN** | 同上 | 按量，新用户有免费额度 | 很好 | 中等 |
| **Gitee Pages** | 快速试用、个人小项目 | 免费（有限制） | 较好 | 简单 |

下面分别给出操作步骤。任选一种即可。

> **已选 Gitee Pages（完全免费）？** 直接看：[DEPLOY-GITEE.md](DEPLOY-GITEE.md)

> **已选阿里云？** 直接看专用指南：[DEPLOY-ALIYUN.md](DEPLOY-ALIYUN.md)

---

## 方案一：阿里云 OSS + CDN（推荐）

适合希望国内访问稳定、可绑定自己域名的场景。

### 第一步：注册与实名

1. 打开 https://www.aliyun.com 注册并**实名认证**
2. 进入控制台 → **对象存储 OSS**

### 第二步：创建 Bucket

1. 点击 **创建 Bucket**
2. 建议配置：

   | 项 | 建议值 |
   |----|--------|
   | Bucket 名称 | 全局唯一，如 `shufa-compare-你的后缀` |
   | 地域 | 选离用户近的，如「华东1（杭州）」 |
   | 存储类型 | 标准存储 |
   | 读写权限 | **公共读**（静态网站需要） |
   | 版本控制 | 关闭 |

3. 创建完成后进入该 Bucket

### 第三步：开启静态网站托管

1. Bucket 左侧 → **数据管理** → **静态页面**
2. 开启静态网站托管
3. 设置：
   - **默认首页**：`index.html`
   - **默认 404 页**：`index.html`（单页应用兜底，建议填写）
4. 保存后记下 **访问 Bucket 绑定的域名**（形如 `https://xxx.oss-cn-hangzhou.aliyuncs.com`）

### 第四步：上传 dist 文件

**方式 A：控制台上传（最简单）**

1. Bucket → **文件管理** → **上传文件**
2. 进入本地 `C:\AI_ML\shuFa\dist`
3. 选中 `dist` **里面的所有文件和文件夹**（不要只上传 dist 文件夹本身）
4. 上传

上传后目录结构应类似：

```
index.html
assets/
icon.svg
manifest.webmanifest
sw.js
...
```

**方式 B：ossutil 命令行（适合以后频繁更新）**

1. 下载安装 [ossutil](https://help.aliyun.com/document_detail/120075.html)
2. 配置 AccessKey 后执行：

```powershell
cd C:\AI_ML\shuFa
ossutil cp dist/ oss://你的Bucket名称/ -r -f
```

`-r` 递归上传，`-f` 覆盖旧文件。

### 第五步：绑定 CDN 加速（推荐）

直接用 OSS 域名也能访问，但 CDN 在国内更快。

1. 控制台 → **CDN** → **域名管理** → **添加域名**
2. **加速域名**：填你的子域名，如 `shufa.你的域名.com`
3. **源站类型**：OSS 域名，选择刚建的 Bucket
4. 按提示在域名 DNS 添加 CNAME 记录
5. CDN 域名管理 → **HTTPS 配置** → 申请免费证书并开启 HTTPS

> 使用自定义域名在国内上线，一般需要先完成 **ICP 备案**。若暂时没有备案，可先用 OSS 默认域名测试（部分功能/地区可能有限制）。

### 第六步：手机访问

1. 浏览器打开你的 HTTPS 地址
2. **iPhone**：Safari → 分享 →「添加到主屏幕」
3. **Android**：Chrome →「安装应用」或「添加到主屏幕」

---

## 方案二：腾讯云 COS + CDN

步骤与阿里云类似，适合已有腾讯云账号的用户。

### 第一步：创建存储桶

1. 打开 https://cloud.tencent.com → **对象存储 COS**
2. **创建存储桶**：

   | 项 | 建议值 |
   |----|--------|
   | 名称 | 如 `shufa-compare-125xxxx` |
   | 地域 | 如「广州」 |
   | 访问权限 | **公有读私有写** |

### 第二步：开启静态网站

1. 存储桶 → **基础配置** → **静态网站**
2. 开启，索引文档填 `index.html`，错误文档填 `index.html`
3. 保存后查看 **静态网站访问节点** 地址

### 第三步：上传 dist

**控制台上传：**

1. **文件列表** → **上传文件**
2. 上传 `dist` 目录内全部内容

**命令行（coscmd）：**

```powershell
pip install coscmd
coscmd config -a <SecretId> -s <SecretKey> -b <Bucket名> -r <地域>
cd C:\AI_ML\shuFa
coscmd upload -r dist/ /
```

### 第四步：CDN 与 HTTPS

1. **内容分发网络 CDN** → 添加域名，源站选 COS
2. DNS 添加 CNAME
3. 开启 HTTPS 证书

---

## 方案三：Gitee Pages（最快上手）

适合先快速上线试用，无需买云资源。注意：Gitee Pages 免费版有流量和功能限制，且需用 Gitee 托管代码。

### 第一步：镜像代码到 Gitee

1. 打开 https://gitee.com 注册登录
2. 新建仓库，名称如 `shufa-compare`（**不要**初始化 README）
3. 在本地添加 Gitee 远程并推送：

```powershell
cd C:\AI_ML\shuFa
git remote add gitee https://gitee.com/你的用户名/shufa-compare.git
git push -u gitee main
```

若已有 GitHub 远程，可保留 `origin` 不变，额外增加 `gitee`。

### 第二步：构建并部署 dist 分支

Gitee Pages 需要部署**已构建好的静态文件**。常用做法：把 `dist` 推到 `gh-pages` 分支。

```powershell
cd C:\AI_ML\shuFa
npm run build

# 进入 dist 并作为独立分支推送（首次）
cd dist
git init
git add .
git commit -m "deploy"
git branch -M gh-pages
git remote add origin https://gitee.com/你的用户名/shufa-compare.git
git push -f origin gh-pages
```

### 第三步：开启 Gitee Pages

1. Gitee 仓库 → **服务** → **Gitee Pages**
2. 选择部署分支 `gh-pages`，目录 `/`
3. 点击 **启动** 或 **更新**
4. 获得访问地址，形如 `https://你的用户名.gitee.io/shufa-compare`

### 第四步：HTTPS

Gitee Pages 默认提供 HTTPS，可直接用于手机拍照。

---

## 以后更新网站

每次改完代码，重新构建并上传即可。

```powershell
cd C:\AI_ML\shuFa
git pull
npm install
npm run build
```

然后按你选的方案上传 `dist` 内容：

| 方案 | 更新方式 |
|------|----------|
| 阿里云 OSS | 控制台重新上传，或 `ossutil cp dist/ oss://Bucket名/ -r -f` |
| 腾讯云 COS | 控制台重新上传，或 `coscmd upload -r dist/ /` |
| Gitee Pages | 重新构建后更新 `gh-pages` 分支，再在 Gitee 点「更新 Pages」 |

---

## 部署后检查清单

- [ ] 首页能正常打开，样式无错乱
- [ ] 能上传图片、切换叠加/差异模式
- [ ] 手机浏览器能打开摄像头（需 HTTPS + 授权）
- [ ] 「添加到主屏幕」后图标和名称正常
- [ ] 导出 PNG 功能正常

---

## 常见问题

**Q：上传后页面空白？**  
A：检查是否上传了 `dist` **内部**文件，而不是把整个 `dist` 文件夹当作一层目录。正确做法是访问 `https://域名/index.html` 能打开。

**Q：CSS/JS 404？**  
A：确认 `assets` 目录已一并上传；不要漏传子目录。

**Q：手机摄像头打不开？**  
A：必须使用 **HTTPS**；在浏览器设置里允许该站点使用相机。

**Q：一定要备案吗？**  
A：使用云厂商提供的测试域名，有时可不备案；**绑定自己的域名**在国内长期对外服务，一般需要备案。

**Q：和 Vercel 比有什么优势？**  
A：国内用户访问更快、更稳定；不依赖境外 CDN。海外访问可能不如 Vercel，若主要用户在国内，优先选本方案。

---

## 相关文档

- 境外托管（Vercel）：见 [DEPLOY.md](DEPLOY.md)
- 本地测试：见 [TESTING.md](TESTING.md)
