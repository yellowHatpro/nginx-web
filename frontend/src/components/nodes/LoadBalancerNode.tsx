import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Network } from "lucide-react";

export interface LoadBalancerNodeData {
  label: string;
}

const LoadBalancerNode: React.FC<NodeProps<LoadBalancerNodeData>> = ({
  data,
}) => {
  return (
    <div className="p-4 rounded-lg border-2 bg-blue-100 border-blue-500 w-60">
      <div className="flex items-center justify-center mb-2">
        <Network className="h-6 w-6 mr-2 text-blue-700" />
        <h3 className="font-medium text-blue-900">{data.label}</h3>
      </div>

      <p className="text-sm text-blue-800 text-center">
        Distributes traffic to upstream servers
      </p>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default LoadBalancerNode;
