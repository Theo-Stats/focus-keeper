use crate::blocker::hosts::{
    add_blocked_website, add_blocked_websites, clear_all_blocks, 
    read_blocked_websites, remove_blocked_website
};
use crate::commands::lock::is_currently_locked;
use tauri::command;

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct HostsResult {
    pub success: bool,
    pub message: String,
    pub data: Option<Vec<String>>,
}

#[command]
pub async fn get_blocked_websites() -> Result<HostsResult, String> {
    match read_blocked_websites() {
        Ok(websites) => Ok(HostsResult {
            success: true,
            message: "Successfully retrieved blocked websites".to_string(),
            data: Some(websites),
        }),
        Err(e) => Ok(HostsResult {
            success: false,
            message: e.to_string(),
            data: None,
        }),
    }
}

#[command]
pub async fn add_website(domain: String) -> Result<HostsResult, String> {
    if is_currently_locked() {
        return Ok(HostsResult {
            success: false,
            message: "当前处于锁定模式，无法修改屏蔽列表".to_string(),
            data: None,
        });
    }
    match add_blocked_website(&domain) {
        Ok(()) => Ok(HostsResult {
            success: true,
            message: format!("Successfully blocked {}", domain),
            data: None,
        }),
        Err(e) => Ok(HostsResult {
            success: false,
            message: e.to_string(),
            data: None,
        }),
    }
}

#[command]
pub async fn remove_website(domain: String) -> Result<HostsResult, String> {
    if is_currently_locked() {
        return Ok(HostsResult {
            success: false,
            message: "当前处于锁定模式，无法修改屏蔽列表".to_string(),
            data: None,
        });
    }
    match remove_blocked_website(&domain) {
        Ok(()) => Ok(HostsResult {
            success: true,
            message: format!("Successfully unblocked {}", domain),
            data: None,
        }),
        Err(e) => Ok(HostsResult {
            success: false,
            message: e.to_string(),
            data: None,
        }),
    }
}

#[command]
pub async fn block_websites(domains: Vec<String>) -> Result<HostsResult, String> {
    match add_blocked_websites(&domains) {
        Ok(()) => Ok(HostsResult {
            success: true,
            message: format!("Successfully blocked {} websites", domains.len()),
            data: None,
        }),
        Err(e) => Ok(HostsResult {
            success: false,
            message: e.to_string(),
            data: None,
        }),
    }
}

#[command]
pub async fn unblock_all() -> Result<HostsResult, String> {
    if is_currently_locked() {
        return Ok(HostsResult {
            success: false,
            message: "当前处于锁定模式，无法修改屏蔽列表".to_string(),
            data: None,
        });
    }
    match clear_all_blocks() {
        Ok(()) => Ok(HostsResult {
            success: true,
            message: "Successfully unblocked all websites".to_string(),
            data: None,
        }),
        Err(e) => Ok(HostsResult {
            success: false,
            message: e.to_string(),
            data: None,
        }),
    }
}
