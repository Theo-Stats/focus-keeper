use tauri::{command, AppHandle, Manager, Emitter};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use tokio::time::{sleep, Duration};
use once_cell::sync::Lazy;

static FOCUS_RUNNING: Lazy<Arc<AtomicBool>> = Lazy::new(|| Arc::new(AtomicBool::new(false)));
static FOCUS_ELAPSED: Lazy<Arc<AtomicU64>> = Lazy::new(|| Arc::new(AtomicU64::new(0)));
static FOCUS_TARGET: Lazy<Arc<AtomicU64>> = Lazy::new(|| Arc::new(AtomicU64::new(25 * 60)));

#[derive(Clone, serde::Serialize)]
pub struct FocusState {
    pub is_running: bool,
    pub elapsed: u64,
    pub target: u64,
    pub is_strict_mode: bool,
}

#[derive(Clone, serde::Serialize)]
pub struct FocusCompletePayload {
    pub duration: u64,
}

#[command]
pub async fn start_focus(target_minutes: u32, strict_mode: bool) -> Result<FocusState, String> {
    if FOCUS_RUNNING.load(Ordering::SeqCst) {
        return Ok(FocusState {
            is_running: true,
            elapsed: FOCUS_ELAPSED.load(Ordering::SeqCst),
            target: FOCUS_TARGET.load(Ordering::SeqCst),
            is_strict_mode: strict_mode,
        });
    }

    FOCUS_ELAPSED.store(0, Ordering::SeqCst);
    FOCUS_TARGET.store(target_minutes as u64 * 60, Ordering::SeqCst);
    FOCUS_RUNNING.store(true, Ordering::SeqCst);

    Ok(FocusState {
        is_running: true,
        elapsed: 0,
        target: target_minutes as u64 * 60,
        is_strict_mode,
    })
}

#[command]
pub async fn pause_focus() -> Result<FocusState, String> {
    FOCUS_RUNNING.store(false, Ordering::SeqCst);
    
    Ok(FocusState {
        is_running: false,
        elapsed: FOCUS_ELAPSED.load(Ordering::SeqCst),
        target: FOCUS_TARGET.load(Ordering::SeqCst),
        is_strict_mode: false,
    })
}

#[command]
pub async fn resume_focus() -> Result<FocusState, String> {
    if FOCUS_ELAPSED.load(Ordering::SeqCst) >= FOCUS_TARGET.load(Ordering::SeqCst) {
        FOCUS_ELAPSED.store(0, Ordering::SeqCst);
    }
    FOCUS_RUNNING.store(true, Ordering::SeqCst);
    
    Ok(FocusState {
        is_running: true,
        elapsed: FOCUS_ELAPSED.load(Ordering::SeqCst),
        target: FOCUS_TARGET.load(Ordering::SeqCst),
        is_strict_mode: true,
    })
}

#[command]
pub async fn stop_focus() -> Result<FocusState, String> {
    FOCUS_RUNNING.store(false, Ordering::SeqCst);
    let elapsed = FOCUS_ELAPSED.load(Ordering::SeqCst);
    FOCUS_ELAPSED.store(0, Ordering::SeqCst);
    
    Ok(FocusState {
        is_running: false,
        elapsed,
        target: FOCUS_TARGET.load(Ordering::SeqCst),
        is_strict_mode: false,
    })
}

#[command]
pub async fn get_focus_state() -> Result<FocusState, String> {
    Ok(FocusState {
        is_running: FOCUS_RUNNING.load(Ordering::SeqCst),
        elapsed: FOCUS_ELAPSED.load(Ordering::SeqCst),
        target: FOCUS_TARGET.load(Ordering::SeqCst),
        is_strict_mode: false,
    })
}

#[command]
pub async fn run_focus_timer(app: AppHandle) -> Result<(), String> {
    while FOCUS_RUNNING.load(Ordering::SeqCst) {
        sleep(Duration::from_secs(1)).await;
        
        if FOCUS_RUNNING.load(Ordering::SeqCst) {
            FOCUS_ELAPSED.fetch_add(1, Ordering::SeqCst);
            
            let elapsed = FOCUS_ELAPSED.load(Ordering::SeqCst);
            let target = FOCUS_TARGET.load(Ordering::SeqCst);
            
            let _ = app.emit("focus-tick", FocusState {
                is_running: true,
                elapsed,
                target,
                is_strict_mode: true,
            });

            if elapsed >= target {
                FOCUS_RUNNING.store(false, Ordering::SeqCst);
                
                let _ = app.emit("focus-complete", FocusCompletePayload {
                    duration: elapsed,
                });
                
                break;
            }
        }
    }
    
    Ok(())
}

pub fn is_focus_running() -> bool {
    FOCUS_RUNNING.load(Ordering::SeqCst)
}

pub fn get_elapsed_seconds() -> u64 {
    FOCUS_ELAPSED.load(Ordering::SeqCst)
}

pub fn is_strict_mode() -> bool {
    FOCUS_RUNNING.load(Ordering::SeqCst)
}
