# 开源基线、二次开发范围与升级同步

核对日期：2026-10-23。此日期是本次取证日期，不代表最初 fork 或最近升级日期。

本文件是当前基线入口，机器可读记录见 [source-baselines.json](source-baselines.json)。历史文档、组件版本和补丁导出基线不能代替这里记录的上游提交。只写版本号或“基于最新版”不足以复现，必须同时保留来源仓库、完整提交、取证方式及本地改动范围。

## 1. Paldee Pet 的原项目与精确基线

| 项目                           | 已核对的值                                             |
| ------------------------------ | ------------------------------------------------------ |
| 原作者上游                     | https://github.com/jubaoliang/OctopPet                 |
| 上游默认分支                   | master；仅代表本次核对时的分支名称                     |
| 当前 fork 共同祖先             | `4ed0711cbd19d29341656317cb4e526bd59789d1`             |
| 该上游提交的 package.json 版本 | `0.2.0`；未确认发行 tag，不能写成已验证的 `v0.2.0` tag |
| 自有 fork / origin             | https://github.com/xiaozs-com/paldee-pet.git           |
| 本次记录的 fork HEAD           | `185833a104a03bbc87fb485b467c55fd97115989`             |
| 该 HEAD 已提交的程序版本       | `0.2.5`                                                |
| 当前工作区版本                 | `0.2.6`，存在其他未提交开发改动；不代表已经提交或发布  |
| 本地历史                       | 浅克隆，尚未配置 upstream remote                       |

取证：GitHub 仓库元数据确认 parent/source 均为 `jubaoliang/OctopPet`；使用固定完整提交比较确认共同祖先，并读取该提交的 package.json。不能只凭 GitHub 上某提交可访问，就认定它在原作者分支中：fork 网络也可能共享提交对象。

