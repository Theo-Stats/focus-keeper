# Gitee Go 自动构建 Windows 安装包

## 📋 步骤 1：注册 Gitee

1. 打开 https://gitee.com/
2. 注册账号（支持手机号注册）
3. 登录

---

## 📋 步骤 2：创建仓库

1. 点击右上角 **+** → **新建仓库**
2. 填写：
   - 仓库名称：`focus-keeper`
   - 选择 **公开** 或 **私有**
3. 点击 **创建**

---

## 📋 步骤 3：上传代码

### 方法 A：网页上传（最简单）

1. 在仓库页面，点击 **上传文件**
2. 把解压后的所有文件拖进去
3. 点击 **提交**

### 方法 B：使用 Git

```bash
cd focus-keeper
git init
git remote add origin https://gitee.com/YOUR_USERNAME/focus-keeper.git
git add .
git commit -m "Initial commit"
git push -u origin master
```

---

## 📋 步骤 4：配置 Gitee Go

1. 在仓库页面，点击 **Gitee Go** 标签
2. 点击 **新建流水线**
3. 选择 **空白模板**
4. 复制以下配置：

```yaml
version: '1.0'
name: build-windows
displayName: Build Windows Installer
triggers:
  push:
    branches:
      - master
      - main

stages:
  - name: build
    displayName: 构建 Windows 安装包
    strategy:
      windows:
        - windows-latest
    steps:
      - name: checkout
        uses: actions/checkout@v3

      - name: setup-node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: setup-rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: install-pnpm
        run: npm install -g pnpm

      - name: install-deps
        run: pnpm install

      - name: build-frontend
        run: pnpm run build

      - name: build-tauri
        run: pnpm tauri build

      - name: upload-artifact
        uses: actions/upload-artifact@v3
        with:
          name: Focus-Keeper-Setup
          path: src-tauri/target/release/bundle/nsis/*.exe
```

5. 点击 **保存并运行**

---

## 📋 步骤 5：下载安装包

1. 构建完成后，在 **Gitee Go** → **流水线** 页面
2. 点击运行记录
3. 在 **构建产物** 中下载 `Focus-Keeper_Setup.exe`

---

## ⏱️ 构建时间

- 首次：约 20-30 分钟
- 后续：约 10-15 分钟（有缓存）

---

## ❓ 常见问题

**Q: Gitee Go 免费额度？**
A: 每月 500 分钟免费额度，个人使用足够

**Q: 构建失败？**
A: 点击运行记录查看详细日志
