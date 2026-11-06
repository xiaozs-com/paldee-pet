# Paldee Pet 0.2.8：自动保持完整可见

记录日期：2026-11-07。组件 ID、入口、协议及用户数据位置保持不变；旧版 0.2.7 包保留。

## 行为

- 启动、拖动和惯性滑动均按物理坐标将整个形象夹在最近显示器的工作区内。右侧和底部扣除该显示器缩放后的形象大小；160 逻辑像素在 125% 下按 200 物理像素计算。
- 已在屏幕内的位置保持原样，包括有效的副屏负坐标。部分越界或完全越界时移动到最近边缘，启动时保存修正后的坐标。
- 托盘/快捷键及 Windows/macOS 组件 show 命令共用显示前边界检查；原生窗口移动、尺寸和 DPI 变化后按实际物理窗口尺寸检查。
- 移除“设置 → 窗口”的手动恢复按钮及对应命令；保留现有透明窗口和焦点处理。

## Windows 本地组件

- ZIP：`build/component-release/paldee-pet-0.2.8/0.2.8/paldee-pet-0.2.8-windows-x64.zip`
- 大小：18,646,404 字节。
- SHA-256：`70ae3f8324960ad3b4195fb1e5155cd09f2d582115433f098bfc3023f5c5a54e`。
- `latest-windows-x64.json` 已由既有小助手签名工具签名并通过受信任公钥验签，未创建或复制私钥。
- `upload-staging/` 仅包含版本 ZIP 与签名清单。尚未上传服务器，未修改全局 catalog。

## 验证

40 项相关前端回归、34 项 Rust 测试和 Clippy 通过；Windows release 构建完成。实际组件包的 14 项验收全部通过，报告为输出目录中的 `acceptance-0.2.8.json`。

新增验收仅操作隔离 host 自己的 HWND，将其移到屏幕外并调用 show，验证整个物理窗口贴到工作区的左上/右下边缘。测试线程使用物理 DPI 坐标，未修改系统缩放；本次实际窗口 DPI 为 96。125% 的尺寸/边界由计算回归覆盖，动态缩放、混合 DPI 多屏及 Mac 的完整人工验收仍待进行。

源码提交执行正常 pre-commit 全套检查，Windows 使用仓库的等价 `make all` 脚本。

## Mac 同步

在 Mac 的 Pet 仓库中拉取 master 后执行 `npm ci`、`make all`，再运行以下命令，替换桥接仓库的实际路径：

```bash
bash scripts/build_pd_component_macos.sh /实际路径/screen-automation-device-bridge
```

Mac 组件仍需在受控环境签名后正式交付；本次未在 Windows 上宣称完成 Mac 构建。
