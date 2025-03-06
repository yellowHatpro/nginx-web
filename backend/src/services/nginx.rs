use std::fs;
use std::path::PathBuf;
use std::process::Command;

use anyhow::{Context, Result};
use regex;
use reqwest;
use uuid::Uuid;

use crate::models::config::NginxConfig;
use crate::models::server::{Server, ServerCreateRequest, ServerStatus, ServerUpdateRequest};
use crate::models::traffic::{TrafficLog, TrafficStats};

pub struct NginxService {
    config_dir: PathBuf,
    log_dir: PathBuf,
}

impl NginxService {
    pub fn new(config_dir: &str, log_dir: &str) -> Result<Self> {
        println!("NginxService::new - config_dir: {}", config_dir);
        tracing::info!("NginxService::new - config_dir: {}", config_dir);
        Ok(Self {
            config_dir: PathBuf::from(config_dir),
            log_dir: PathBuf::from(log_dir),
        })
    }

    // Config management methods
    pub fn list_configs(&self) -> Result<Vec<NginxConfig>> {
        let mut configs = Vec::new();

        // Read all .conf files in the config directory
        for entry in fs::read_dir(&self.config_dir).context("Failed to read config directory")? {
            let entry = entry.context("Failed to read directory entry")?;
            let path = entry.path();

            if path.is_file() && path.extension().map_or(false, |ext| ext == "conf") {
                let file_name = path
                    .file_name()
                    .and_then(|name| name.to_str())
                    .unwrap_or("unknown.conf");

                let content = fs::read_to_string(&path)
                    .context(format!("Failed to read config file: {:?}", path))?;

                // Create a deterministic ID based on the file name
                // This ensures the ID remains consistent across server restarts
                let id = format!("config-{}", file_name.replace(".", "-"));

                configs.push(NginxConfig {
                    id,
                    name: file_name.to_string(),
                    path: path.to_string_lossy().to_string(),
                    content,
                    symlink_path: None,
                    symlink_created: None,
                });
            }
        }

        Ok(configs)
    }

    pub fn create_config(&self, name: &str, content: &str) -> Result<NginxConfig> {
        // Ensure the name ends with .conf
        let name = if name.ends_with(".conf") {
            name.to_string()
        } else {
            format!("{}.conf", name)
        };

        // Create a deterministic ID based on the file name
        // This ensures the ID remains consistent across server restarts
        let id = format!("config-{}", name.replace(".", "-"));

        // Create the path for the new config file
        let path = self.config_dir.join(&name);

        // Print the path for debugging
        println!("Trying to write config to: {:?}", path);
        tracing::info!("Trying to write config to: {:?}", path);

        // Write the content to the file
        fs::write(&path, content).context(format!("Failed to write config file: {:?}", path))?;

        // Try to create a symlink to the Nginx directory
        // Check common Nginx directories
        let nginx_dirs = vec![
            "/etc/nginx",           // Linux standard
            "/usr/local/etc/nginx", // macOS Homebrew
        ];

        let mut symlink_created = None;
        let mut symlink_path = None;

        for nginx_dir in nginx_dirs {
            let dir_path = PathBuf::from(nginx_dir);
            if dir_path.exists() {
                let nginx_path = dir_path.join(&name);

                // Check if we can create the symlink
                let symlink_result = std::os::unix::fs::symlink(&path, &nginx_path);

                match symlink_result {
                    Ok(_) => {
                        println!(
                            "Successfully created symlink: {} -> {}",
                            nginx_path.display(),
                            path.display()
                        );
                        tracing::info!(
                            "Successfully created symlink: {} -> {}",
                            nginx_path.display(),
                            path.display()
                        );
                        symlink_created = Some(true);
                        symlink_path = Some(nginx_path.to_string_lossy().to_string());
                        break; // Successfully created symlink, no need to try other directories
                    }
                    Err(e) => {
                        println!("Could not create symlink at {}: {}", nginx_dir, e);
                        tracing::warn!("Could not create symlink at {}: {}", nginx_dir, e);
                        // Continue to try other directories
                    }
                }
            }
        }

        // If no symlink was created, provide instructions
        if symlink_created.is_none() {
            // Try to determine the best Nginx directory to suggest
            let suggested_dir = if PathBuf::from("/usr/local/etc/nginx").exists() {
                "/usr/local/etc/nginx"
            } else if PathBuf::from("/opt/homebrew/etc/nginx").exists() {
                "/opt/homebrew/etc/nginx"
            } else {
                "/etc/nginx"
            };

            let suggested_path = PathBuf::from(suggested_dir).join(&name);
            symlink_created = Some(false);
            symlink_path = Some(suggested_path.to_string_lossy().to_string());

            // Create a more robust command that will:
            // 1. Create the directory if it doesn't exist
            // 2. Remove any existing symlink or file with the same name
            // 3. Create the new symlink
            println!("Could not create symlink automatically. To use this configuration with Nginx, run this command:");
            println!(
                "sudo bash -c 'mkdir -p {} && [ -e {}/{} ] && rm {}/{} ; ln -s {} {}/{}'",
                suggested_dir,
                suggested_dir,
                name,
                suggested_dir,
                name,
                path.display(),
                suggested_dir,
                name
            );

            tracing::info!(
                "Symlink command: sudo bash -c 'mkdir -p {} && [ -e {}/{} ] && rm {}/{} ; ln -s {} {}/{}'",
                suggested_dir,
                suggested_dir,
                name,
                suggested_dir,
                name,
                path.display(),
                suggested_dir,
                name
            );
        }

        // Return the new config
        Ok(NginxConfig {
            id,
            name,
            path: path.to_string_lossy().to_string(),
            content: content.to_string(),
            symlink_created,
            symlink_path,
        })
    }

