import React, { useState, useEffect } from "react";
import { Server, Clock, RefreshCw } from "lucide-react";
import {
  healthApi,
  trafficApi,
  configApi,
  loadBalancerApi,
} from "../utils/api";
import { TrafficStats, Server as ServerType, ServerStatus } from "../types";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<string>("Unknown");
  const [trafficStats, setTrafficStats] = useState<TrafficStats | null>(null);
  const [configCount, setConfigCount] = useState<number>(0);
  const [servers, setServers] = useState<ServerType[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch health status
      const health = await healthApi.check();
      setHealthStatus(health.status);

      // Fetch traffic stats
      const stats = await trafficApi.getStats();
      setTrafficStats(stats);

      // Fetch config count
      const configs = await configApi.list();
      setConfigCount(configs.length);

      // Fetch servers
      const serverList = await loadBalancerApi.listServers();
      setServers(serverList);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to fetch dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getServerStatusCounts = () => {
    const counts = {
      healthy: 0,
      unhealthy: 0,
      unknown: 0,
    };

    servers.forEach((server) => {
      if (server.status === ServerStatus.Healthy) {
        counts.healthy++;
      } else if (server.status === ServerStatus.Unhealthy) {
        counts.unhealthy++;
      } else {
        counts.unknown++;
      }
    });

    return counts;
  };

  const serverCounts = getServerStatusCounts();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                System Status
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Health Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div
                      className={`rounded-full h-3 w-3 mr-2 ${
                        healthStatus === "OK" ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <h4 className="text-sm font-medium text-gray-500">
                      System Health
                    </h4>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {healthStatus}
                  </p>
                </div>

                {/* Config Count */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Server className="h-4 w-4 text-gray-400 mr-2" />
                    <h4 className="text-sm font-medium text-gray-500">
                      Nginx Configs
                    </h4>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {configCount}
                  </p>
                </div>

                {/* Server Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Server className="h-4 w-4 text-gray-400 mr-2" />
                    <h4 className="text-sm font-medium text-gray-500">
                      Servers
                    </h4>
                  </div>
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
                      <span className="text-sm text-gray-600">
                        {serverCounts.healthy}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
                      <span className="text-sm text-gray-600">
                        {serverCounts.unhealthy}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-gray-300 mr-1"></div>
                      <span className="text-sm text-gray-600">
                        {serverCounts.unknown}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Response Time */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <h4 className="text-sm font-medium text-gray-500">
                      Avg Response Time
                    </h4>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {trafficStats
                      ? `${trafficStats.avg_response_time.toFixed(2)}ms`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {trafficStats && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Traffic Overview
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Requests */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500">
                      Total Requests
                    </h4>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      {trafficStats.total_requests}
                    </p>
                  </div>

                  {/* Success Rate */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500">
                      Success Rate
                    </h4>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      {trafficStats.total_requests > 0
                        ? `${(
                            (trafficStats.success_requests /
                              trafficStats.total_requests) *
                            100
                          ).toFixed(1)}%`
                        : "N/A"}
                    </p>
                  </div>

                  {/* Requests Per Minute */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500">
                      Requests Per Minute
                    </h4>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      {trafficStats.requests_per_minute.toFixed(1)}
                    </p>
                  </div>

                  {/* Data Transfer */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500">
                      Data Transferred
                    </h4>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      {(trafficStats.total_bytes_sent / (1024 * 1024)).toFixed(
                        2
                      )}{" "}
                      MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