- [上游固定源码](https://github.com/jubaoliang/OctopPet/tree/4ed0711cbd19d29341656317cb4e526bd59789d1)
- [固定提交比较](https://github.com/jubaoliang/OctopPet/compare/4ed0711cbd19d29341656317cb4e526bd59789d1...xiaozs-com:185833a104a03bbc87fb485b467c55fd97115989)

本地浅历史起点 `e0ded53e8f36f309e2b2105ef163824886e0da6a` 已包含自有修复，不应继续当作原作者的精确基线。组件快照的 `53b675dd424a372accfb1ea98ddcadbce9ab1813` 是本地组件补丁导出基线，也不是官方上游版本。

2026-10-23 已取回上述上游固定提交到本地，核对原版 Peek/Type 仍为手动选择；另合入远端四项 Mac 组件支持提交。逐项修改与兼容修复的保留边界见 [源码修改清单](SOURCE_CHANGES.md)。

Pet 现有本地扩展包括品牌/组件生命周期、聊天 CLI 桥接、太极形象与动画、Windows 兼容和打包。逐文件同步入口见 [PALDEE_SYNC.md](PALDEE_SYNC.md)。2026-10-23 已在 Pet 工程直接替换内置 peek/type 素材，默认 peek；未修改 Octop 服务器。重建脚本为 scripts/build_mascot_assets.py，来源和白色电脑 Logo 哈希见 public/mascots/mascot-assets.json。旧 taiji-bot 配置加载为 peek，独立选项及旧 SVG 动画已移除。

## 2. Octop 服务器与网页适配基线

| 项目                 | 已核对的值                                                               |
| -------------------- | ------------------------------------------------------------------------ |
| 原作者上游           | https://github.com/TencentCloud/Octop                                    |
| 源码版本 / tag       | `1.0.2` / `v1.0.2`                                                       |
| 留存源码归档对应提交 | `dd9dce470844c25d59effb50615bb3c667ea25cd`                               |
| 官方源码归档         | `https://codeload.github.com/TencentCloud/Octop/tar.gz/refs/tags/v1.0.2` |
| 归档 SHA256          | `b96d48634878796e4a2f147ec330b5705c028660ed27960ac3a3ffe640fcfd16`       |
| 服务器版本证据       | 用户于 2026-10-20 回传 Python 安装版本 `1.0.2`；本次未重新登录服务器核验 |

提交取自官方留存归档的全局 PAX `comment`，归档及原文件指纹见 JSON。对应 [固定源码](https://github.com/TencentCloud/Octop/tree/dd9dce470844c25d59effb50615bb3c667ea25cd)。这证明适配所审阅的源码身份，不代表服务器整个 PyPI 安装目录已经逐文件与该归档比对。

### 2.1 已实施：独立服务器桥接

独立仓库：`D:/ai/screen-automation-device-bridge`，https://github.com/xiaozs-com/screen-automation-device-bridge 。记录提交：`21d3b0d0b6bddd35ba260128f36be362c5f1cd26`。它是自有桥接工程，不是另一份 Octop 上游源码树。

| 改动对象                            | 改动及升级迁移点                                                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/octop/api/routers/chat/ws.py`  | 四处接线：导入 broker、接收结果、绑定已认证用户/专家/线程、断线清理。1.0.2 的实际变量为 `prepared_early`。保留上游访问与线程归属检查；共享专家不能退回所有者设备。 |
| `src/octop/infra/agents/manager.py` | 注册 `pd_helper_cli`；保留上游工具、插件、中间件及策略。运行时用户/线程身份不可由模型参数代替。                                                                    |
| `site-packages/pd_chat_bridge.py`   | 独立新增模块：用户/专家/线程路由与工具实现，不是 Octop 原有文件。                                                                                                  |
| `site-packages/pd_cli_proxy.py`     | 独立新增模块：CLI 参数、输入与文件传输、结果落地及私有专家旧代理兼容。                                                                                             |

原始文件 SHA256 存在 JSON 的 `octop.pristineFileSha256` 中。补丁后的文件不应与原始指纹相同；部署前后指纹及备份以实际 `install-records` 为准。不要用历史参考补丁整文件覆盖新版本。

最新安装、更新和回滚步骤以桥接仓库的 `SERVER_UPGRADE.md` 为准。这里及同目录旧 README 中的“只改 ws.py”“仅私有专家”“update_bridge.py 只更新模块”均是历史行为，不能用于当前共享版本。

验证边界：本地 52 项测试中 50 项通过、2 项跳过；用户回传单账号共享专家调用窗口列表成功。双账号分别连接真实电脑的隔离验收尚未完成。`cli status` 的 1 MiB 本机输出限制仍未修复。

### 2.2 已调查、尚未实施：网页默认配色

以下文件均基于上述 Octop `v1.0.2` 归档核对，本轮没有修改、构建或部署网页：

| 文件                                        | 后续自定义及升级检查点                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `dashboard/src/styles/themePalettes.ts`     | `DEFAULT_PALETTE` 原值 `rose`；`DEFAULT_CUSTOM_COLOR` 原值 `#4B74FA`。修改首次默认主色时从这里接入。 |
| `dashboard/src/styles/appearanceStorage.ts` | 无存储时默认跟随系统；保留已有浏览器选择和旧格式迁移。                                               |
| `dashboard/src/context/ThemeContext.tsx`    | 应用主题、调色板及自定义颜色；若上游变更加载流程，重新确认默认值是否仍被使用。                       |
| `dashboard/index.html`                      | 首屏明暗判断、加载背景及转圈样式；若自定义范围涉及这些内容，同步首屏与 React 加载后的效果。          |
| `dashboard/src/styles/theme-vars.css`       | 完整主题 CSS 变量；仅改默认主色通常不需要改此文件。                                                  |
| `Makefile` / `dashboard/vite.config.ts`     | `make build-frontend` 输出到 `src/octop/dashboard/`；部署前重新确认实际输出和服务读取位置。          |

“首次”指浏览器没有保存外观配置，不是每个账号首次登录。已有选择不得因默认值更新被强制覆盖。只部署网页资源时，不重装整个 Octop Python 包或覆盖已修补的桥接文件。

## 3. 以后每次同步必须补齐的记录

1. 保留工作区和未跟踪文件，记录同步前自有提交；查明目标上游版本、tag、完整提交、来源链接和原始文件指纹。Pet 与 Octop 分开处理，不能把一个项目的版本写成另一个项目的版本。
2. Pet 按 PALDEE_SYNC.md 在独立同步分支迁移；缺少历史时先补历史，不能用浅克隆起点猜共同祖先。保留原作者版权、许可证与内部数据/凭据标识。
3. Octop 桥接重新审阅两处系统文件以及用户/线程/工具接口；源码锚点匹配、语法通过并不等于运行兼容。网页自定义按上表少量迁移，不复制旧构建目录冒充新版本构建。
4. 记录“新上游原样 / 本地补丁后”的指纹、差异、备份路径、冲突处理、本地检查及实际部署验收。Pet 代码改动按 `make all` 或 Windows 等价检查；桥接测绑定块实际执行、真实工具注册、双用户路由、普通聊天和失败恢复；网页测全新浏览器默认值及已存选择不被覆盖。
5. 同步完成后同时更新本文件和 source-baselines.json 的版本、完整提交及验证状态。源码提交、推送、构建、部署、发布和真机验收分别记录，不互相替代。

每次同步记录至少包含：日期、项目、旧基线、新上游版本/tag/完整提交、同步前后自有提交、改动文件/迁移位置、原文件/补丁后指纹、备份、测试命令与结果、部署/真机结果、未完成项。
