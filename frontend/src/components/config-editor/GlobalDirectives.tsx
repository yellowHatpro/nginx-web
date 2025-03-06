import React, { useState } from "react";
import { ChevronDown, ChevronRight, Edit, Save, X } from "lucide-react";

interface GlobalDirectivesProps {
  content: string;
  onChange: (updatedContent: string) => void;
}

const GlobalDirectives: React.FC<GlobalDirectivesProps> = ({
  content,
  onChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  // Extract common directives
  const workerProcessesMatch = content.match(/worker_processes\s+([^;]+);/);
  const workerProcesses = workerProcessesMatch
    ? workerProcessesMatch[1].trim()
    : "auto";

  const workerConnectionsMatch = content.match(/worker_connections\s+([^;]+);/);
  const workerConnections = workerConnectionsMatch
    ? workerConnectionsMatch[1].trim()
    : "1024";

  const keepaliveTimeoutMatch = content.match(/keepalive_timeout\s+([^;]+);/);
  const keepaliveTimeout = keepaliveTimeoutMatch
    ? keepaliveTimeoutMatch[1].trim()
    : "65";

  const handleSave = () => {
    onChange(editedContent);
    setIsEditing(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
          <h4 className="text-md font-medium text-gray-900 ml-2">
            Global Directives
          </h4>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="text-green-600 hover:text-green-800"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setEditedContent(content);
                setIsEditing(false);
              }}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="mt-3 pl-6">
          {isEditing ? (
            <textarea
              className="w-full h-40 p-2 border border-gray-300 rounded-md font-mono text-sm"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Worker Processes
                  </label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {workerProcesses}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Worker Connections
                  </label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {workerConnections}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Keepalive Timeout
                  </label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {keepaliveTimeout}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Raw Configuration
                </label>
                <pre className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded overflow-x-auto">
                  {content}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalDirectives;
