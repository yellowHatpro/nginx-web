import React, { useState, useEffect } from "react";
import { RefreshCw, AlertCircle, Download, Filter } from "lucide-react";
import { trafficApi, healthApi } from "../utils/api";
import NginxStatus from "./NginxStatus";
import { TrafficLog, TrafficStats } from "../types";

const TrafficDashboard: React.FC = () => {
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [stats, setStats] = useState<TrafficStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nginxReady, setNginxReady] = useState<boolean | null>(null);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    checkNginxStatus();
  }, []);

  useEffect(() => {
    if (nginxReady) {
      fetchData();
    }
  }, [nginxReady]);

  const checkNginxStatus = async () => {
    try {
      const response = await healthApi.check();
      setNginxReady(response.nginx_installed);
    } catch (err) {
      console.error("Failed to check Nginx status:", err);
      setError("Failed to check Nginx status. Please try again later.");
      setNginxReady(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsData, statsData] = await Promise.all([
        trafficApi.getLogs(),
        trafficApi.getStats(),
      ]);
      setLogs(logsData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch traffic data:", err);
      setError("Failed to fetch traffic data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = () => {
    const csvContent = [
      [
        "Timestamp",
        "IP",
        "Method",
        "Path",
        "Status",
        "User Agent",
        "Response Time (ms)",
      ].join(","),
      ...logs.map((log) =>
        [
          log.timestamp,
          log.ip,
          log.method,
          log.path,
          log.status,
          `"${log.user_agent ? log.user_agent.replace(/"/g, '""') : ""}"`,
          log.response_time || 0,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `nginx-logs-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((log) => {
    if (!filterText) return true;
    const searchText = filterText.toLowerCase();
    return (
      log.ip.toLowerCase().includes(searchText) ||
      log.method.toLowerCase().includes(searchText) ||
      log.path.toLowerCase().includes(searchText) ||
      log.status.toString().includes(searchText) ||
      (log.user_agent
        ? log.user_agent.toLowerCase().includes(searchText)
        : false)
    );
  });

  // If Nginx status is still being checked
  if (nginxReady === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If Nginx is not installed, show the status component
  if (!nginxReady) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Traffic Dashboard</h2>
        <NginxStatus onClose={() => checkNginxStatus()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Traffic Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            disabled={loading || logs.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Total Requests
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.total_requests}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Avg Response Time
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.avg_response_time.toFixed(2)} ms
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Success Rate
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.total_requests > 0
                    ? (
                        (stats.success_requests / stats.total_requests) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Error Rate
                </h3>
                <p className="text-3xl font-bold text-red-600">
                  {stats.total_requests > 0
                    ? (
                        (stats.error_requests / stats.total_requests) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>
          )}

          {/* Traffic Logs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Traffic Logs
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Filter logs..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Path
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Response Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ip}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.method === "GET"
                                ? "bg-green-100 text-green-800"
                                : log.method === "POST"
                                ? "bg-blue-100 text-blue-800"
                                : log.method === "PUT"
                                ? "bg-yellow-100 text-yellow-800"
                                : log.method === "DELETE"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {log.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.path}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.status < 300
                                ? "bg-green-100 text-green-800"
                                : log.status < 400
                                ? "bg-blue-100 text-blue-800"
                                : log.status < 500
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.response_time !== undefined
                            ? `${log.response_time} ms`
                            : "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        {logs.length === 0
                          ? "No logs available"
                          : "No logs match your filter"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TrafficDashboard;
