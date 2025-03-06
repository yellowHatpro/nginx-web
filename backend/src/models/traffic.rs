use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TrafficLog {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub ip: String,
    pub method: String,
    pub path: String,
    pub status: u16,
    pub response_time: Option<u64>,
    pub user_agent: Option<String>,
    pub referer: Option<String>,
    pub bytes_sent: Option<u64>,
    pub bytes_received: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrafficQuery {
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
    pub ip: Option<String>,
    pub status: Option<u16>,
    pub method: Option<String>,
    pub path: Option<String>,
    pub limit: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrafficStats {
    pub total_requests: u64,
    pub success_requests: u64,
    pub error_requests: u64,
    pub avg_response_time: f64,
    pub total_bytes_sent: u64,
    pub requests_per_minute: f64,
}
