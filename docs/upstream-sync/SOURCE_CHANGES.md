# Paldee Pet 对原项目的修改清单

更新日期：2026-10-23。本文件是源码维护清单；新增定制时同步更新，升级原项目时逐项核对。

## 来源与记录范围

| 项目                      | 记录值                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| 原项目                    | `jubaoliang/OctopPet`，上游分支 `master`                                                   |
| 已核对的原项目基线        | `4ed0711cbd19d29341656317cb4e526bd59789d1`，包版本 `0.2.0`；未确认发行 tag                 |
| 自有仓库                  | `xiaozs-com/paldee-pet`                                                                    |
| 本轮开始及清单建立时 HEAD | `582a6d3fbcbdea39be74d99ef60e69aa70655716`，已提交版本 `0.2.3`                             |
| 当前工作区版本            | `0.2.6`，当前正在完成 Windows 组件构建与提交；不代表已上传                                 |
| 精确来源记录              | [SOURCE_BASELINES.md](SOURCE_BASELINES.md)、[source-baselines.json](source-baselines.json) |

上游身份与基线取自此前已核对的来源记录，本次没有重新联网核对。本地为浅克隆，已于 2026-10-23 取回上述上游提交对象进行核对；以下是按当前源码、提交记录和本轮工作区核实的定制维护清单，其中表格是维护摘要；逐行差异可使用下文固定基线比较命令查看。`git diff HEAD` 也只覆盖当前未提交修改，不能代表全部历史定制。

服务器 Octop、Device Bridge 和小助手是独立工程；它们的代码修改不计入 Pet 清单。Pet 原作者版权、LICENSE 和来源记录继续保留。

## 一、此前已存在的定制

这些项目在本轮开始时已经存在。这里列维护入口，历史实现与验收细节见对应文档，不能把历史通过状态当作本轮重新验收结果。

| 编号 | 改动与当前用途                                                           | 主要文件                                                                                                                                                                                                            | 后续升级需保留或核对                                                                                                          |
| ---- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| H01  | 产品显示名称、包名和 Rust crate/可执行文件改为 Paldee Pet / `paldee-pet` | `src/lib/brand.ts`、`src/main.tsx`、`src/windows/SettingsWindow.tsx`、`package.json`、`package-lock.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`、`src-tauri/src/tray.rs`     | `productName` 为显示名称来源；保留 `com.octop.pet`、组件 ID `octoppet` 及现有凭据/数据标识，避免升级后丢失原用户设置          |
| H02  | 在已有聊天 WebSocket 上转发小助手 CLI 请求与结果                         | `src/lib/pdChatBridge.ts`、`src/lib/pdChatBridge.test.ts`、`src/hooks/useChatController.ts`、`src/lib/tauriApi.ts`、`src-tauri/src/pd_bridge_cmd.rs`、`src-tauri/src/lib.rs`                                        | 保留 `pd-chat-cli@2`、`helper.cli`、请求/结果接线和断线清理；不能只复制桥接模块而遗漏聊天控制器与命令注册                     |
| H03  | 独立 Windows 组件生命周期、启动/状态/停止及当前用户数据隔离              | `src-tauri/src/component_runtime.rs`、`src-tauri/src/component_runtime_macos.rs`、`src-tauri/src/main.rs`、`src-tauri/src/lib.rs`、`src-tauri/src/config_cmd.rs`、`src-tauri/src/secrets_cmd.rs`                    | 保留 `octoppet-component@1`；Windows 和 macOS 分别使用 `component_runtime.rs`、`component_runtime_macos.rs`，必须保留平台隔离 |
| H04  | Windows 窗口/WebView 与 macOS 透明窗口、焦点处理适配                     | `src-tauri/src/lib.rs`、`src-tauri/src/window_cmd.rs`、`src/windows/PetWindow.tsx`、`src/lib/tauriWindowApi.ts`、`src/lib/tauriWebviewApi.ts`                                                                       | 合并窗口代码时核对显示、隐藏、焦点、背景透明和定位行为；不能把整份上游窗口文件覆盖回来                                        |
| H05  | Markdown 依赖兼容修补及按修补内容区分开发缓存                            | `scripts/patch-gfm-autolink-lookbehind.mjs`、`package.json` 的 `postinstall`、`vite.config.ts`                                                                                                                      | 保留修补与缓存失效配套关系；上游依赖升级后先确认是否仍需要，不能只删除其中一半                                                |
| H06  | 独立组件构建、打包、第三方许可证与补丁导出                               | `scripts/build_pd_component.ps1`、`scripts/package_pd_component.py`、`scripts/test_pd_component.py`、`scripts/export_pd_component_patch.py`、`scripts/export_pd_bridge_patch.py`、`packaging/third-party-licenses/` | Pet 源码同步、组件 ZIP、发布清单和服务器上传是不同步骤；补丁导出器只覆盖声明的范围，不能当作全仓库备份                        |

