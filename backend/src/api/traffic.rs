use std::sync::Arc;

use axum::{
    extract::{Query, State},
    routing::get,
    Json, Router,
};
use serde::Deserialize;
use serde_json::json;

use crate::models::traffic::{TrafficLog, TrafficStats};
use crate::services::nginx::NginxService;

pub fn traffic_routes() -> Router<Arc<NginxService>> {
    Router::new()
        .route("/", get(get_traffic))
        .route("/stats", get(get_traffic_stats))
        .route("/realtime", get(realtime_traffic))
}

#[derive(Debug, Deserialize)]
pub struct TrafficQueryParams {
    pub from: Option<String>,
    pub to: Option<String>,
    pub ip: Option<String>,
    pub status: Option<u16>,
    pub method: Option<String>,
    pub path: Option<String>,
    pub limit: Option<usize>,
}

async fn get_traffic(
    State(nginx_service): State<Arc<NginxService>>,
    Query(params): Query<TrafficQueryParams>,
) -> Json<Vec<TrafficLog>> {
    // Convert query params to TrafficQuery
    // TODO: this would parse the Nginx access logs
    // MOCK for now
    Json(
        nginx_service
            .get_traffic_logs(&params.ip, params.limit)
            .unwrap_or_default(),
    )
}

async fn get_traffic_stats(
    State(nginx_service): State<Arc<NginxService>>,
    Query(params): Query<TrafficQueryParams>,
) -> Json<TrafficStats> {
    // TODO: this would analyze the Nginx access logs
    // MOCK for now
    Json(
        nginx_service
            .get_traffic_stats()
            .unwrap_or_else(|_| TrafficStats {
                total_requests: 0,
                success_requests: 0,
                error_requests: 0,
                avg_response_time: 0.0,
                total_bytes_sent: 0,
                requests_per_minute: 0.0,
            }),
    )
}

async fn realtime_traffic() -> Json<serde_json::Value> {
    // TODO: this would be a WebSocket endpoint
    // MOCK for now
    Json(json!({
        "message": "WebSocket endpoint not implemented yet"
    }))
}
