# 阿里云 OSS 部署指南

将「书法临摹对比」部署到阿里云对象存储（OSS），国内访问稳定，适合手机浏览器使用。

**项目路径：** `C:\AI_ML\shuFa`  
**GitHub：** https://github.com/flowerflyinginwind-wq/shufa-compare

---

## 整体流程

```
本地 npm run build  →  上传 dist 到 OSS  →  开启静态网站  →  （可选）CDN + 域名 + HTTPS
```

预计耗时：**首次约 20～40 分钟**（含注册实名）；以后更新约 **2 分钟**。

---

## 第一步：注册阿里云

1. 打开 https://www.aliyun.com 注册账号
2. 完成**个人实名认证**（控制台右上角按提示操作）
3. 新用户通常有 OSS 免费额度，个人小项目流量一般够用

---

## 第二步：创建 OSS Bucket

1. 登录 [阿里云控制台](https://home.console.aliyun.com/)
2. 搜索 **对象存储 OSS** → 进入
3. 点击 **创建 Bucket**，按下面填写：

| 配置项 | 填写建议 |
|--------|----------|
| Bucket 名称 | 全局唯一，例如 `shufa-compare-2025`（只能小写字母、数字、短横线） |
| 地域 | 选离你近的，如 **华东1（杭州）** |
| 存储类型 | 标准存储 |
| 读写权限 | **公共读**（网站需要任何人能读文件） |
| 版本控制 | 关闭 |
| 服务端加密 | 可不选 |

4. 点击确定，进入刚创建的 Bucket

> **记下：** Bucket 名称、地域（后面上传脚本要用）。

---

## 第三步：开启静态网站托管

1. 在 Bucket 左侧菜单 → **数据管理** → **静态页面**
2. 点击 **设置** → 开启 **静态页面**
3. 填写：

   | 项 | 值 |
   |----|-----|
   | 默认首页 | `index.html` |
   | 默认 404 页 | `index.html` |

4. 保存

5. 页面会显示 **访问 Bucket 的域名**，形如：

   ```
   http://shufa-compare-2025.oss-cn-hangzhou.aliyuncs.com
   ```

   先记下，上传文件后再访问测试。

> 手机拍照需要 **HTTPS**。OSS 默认域名部分地域支持 `https://` 前缀，若不行见下文「第七步」配置 CDN。

---

## 第四步：本地构建

在电脑上打开 PowerShell：

```powershell
cd C:\AI_ML\shuFa
npm install
npm run build
```

无报错后，打开 `C:\AI_ML\shuFa\dist`，应看到：

```
index.html
assets/
icon.svg
manifest.webmanifest
sw.js
...
```

---

## 第五步：上传文件到 OSS

### 方式 A：网页上传（第一次推荐）

1. OSS 控制台 → 你的 Bucket → **文件管理**
2. 点击 **上传文件** → **扫描文件**
3. 打开本地文件夹 `C:\AI_ML\shuFa\dist`
4. **全选** dist 里的所有文件和文件夹（`index.html`、`assets` 等）
5. 开始上传，等待完成

**注意：** 上传的是 dist **里面的内容**，不要多包一层 `dist` 文件夹。  
正确：Bucket 根目录直接是 `index.html`  
错误：Bucket 里是 `dist/index.html`

### 方式 B：命令行上传（以后更新用）

#### 1. 安装 ossutil

- 下载：https://help.aliyun.com/document_detail/120075.html  
- Windows 解压后，将 `ossutil.exe` 所在目录加入系统 PATH，或在项目里用完整路径调用

#### 2. 创建 AccessKey

1. 控制台右上角头像 → **AccessKey 管理**
2. 按提示创建 **AccessKey ID** 和 **AccessKey Secret**（妥善保存，勿泄露、勿提交到 Git）

#### 3. 配置 ossutil

```powershell
ossutil config
```

按提示输入：

- Endpoint：与地域对应，例如杭州为 `oss-cn-hangzhou.aliyuncs.com`
- AccessKeyId / AccessKeySecret：上一步创建的
- 其他可回车默认

各地域 Endpoint 可查：https://help.aliyun.com/document_detail/31837.html

#### 4. 上传

```powershell
cd C:\AI_ML\shuFa
ossutil cp dist/ oss://你的Bucket名称/ -r -f --meta Cache-Control:no-cache
```

或使用项目自带脚本（需先改脚本里的 Bucket 名）：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\deploy-aliyun.ps1
```

---

## 第六步：访问测试

1. 浏览器打开静态网站域名，例如：

   ```
   https://shufa-compare-2025.oss-cn-hangzhou.aliyuncs.com
   ```

   若 HTTPS 不可用，先用 `http://` 在电脑浏览器测功能；手机拍照再按第七步配 HTTPS。

2. 检查：

   - [ ] 页面样式正常，不是空白
   - [ ] 能上传两张图并切换「叠加 / 差异」
   - [ ] 能导出 PNG

3. **手机测试：**

   - 手机浏览器打开同一地址
   - 允许相机权限后点「拍照」
   - Safari / Chrome →「添加到主屏幕」

---

## 第七步：配置 CDN + HTTPS（推荐，手机必用）

OSS 直连域名有时较慢或 HTTPS 受限，**正式给手机用建议加 CDN**。

### 1. 开通 CDN

1. 控制台搜索 **CDN** → 进入 **域名管理**
2. **添加域名**

| 项 | 填写 |
|----|------|
| 加速域名 | 子域名，如 `shufa.你的域名.com`（需已备案域名） |
| 业务类型 | 图片小文件 |
| 源站信息 | 源站类型选 **OSS 域名**，选择你的 Bucket |

3. 提交后，CDN 会给出 **CNAME 地址**（形如 `xxx.w.kunlunaq.com`）

### 2. 域名 DNS 解析

到买域名的地方（阿里云万网、腾讯云等）：

- 记录类型：**CNAME**
- 主机记录：`shufa`（对应 `shufa.你的域名.com`）
- 记录值：粘贴 CDN 提供的 CNAME

### 3. 开启 HTTPS

1. CDN 控制台 → 该域名 → **HTTPS 配置**
2. 开启 HTTPS，选择 **免费证书**（阿里云可申请 Let's Encrypt 或免费 DV 证书）
3. 开启 **HTTP 跳转 HTTPS**

### 4. 备案说明

- 使用 **自己的域名** 在国内 CDN 加速，域名一般需要 **[ICP 备案](https://beian.miit.gov.cn/)**
- 若暂时没有备案域名，可先用 OSS 默认域名在电脑端测试；手机拍照长期用仍建议备案 + CDN + HTTPS

---

## 以后更新网站

改完代码后：

```powershell
cd C:\AI_ML\shuFa
git pull
npm run build
ossutil cp dist/ oss://你的Bucket名称/ -r -f
```

若用了 CDN，可在 CDN 控制台对该域名 **刷新缓存**（路径 `/` 或 `/*`），避免用户看到旧页面。

---

## 费用参考（个人小项目）

| 项目 | 说明 |
|------|------|
| OSS 存储 | 几十 MB 的静态站，每月通常几分到几毛钱 |
| 外网流出流量 | 按下载量计费，访问不多时很低 |
| CDN | 有免费额度，小流量基本可忽略 |

可在控制台 **费用中心** 设置余额告警。

---

## 常见问题

**Q：打开网页一片空白？**  
A：检查 Bucket 根目录是否直接有 `index.html`，而不是 `dist/index.html`。

**Q：样式丢失、控制台报 404？**  
A：确认 `assets` 文件夹已完整上传。

**Q：手机摄像头打不开？**  
A：必须用 **HTTPS**；检查浏览器是否允许相机权限。

**Q：更新后手机还是旧版？**  
A：清浏览器缓存，或 CDN 刷新缓存；PWA 用户可删掉主屏幕图标重新添加。

**Q：AccessKey 泄露怎么办？**  
A：立即在控制台禁用并新建，**不要**把 Key 写进 Git 仓库。

---

## 快速命令备忘

```powershell
# 构建
cd C:\AI_ML\shuFa
npm run build

# 上传（替换 Bucket 名）
ossutil cp dist/ oss://shufa-compare-2025/ -r -f

# 本地预览
npm run preview
```

---

## 相关文档

- 其他国内方案对比：[DEPLOY-CN.md](DEPLOY-CN.md)
- Vercel 部署：[DEPLOY.md](DEPLOY.md)