参见：[组件实现与协议](../OCTOPPET_COMPONENT.md)、[完整 CLI 桥接](../PALDEE_PET_FULL_CLI.md)、[上游同步流程](PALDEE_SYNC.md)。

### 状态表情的增加与撤回

2026-10-09 曾通过 `ce506b6847582390f41e4a3aafebd1f67ee4a5ee` 增加基于聊天活动的 `pet-state` 接线，随后在 `7979d4ff08d43c2da0d112c71df6098308dbf878` 撤回。因此在本轮替换素材之前，当前分支已经不再随思考、工作、等待、成功、失败等状态自动切换形象。提交说明没有注明撤回原因，不能把“因图片左右晃动撤回”写成已确认事实。素材抖动与状态驱动是独立问题；本轮没有恢复这项历史功能。聊天文字/工具状态提示保持原逻辑。

## 二、当前工作区的修改记录

以下项目截至本清单建立时尚未提交。本轮工作区原有的版本、组件和诊断改动与新增视觉改动一起保留，不表示它们已经统一打包、安装或发布。

| 编号 | 修改项                                 | 文件与处理方式                                                                                                                                                                                                                                         | 当前结果 / 升级核对点                                                                                                                            |
| ---- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| W01  | 直接替换内置 Peek、Type 形象           | 替换 `public/mascots/peek.webp`、`type.webp`；新增 `peek.png`、`type.png` 静态首帧                                                                                                                                                                     | 继续使用原有两个动作 ID；默认 `peek`。Peek 为 352×320，Type 为 856×812；PNG 是预览和图标来源，运行时形象使用 WebP                                |
| W02  | 固定主体动画，清理 Type 面部和手部残线 | 新增 `scripts/build_mascot_assets.py`、`public/mascots/taiji-bot/peek-type-source.png`、`type-face-cleanup.png`、`public/mascots/mascot-assets.json`                                                                                                   | Peek 只改变眼部，Type 只改变手部区域；局部清除下巴青色痕迹；手部替换区域覆盖完整旧手轮廓，避免放下手后残留黑线。清单记录来源哈希、时长和变化区域 |
| W03  | 电脑背面的白色 Logo                    | 新增 `public/mascots/taiji-bot/laptop-logo-white.png`；由形象脚本缩放、居中合成                                                                                                                                                                        | 来自用户的 `pd_白色.png`，不由 AI 重画；当前图集坐标下缩放为 54×54，位置为 `(194,339)`；改版时保留用户确认的大小和位置                           |
| W04  | 移除第三个独立形象选项                 | 修改 `src/lib/types.ts`、`src/lib/configLogic.ts`、`src/windows/SettingsWindow.tsx`                                                                                                                                                                    | 只允许 `peek`、`type`；不再增加 `taiji-bot` 选择项                                                                                               |
| W05  | 迁移旧形象配置                         | 修改 `src-tauri/src/config_cmd.rs`、`src-tauri/tests/command_logic.rs`                                                                                                                                                                                 | 加载旧 `taiji-bot` 时按 `peek` 使用，其他设置保持；仅加载不重写磁盘；原生选择命令只接受 Peek/Type                                                |
| W06  | 移除旧的 SVG 眼部叠加和状态动画映射    | 简化 `src/components/MascotImage.tsx`；修改对应测试；删除 `src/lib/mascotAnimation.ts`、`mascotAnimation.test.ts`、`src/styles/mascot.css`                                                                                                             | 图片组件直接显示内置 WebP，不再给 Taiji 单独接线；旧八状态素材保留归档，不代表当前客户端方案                                                     |
| W07  | 聊天空白页替换为用户导出的矢量标志     | 替换 `src/assets/logo.svg`；继续由 `src/components/MessageList.tsx` 原路径引用                                                                                                                                                                         | 使用用户提供的 Illustrator SVG（原文件 `资源 38.svg`），不再使用自动位图描摹版；不要把原上游 Logo 合并回来                                       |
| W08  | 空白页标志显示更淡                     | 修改 `src/styles/chat.css` 的 `.chat-empty-logo`                                                                                                                                                                                                       | 不透明度为 `0.1`（10%）；位置、尺寸与反色效果保留，Windows/macOS 共用                                                                            |
| W09  | 聊天菜单和输入框改为“小助手”           | 修改 `src/lib/petContextMenu.ts`、`src/components/Composer.tsx`、`Composer.test.tsx`                                                                                                                                                                   | “与小助手对话”“和小助手说点什么”；保留真正的 Octop 服务/API 名称，避免全文替换                                                                   |
| W10  | 模板遗留 React 图标配色                | 修改 `src/assets/react.svg`                                                                                                                                                                                                                            | 填充为 `#33cccc`；当前无源码引用，不影响界面颜色，不能误认为已配置全局主题                                                                       |
| W11  | 应用图标改为打字机器人并收紧留白       | 替换 `assets/octop-app-icon.png` 和 `src-tauri/icons/` 生成的 PNG、ICO、ICNS、iOS/Android 配套文件；新增 `scripts/build_app_icons.ps1`                                                                                                                 | 裁掉原人物图透明边距，保留约 3% 安全边距；源图为清理后的 `public/mascots/type.png`。README 中原有图片路径保持，只替换内容                        |
| W12  | 更换系统托盘黑色剪影                   | 替换 `src-tauri/icons/tray-template.png`、`tray-template@2x.png`                                                                                                                                                                                       | 同一人物剪影，分别为 32×32、64×64；Rust 当前直接引用普通版；macOS 保留 `icon_as_template(true)`，两份都需同步                                    |
| W13  | 图标变化触发原生增量构建               | 修改 `src-tauri/build.rs`                                                                                                                                                                                                                              | 新增 `cargo:rerun-if-changed=icons`，确保图标更新被重新嵌入；运行中的旧 EXE 仍需退出重启                                                         |
| W14  | 0.2.4 版本与 Windows 组件诊断交付      | 当前已有修改：`package.json`、`package-lock.json`、`src-tauri/Cargo.toml`、`Cargo.lock`、`tauri.conf.json`、`scripts/package_pd_component.py`、`test_pd_component.py`、`export_pd_component_patch.py`；新增 `scripts/diagnose-pet-windows.ps1`、`.cmd` | 本轮开始时已有的工作区改动；具体交付边界见 `docs/PALDEE_PET_0.2.4_RELEASE.md` 和 `docs/OCTOPPET_COMPONENT.md`；不能因包版本号存在就认定已发布    |
| W15  | 源码来源、同步说明和用户可见变更记录   | `CHANGELOG.md`、`CONTRIBUTING.md`、`docs/upstream-sync/README.md`、`PALDEE_SYNC.md`、`SOURCE_BASELINES.md`、`source-baselines.json`、本清单；另有组件说明和 `snapshots/` 的工作区改动                                                                  | 升级时更新基线和本清单；旧补丁快照不涵盖这轮全部形象、图标、文案修改，不能单独拿来恢复完整源码                                                   |

