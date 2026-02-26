mod blocker;
mod commands;

use commands::{hosts, process, stats, focus, lock};
use tauri::menu::{Menu, MenuItem};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                let hide_item = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
                let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
                let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                
                let menu = Menu::with_items(app, &[&hide_item, &show_item, &quit_item])?;
                app.set_menu(Some(menu))?;
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            app.handle().plugin(tauri_plugin_log::Builder::default().build())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            hosts::get_blocked_websites,
            hosts::add_website,
            hosts::remove_website,
            hosts::block_websites,
            hosts::unblock_all,
            process::check_processes,
            process::kill_process_cmd,
            process::kill_app_processes,
            process::is_app_running_cmd,
            process::find_processes_cmd,
            stats::get_stats,
            stats::add_focus_time,
            stats::add_block,
            stats::reset_stats,
            stats::get_focus_duration,
            stats::get_block_count,
            focus::start_focus,
            focus::pause_focus,
            focus::resume_focus,
            focus::stop_focus,
            focus::get_focus_state,
            lock::has_password,
            lock::set_password,
            lock::verify_password,
            lock::change_password,
            lock::lock_focus,
            lock::unlock,
            lock::get_lock_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
