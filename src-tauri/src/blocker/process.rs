use sysinfo::{ProcessExt, System, SystemExt};
use std::sync::Mutex;
use once_cell::sync::Lazy;

static SYSTEM: Lazy<Mutex<System>> = Lazy::new(|| {
    let mut sys = System::new_all();
    sys.refresh_all();
    Mutex::new(sys)
});

#[derive(Debug, Clone)]
pub struct ProcessInfo {
    pub name: String,
    pub pid: u32,
    pub exe: Option<String>,
}

pub fn refresh_system() {
    let mut sys = SYSTEM.lock().unwrap();
    sys.refresh_all();
}

pub fn find_processes_by_name(name: &str) -> Vec<ProcessInfo> {
    let sys = SYSTEM.lock().unwrap();
    let mut processes = Vec::new();

    let name_lower = name.to_lowercase();

    for (pid, process) in sys.processes() {
        let process_name = process.name().to_lowercase();
        if process_name.contains(&name_lower) || process_name == name_lower {
            processes.push(ProcessInfo {
                name: process.name().to_string(),
                pid: pid.as_u32(),
                exe: process.exe().map(|p| p.to_string_lossy().to_string()),
            });
        }
    }

    processes
}

pub fn kill_process(pid: u32) -> bool {
    let mut sys = SYSTEM.lock().unwrap();
    if let Some(process) = sys.process(sysinfo::Pid::from_u32(pid)) {
        process.kill()
    } else {
        false
    }
}

pub fn kill_processes_by_name(name: &str) -> u32 {
    let processes = find_processes_by_name(name);
    let mut killed_count = 0u32;

    for process in processes {
        if kill_process(process.pid) {
            killed_count += 1;
        }
    }

    killed_count
}

pub fn get_running_apps(app_names: &[String]) -> Vec<ProcessInfo> {
    refresh_system();
    let mut running = Vec::new();

    for app_name in app_names {
        let processes = find_processes_by_name(app_name);
        running.extend(processes);
    }

    running
}

pub fn is_app_running(name: &str) -> bool {
    !find_processes_by_name(name).is_empty()
}

pub fn get_all_running_processes() -> Vec<ProcessInfo> {
    let sys = SYSTEM.lock().unwrap();
    let mut processes = Vec::new();

    for (pid, process) in sys.processes() {
        processes.push(ProcessInfo {
            name: process.name().to_string(),
            pid: pid.as_u32(),
            exe: process.exe().map(|p| p.to_string_lossy().to_string()),
        });
    }

    processes
}

pub fn get_process_count() -> usize {
    let sys = SYSTEM.lock().unwrap();
    sys.processes().len()
}
