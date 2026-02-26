# Focus Keeper - 不做手机控 电脑版

🎯 **专注时间管理工具** - 帮助你屏蔽分心网站和应用，提升工作效率

## ✨ 核心功能

### 1. 专注模式
- 🍅 番茄钟计时（25/45/60 分钟可选）
- 🔒 严格模式 - 专注期间无法关闭拦截
- ⏱️ 实时倒计时显示
- 📊 自动记录专注时长

### 2. 网站屏蔽
- 🌐 修改 hosts 文件屏蔽网站
- 📋 预设常见分心网站（B 站、微博、抖音、YouTube 等）
- ➕ 自定义添加/删除黑名单
- ⏰ 分时段屏蔽（专注时段自动启用）

### 3. 应用屏蔽
- 🖥️ 监控并关闭黑名单应用进程
- 📱 支持微信、QQ、游戏等应用
- ➕ 自定义添加/删除黑名单
- ⏰ 分时段屏蔽

### 4. 数据统计
- 📈 今日专注时长统计
- 🚫 今日拦截次数
- 📊 历史趋势图表

## 🛠️ 技术栈

- **前端**: React 19 + TypeScript + Vite + shadcn/ui
- **后端**: Rust + Tauri 2.0
- **系统**: Windows (支持 macOS/Linux)

## 📦 安装

### Windows 安装包

在 Windows 上运行以下命令构建：

```bash
# 进入项目目录
cd focus-keeper

# 安装依赖
pnpm install

# 构建 Windows 安装包
pnpm tauri build

# 安装包位置
# target/release/bundle/nsis/Focus-Keeper_Setup.exe
```

### 开发模式

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm tauri dev
```

## 📋 使用说明

### 首次使用

1. **以管理员身份运行** - 修改 hosts 文件需要管理员权限
2. **设置黑名单** - 在"网站屏蔽"和"应用屏蔽"页面添加要屏蔽的内容
3. **开启专注** - 点击"专注模式"开始专注时间

### 专注模式

1. 选择专注时长（25/45/60 分钟）
2. 点击"开始专注"
3. 专注期间会自动屏蔽黑名单网站和应用
4. 专注完成后自动记录时长

### 网站屏蔽

预设网站包括：
- bilibili.com
- weibo.com
- douyin.com
- youtube.com
- twitter.com
- facebook.com
- instagram.com
- reddit.com

点击"启用屏蔽"即可修改 hosts 文件。

### 应用屏蔽

预设应用进程名：
- WeChat.exe (微信)
- QQ.exe (QQ)
- Steam.exe (Steam)

专注模式下会自动检测并关闭这些进程。

## ⚠️ 注意事项

1. **管理员权限** - 修改 hosts 文件需要管理员权限
2. **hosts 备份** - 程序会自动备份原始 hosts 文件
3. **卸载恢复** - 卸载时会自动恢复 hosts 文件
4. **杀毒软件** - 某些杀毒软件可能会拦截 hosts 修改，请添加信任

## 📁 项目结构

```
focus-keeper/
├── src/                      # React 前端
│   ├── components/ui/        # UI 组件
│   ├── pages/                # 页面组件
│   │   ├── FocusMode.tsx     # 专注模式
│   │   ├── WebsiteBlocker.tsx # 网站屏蔽
│   │   ├── AppBlocker.tsx    # 应用屏蔽
│   │   └── Statistics.tsx    # 数据统计
│   └── App.tsx
├── src-tauri/                # Rust 后端
│   ├── src/
│   │   ├── blocker/          # 拦截核心逻辑
│   │   │   ├── hosts.rs      # hosts 文件操作
│   │   │   └── process.rs    # 进程监控
│   │   ├── commands/         # Tauri commands
│   │   │   ├── hosts.rs
│   │   │   ├── process.rs
│   │   │   ├── stats.rs
│   │   │   └── focus.rs
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
└── package.json
```

## 🔧 配置

配置文件位于：`%APPDATA%\Focus Keeper\config.json`

包含：
- 网站黑名单
- 应用黑名单
- 专注设置
- 统计数据

## 📝 更新日志

### v0.1.0 (2026-02-26)
- ✅ 初始版本发布
- ✅ 专注模式
- ✅ 网站屏蔽
- ✅ 应用屏蔽
- ✅ 数据统计

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**开发时间**: 2026-02-26
**技术**: Tauri 2.0 + React + Rust