`src-tauri/icons/ios/`、`android/` 在这里仅指同步生成的图标素材，不代表新增了手机端功能或发布了手机应用。

### 本轮交付补充

- 远端 `527ed863c83633d03ae6a9c0d8e9da72b132372c` 之前的四项 Mac 支持提交已快进合入，保留 macOS 生命周期、桥接可执行文件定位、双架构打包脚本及组件 CI。
- 0.2.4 已有不可变组件包记录，本次新包使用 0.2.5，不覆盖旧版本。
- 用户确认：原项目曾出现对话窗口无法显示，我们的修改后可以显示。保留原功能并不意味着恢复原版文件：窗口显示/透明背景修复、Markdown/WebView 兼容修补及 Vite 缓存失效处理必须继续保留。该历史现象的单一根因未在本轮重现，因此不把它统一写成某一个已确认 bug。
- 已对照原上游 `4ed0711`：原版仅手选 Peek/Type；当前 `PetWindow.tsx`、`MascotImage.tsx`、`configLogic.ts` 与该基线一致。聊天控制器继续保留原功能，并增加桥接接线；没有为恢复原版而删除本地兼容修复。

## 三、macOS 同步范围与验收状态

### W16：托盘检查更新（0.2.6；不覆盖 0.2.5）

- 原项目 `tray.rs::check_for_updates` 仅显示版本与“暂未接入自动更新”。现修改 `src-tauri/src/tray.rs`，异步调用 `src-tauri/src/pd_bridge_cmd.rs` 的固定组件更新请求，不阻塞菜单/UI。
- 复用 Device Bridge 传输，固定请求为 `cli components check-update octoppet`。聊天窗口的 CLI 调用权限检查保留，不开放通用托盘执行入口。
- 小助手另在 `runtime/cli.py` 增加只读命令，直接调用原“功能组件 → 检查更新”的 `components.operations.check_catalog_component_update`，复用清单验签和已安装版本比较；原有 Android 连接器命令保留。
- Pet 显示更新结果或实际错误；不会自行下载、安装、停止或替换当前程序。安装更新仍由小助手功能组件页面处理。旧主程序缺少 CLI 入口时明确报错，不假装已完成检查。
- Pet 接线进入 0.2.6 组件；小助手 CLI 源码提交为 `ed961c7e9c5dd49de86ef4e9003aae603bb66753`。用户本次仅要求 Pet 打包、推送两端源码，不生成小助手主程序安装包，主程序仍需后续构建才能提供新命令。本次不覆盖不可变 0.2.5 ZIP。Mac 共用相同 Rust/CLI 接线，实机未验收。
- Agent Skill `D:/ai/screen-automation/skills/screen-automation/SKILL.md` 已审阅，无需改动；此项为本机产品更新入口，不改变 Agent 工作流执行契约。
- 小助手修改仅 `runtime/cli.py` 与新增 `tests/test_component_update_cli.py`；其余工作区修改保留，未混入本轮功能。
- 验证：Pet 的 Windows 全套检查通过（137 项前端、31 项 Rust 测试）；小助手更新 CLI 与组件回归测试 30 项通过、4 项原有跳过。未将源码测试称为已安装程序的联网或 Mac 实机验收。

