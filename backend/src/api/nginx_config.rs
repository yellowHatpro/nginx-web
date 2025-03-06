use std::sync::Arc;

use axum::{
    extract::{Path, State},
    routing::{get, post, put},
    Json, Router,
};
use serde_json::json;

use crate::models::config::{ConfigDeployRequest, ConfigUpdateRequest, NginxConfig};
use crate::services::nginx::NginxService;

pub fn config_routes() -> Router<Arc<NginxService>> {
    Router::new()
        .route("/", get(list_configs))
        .route("/", post(create_config))
        .route("/:id", get(get_config))
        .route("/:id", put(update_config))
        .route("/:id/deploy", post(deploy_config))
}

async fn list_configs(State(nginx_service): State<Arc<NginxService>>) -> Json<Vec<NginxConfig>> {
    // In a real implementation, this would read from the Nginx config directory
    // For now, we'll return a mock response
    Json(nginx_service.list_configs().unwrap_or_default())
}

async fn create_config(
    State(nginx_service): State<Arc<NginxService>>,
    Json(request): Json<serde_json::Value>,
) -> Json<serde_json::Value> {
    let name = request
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("default.conf");
    let content = request
        .get("content")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    match nginx_service.create_config(name, content) {
        Ok(config) => Json(json!(config)),
        Err(e) => Json(json!({
            "error": format!("Failed to create config: {}", e)
        })),
    }
}

async fn get_config(
    State(nginx_service): State<Arc<NginxService>>,
    Path(id): Path<String>,
) -> Json<serde_json::Value> {
    match nginx_service.get_config(&id) {
        Ok(Some(config)) => Json(json!(config)),
        Ok(None) => Json(json!({
            "error": "Config not found"
        })),
        Err(e) => Json(json!({
            "error": format!("Failed to get config: {}", e)
        })),
    }
}

async fn update_config(
    State(nginx_service): State<Arc<NginxService>>,
    Path(id): Path<String>,
    Json(request): Json<ConfigUpdateRequest>,
) -> Json<serde_json::Value> {
    match nginx_service.update_config(&id, &request.content) {
        Ok(config) => Json(json!(config)),
        Err(e) => Json(json!({
            "error": format!("Failed to update config: {}", e)
        })),
    }
}

async fn deploy_config(
    State(nginx_service): State<Arc<NginxService>>,
    Json(request): Json<ConfigDeployRequest>,
) -> Json<serde_json::Value> {
    let validate_only = request.validate_only.unwrap_or(false);

    match nginx_service.deploy_config(&request.config_id, validate_only) {
        Ok(()) => Json(json!({
            "success": true,
            "message": if validate_only { "Configuration is valid" } else { "Configuration deployed successfully" }
        })),
        Err(e) => Json(json!({
            "success": false,
            "error": format!("Failed to deploy config: {}", e)
        })),
    }
}
