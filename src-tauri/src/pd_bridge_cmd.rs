//! Thin adapter to the independently installed helper CLI transport.
use serde_json::Value;
use std::{
    io::{Read, Write},
    path::PathBuf,
    process::{Command, Stdio},
    time::{Duration, Instant},
};

fn component_entry() -> Result<PathBuf, String> {
    // The PD CLI bridge is packaged as `pd-device-bridge.exe` on Windows and a
    // bare `pd-device-bridge` Mach-O on macOS (see package_pd_component*.py).
    #[cfg(windows)]
    const BRIDGE_NAME: &str = "pd-device-bridge.exe";
    #[cfg(not(windows))]
    const BRIDGE_NAME: &str = "pd-device-bridge";
    #[cfg(debug_assertions)]
    if let Some(path) = std::env::var_os("PD_BRIDGE_COMPONENT_EXE") {
        let path = PathBuf::from(path);
        if path.is_absolute() && path.is_file() {
            return Ok(path);
        }
        return Err("开发组件路径无效".into());
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(directory) = exe.parent() {
            let metadata_path = directory.join("component.json");
            if metadata_path.is_file() {
                let metadata: Value = serde_json::from_slice(
                    &std::fs::read(metadata_path).map_err(|_| "宠物组件记录不可读")?,
                )
                .map_err(|_| "宠物组件记录无效")?;
                if metadata["id"] != "octoppet" || metadata["protocol"] != "octoppet-component@1" {
                    return Err("宠物组件协议不兼容".into());
                }
                let path = directory.join(BRIDGE_NAME);
                return path
                    .is_file()
                    .then_some(path)
                    .ok_or("宠物包中的 CLI 桥接缺失".into());
            }
        }
    }
    let root = std::env::var_os("SCREEN_AUTOMATION_HOME")
        .map(PathBuf::from)
        .or_else(|| {
            std::env::var_os("USERPROFILE")
                .map(|p| PathBuf::from(p).join("Xiaozs/ScreenAutomationHelper"))
        })
        .ok_or("无法定位 PD 组件目录")?;
    let root = root.join("components/pd-device-bridge");
    let current: Value = serde_json::from_slice(
        &std::fs::read(root.join("current.json")).map_err(|_| "尚未安装 PD 桥接组件")?,
    )
    .map_err(|_| "PD 组件记录无效")?;
    let version = current
        .get("version")
        .and_then(Value::as_str)
        .ok_or("PD 组件版本无效")?;
    if !valid_version(version) {
        return Err("PD 组件版本无效".into());
    }
    let path = root.join("versions").join(version).join(BRIDGE_NAME);
    if !path.is_file() {
        return Err("PD 桥接组件入口缺失".into());
    }
    Ok(path)
}

#[tauri::command]
pub async fn pd_execute_cli(
    window: tauri::WebviewWindow,
    args: Vec<String>,
    input: Option<Value>,
) -> Result<Value, String> {
    if window.label() != "chat" {
        return Err("本机 CLI 仅允许从聊天窗口调用".into());
    }
    execute_cli(args, input).await
}

async fn execute_cli(args: Vec<String>, input: Option<Value>) -> Result<Value, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if !valid_cli_args(&args) {
            return Err("CLI 参数格式无效".into());
        }
        let mut command = Command::new(component_entry()?);
        let payload = if let Some(input) = input {
            if !input.is_object() {
                return Err("CLI 输入格式无效".into());
            }
            let bytes = serde_json::to_vec(&serde_json::json!({"args":args,"input":input}))
                .map_err(|_| "CLI 输入序列化失败")?;
            if bytes.len() > 8 * 1024 * 1024 {
                return Err("CLI 输入超过 8 MiB".into());
            }
            command.arg("--request-json");
            Some(bytes)
        } else {
            command.args(&args);
            None
        };
        command
            .stdin(if payload.is_some() {
                Stdio::piped()
            } else {
                Stdio::null()
            })
            .stdout(Stdio::piped())
            .stderr(Stdio::null());
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x08000000);
        }
        let mut child = command.spawn().map_err(|_| "本机桥接组件启动失败")?;
        let writer = payload.map(|bytes| {
            let mut stdin = child.stdin.take().expect("piped CLI input");
            std::thread::spawn(move || stdin.write_all(&bytes))
        });
        let stdout = child.stdout.take().ok_or("本机输出不可用")?;
        let reader = std::thread::spawn(move || {
            let mut bytes = Vec::new();
            stdout
                .take(16 * 1024 * 1024 + 1)
                .read_to_end(&mut bytes)
                .map(|_| bytes)
        });
        let deadline = Instant::now() + Duration::from_secs(70);
        loop {
            match child.try_wait() {
                Ok(Some(_)) => break,
                Ok(None) if Instant::now() < deadline => {
                    std::thread::sleep(Duration::from_millis(25))
                }
                _ => {
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err("本机 CLI 调用超时".into());
                }
            }
        }
        if let Some(writer) = writer {
            let _ = writer.join();
        }
        let output = reader
            .join()
            .map_err(|_| "本机输出读取失败")?
            .map_err(|_| "本机输出读取失败")?;
        if output.len() > 16 * 1024 * 1024 {
            return Err("本机 CLI 结果过大".into());
        }
        let result: Value = serde_json::from_slice(&output).map_err(|_| "本机桥接结果格式无效")?;
        Ok(result)
    })
    .await
    .map_err(|_| "本机 CLI 线程异常".to_string())?
}

fn valid_version(version: &str) -> bool {
    let parts: Vec<_> = version.split('.').collect();
    parts.len() == 3
        && parts
            .iter()
            .all(|part| !part.is_empty() && part.bytes().all(|byte| byte.is_ascii_digit()))
}

