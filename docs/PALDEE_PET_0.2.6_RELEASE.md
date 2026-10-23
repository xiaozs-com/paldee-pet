# Paldee Pet 0.2.6 Windows x64 组件交付

记录日期：2026-10-23。组件 ID `octoppet`、入口 `paldee-pet.exe`、协议 `octoppet-component@1` 保持不变；不覆盖已生成的 0.2.5 包。

## 本版修改

- 托盘“检查更新”由原项目占位弹窗改为经 Device Bridge 调用 `cli components check-update octoppet`。
- 复用小助手“功能组件 → 检查更新”的同一后端服务，继续执行签名校验与已安装版本比较；显示发现新版本、已经最新、尚未安装或错误原因。
- 后台执行检查，保留菜单响应；Pet 不自行下载、安装、停止或替换组件。下载安装仍由小助手功能组件页面负责。
- 原有聊天窗口 CLI 权限限制、聊天功能、显示兼容修复和 0.2.5 形象/图标继续保留。

## 两端依赖

小助手对应源码提交：`ed961c7e9c5dd49de86ef4e9003aae603bb66753`，仅修改 `runtime/cli.py`，新增 `tests/test_component_update_cli.py`。该提交增加只读入口，直接调用 `components.operations.check_catalog_component_update`，未复制更新逻辑，也不改变原有 Android 连接器命令。

用户选择本次仅构建 Pet 组件，推送两端源码，不构建或发布小助手主程序安装包。因此旧小助手即使安装了 Pet 0.2.6，仍需更新为包含上述提交的主程序构建后，托盘检查更新才能成功。版本号本身不能替代确认该 CLI 入口存在；旧版缺失时显示明确错误。

Mac 共用 Rust 与小助手 CLI 接线，保留现有 Mac 组件支持；本次未构建或验收 Mac 包。Agent Skill 已审阅，无需改动。

## 构建与交付

```powershell
./scripts/build_pd_component.ps1 -BridgeRoot D:/ai/screen-automation-device-bridge
python scripts/test_pd_component.py --package-root build/component-release/paldee-pet --report build/component-release/paldee-pet/acceptance-0.2.6.json
```

平台清单由既有小助手产品签名工具签名并验签，不创建或复制私钥。普通更新只交付版本 ZIP 与已签名 `latest-windows-x64.json`，不上传未签名备份或 `catalog-entry.json`，不修改全局 `catalog.json`。

本地打包与源码 push 不代表服务器已更新。上传时先 ZIP、核对大小与哈希，再上传签名清单。本次不触发 Mac 发布工作流，不推发行 tag。

## 验证结果与交付文件

Windows x64 release 编译与 ZIP 组装完成，13 项实际组件验收全部通过，无失败、错误或跳过。小助手 CLI 与组件测试 30 项通过、4 项原有跳过。下载清单通过既有产品公钥验签。桥接源码保持 `21d3b0d0b6bddd35ba260128f36be362c5f1cd26`。

- `D:\ai\xiaozs.com\xiaozs\sah\components\paldee-pet\0.2.6\paldee-pet-0.2.6-windows-x64.zip`：18,644,173 字节；SHA-256 `c8afb46cfacc6a95a5d8e7eea615bfe2835610959224d3d2a9c21cf60ae459aa`。
- `D:\ai\xiaozs.com\xiaozs\sah\components\paldee-pet\latest-windows-x64.json`：637 字节；SHA-256 `758d42cdddb74e0bdb78041fe44329a7f00a6e2c70a8ed2e5f3ecc0c5e078f6f`。

签名核验报告：`D:/ai/xiaozs.com/component-release-staging/paldee-pet-0.2.6/signing-verification.json`。旧版 ZIP 保留，旧 latest 清单已备份。本次未上传服务器；小助手主程序安装包未构建。

两端源码推送后，Mac 上分别在 Pet 和小助手源码目录执行 `git pull --ff-only`；Pet 组件可继续使用 `scripts/build_pd_component_macos.sh`，主程序构建需包含上述 CLI 提交。