| 范围                                                    | 源码 / 素材状态                                        | 验收边界                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| Peek/Type、配置迁移、聊天 SVG、10% 透明度和“小助手”文案 | Windows/macOS 共用源码，已同步修改                     | 需在真实 Mac 运行检查                                                    |
| Mac 应用图标                                            | `src-tauri/icons/icon.icns` 已同步生成，配置引用已核对 | 尚未构建、安装或发布本轮 Mac 包                                          |
| Mac 菜单栏                                              | 两份单色模板已同步；现有模板模式保留                   | 浅色/深色菜单栏和 Retina 实际效果尚未验收                                |
| Windows 组件管理                                        | Windows/macOS 使用独立平台实现                         | Mac 使用远端已合入的 Unix socket 生命周期模块，不能误接 Windows 命名管道 |

## 四、本轮已有验证记录

这里记录本会话实际执行的检查范围。0.2.5 已完成 Windows release 构建、实际 ZIP 的 13 项组件验收和签名验签，交付文件哈希见 [0.2.5 交付记录](../PALDEE_PET_0.2.5_RELEASE.md)。源码提交还受仓库 pre-commit 全套检查约束。

- 全量前端测试曾通过：18 个文件、137 项；最后一次聊天文案修改另通过 Composer 的 5 项测试。
- Rust 测试曾通过：7 项单元测试、21 项集成测试；后续图标修改完成后，`cargo fmt --check`、`cargo check --offline` 通过。
- 本轮前端 `npm run build` 多次通过；最后两处“小助手”文案修改尚未另做生产构建。
- 动画按四帧、帧时长、哈希和变化范围检查；完整手部区域修正后逐帧查看了放下手时的残线。
- 52 个生成的应用图标与目标文件逐一核对；检查了 ICO 尺寸、ICNS 多尺寸、托盘尺寸和纯黑 RGB。
- 较早的调试 EXE 额外构建曾因运行中的 `paldee-pet.exe` 被占用而失败；不能把 `cargo check` 当作完成了安装包构建。
- 当前新增文档不代表已提交、推送、打包、部署或真实 Mac 验收。

## 五、以后修改与升级时怎样维护

1. 新增一项定制时，给它稳定编号，填写原因、文件、配置/资源路径、平台范围和验证结果；同一项后续修正更新原行，不保留互相矛盾的“当前方案”。
2. 提交后记录对应 commit；发布后另记录包版本及实际验收，不把源码状态写成发布状态。
3. 上游升级前先核对 [精确基线](SOURCE_BASELINES.md)，补齐缺失历史，再与明确的上游 commit 比较。不能将本地 HEAD、浅克隆起点或组件补丁基线冒充原上游。
4. 按 H/W 编号逐项检查是否仍需保留：独立文件通常保留，修改过的上游文件逐项合并；本轮删除的旧动画代码不要随合并意外恢复。
5. 图标、形象和源 SVG 必须一起管理；`dist/`、`src-tauri/target/` 是构建产物，不作为唯一源文件。重建入口见 [PALDEE_SYNC.md](PALDEE_SYNC.md)。
6. 合并后运行仓库要求的 `make all` 或 Windows 对应检查；完成 Windows/macOS 实机验收后，再更新本清单的验证状态。

当前工作区差异可以辅助核对，但以下命令不包含全部已提交定制，也不替代完整的上游比较：

```powershell
git diff 4ed0711cbd19d29341656317cb4e526bd59789d1 --name-status
git diff HEAD --name-status
git ls-files --others --exclude-standard
git diff HEAD -- src src-tauri scripts assets public docs
```
