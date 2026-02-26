# Focus Keeper - GitHub Actions 构建指南

## 📋 步骤 1：创建 GitHub 仓库

1. 打开 https://github.com/
2. 登录你的 GitHub 账号（没有的话先注册）
3. 点击右上角 **+** → **New repository**
4. 填写：
   - Repository name: `focus-keeper`
   - 选择 **Public** 或 **Private**（Private 也可以免费用 Actions）
5. 点击 **Create repository**

---

## 📋 步骤 2：上传代码

### 方法 A：使用 GitHub 网页上传（最简单）

1. 在刚创建的仓库页面，点击 **uploading an existing file**
2. 把 `focus-keeper.zip` 解压后的所有文件拖进去
3. 点击 **Commit changes**

### 方法 B：使用 Git 命令

```bash
# 解压 ZIP 文件
# 进入项目目录
cd focus-keeper

# 初始化 git（如果还没有）
git init

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/focus-keeper.git

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Focus Keeper app"

# 推送到 GitHub
git branch -M main
git push -u origin main
```

---

## 📋 步骤 3：触发自动构建

### 自动触发
- 推送代码到 `main` 分支后自动开始构建

### 手动触发
1. 在 GitHub 仓库页面，点击 **Actions** 标签
2. 点击左侧 **Build Windows Installer**
3. 点击右侧 **Run workflow** → **Run workflow**
4. 等待构建完成（约 15-20 分钟）

---

## 📋 步骤 4：下载安装包

### 从 Actions 下载

1. 在 **Actions** 页面，点击正在运行或已完成的构建
2. 向下滚动到 **Artifacts** 部分
3. 点击 **Focus-Keeper-Setup** 下载
4. 解压后得到 `Focus-Keeper_Setup.exe`

### 从 Release 下载（如果创建了 tag）

```bash
# 创建版本 tag
git tag v0.1.0
git push origin v0.1.0
```

构建完成后会在 **Releases** 页面自动生成安装包。

---

## ⏱️ 构建时间

- 首次构建：约 15-20 分钟（需要下载 Rust 和 Node 依赖）
- 后续构建：约 5-10 分钟（有缓存）

---

## ❓ 常见问题

**Q: Actions 显示失败？**
A: 点击失败的 job 查看日志，通常是依赖安装问题

**Q: 免费额度够用吗？**
A: 每月 2000 分钟免费额度，足够个人使用

**Q: 可以删除构建历史吗？**
A: 可以，在 Actions 页面删除旧的工作流运行

---

## 🎉 完成！

下载 `Focus-Keeper_Setup.exe` 后，双击安装即可使用！
