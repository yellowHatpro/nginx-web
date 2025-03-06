/**
 * API client for the Nginx Manager backend
 */
import {
  NginxConfig,
  ConfigUpdateRequest,
  ConfigDeployRequest,
  ConfigDeployResponse,
  Server,
  HealthCheckResponse,
  TrafficLog,
  TrafficStats,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Helper function to handle API responses
 */
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
};

/**
 * Health check API
 */
export const healthApi = {
  check: async (): Promise<HealthCheckResponse> => {
    const response = await fetch(`${API_URL}/health`);
    return handleResponse(response);
  },
};

/**
 * Config management API
 */
export const configApi = {
  list: async (): Promise<NginxConfig[]> => {
    const response = await fetch(`${API_URL}/config`);
    return handleResponse(response);
  },

  get: async (id: string): Promise<NginxConfig> => {
    const response = await fetch(`${API_URL}/config/${id}`);
    return handleResponse(response);
  },

  create: async (name: string, content: string): Promise<NginxConfig> => {
    const response = await fetch(`${API_URL}/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, content }),
    });
    return handleResponse(response);
  },

  update: async (
    id: string,
    data: ConfigUpdateRequest
  ): Promise<NginxConfig> => {
    const response = await fetch(`${API_URL}/config/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/config/${id}`, {
      method: "DELETE",
    });
    return handleResponse(response);
  },

  deploy: async (data: ConfigDeployRequest): Promise<ConfigDeployResponse> => {
    const response = await fetch(`${API_URL}/config/deploy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Helper methods
  updateDefault: async (content: string): Promise<{ success: boolean }> => {
    const configs = await configApi.list();
    if (!configs.length) {
      throw new Error("No Nginx configurations found");
    }
    await configApi.update(configs[0].id, { content });
    return { success: true };
  },

  deployDefault: async (): Promise<{ success: boolean; message: string }> => {
    const configs = await configApi.list();
    if (!configs.length) {
      throw new Error("No Nginx configurations found");
    }
    const result = await configApi.deploy({ config_id: configs[0].id });
    return {
      success: result.success,
      message: result.message || "",
    };
  },
};

/**
 * Traffic monitoring API
 */
export const trafficApi = {
  getLogs: async (): Promise<TrafficLog[]> => {
    const response = await fetch(`${API_URL}/traffic`);
    return handleResponse(response);
  },

  getStats: async (): Promise<TrafficStats> => {
    const response = await fetch(`${API_URL}/traffic/stats`);
    return handleResponse(response);
  },
};

/**
 * Server API
 */
export const serverApi = {
  list: async (): Promise<Server[]> => {
    const response = await fetch(`${API_URL}/load-balancer/servers`);
    return handleResponse(response);
  },

  get: async (id: string): Promise<Server> => {
    const response = await fetch(`${API_URL}/load-balancer/servers/${id}`);
    return handleResponse(response);
  },

  create: async (server: Omit<Server, "id">): Promise<Server> => {
    const response = await fetch(`${API_URL}/load-balancer/servers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(server),
    });
    return handleResponse(response);
  },

  update: async (id: string, server: Partial<Server>): Promise<Server> => {
    const response = await fetch(`${API_URL}/load-balancer/servers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(server),
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/load-balancer/servers/${id}`, {
      method: "DELETE",
    });
    return handleResponse(response);
  },

  checkHealth: async (
    id: string
  ): Promise<{ status: "healthy" | "unhealthy" }> => {
    const response = await fetch(
      `${API_URL}/load-balancer/servers/${id}/health`
    );
    return handleResponse(response);
  },
};

export default {
  health: healthApi,
  config: configApi,
  server: serverApi,
  traffic: trafficApi,
};