    pub fn get_config(&self, id: &str) -> Result<Option<NginxConfig>> {
        // For now, we'll just return the first config that matches the ID
        self.list_configs()?
            .into_iter()
            .find(|config| config.id == id)
            .map_or(Ok(None), |config| Ok(Some(config)))
    }

    pub fn update_config(&self, id: &str, content: &str) -> Result<NginxConfig> {
        // Find the config
        let config = self
            .get_config(id)?
            .ok_or_else(|| anyhow::anyhow!("Config not found"))?;

        // Write the updated content to the file
        fs::write(&config.path, content)
            .context(format!("Failed to write config file: {}", config.path))?;

        // Return the updated config
        Ok(NginxConfig {
            id: config.id,
            name: config.name,
            path: config.path,
            content: content.to_string(),
            symlink_path: config.symlink_path,
            symlink_created: config.symlink_created,
        })
    }

    pub fn deploy_config(&self, id: &str, validate_only: bool) -> Result<()> {
        // Find the config
        let config = self
            .get_config(id)?
            .ok_or_else(|| anyhow::anyhow!("Config not found"))?;

        // Validate the config
        let output = Command::new("nginx")
            .arg("-t")
            .arg("-c")
            .arg(&config.path)
            .output()
            .context("Failed to execute nginx -t")?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow::anyhow!("Invalid configuration: {}", error));
        }

        // If we're just validating, we're done
        if validate_only {
            return Ok(());
        }

        // Reload Nginx
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

    // Traffic monitoring methods
    pub fn get_traffic_logs(
        &self,
        ip_filter: &Option<String>,
        limit: Option<usize>,
    ) -> Result<Vec<TrafficLog>> {
        // Parse the Nginx access logs
        let log_path = self.log_dir.join("access.log");
        let mut logs = Vec::new();

        // Check if the log file exists
        if !log_path.exists() {
            // If no log file exists yet, return empty logs
            return Ok(logs);
        }

        // Read the log file
        let content = fs::read_to_string(&log_path)
            .context(format!("Failed to read access log file: {:?}", log_path))?;

        // Parse each line
        for line in content.lines() {
            if let Some(log) = self.parse_log_line(line) {
                // Apply IP filter if provided
                if let Some(ip) = ip_filter {
                    if log.ip != *ip {
                        continue;
                    }
                }
                logs.push(log);
            }
        }

        // Sort logs by timestamp (newest first)
        logs.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

        // Apply limit if provided
        if let Some(limit_val) = limit {
            logs.truncate(limit_val);
        }

        Ok(logs)
    }

    // Helper method to parse a log line
    fn parse_log_line(&self, line: &str) -> Option<TrafficLog> {
        // Common log format: IP - - [timestamp] "METHOD /path HTTP/1.1" status bytes_sent "referer" "user_agent"
        let re = regex::Regex::new(
            r#"^(\S+) - - \[([^\]]+)\] "(\S+) ([^"]+) HTTP/\d\.\d" (\d+) (\d+) "([^"]*)" "([^"]*)""#,
        )
        .ok()?;

        let captures = re.captures(line)?;

        let ip = captures.get(1)?.as_str().to_string();
        let timestamp_str = captures.get(2)?.as_str();
        let method = captures.get(3)?.as_str().to_string();
        let path = captures.get(4)?.as_str().to_string();
        let status = captures.get(5)?.as_str().parse::<u16>().ok()?;
        let bytes_sent = captures.get(6)?.as_str().parse::<u64>().ok();
        let referer = captures
            .get(7)
            .map(|m| m.as_str().to_string())
            .filter(|s| !s.is_empty());
        let user_agent = captures.get(8).map(|m| m.as_str().to_string());

        // Parse timestamp
        let timestamp = chrono::DateTime::parse_from_str(timestamp_str, "%d/%b/%Y:%H:%M:%S %z")
            .ok()?
            .with_timezone(&chrono::Utc);

        Some(TrafficLog {
            id: Uuid::new_v4().to_string(),
            timestamp,
            ip,
            method,
            path,
            status,
            response_time: None, // Not available in common log format
            user_agent,
            referer,
            bytes_sent,
            bytes_received: None, // Not available in common log format
        })
    }

    pub fn get_traffic_stats(&self) -> Result<TrafficStats> {
        // Get the logs
        let logs = self.get_traffic_logs(&None, None)?;

        // Calculate stats
        let total_requests = logs.len();
        let success_requests = logs.iter().filter(|log| log.status < 400).count();
        let error_requests = total_requests - success_requests;

        // Calculate average response time
        let (total_response_time, response_count) = logs
            .iter()
            .filter_map(|log| log.response_time)
            .fold((0.0, 0), |(sum, count), time| {
                (sum + time as f64, count + 1)
            });

        let avg_response_time = if response_count > 0 {
            total_response_time / response_count as f64
        } else {
            0.0
        };

        // Calculate total bytes sent
        let total_bytes_sent = logs.iter().filter_map(|log| log.bytes_sent).sum::<u64>();

        // Calculate requests per minute
        let requests_per_minute = if !logs.is_empty() {
            let first_log_time = logs.first().unwrap().timestamp;
            let last_log_time = logs.last().unwrap().timestamp;

            let time_span = last_log_time.signed_duration_since(first_log_time);
            let minutes = time_span.num_minutes();

            if minutes > 0 {
                total_requests as f64 / minutes as f64
            } else {
                total_requests as f64
            }
        } else {
            0.0
        };

        // Return the stats
        Ok(TrafficStats {
            total_requests: total_requests as u64,
            success_requests: success_requests as u64,
            error_requests: error_requests as u64,
            avg_response_time,
            total_bytes_sent,
            requests_per_minute,
        })
    }

    // Load balancer methods
    pub fn list_servers(&self) -> Result<Vec<Server>> {
        // Parse the Nginx upstream configuration
        let upstream_file = self.config_dir.join("upstream.conf");
        let mut servers = Vec::new();

        // If the upstream file doesn't exist yet, return empty list
        if !upstream_file.exists() {
            return Ok(servers);
        }

        // Read the upstream file
        let content = fs::read_to_string(&upstream_file)
            .context(format!("Failed to read upstream file: {:?}", upstream_file))?;

        // Parse the upstream configuration
        // Example format:
        // upstream backend {
        //     server 192.168.1.1:8080 weight=5 max_conns=100;
        //     server 192.168.1.2:8080 weight=3;
        // }

        let re = regex::Regex::new(
            r#"server\s+([^:]+):(\d+)(?:\s+weight=(\d+))?(?:\s+max_conns=(\d+))?"#,
        )
        .context("Failed to create regex for server parsing")?;

        for cap in re.captures_iter(&content) {
            let ip = cap.get(1).map_or("", |m| m.as_str()).to_string();
            let port = cap
                .get(2)
                .map_or("80", |m| m.as_str())
                .parse::<u16>()
                .unwrap_or(80);
            let weight = cap.get(3).map(|m| m.as_str().parse::<u32>().ok()).flatten();
            let max_connections = cap.get(4).map(|m| m.as_str().parse::<u32>().ok()).flatten();

            // Generate a unique ID based on IP and port
            let id = format!("{}:{}", ip, port);

            servers.push(Server {
                id: id.clone(),
                name: format!("Server {}", id),
                ip,
                port,
                weight,
                max_connections,
                health_check: None,
                status: ServerStatus::Unknown,
            });
        }

        // Check health for each server
        for server in &mut servers {
            match self.check_server_health(&server.id) {
                Ok(status) => server.status = status,
                Err(_) => server.status = ServerStatus::Unknown,
            }
        }

        Ok(servers)
    }

    pub fn get_server(&self, id: &str) -> Result<Option<Server>> {
        // Look up the server by ID
        self.list_servers()?
            .into_iter()
            .find(|server| server.id == id)
            .map_or(Ok(None), |server| Ok(Some(server)))
    }

    pub fn add_server(&self, request: &ServerCreateRequest) -> Result<Server> {
        // Update the Nginx upstream configuration to add a new server
        let upstream_file = self.config_dir.join("upstream.conf");

        // Create or update the upstream file
        let content = if upstream_file.exists() {
            // Read existing content
            let mut content = fs::read_to_string(&upstream_file)
                .context(format!("Failed to read upstream file: {:?}", upstream_file))?;

            // Check if the upstream block exists
            if !content.contains("upstream backend {") {
                content = format!("upstream backend {{\n}}\n{}", content);
            }

            // Check if this server already exists
            let server_line = format!("server {}:{}", request.ip, request.port);
            if content.contains(&server_line) {
                return Err(anyhow::anyhow!("Server already exists"));
            }

            // Add the new server to the upstream block
            content.replace(
                "upstream backend {",
                &format!(
                    "upstream backend {{\n    server {}:{}{}{};",
                    request.ip,
                    request.port,
                    request
                        .weight
                        .map_or("".to_string(), |w| format!(" weight={}", w)),
                    request
                        .max_connections
                        .map_or("".to_string(), |m| format!(" max_conns={}", m))
                ),
            )
        } else {
            // Create a new upstream file
            format!(
                "upstream backend {{\n    server {}:{}{}{};
}}\n",
                request.ip,
                request.port,
                request
                    .weight
                    .map_or("".to_string(), |w| format!(" weight={}", w)),
                request
                    .max_connections
                    .map_or("".to_string(), |m| format!(" max_conns={}", m))
            )
        };

        // Write the updated content
        fs::write(&upstream_file, content).context(format!(
            "Failed to write upstream file: {:?}",
            upstream_file
        ))?;

        // Generate a unique ID based on IP and port
        let id = format!("{}:{}", request.ip, request.port);

        // Return the new server
        let server = Server {
            id: id.clone(),
            name: request.name.clone(),
            ip: request.ip.clone(),
            port: request.port,
            weight: request.weight,
            max_connections: request.max_connections,
            health_check: request.health_check.clone(),
            status: ServerStatus::Unknown,
        };

        Ok(server)
    }

    pub fn update_server(&self, id: &str, request: &ServerUpdateRequest) -> Result<Server> {
        // Update the Nginx upstream configuration
        let upstream_file = self.config_dir.join("upstream.conf");

        // Check if the upstream file exists
        if !upstream_file.exists() {
            return Err(anyhow::anyhow!("Upstream configuration does not exist"));
        }

        // Get the existing server
        let existing_server = self
            .get_server(id)?
            .ok_or_else(|| anyhow::anyhow!("Server not found"))?;

        // Read the upstream file
        let content = fs::read_to_string(&upstream_file)
            .context(format!("Failed to read upstream file: {:?}", upstream_file))?;

        // Create the old and new server lines
        let old_server_line = format!(
            "server {}:{}{}{}",
            existing_server.ip,
            existing_server.port,
            existing_server
                .weight
                .map_or("".to_string(), |w| format!(" weight={}", w)),
            existing_server
                .max_connections
                .map_or("".to_string(), |m| format!(" max_conns={}", m))
        );

        let new_ip = request.ip.as_ref().unwrap_or(&existing_server.ip);
        let new_port = request.port.unwrap_or(existing_server.port);
        let new_weight = request.weight.or(existing_server.weight);
        let new_max_connections = request.max_connections.or(existing_server.max_connections);

        let new_server_line = format!(
            "server {}:{}{}{}",
            new_ip,
            new_port,
            new_weight.map_or("".to_string(), |w| format!(" weight={}", w)),
            new_max_connections.map_or("".to_string(), |m| format!(" max_conns={}", m))
        );

        // Replace the old server line with the new one
        let updated_content = content.replace(&old_server_line, &new_server_line);

        // Write the updated content
        fs::write(&upstream_file, updated_content).context(format!(
            "Failed to write upstream file: {:?}",
            upstream_file
        ))?;

        // Generate a new ID if IP or port changed
        let new_id = format!("{}:{}", new_ip, new_port);

        // Return the updated server
        let server = Server {
            id: new_id,
            name: request.name.clone().unwrap_or(existing_server.name),
            ip: new_ip.clone(),
            port: new_port,
            weight: new_weight,
            max_connections: new_max_connections,
            health_check: request
                .health_check
                .clone()
                .or(existing_server.health_check),
            status: ServerStatus::Unknown,
        };

        Ok(server)
    }

    pub fn remove_server(&self, id: &str) -> Result<()> {
        // Update the Nginx upstream configuration to remove a server
        let upstream_file = self.config_dir.join("upstream.conf");

        // Check if the upstream file exists
        if !upstream_file.exists() {
            return Err(anyhow::anyhow!("Upstream configuration does not exist"));
        }

        // Get the existing server
        let existing_server = self
            .get_server(id)?
            .ok_or_else(|| anyhow::anyhow!("Server not found"))?;

        // Read the upstream file
        let content = fs::read_to_string(&upstream_file)
            .context(format!("Failed to read upstream file: {:?}", upstream_file))?;

        // Create the server line to remove
        let server_line = format!(
            "server {}:{}{}{}",
            existing_server.ip,
            existing_server.port,
            existing_server
                .weight
                .map_or("".to_string(), |w| format!(" weight={}", w)),
            existing_server
                .max_connections
                .map_or("".to_string(), |m| format!(" max_conns={}", m))
        );

        // Remove the server line
        let updated_content = content
            .lines()
            .filter(|line| !line.contains(&server_line))
            .collect::<Vec<&str>>()
            .join("\n");

        // Write the updated content
        fs::write(&upstream_file, updated_content).context(format!(
            "Failed to write upstream file: {:?}",
            upstream_file
        ))?;

        Ok(())
    }

    pub fn check_server_health(&self, id: &str) -> Result<ServerStatus> {
        // Get the server details
        let server = self
            .get_server(id)?
            .ok_or_else(|| anyhow::anyhow!("Server not found"))?;

        // If there's a health check path defined, use it
        let health_path = server
            .health_check
            .as_ref()
            .map(|hc| hc.path.clone())
            .unwrap_or_else(|| "/".to_string());

        // Construct the URL
        let url = format!("http://{}:{}{}", server.ip, server.port, health_path);

        // Create a client with a timeout
        let client = reqwest::blocking::Client::builder()
            .timeout(std::time::Duration::from_secs(5))
            .build()
            .context("Failed to create HTTP client")?;

        // Make the request
        match client.get(&url).send() {
            Ok(response) => {
                if response.status().is_success() {
                    Ok(ServerStatus::Healthy)
                } else {
                    Ok(ServerStatus::Unhealthy)
                }
            }
            Err(_) => Ok(ServerStatus::Unhealthy),
        }
    }
}
