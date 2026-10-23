# Paldee Pet 0.2.5 Windows x64 组件交付

记录日期：2026-10-23。组件 ID 保持 `octoppet`，入口为 `paldee-pet.exe`，运行协议为 `octoppet-component@1`。旧 0.2.4 内容保持不变。

## 本版内容

- 内置 Peek/Type 替换为固定主体的太极机器人；清除 Type 下巴青色痕迹及手放下后残留的轮廓。
- 移除独立 Taiji 第三选项；旧配置自动按 Peek 使用，保留其他设置。
- 电脑背面采用用户确认的白色 Logo；应用图标收紧透明留白，托盘模板同步替换。
- 聊天空白页采用用户提供的矢量 Logo，10% 不透明度；聊天菜单和输入提示改为“小助手”。
- 保留现有桥接、组件运行协议和随包只读 Windows 诊断工具。
- 包含源码修改清单、精确上游基线及素材重建入口；Mac 共用源码与图标素材，实际 Mac 构建和验收单独进行。

状态表情历史：聊天活动驱动表情曾在 `ce506b6` 增加、在 `7979d4f` 撤回，早于本轮修改。本版没有恢复自动状态表情，不能把旧八状态素材目录当作已启用的功能。

## 本地交付与上传边界

组件 ZIP、未签名清单与测试报告在 `build/component-release/paldee-pet/` 生成。正式下载清单需由既有产品签名工具签名，并使用小助手信任的公钥验签；不创建或复制私钥，不改全局 `catalog.json`。

本次仅生成本地 Windows x64 包并推送源码，不上传服务器，不推送发行 tag，不触发 Mac 发布。上传时先放置 `0.2.5/paldee-pet-0.2.5-windows-x64.zip`，核对大小与 SHA-256，再放置已签名的 `latest-windows-x64.json`。普通升级不需要覆盖全局目录或 Cua 文件。

## 已完成的交付验证

- Windows release 程序、随包桥接程序和组件 ZIP 均已本地构建，桥接源码提交为 `21d3b0d0b6bddd35ba260128f36be362c5f1cd26`。
- 实际 ZIP 的 13 项独立目录验收全部通过；无失败、错误或跳过。
- 下载清单已用既有产品签名工具签名，并通过小助手内置信任公钥验签；不创建或复制私钥。
- 未上传服务器，未修改全局目录，未发布 Mac 包。Mac 组件支持的远端提交 `527ed863c83633d03ae6a9c0d8e9da72b132372c` 已合入本地源码。

## 可上传的两个文件

- `D:\ai\xiaozs.com\xiaozs\sah\components\paldee-pet\0.2.5\paldee-pet-0.2.5-windows-x64.zip`：18,630,537 字节；SHA-256 `4afe4854afc9422097d4fe53e13d8c9c2c2591067511679d1d827af5ca5e584b`。
- `D:\ai\xiaozs.com\xiaozs\sah\components\paldee-pet\latest-windows-x64.json`：637 字节；SHA-256 `8f8c70f8b63e1a920c6f556bb2a200b7436576fd06049f6433c85df6547d1b88`。

签名核验报告：`D:/ai/xiaozs.com/component-release-staging/paldee-pet-0.2.5/signing-verification.json`。构建目录中的 `latest-windows-x64.unsigned.json` 仅留档，不上传；`catalog-entry.json` 不属于普通版本更新上传文件。

## Mac 上拉取和编译

先在自己的源码目录 `git pull --ff-only`，再安装依赖并执行：

```bash
npm ci
bash scripts/build_pd_component_macos.sh /实际路径/screen-automation-device-bridge
```

脚本默认构建当前 Mac 的架构；本地尚未执行本版 Mac 编译与实机验收。GitHub 的组件发布工作流仅手动触发，本次不触发它。
