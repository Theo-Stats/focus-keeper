use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::command;

static LOCK_STATE: Lazy<Mutex<LockState>> = Lazy::new(|| {
    Mutex::new(LockState::load())
});

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LockState {
    password_hash: Option<String>,
    is_locked: bool,
    lock_end_time: Option<u64>,
}

impl LockState {
    fn load() -> Self {
        let config_path = get_config_path();
        if let Ok(content) = fs::read_to_string(&config_path) {
            if let Ok(state) = serde_json::from_str(&content) {
                return state;
            }
        }
        LockState {
            password_hash: None,
            is_locked: false,
            lock_end_time: None,
        }
    }

    fn save(&self) -> Result<(), String> {
        let config_path = get_config_path();
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let content = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        fs::write(&config_path, content).map_err(|e| e.to_string())?;
        Ok(())
    }
}

fn get_config_path() -> PathBuf {
    let app_data = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    PathBuf::from(app_data).join("focus-keeper").join("lock-config.json")
}

fn hash_password(password: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    let salted = format!("focus_keeper_salt_2024{}", password);
    salted.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LockResult {
    pub success: bool,
    pub message: String,
}

impl LockResult {
    fn success(msg: &str) -> Self {
        LockResult { success: true, message: msg.to_string() }
    }
    
    fn error(msg: &str) -> Self {
        LockResult { success: false, message: msg.to_string() }
    }
}

#[command]
pub async fn has_password() -> Result<bool, String> {
    let state = LOCK_STATE.lock().map_err(|e| e.to_string())?;
    Ok(state.password_hash.is_some())
}

#[command]
pub async fn set_password(password: String) -> Result<LockResult, String> {
    if password.len() < 4 {
        return Ok(LockResult::error("密码至少需要 4 位"));
    }
    
    let mut state = LOCK_STATE.lock().map_err(|e| e.to_string())?;
    state.password_hash = Some(hash_password(&password));
    state.save()?;
    Ok(LockResult::success("密码设置成功"))
}

#[command]
pub async fn verify_password(password: String) -> Result<LockResult, String> {
    let state = LOCK_STATE.lock().map_err(|e| e.to_string())?;
    
    match &state.password_hash {
        None => Ok(LockResult::error("未设置密码")),
        Some(hash) => {
            if hash_password(&password) == *hash {
                Ok(LockResult::success("验证成功"))
            } else {
                Ok(LockResult::error("密码错误"))
            }
        }
    }
}

#[command]
pub async fn change_password(old_password: String, new_password: String) -> Result<LockResult, String> {
    if new_password.len() < 4 {
        return Ok(LockResult::error("新密码至少需要 4 位"));
    }
    
    let mut state = LOCK_STATE.lock().map_err(|e| e.to_string())?;
    
    match &state.password_hash {
        None => Ok(LockResult::error("未设置密码")),
        Some(hash) => {
            if hash_password(&old_password) != *hash {
                return Ok(LockResult::error("原密码错误"));
            }
            state.password_hash = Some(hash_password(&new_password));
            state.save()?;
            Ok(LockResult::success("密码修改成功"))
        }
    }
}

#[command]
pub async fn lock_focus(minutes: u64) -> Result<LockResult, String> {
    let mut state = LOCK_STATE.lock().map_err(|e| e.to_string())?;
    
    if state.password_hash.is_none() {
        return Ok(LockResult::error("请先设置密码"));
    }
    
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();
    
    state.is_locked = true;
    state.lock_end_time = Some(now + minutes * 60);
    state.save()?;
    
    Ok(LockResult::success(&format!("已锁定 {} 分钟", minutes)))
}

#[command]
pub async fn unlock(password: String) -> Result<LockResult, String> {
    let mut state = LOCK_STATE.lock().map_err(|e| e.to_string())?;
    
    if !state.is_locked {
        return Ok(LockResult::success("当前未锁定"));
    }
    
    // 检查是否超时
    if let Some(end_time) = state.lock_end_time {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_secs();
        
        if now >= end_time {
            state.is_locked = false;
            state.lock_end_time = None;
            state.save()?;
            return Ok(LockResult::success("锁定已自动解除"));
        }
    }
    
    match &state.password_hash {
        None => Ok(LockResult::error("未设置密码")),
        Some(hash) => {
            if hash_password(&password) == *hash {
                state.is_locked = false;
                state.lock_end_time = None;
                state.save()?;
                Ok(LockResult::success("解锁成功"))
            } else {
                Ok(LockResult::error("密码错误"))
            }
        }
    }
}

#[command]
pub async fn get_lock_state() -> Result<LockStateInfo, String> {
    let state = LOCK_STATE.lock().map_err(|e| e.to_string())?;
    
    let remaining_seconds = if let Some(end_time) = state.lock_end_time {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_secs();
        
        if now < end_time && state.is_locked {
            Some(end_time - now)
        } else {
            None
        }
    } else {
        None
    };
    
    Ok(LockStateInfo {
        is_locked: state.is_locked && remaining_seconds.is_some(),
        remaining_seconds,
        has_password: state.password_hash.is_some(),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LockStateInfo {
    pub is_locked: bool,
    pub remaining_seconds: Option<u64>,
    pub has_password: bool,
}

pub fn is_currently_locked() -> bool {
    let state = LOCK_STATE.lock().map_err(|e| e.to_string()).unwrap();
    
    if !state.is_locked {
        return false;
    }
    
    if let Some(end_time) = state.lock_end_time {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| e.to_string())
            .unwrap()
            .as_secs();
        return now < end_time;
    }
    
    false
}
