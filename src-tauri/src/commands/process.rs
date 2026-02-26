use crate::blocker::process::{
    find_processes_by_name, get_running_apps, is_app_running, 
    kill_process, kill_processes_by_name, refresh_system
};
use crate::blocker::process::ProcessInfo;
use tauri::command;

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct ProcessResult {
    pub success: bool,
    pub message: String,
    pub processes: Option<Vec<ProcessInfo>>,
    pub killed_count: Option<u32>,
}

#[command]
pub async fn check_processes(names: Vec<String>) -> Result<ProcessResult, String> {
    refresh_system();
    let running = get_running_apps(&names);
    
    Ok(ProcessResult {
        success: true,
        message: format!("Found {} running processes", running.len()),
        processes: Some(running),
        killed_count: None,
    })
}

#[command]
pub async fn kill_process_cmd(pid: u32) -> Result<ProcessResult, String> {
    let success = kill_process(pid);
    
    Ok(ProcessResult {
        success,
        message: if success {
            format!("Successfully killed process {}", pid)
        } else {
            format!("Failed to kill process {}", pid)
        },
        processes: None,
        killed_count: if success { Some(1) } else { Some(0) },
    })
}

#[command]
pub async fn kill_app_processes(name: String) -> Result<ProcessResult, String> {
    let count = kill_processes_by_name(&name);
    
    Ok(ProcessResult {
        success: true,
        message: format!("Killed {} instances of {}", count, name),
        processes: None,
        killed_count: Some(count),
    })
}

#[command]
pub async fn is_app_running_cmd(name: String) -> Result<ProcessResult, String> {
    let running = is_app_running(&name);
    
    Ok(ProcessResult {
        success: true,
        message: if running {
            format!("{} is running", name)
        } else {
            format!("{} is not running", name)
        },
        processes: None,
        killed_count: None,
    })
}

#[command]
pub async fn find_processes_cmd(name: String) -> Result<ProcessResult, String> {
    let processes = find_processes_by_name(&name);
    
    Ok(ProcessResult {
        success: true,
        message: format!("Found {} processes matching '{}'", processes.len(), name),
        processes: Some(processes),
        killed_count: None,
    })
}