pub async fn check_pet_component_update() -> Result<String, String> {
    let args = ["cli", "components", "check-update", "octoppet"]
        .map(String::from)
        .to_vec();
    component_update_message(&execute_cli(args, None).await?)
}

fn component_update_message(result: &Value) -> Result<String, String> {
    if result["ok"] != true || result["exit_code"] != 0 {
        if let Some(error) = result["stdout"]
            .as_str()
            .and_then(|text| serde_json::from_str::<Value>(text).ok())
            .and_then(|payload| payload["error"].as_str().map(String::from))
        {
            return Err(error);
        }
        return Err(format!(
            "小助手组件更新检查不可用，请确认主程序已更新且可用。\n{}",
            result["error"]
                .as_str()
                .or(result["stderr"].as_str())
                .unwrap_or("")
                .chars()
                .take(300)
                .collect::<String>()
        ));
    }
    let payload: Value = serde_json::from_str(result["stdout"].as_str().unwrap_or(""))
        .map_err(|_| "小助手更新检查返回格式无效".to_string())?;
    if payload["ok"] != true {
        return Err(payload["error"]
            .as_str()
            .unwrap_or("小助手组件更新检查失败")
            .into());
    }
    let update = &payload["update"];
    if update["component_id"] != "octoppet" {
        return Err("小助手更新检查返回的组件不匹配".into());
    }
    let latest = update["latest_version"]
        .as_str()
        .filter(|s| !s.is_empty())
        .ok_or("小助手未返回可用版本")?;
    let current = update["current_version"]
        .as_str()
        .ok_or("小助手未返回组件安装状态")?;
    if current.is_empty() {
        return Ok(format!(
            "小助手尚未安装此组件，可用版本 V{latest}。\n请在小助手“功能组件”页面安装 Paldee Pet。"
        ));
    }
    if update["update_available"] == true {
        Ok(format!("发现新版本 V{latest}（已安装 V{current}）。\n请在小助手“功能组件”页面更新 Paldee Pet。"))
    } else if update["up_to_date"] == true {
        Ok(format!(
            "小助手中已安装的 Paldee Pet V{current} 已是最新版本。"
        ))
    } else {
        Err("小助手未返回有效的版本比较结果".into())
    }
}

#[cfg(test)]
mod component_update_tests {
    use super::component_update_message;
    use serde_json::{json, Value};

    fn response(update: Value) -> Value {
        json!({"ok":true,"exit_code":0,"stdout":json!({"ok":true,"update":update}).to_string()})
    }

    #[test]
    fn displays_the_helpers_installed_and_available_versions() {
        let message = component_update_message(&response(json!({"component_id":"octoppet",
            "current_version":"0.2.5","latest_version":"0.2.6","update_available":true})))
        .unwrap();
        assert!(message.contains("新版本 V0.2.6"));
        assert!(message.contains("已安装 V0.2.5"));
    }

    #[test]
    fn distinguishes_current_from_uninstalled() {
        let current = component_update_message(&response(json!({"component_id":"octoppet",
            "current_version":"0.2.5","latest_version":"0.2.5","up_to_date":true})))
        .unwrap();
        assert!(current.contains("已是最新版本"));
        let missing = component_update_message(&response(json!({"component_id":"octoppet",
            "current_version":"","latest_version":"0.2.5"})))
        .unwrap();
        assert!(missing.contains("尚未安装"));
    }

    #[test]
    fn rejects_failed_checks_and_mismatched_components() {
        assert!(component_update_message(
            &json!({"ok":true,"exit_code":2,"stderr":"unsupported command"})
        )
        .is_err());
        assert!(component_update_message(
            &json!({"ok":true,"exit_code":1,"stdout":r#"{"ok":false,"error":"清单签名无效"}"#})
        )
        .unwrap_err()
        .contains("签名"));
        assert!(component_update_message(&response(json!({"component_id":"other"}))).is_err());
    }
}

#[cfg(test)]
mod tests {
    use super::valid_version;
    #[test]
    fn component_versions_cannot_escape_the_version_directory() {
        assert!(valid_version("0.1.0"));
        for value in ["..", "../0.1.0", "0..1", "C:/tmp", "", "0.1.0/other"] {
            assert!(!valid_version(value));
        }
    }
}

fn valid_cli_args(args: &[String]) -> bool {
    if args.is_empty()
        || args.len() > 128
        || !matches!(args[0].as_str(), "cli" | "browser")
        || args.iter().any(|a| a.len() > 4096 || a.contains('\0'))
    {
        return false;
    }
    true
}

#[cfg(test)]
mod cli_tests {
    use super::valid_cli_args;
    #[test]
    fn all_helper_subcommands_are_allowed() {
        assert!(valid_cli_args(
            &["cli", "workflow", "schema"].map(String::from)
        ));
        assert!(valid_cli_args(
            &["cli", "future-command", "--help"].map(String::from)
        ));
        for args in [
            vec!["bash", "-c", "run"],
            vec!["powershell", "-Command", "run"],
            vec!["cmd", "/c", "run"],
        ] {
            assert!(!valid_cli_args(
                &args.into_iter().map(String::from).collect::<Vec<_>>()
            ));
        }
        assert!(valid_cli_args(
            &["browser", "status"]
                .into_iter()
                .map(String::from)
                .collect::<Vec<_>>()
        ));
        assert!(valid_cli_args(
            &["cli", "browser", "status"]
                .into_iter()
                .map(String::from)
                .collect::<Vec<_>>()
        ));
        assert!(valid_cli_args(
            &["cli", "window", "list-visible"]
                .into_iter()
                .map(String::from)
                .collect::<Vec<_>>()
        ));
    }
}
