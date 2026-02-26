use chrono::{DateTime, Local, Datelike};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use once_cell::sync::Lazy;
use std::sync::Mutex;
use tauri::command;

static STATS_FILE: Lazy<Mutex<Option<PathBuf>>> = Lazy::new(|| Mutex::new(None));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyStats {
    pub date: String,
    pub focus_duration_seconds: u64,
    pub block_count: u64,
    pub websites_blocked: u64,
    pub apps_blocked: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatsData {
    pub today: DailyStats,
    pub total_focus_seconds: u64,
    pub total_blocks: u64,
}

impl Default for DailyStats {
    fn default() -> Self {
        DailyStats {
            date: Local::now().format("%Y-%m-%d").to_string(),
            focus_duration_seconds: 0,
            block_count: 0,
            websites_blocked: 0,
            apps_blocked: 0,
        }
    }
}

fn get_stats_path() -> PathBuf {
    if let Some(path) = STATS_FILE.lock().unwrap().clone() {
        return path;
    }

    let path = dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("FocusKeeper")
        .join("stats.json");

    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    *STATS_FILE.lock().unwrap() = Some(path.clone());
    path
}

fn load_stats() -> StatsData {
    let path = get_stats_path();
    
    if let Ok(content) = fs::read_to_string(&path) {
        if let Ok(data) = serde_json::from_str::<StatsData>(&content) {
            let today = Local::now().format("%Y-%m-%d").to_string();
            if data.today.date == today {
                return data;
            }
        }
    }

    StatsData {
        today: DailyStats::default(),
        total_focus_seconds: 0,
        total_blocks: 0,
    }
}

fn save_stats(data: &StatsData) -> std::io::Result<()> {
    let path = get_stats_path();
    let content = serde_json::to_string_pretty(data)?;
    fs::write(path, content)
}

#[command]
pub async fn get_stats() -> Result<StatsData, String> {
    Ok(load_stats())
}

#[command]
pub async fn add_focus_time(seconds: u64) -> Result<StatsData, String> {
    let mut data = load_stats();
    data.today.focus_duration_seconds += seconds;
    data.total_focus_seconds += seconds;
    save_stats(&data).map_err(|e| e.to_string())?;
    Ok(data)
}

#[command]
pub async fn add_block(website: bool) -> Result<StatsData, String> {
    let mut data = load_stats();
    data.today.block_count += 1;
    data.total_blocks += 1;
    if website {
        data.today.websites_blocked += 1;
    } else {
        data.today.apps_blocked += 1;
    }
    save_stats(&data).map_err(|e| e.to_string())?;
    Ok(data)
}

#[command]
pub async fn reset_stats() -> Result<StatsData, String> {
    let data = StatsData {
        today: DailyStats::default(),
        total_focus_seconds: 0,
        total_blocks: 0,
    };
    save_stats(&data).map_err(|e| e.to_string())?;
    Ok(data)
}

#[command]
pub async fn get_focus_duration() -> Result<u64, String> {
    Ok(load_stats().today.focus_duration_seconds)
}

#[command]
pub async fn get_block_count() -> Result<u64, String> {
    Ok(load_stats().today.block_count)
}

pub fn format_duration(seconds: u64) -> String {
    let hours = seconds / 3600;
    let minutes = (seconds % 3600) / 60;
    let secs = seconds % 60;
    
    if hours > 0 {
        format!("{}h {}m {}s", hours, minutes, secs)
    } else if minutes > 0 {
        format!("{}m {}s", minutes, secs)
    } else {
        format!("{}s", secs)
    }
}
