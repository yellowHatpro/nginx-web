use anyhow::Result;
use serde::Deserialize;
use std::env;
use std::fs;
use std::path::Path;
use tracing::info;
#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub host: String,
    pub port: u16,
    pub nginx_config_dir: String,
    pub nginx_log_dir: String,
    pub nginx_binary: String,
    pub api_key_required: bool,  // For later AI Mindfuck
    pub api_key: Option<String>, // For later AI Mindfuck
}

impl AppConfig {
    pub fn from_env() -> Result<Self> {
        let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
        let port = env::var("PORT")
            .unwrap_or_else(|_| "3000".to_string())
            .parse::<u16>()?;

        // Use ~/.nginx-web directory for configs and logs
        let home_dir = dirs::home_dir().expect("Could not find home directory");
        let app_dir = home_dir.join(".nginx-web");
        let config_dir = app_dir.join("configs");
        let log_dir = app_dir.join("logs");

        // Check dir, if not exists, create it
        ensure_directory_exists(&app_dir)?;
        ensure_directory_exists(&config_dir)?;
        ensure_directory_exists(&log_dir)?;

        // Use the environment variables if provided, otherwise use our default directories
        let nginx_config_dir = env::var("NGINX_CONFIG_DIR")
            .unwrap_or_else(|_| config_dir.to_string_lossy().to_string());
        let nginx_log_dir =
            env::var("NGINX_LOG_DIR").unwrap_or_else(|_| log_dir.to_string_lossy().to_string());
        let nginx_binary =
            env::var("NGINX_BINARY").unwrap_or_else(|_| "/usr/sbin/nginx".to_string());
        let api_key_required = env::var("API_KEY_REQUIRED")
            .unwrap_or_else(|_| "false".to_string())
            .parse::<bool>()?;
        let api_key = env::var("API_KEY").ok();

        info!("Nginx config dir: {}", nginx_config_dir);
        info!("Nginx log dir: {}", nginx_log_dir);
        info!("Nginx binary: {}", nginx_binary);
        info!("API key required: {}", api_key_required);
        info!("API key: {}", api_key.clone().unwrap_or_else(|| "None".to_string()));

        Ok(Self {
            host,
            port,
            nginx_config_dir,
            nginx_log_dir,
            nginx_binary,
            api_key_required,
            api_key,
        })
    }
}

// Helper Functions

fn ensure_directory_exists(path: &Path) -> Result<()> {
    if !path.exists() {
        fs::create_dir_all(path)?;
        println!("Created directory: {}", path.display());
    }
    Ok(())
}
