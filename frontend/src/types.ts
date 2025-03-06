// Nginx Config Types
export interface NginxConfig {
  id: string;
  name: string;
  path: string;
  content: string;
  symlink_path?: string;
  symlink_created?: boolean;
}

export interface ConfigUpdateRequest {
  content: string;
}

export interface ConfigDeployRequest {
  config_id: string;
  validate_only?: boolean;
}

export interface ConfigDeployResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Traffic Types
export interface TrafficLog {
  id: string;
  timestamp: string;
  ip: string;
  method: string;
  path: string;
  status: number;
  response_time?: number;
  user_agent?: string;
  referer?: string;
  bytes_sent?: number;
  bytes_received?: number;
}

export interface TrafficStats {
  total_requests: number;
  success_requests: number;
  error_requests: number;
  avg_response_time: number;
  total_bytes_sent: number;
  requests_per_minute: number;
}

export interface TrafficQuery {
  from?: string;
  to?: string;
  ip?: string;
  status?: number;
  method?: string;
  path?: string;
  limit?: number;
}

// Server Types
export interface Server {
  id: string;
  name: string;
  ip: string;
  port: number;
  weight?: number;
  max_connections?: number;
  health_check?: HealthCheck;
  status: ServerStatus;
}

export interface HealthCheck {
  path: string;
  interval: number;
  timeout: number;
  unhealthy_threshold: number;
  healthy_threshold: number;
}

export enum ServerStatus {
  Healthy = "Healthy",
  Unhealthy = "Unhealthy",
  Unknown = "Unknown",
}

export interface ServerCreateRequest {
  name: string;
  ip: string;
  port: number;
  weight?: number;
  max_connections?: number;
  health_check?: HealthCheck;
}

export interface ServerUpdateRequest {
  name?: string;
  ip?: string;
  port?: number;
  weight?: number;
  max_connections?: number;
  health_check?: HealthCheck;
}

export interface ServerResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Health Check Types
export interface HealthCheckResponse {
  status: string;
  message: string;
  nginx_installed: boolean;
  has_configs: boolean;
  installation_instructions?: {
    ubuntu: string;
    debian: string;
    fedora: string;
    centos: string;
    macos: string;
    windows: string;
  };
  next_steps?: string;
}
