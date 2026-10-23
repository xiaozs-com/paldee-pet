# Paldee Pet 品牌与上游同步流程

逐项修改、文件范围和验收边界见 [原项目源码修改清单](SOURCE_CHANGES.md)。后续修改源码时同步更新清单，升级上游时按编号核对。

记录日期：2026-10-08；上游身份与基线于 2026-10-23 核对更新，见 [精确源码基线](SOURCE_BASELINES.md)。本仓库继续独立维护，不向小助手仓库复制源码。

## 修改边界

品牌名称的唯一来源是 `src-tauri/tauri.conf.json` 的 `productName`。
`src/lib/brand.ts` 提供前端名称，设置页和页面标题读取它；托盘读取 Tauri 配置；组件打包器同样读取该字段。
聊天原生窗口标题在同一配置中显式设置为 Paldee Pet；修改品牌时同时核对它。宠物窗口空标题保留，避免 Windows 残留标题条。

保留 `com.octop.pet` 应用/凭据标识、`octoppet` 组件 ID、`octoppet-component@1` 和 `pd-chat-cli@2` 协议；独立用户数据路径保持不变。不要把远程 Octop 服务名称全部替换成 Paldee。应用图标和托盘形象已替换；品牌资源按现有打包配置接入。原作者版权、LICENSE 和上游来源不得删除。

| 扩展         | 独立文件                                        | 合并时检查的已有文件                                                                       |
| ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 品牌         | src/lib/brand.ts、本说明                        | tauri.conf.json、main.tsx、SettingsWindow.tsx、tray.rs、打包脚本                           |
| 聊天桥接     | pdChatBridge.ts、pd_bridge_cmd.rs               | useChatController.ts、tauriApi.ts、lib.rs                                                  |
| 可选组件     | component_runtime.rs、scripts/_pd_component_    | Cargo.toml/lock、lib.rs、config_cmd.rs、secrets_cmd.rs                                     |
| 内置形象替换 | public/mascots/、scripts/build_mascot_assets.py | MascotImage.tsx、types.ts、configLogic.ts、SettingsWindow.tsx、config_cmd.rs（旧 ID 迁移） |

应用图标采用清理后的 `public/mascots/type.png`。`scripts/build_app_icons.ps1` 先裁掉多余透明边距，再以约 3% 的安全边距生成 `assets/octop-app-icon.png` 及 `src-tauri/icons/` 的桌面、iOS、Android 配套图标。Windows 任务栏使用 `icon.ico`；托盘使用同一人物的黑色剪影 `tray-template.png`（32×32）及 `tray-template@2x.png`（64×64）。当前 Rust 托盘接线直接引用普通版，因此必须同步生成两份。

在仓库根目录执行（需要 FFmpeg）：

```powershell
python scripts/build_mascot_assets.py
./scripts/build_app_icons.ps1
```

原生图标变更需重新编译并重启程序。`src-tauri/build.rs` 监视 `icons` 目录，保证增量构建会重新嵌入新图标。

## macOS 同步（2026-10-23）

Windows 和 macOS 共用同一套前端、形象配置与 Rust 配置迁移逻辑，默认 Peek，设置只显示 Peek/Type。聊天空白页使用用户提供的矢量 `src/assets/logo.svg`，不透明度统一为 10%。固定主体动画、Type 下巴修复和手部残线修复均随同一份 `public/mascots/` 打包。

macOS 应用图标为本轮同步生成的 `src-tauri/icons/icon.icns`；菜单栏使用已更新的单色托盘模板，并保留 `icon_as_template(true)`。现有发布矩阵覆盖 Apple Silicon 和 Intel，无须维护另一份 Mac 形象或前端源码。生成后的图标已入源码工作区，Mac 构建可直接使用，无需运行 Windows 图标脚本。

Windows 本地检查不能替代 Mac 验收。本轮尚未构建、安装或发布 Mac 包。后续在真实 Mac 上检查：Peek/Type 动画、聊天空白标志、Dock/Finder 应用图标、菜单栏浅色/深色效果，以及宠物窗口焦点切换后的透明背景。

## 第一次同步前

当前 origin 是自有 fork https://github.com/xiaozs-com/paldee-pet.git。已通过 GitHub parent/source 和固定提交比较核实原上游为 https://github.com/jubaoliang/OctopPet.git，默认分支 master，当前 fork 的上游共同祖先为 `4ed0711cbd19d29341656317cb4e526bd59789d1`，该提交包版本 0.2.0。尚未在本地配置 upstream，且本地仍为浅克隆。此前已核对来源；2026-10-23 本地按固定 SHA 取回原上游对象，并快进合入自有远端的四项 Mac 支持提交；未增加 upstream remote。不要把 Octop 服务端仓库、origin、本地浅克隆起点或组件补丁导出基线当作 Pet 上游。

以下命令在仓库目录的 PowerShell 执行；上游分支名未来仍需核实，后续示例中的尖括号必须按当次情况填写。

```powershell
git status --short
git remote -v
git rev-parse --is-shallow-repository
git remote add upstream https://github.com/jubaoliang/OctopPet.git
git fetch upstream
```

已经有 upstream 时先核对地址，不重复添加。若浅历史无法找到共同祖先，补充对应远端历史，必要时使用 `git fetch --unshallow origin` 并重新 fetch upstream；确认 `git merge-base HEAD upstream/<默认分支>` 能返回共同祖先。失败时先查清仓库来源，禁止用 `--allow-unrelated-histories` 强行合并。

