# Paldee Pet 0.2.4 Windows x64 交付

2026-10-14。本版在原功能组件格式中加入只读诊断脚本与双击入口，不修改小助手主程序、服务器桥接或全局目录，不包含 Windows x86。

新增 `diagnose-pet-windows.ps1`、`diagnose-pet-windows.cmd`；打包器复制二者并验证存在，组件验收白名单同步更新。诊断输出系统、显卡、Pet 进程/窗口位置与宠物布局配置，不读取密码或聊天内容，不上传，不修改配置。兼容 Windows PowerShell 5.1；读取独立用户数据目录，支持 OCTOPPET_DATA_DIR 隔离。

正式 ZIP：`D:/ai/xiaozs.com/xiaozs/sah/components/paldee-pet/0.2.4/paldee-pet-0.2.4-windows-x64.zip`，15,428,493 字节，SHA-256 `4473d326469db57e84f36b34fbd9b4aca09f60d80d38605b77cbba924dcab449`。

签名清单：`D:/ai/xiaozs.com/xiaozs/sah/components/paldee-pet/latest-windows-x64.json`，637 字节，SHA-256 `5da57d35b3073c4e2039d3e11efa2e7537f6c84d66559ecd76327b5fc1f075f5`。使用既有产品密钥，公钥验签通过；未创建或复制私钥。未签名清单保存在组件构建目录，签名验证报告保存在 `D:/ai/xiaozs.com/component-release-staging/paldee-pet-0.2.4/signing-verification.json`。

上传顺序：先 ZIP 到 `/www/wwwroot/xiaozs/sah/components/paldee-pet/0.2.4/`，再 latest 清单到 `/www/wwwroot/xiaozs/sah/components/paldee-pet/`。不上传 catalog-entry.json 或未签名清单，不修改 catalog.json 或 Cua 文件。旧 0.2.3 保留。

最终 ZIP 13 项真实验收通过：诊断工具在中文及空格路径运行、只读配置、入口/许可证/架构/元数据/哈希、重复和并发启动、正常停止、异常退出、显示/隐藏、超时及卸载后用户数据保留。旧笔记本透明宠物不显示的根因仍待该电脑诊断，不宣称本版修复了此问题。

用户更新组件后，在组件版本目录双击 `diagnose-pet-windows.cmd`，复制输出即可继续排查。不自动上传、推送或发布。
