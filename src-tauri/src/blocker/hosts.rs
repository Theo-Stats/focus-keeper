use std::fs::{self, OpenOptions};
use std::io::{Read, Write, BufRead, BufReader};
use std::path::Path;
use thiserror::Error;

#[cfg(target_os = "windows")]
const HOSTS_PATH: &str = r"C:\Windows\System32\drivers\etc\hosts";

#[cfg(target_os = "linux")]
const HOSTS_PATH: &str = "/etc/hosts";

#[cfg(target_os = "macos")]
const HOSTS_PATH: &str = "/etc/hosts";

#[derive(Error, Debug)]
pub enum HostsError {
    #[error("Failed to read hosts file: {0}")]
    ReadError(std::io::Error),
    #[error("Failed to write hosts file: {0}")]
    WriteError(std::io::Error),
    #[error("Permission denied: {0}")]
    PermissionError(String),
}

const BLOCK_COMMENT: &str = "# Focus Keeper Block";

pub fn get_hosts_path() -> String {
    HOSTS_PATH.to_string()
}

pub fn read_blocked_websites() -> Result<Vec<String>, HostsError> {
    let content = fs::read_to_string(HOSTS_PATH)
        .map_err(HostsError::ReadError)?;

    let mut blocked = Vec::new();
    let mut in_block_section = false;

    for line in content.lines() {
        if line.contains(BLOCK_COMMENT) {
            in_block_section = true;
            if let Some(domain) = line.split_whitespace().nth(1) {
                if domain != "Focus" {
                    blocked.push(domain.to_string());
                }
            }
            continue;
        }
        if in_block_section && line.trim().is_empty() {
            in_block_section = false;
            continue;
        }
        if in_block_section && !line.starts_with('#') && !line.trim().is_empty() {
            if let Some(domain) = line.split_whitespace().nth(1) {
                blocked.push(domain.to_string());
            }
        }
    }

    Ok(blocked)
}

pub fn add_blocked_website(domain: &str) -> Result<(), HostsError> {
    let mut content = fs::read_to_string(HOSTS_PATH)
        .map_err(HostsError::ReadError)?;

    if !content.contains(&format!("127.0.0.1 {}", domain)) {
        if !content.ends_with('\n') {
            content.push('\n');
        }
        content.push_str(&format!("127.0.0.1 {} # {}\n", domain, BLOCK_COMMENT));

        fs::write(HOSTS_PATH, &content)
            .map_err(HostsError::WriteError)?;
    }

    Ok(())
}

pub fn remove_blocked_website(domain: &str) -> Result<(), HostsError> {
    let content = fs::read_to_string(HOSTS_PATH)
        .map_err(HostsError::ReadError)?;

    let new_content: String = content
        .lines()
        .filter(|line| !line.contains(&format!("127.0.0.1 {}", domain)))
        .collect::<Vec<_>>()
        .join("\n");

    fs::write(HOSTS_PATH, format!("{}\n", new_content))
        .map_err(HostsError::WriteError)?;

    Ok(())
}

pub fn add_blocked_websites(domains: &[String]) -> Result<(), HostsError> {
    let mut content = fs::read_to_string(HOSTS_PATH)
        .map_err(HostsError::ReadError)?;

    let existing_blocked = read_blocked_websites().unwrap_or_default();

    let mut new_entries = Vec::new();
    for domain in domains {
        if !existing_blocked.contains(domain) {
            new_entries.push(format!("127.0.0.1 {} # {}", domain, BLOCK_COMMENT));
        }
    }

    if !new_entries.is_empty() {
        if !content.ends_with('\n') {
            content.push('\n');
        }
        content.push_str(&new_entries.join("\n"));
        content.push('\n');

        fs::write(HOSTS_PATH, &content)
            .map_err(HostsError::WriteError)?;
    }

    Ok(())
}

pub fn clear_all_blocks() -> Result<(), HostsError> {
    let content = fs::read_to_string(HOSTS_PATH)
        .map_err(HostsError::ReadError)?;

    let new_content: String = content
        .lines()
        .filter(|line| !line.contains(BLOCK_COMMENT))
        .collect::<Vec<_>>()
        .join("\n");

    fs::write(HOSTS_PATH, format!("{}\n", new_content))
        .map_err(HostsError::WriteError)?;

    Ok(())
}

pub fn is_admin() -> bool {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let output = Command::new("net")
            .arg("session")
            .output();
        output.map(|o| o.status.success()).unwrap_or(false)
    }

    #[cfg(not(target_os = "windows"))]
    {
        unsafe { libc::geteuid() == 0 }
    }
}