## 每次同步

1. 先备份整个当前工作目录中的源文件和未跟踪文件，用户数据另外备份。`git diff` 不包含未跟踪文件，不能单独当完整备份。查看 `git status --short`；有未提交工作时先由维护者审查并提交，或明确保存后再继续。不要直接 reset、clean 或覆盖文件。本次工作仍未提交。
2. 在干净工作区记录当前提交并建立恢复分支，再在同步分支操作：

```powershell
git rev-parse HEAD
git branch backup/paldee-before-sync-<日期>
git switch -c codex/sync-octoppet-<日期>
git fetch upstream
git log --oneline HEAD..upstream/<默认分支>
git diff HEAD...upstream/<默认分支> -- src src-tauri package.json package-lock.json
git merge --no-commit --no-ff upstream/<默认分支>
```

3. 冲突按上表逐项迁移少量接线，独立模块保留；不要整文件选择 ours/theirs。特别检查聊天创建/接收/发送连接、Tauri 命令注册、用户数据和 keyring。不要恢复桥接授权弹窗、增加公网端口或要求 SSH。保留新上游的安全修复与正常聊天行为。
4. 检查未解决冲突，运行 Windows 等价 `make all`：

```powershell
git diff --name-only --diff-filter=U
powershell -ExecutionPolicy Bypass -File scripts/check-windows.ps1
git diff --check
```

5. 验证设置页名称、托盘提示、聊天、Peek 仅眨眼、Type 仅手部动画及白色电脑 Logo；按 `docs/OCTOPPET_COMPONENT.md` 构建并运行组件验收。用户数据、重复启动、停止、异常退出、中文空格路径都必须通过。Mac 手工测试需另行执行，Windows 通过不代表 Mac 通过。
6. 更新 CHANGELOG、同步日期/上游提交/冲突位置/测试结果，审查后由维护者提交。合并回维护分支、push 和发布是单独步骤；源码同步不等于发布安装包。

合并期间要放弃时用 `git merge --abort`，返回原维护分支；恢复分支留存。已结束合并后不要对有工作改动的目录执行 reset；先保存工作，再从恢复分支创建新的工作分支。

## 补丁、构建产物与发布

日常以 Git 合并为主，`docs/upstream-sync/snapshots/` 是应急参考。旧快照的 baseline/head 仅代表生成时点，不能盲目覆盖新上游。品牌接线涉及的文件已列在上表；最新组件补丁导出器已纳入品牌接线及版本文件。快照必须在最终修改后重新生成，不能把旧快照当作当前完整源码。组件补丁使用 `python scripts/export_pd_component_patch.py --base <明确的基线提交>` 重新生成；它不涵盖所有历史桥接和太极改动。

已有 0.2.0 ZIP 是本次更名前的已验收包，不能宣称它已经显示 Paldee Pet。当前品牌版使用 0.2.2，以后构建应使用新版本，并同步 package.json、tauri.conf.json、Cargo.toml 和 Cargo.lock 根包版本，再重新计算最终 ZIP 的 size/sha256、生成未签名清单、验收和受控签名。不得覆盖已发布版本，不能沿用旧哈希/签名。对外包从 0.2.1 起改为 `paldee-pet-<version>-windows-x64.zip`，入口为 `paldee-pet.exe`，发布目录为 `/sah/components/paldee-pet/`。打包器在复制时改名，不修改 Cargo 包名。小助手更新须先按旧清单入口停止旧版本，再按新清单入口启动，不硬编码旧入口。内部 ID 不变，目录维护者应替换同 ID 的条目，避免重复。未上传，不修改全局 catalog.json 或 Cua 文件。

0.2.2 增加 launchable 与默认关闭的 start_with_helper 声明；小助手调用层补丁独立保存为 snapshots/helper-pet-startup.patch。同步主程序后检查组件页异步打开、主窗口一次性启动钩子、读取已保存开关及错误提示，不向 Pet 仓库复制小助手源码。

0.2.3 全 CLI 接线涉及 pdChatBridge.ts / tauriApi.ts / pd_bridge_cmd.rs；参数范围只限制固定 helper CLI 根，不列举子命令。独立桥接传输细节及服务端模块更新留在桥接仓库；服务端不修改 Octop API，已有 ws.py 补丁升级兼容性仍要检查。完整记录见 ../PALDEE_PET_FULL_CLI.md。

2026-10-09 目录精简：打包器不再在 catalog-entry.json 输出 version/entry，验证改为 ZIP component.json 与 latest 清单版本及入口一致；目录只核对稳定 ID 和平台。Pet 与 Cua 分类统一为“交互增强”；Cua 的 packaging/windows/create_release_metadata.ps1 同步修改分类。本地网站全局目录重新签署，保留其他字段和条目。普通版本更新无需重生成目录；只有目录身份、分类或清单地址变化才合并并签名。已有 ZIP、latest 清单及 Cua 发布文件不改。

2026-10-10 项目包名改为 paldee-pet，Rust 库名 paldee_pet_lib，原生构建入口 paldee-pet.exe；同步上游后检查 package/lock、Cargo/lock、main.rs、command_logic.rs 与 build_pd_component.ps1 的名字接线。上游 OctopPet 版权来源、内部 octoppet 组件 ID、com.octop.pet 用户数据及协议标识保留。历史补丁与已发布 ZIP 不重写。
