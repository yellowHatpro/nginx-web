use anyhow::{Context, Result};
use regex::Regex;
use std::process::Command;
use tracing::debug;

/// Parse an Nginx access log line into its components
pub fn parse_access_log_line(line: &str) -> Option<(String, String, String, u16, usize)> {
    // Example log format: 192.168.1.1 - - [21/Mar/2023:13:55:36 +0000] "GET /api/users HTTP/1.1" 200 2326
    let re =
        Regex::new(r#"^(\S+) .+ \[([^\]]+)\] "(\S+) ([^"]+) HTTP/\d\.\d" (\d+) (\d+)"#).ok()?;

    if let Some(captures) = re.captures(line) {
        let ip = captures.get(1)?.as_str().to_string();
        let timestamp = captures.get(2)?.as_str().to_string();
        let method = captures.get(3)?.as_str().to_string();
        let path = captures.get(4)?.as_str().to_string();
        let status = captures.get(5)?.as_str().parse::<u16>().ok()?;
        let bytes = captures.get(6)?.as_str().parse::<usize>().ok()?;

        Some((ip, timestamp, method, status, bytes))
    } else {
        None
    }
}

/// Test if Nginx is running
pub fn is_nginx_running() -> bool {
    Command::new("pgrep")
        .arg("nginx")
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}

/// Validate an Nginx configuration file
pub fn validate_config(config_path: &str) -> Result<bool> {
    debug!("Validating Nginx config: {}", config_path);

    let output = Command::new("nginx")
        .arg("-t")
        .arg("-c")
        .arg(config_path)
        .output()
        .context("Failed to execute nginx -t")?;

    Ok(output.status.success())
}

/// Reload Nginx configuration
pub fn reload_nginx() -> Result<()> {
    debug!("Reloading Nginx");

    let output = Command::new("nginx")
        .arg("-s")
        .arg("reload")
        .output()
        .context("Failed to execute nginx -s reload")?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!("Failed to reload Nginx: {}", error));
    }

    Ok(())
}
