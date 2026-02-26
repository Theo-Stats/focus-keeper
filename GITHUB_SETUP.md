# Focus Keeper - GitHub Actions 构建指南

## 📋 步骤 1：创建 GitHub 仓库

1. 打开 https://github.com/
2. 登录你的 GitHub 账号
3. 点击右上角 **+** → **New repository**
4. 填写：
   - Repository name: `focus-keeper`
   - 选择 **Private**（推荐）或 **Public**
5. 点击 **Create repository**

---

## 📋 步骤 2：上传代码到 GitHub

### 方法：使用 Git 命令

```bash
# 在 GitHub 创建空仓库后，执行以下命令

cd /root/.openclaw/workspace/focus-keeper

# 添加 GitHub 远程（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add github https://github.com/YOUR_USERNAME/focus-keeper.git

# 推送所有分支
git push -u github master
```

---

## 📋 步骤 3：触发自动构建

### 自动触发
- 推送代码后自动开始构建

### 手动触发
1. 在 GitHub 仓库页面，点击 **Actions** 标签
2. 点击左侧 **Build Windows Installer**
3. 点击右侧 **Run workflow** → **Run workflow**
4. 等待构建完成（约 15-20 分钟）

---

## 📋 步骤 4：下载安装包

### 从 Actions 下载

1. 在 **Actions** 页面，点击已完成的构建（绿色✓）
2. 向下滚动到 **Artifacts** 部分
3. 点击 **Focus-Keeper-Setup** 下载
4. 解压后得到 `Focus-Keeper_Setup.exe`

### 从 Release 下载（创建 tag 时）

```bash
# 创建版本 tag
git tag v0.1.0
git push github v0.1.0
```

构建完成后会在 **Releases** 页面自动生成安装包。

---

## ⏱️ 构建时间

- 首次构建：约 15-20 分钟
- 后续构建：约 5-10 分钟（有缓存）

---

## 💰 免费额度

- GitHub Actions：每月 2000 分钟（Private 仓库）
- 足够个人开发者使用

---

## 🎉 完成！

下载 `Focus-Keeper_Setup.exe` 后，双击安装即可使用！
