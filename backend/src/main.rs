mod api;
mod config;
mod models;
mod services;
mod utils;

use std::net::SocketAddr;
use std::sync::Arc;

use anyhow::Result;
use axum::Router;
use dotenv::dotenv;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::info;

use crate::api::health::health_routes;
use crate::api::load_balancer::load_balancer_routes;
use crate::api::nginx_config::config_routes;
use crate::api::traffic::traffic_routes;
use crate::config::AppConfig;
use crate::services::nginx::NginxService;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();
    tracing_subscriber::fmt::init(); // Logging

    let config = AppConfig::from_env()?;
    info!("Configuration loaded");
    info!("Nginx config directory: {}", config.nginx_config_dir);
    info!("Nginx log directory: {}", config.nginx_log_dir);

    // Create shared services
    let nginx_service = Arc::new(NginxService::new(
        &config.nginx_config_dir,
        &config.nginx_log_dir,
    )?);
    info!("Nginx service initialized");

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build our application with routes
    let app = Router::new()
        .nest("/api/health", health_routes())
        .nest("/api/config", config_routes())
        .nest("/api/traffic", traffic_routes())
        .nest("/api/load-balancer", load_balancer_routes())
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(nginx_service);

    // Run the server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    info!("Starting server on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
