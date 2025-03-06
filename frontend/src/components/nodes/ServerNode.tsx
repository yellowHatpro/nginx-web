import React, { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Server } from "lucide-react";

export interface ServerNodeData {
  server: {
    id: string;
    name: string;
    ip: string;
    port: number;
    status: string;
    weight?: number;
    max_connections?: number;
  };
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}

const ServerNode: React.FC<NodeProps<ServerNodeData>> = ({ data }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    name: data.server.name,
    ip: data.server.ip,
    port: data.server.port,
    weight: data.server.weight || 1,
    max_connections: data.server.max_connections || 100,
  });

  const getStatusColor = () => {
    switch (data.server.status.toLowerCase()) {
      case "up":
      case "healthy":
        return "bg-green-100 border-green-500";
      case "down":
      case "unhealthy":
        return "bg-red-100 border-red-500";
      case "warning":
        return "bg-yellow-100 border-yellow-500";
      default:
        return "bg-gray-100 border-gray-500";
    }
  };

  const handleSave = () => {
    data.onUpdate(data.server.id, editValues);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues({
      name: data.server.name,
      ip: data.server.ip,
      port: data.server.port,
      weight: data.server.weight || 1,
      max_connections: data.server.max_connections || 100,
    });
    setIsEditing(false);
  };

  return (
    <div className={`p-3 rounded-lg border-2 ${getStatusColor()} w-60`}>
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Server className="h-5 w-5 mr-2 text-gray-700" />
          {!isEditing ? (
            <h3 className="font-medium text-gray-900">{data.server.name}</h3>
          ) : (
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              value={editValues.name}
              onChange={(e) =>
                setEditValues({ ...editValues, name: e.target.value })
              }
            />
          )}
        </div>

        {!isEditing ? (
          <button
            className="text-blue-600 text-xs"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        ) : (
          <div className="flex space-x-1">
            <button className="text-green-600 text-xs" onClick={handleSave}>
              Save
            </button>
            <button className="text-gray-600 text-xs" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-1 text-sm">
          <p className="text-gray-700">
            <span className="font-medium">Address:</span> {data.server.ip}:
            {data.server.port}
          </p>
          {data.server.weight && (
            <p className="text-gray-700">
              <span className="font-medium">Weight:</span> {data.server.weight}
            </p>
          )}
          {data.server.max_connections && (
            <p className="text-gray-700">
              <span className="font-medium">Max Conn:</span>{" "}
              {data.server.max_connections}
            </p>
          )}
          <p className="text-gray-700">
            <span className="font-medium">Status:</span> {data.server.status}
          </p>
          <button
            className="mt-2 text-red-600 text-xs"
            onClick={() => data.onDelete(data.server.id)}
          >
            Remove Server
          </button>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-700">
              IP Address
            </label>
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              value={editValues.ip}
              onChange={(e) =>
                setEditValues({ ...editValues, ip: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Port
            </label>
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              type="number"
              value={editValues.port}
              onChange={(e) =>
                setEditValues({
                  ...editValues,
                  port: parseInt(e.target.value) || 80,
                })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Weight
            </label>
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              type="number"
              value={editValues.weight}
              onChange={(e) =>
                setEditValues({
                  ...editValues,
                  weight: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Max Connections
            </label>
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              type="number"
              value={editValues.max_connections}
              onChange={(e) =>
                setEditValues({
                  ...editValues,
                  max_connections: parseInt(e.target.value) || 100,
                })
              }
            />
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default ServerNode;
