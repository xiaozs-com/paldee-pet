# Paldee Pet 0.2.7 Windows x64 组件交付

记录日期：2026-11-06。组件 ID `octoppet`、入口 `paldee-pet.exe`、协议 `octoppet-component@1` 不变；旧版 0.2.6 ZIP 保留。

## 本版修改

- Pet 拖动、惯性滑动、移动事件和持久化统一使用物理坐标；鼠标逻辑位移按当前缩放转换一次，物理位置取整后调用 Tauri，形象大小仍为逻辑尺寸。
- 启动时检查形象与全部显示器工作区的相交情况，完全不可见时移回主屏幕并保存；保留有效的副屏和负坐标位置。
- 重置入口位于“设置 → 窗口 → 重置形象位置”，点击后移回主屏幕、显示并保存。托盘菜单不增加该入口。
- Windows/macOS 共用位置和设置代码，保留既有透明窗口处理；Mac 端拉取源码后本机构建，当前没有构建或验收 macOS 包。
- 保留远端已有的 Mac 脚本、ARM 目标名和按平台收集许可证的三项修复。

## Windows 交付

- ZIP：`build/component-release/paldee-pet-0.2.7/0.2.7/paldee-pet-0.2.7-windows-x64.zip`
- 大小：18,656,383 字节。
- SHA-256：`71269c7825a55f8bc5a023e03dd1d3ce5ea4ab4f48b3b78081ff7028ebe33d69`。
- 安装清单：`build/component-release/paldee-pet-0.2.7/latest-windows-x64.json`，经既有小助手签名工具签名，并通过受信任公钥验签。
- 上传暂存目录：`build/component-release/paldee-pet-0.2.7/upload-staging/`，只包含版本 ZIP 和签名清单。未上传服务器，未修改全局 catalog。
- 随包提供桥接 EXE、诊断工具和许可证；桥接二进制与 0.2.6 组件中的文件完全一致。

## 验证范围

35 项相关前端测试和 31 项 Rust 测试通过，Windows release 构建完成。组件实际解压验收报告为输出目录中的 `acceptance-0.2.7.json`，签名及哈希报告为 `signing-verification.json`。源码提交受正常 pre-commit 全套检查约束。

125% 连续拖动、松手滑动、退出重启、多显示器拔屏以及 macOS 透明窗口行为仍需实机验收。

## Mac 拉取和构建

在 Mac 的 Pet 仓库目录执行，桥接根目录替换为本机实际路径：

```bash
git pull --ff-only origin master
npm ci
bash scripts/build_pd_component_macos.sh /实际路径/screen-automation-device-bridge
```

脚本默认按本机架构构建，Apple Silicon 使用 `aarch64-apple-darwin`，Intel 使用 `x86_64-apple-darwin`。Mac 的组件清单由打包脚本生成时仍未签名，正式交付沿用既有受控签名流程。
