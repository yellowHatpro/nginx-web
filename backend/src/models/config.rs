use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NginxConfig {
    pub id: String,
    pub name: String,
    pub path: String,
    pub content: String,
    pub symlink_path: Option<String>,
    pub symlink_created: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigUpdateRequest {
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigDeployRequest {
    pub config_id: String,
    pub validate_only: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateConfigRequest {
    pub name: String,
    pub content: String,
}
