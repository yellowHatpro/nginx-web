use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Server {
    pub id: String,
    pub name: String,
    pub ip: String,
    pub port: u16,
    pub weight: Option<u32>,
    pub max_connections: Option<u32>,
    pub health_check: Option<HealthCheck>,
    pub status: ServerStatus,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HealthCheck {
    pub path: String,
    pub interval: u32,
    pub timeout: u32,
    pub unhealthy_threshold: u32,
    pub healthy_threshold: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum ServerStatus {
    Healthy,
    Unhealthy,
    Unknown,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerCreateRequest {
    pub name: String,
    pub ip: String,
    pub port: u16,
    pub weight: Option<u32>,
    pub max_connections: Option<u32>,
    pub health_check: Option<HealthCheck>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerUpdateRequest {
    pub name: Option<String>,
    pub ip: Option<String>,
    pub port: Option<u16>,
    pub weight: Option<u32>,
    pub max_connections: Option<u32>,
    pub health_check: Option<HealthCheck>,
}
