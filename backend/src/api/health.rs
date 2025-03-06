use std::process::Command;
use std::sync::Arc;

use axum::{extract::State, routing::get, Json, Router};
use serde_json::json;

use crate::services::nginx::NginxService;

pub fn health_routes() -> Router<Arc<NginxService>> {
    Router::new().route("/", get(health_check))
}

async fn health_check(State(nginx_service): State<Arc<NginxService>>) -> Json<serde_json::Value> {
    // Check if Nginx is installed
    let nginx_installed = Command::new("which")
        .arg("nginx")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false);

    // Check if there are any configs
    let has_configs = nginx_service
        .list_configs()
        .map(|configs| !configs.is_empty())
        .unwrap_or(false);

    if !nginx_installed {
        return Json(json!({
            "status": "warning",
            "message": "Nginx is not installed",
            "nginx_installed": false,
            "has_configs": has_configs,
            "installation_instructions": {
                "ubuntu": "sudo apt update && sudo apt install nginx",
                "debian": "sudo apt update && sudo apt install nginx",
                "fedora": "sudo dnf install nginx",
                "centos": "sudo yum install nginx",
                "macos": "brew install nginx",
                "windows": "Please download from http://nginx.org/en/download.html. Also we don't support Windows LOL"
            }
        }));
    }

    if !has_configs {
        return Json(json!({
            "status": "warning",
            "message": "No Nginx configurations found",
            "nginx_installed": true,
            "has_configs": false,
            "next_steps": "Please create a configuration in the Configuration page"
        }));
    }

    Json(json!({
        "status": "ok",
        "message": "Service is healthy",
        "nginx_installed": true,
        "has_configs": true
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_health_check() {
        let response =
            health_check(State(Arc::new(NginxService::new("test", "test").unwrap()))).await;
        let value = response.0;

        assert_eq!(value["status"], "ok");
        assert_eq!(value["version"], env!("CARGO_PKG_VERSION"));
    }
}
