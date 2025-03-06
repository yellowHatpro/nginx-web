import React, { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, AlertCircle } from "lucide-react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  ConnectionLineType,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import { serverApi, healthApi } from "../utils/api";
import {
  Server,
  ServerCreateRequest,
  ServerUpdateRequest,
  ServerStatus,
} from "../types";
import ServerNode from "./nodes/ServerNode";
import LoadBalancerNode from "./nodes/LoadBalancerNode";
import NginxStatus from "./NginxStatus";

// Define custom node types
const nodeTypes = {
  server: ServerNode,
  loadBalancer: LoadBalancerNode,
};

function LoadBalancer() {
  const [servers, setServers] = useState<Server[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [nginxReady, setNginxReady] = useState<boolean | null>(null);

  useEffect(() => {
    checkNginxStatus();
  }, []);

  useEffect(() => {
    if (nginxReady) {
      fetchServers();
    }
  }, [nginxReady]);

  useEffect(() => {
    // Convert servers to nodes and edges
    if (servers.length > 0) {
      convertServersToFlow(servers);
    }
  }, [servers]);

  const checkNginxStatus = async () => {
    try {
      const response = await healthApi.check();
      setNginxReady(response.nginx_installed && response.has_configs);
    } catch (err) {
      console.error("Failed to check Nginx status:", err);
      setError("Failed to check Nginx status. Please try again later.");
      setNginxReady(false);
    }
  };

  const fetchServers = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedServers = await serverApi.list();
      setServers(fetchedServers);
    } catch (err) {
      console.error("Failed to fetch load balancer servers:", err);
      setError(
        "Failed to fetch load balancer servers. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const convertServersToFlow = (servers: Server[]) => {
    // Create load balancer node
    const newNodes: Node[] = [
      {
        id: "load-balancer",
        type: "loadBalancer",
        data: { label: "Nginx Load Balancer" },
        position: { x: 250, y: 50 },
        className: "bg-blue-100 border-2 border-blue-500 rounded-lg px-4 py-2",
      },
    ];

    // Create server nodes
    const newEdges: Edge[] = [];

    servers.forEach((server, index) => {
      const nodeId = `server-${server.id}`;
      const xPos = 100 + (index % 3) * 200;
      const yPos = 200 + Math.floor(index / 3) * 150;

      // Add server node
      newNodes.push({
        id: nodeId,
        type: "server",
        data: {
          server,
          onUpdate: handleUpdateServer,
          onDelete: handleDeleteServer,
        },
        position: { x: xPos, y: yPos },
      });

      // Add edge from load balancer to server
      newEdges.push({
        id: `edge-lb-${nodeId}`,
        source: "load-balancer",
        target: nodeId,
        animated: true,
        style: { stroke: "#2563eb" },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "#2563eb",
        },
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleAddServer = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const newServer = {
        name: `Server ${servers.length + 1}`,
        ip: "",
        port: 80,
        weight: 1,
        max_connections: 100,
        status: ServerStatus.Unknown,
        health_check: {
          path: "/health",
          interval: 30,
          timeout: 5,
          unhealthy_threshold: 3,
          healthy_threshold: 2,
        },
      };

      await serverApi.create(newServer);
      setSuccessMessage("Server added successfully!");
      fetchServers(); // Refresh the server list

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to add server:", err);
      setError("Failed to add server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateServer = async (
    id: string,
    updates: ServerUpdateRequest
  ) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await serverApi.update(id, updates);
      setSuccessMessage("Server updated successfully!");
      fetchServers(); // Refresh the server list

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update server:", err);
      setError("Failed to update server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteServer = async (id: string) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await serverApi.delete(id);
      setSuccessMessage("Server deleted successfully!");
      fetchServers(); // Refresh the server list

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to delete server:", err);
      setError("Failed to delete server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "#2563eb" },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: "#2563eb",
            },
          },
          eds
        )
      ),
    []
  );

  // If Nginx status is still being checked
  if (nginxReady === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If Nginx is not ready, show the status component
  if (!nginxReady) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Load Balancer Configuration
        </h2>
        <NginxStatus onClose={() => checkNginxStatus()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Load Balancer Configuration
        </h2>
        <div className="flex gap-2">
          <button
            onClick={fetchServers}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleAddServer}
            disabled={saving || loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Server
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-[600px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
          >
            <Controls />
            <Background color="#f1f5f9" gap={16} />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}

export default LoadBalancer;
