use std::sync::Arc;

use axum::{
    extract::{Path, State},
    routing::{delete, get, post, put},
    Json, Router,
};
use serde_json::json;

use crate::models::server::{Server, ServerCreateRequest, ServerUpdateRequest};
use crate::services::nginx::NginxService;

pub fn load_balancer_routes() -> Router<Arc<NginxService>> {
    Router::new()
        .route("/servers", get(list_servers))
        .route("/servers", post(create_server))
        .route("/servers/:id", get(get_server))
        .route("/servers/:id", put(update_server))
        .route("/servers/:id", delete(delete_server))
        .route("/servers/:id/health", get(check_server_health))
}

async fn list_servers(State(nginx_service): State<Arc<NginxService>>) -> Json<Vec<Server>> {
    // In a real implementation, this would read from the Nginx upstream configuration
    // For now, we'll return a mock response
    Json(nginx_service.list_servers().unwrap_or_default())
}

async fn create_server(
    State(nginx_service): State<Arc<NginxService>>,
    Json(request): Json<ServerCreateRequest>,
) -> Json<serde_json::Value> {
    match nginx_service.add_server(&request) {
        Ok(server) => Json(json!(server)),
        Err(e) => Json(json!({
            "error": format!("Failed to create server: {}", e)
        })),
    }
}

async fn get_server(
    State(nginx_service): State<Arc<NginxService>>,
    Path(id): Path<String>,
) -> Json<serde_json::Value> {
    match nginx_service.get_server(&id) {
        Ok(Some(server)) => Json(json!(server)),
        Ok(None) => Json(json!({
            "error": "Server not found"
        })),
        Err(e) => Json(json!({
            "error": format!("Failed to get server: {}", e)
        })),
    }
}

async fn update_server(
    State(nginx_service): State<Arc<NginxService>>,
    Path(id): Path<String>,
    Json(request): Json<ServerUpdateRequest>,
) -> Json<serde_json::Value> {
    match nginx_service.update_server(&id, &request) {
        Ok(server) => Json(json!(server)),
        Err(e) => Json(json!({
            "error": format!("Failed to update server: {}", e)
        })),
    }
}

async fn delete_server(
    State(nginx_service): State<Arc<NginxService>>,
    Path(id): Path<String>,
) -> Json<serde_json::Value> {
    match nginx_service.remove_server(&id) {
        Ok(()) => Json(json!({
            "success": true,
            "message": "Server removed successfully"
        })),
        Err(e) => Json(json!({
            "success": false,
            "error": format!("Failed to remove server: {}", e)
        })),
    }
}

async fn check_server_health(
    State(nginx_service): State<Arc<NginxService>>,
    Path(id): Path<String>,
) -> Json<serde_json::Value> {
    match nginx_service.check_server_health(&id) {
        Ok(status) => Json(json!({
            "status": status
        })),
        Err(e) => Json(json!({
            "error": format!("Failed to check server health: {}", e)
        })),
    }
}
