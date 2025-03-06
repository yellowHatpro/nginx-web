import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Save,
  X,
  Plus,
  Trash,
} from "lucide-react";

interface UpstreamBlockProps {
  block: {
    content: string;
    full: string;
  };
  onChange: (updatedBlock: any) => void;
}

const UpstreamBlock: React.FC<UpstreamBlockProps> = ({ block, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(block.content);

  // Extract upstream name
  const upstreamNameMatch = block.full.match(/upstream\s+([^\s{]+)\s*{/);
  const upstreamName = upstreamNameMatch
    ? upstreamNameMatch[1].trim()
    : "Unknown";

  // Extract server entries
  const serverEntries: string[] = [];
  const serverRegex = /server\s+([^;]+);/g;
  let match;
  while ((match = serverRegex.exec(block.content)) !== null) {
    serverEntries.push(match[1].trim());
  }

  const handleSave = () => {
    const updatedBlock = {
      ...block,
      content: editedContent,
    };
    onChange(updatedBlock);
    setIsEditing(false);
  };

  const handleAddServer = () => {
    const newServer = "server 127.0.0.1:8080;";
    const updatedContent = editedContent + "\n    " + newServer;
    setEditedContent(updatedContent);
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
            Upstream: {upstreamName}
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
                setEditedContent(block.content);
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
            <div>
              <textarea
                className="w-full h-40 p-2 border border-gray-300 rounded-md font-mono text-sm"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
              <button
                onClick={handleAddServer}
                className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Server
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Servers
                </h5>
                {serverEntries.length > 0 ? (
                  <ul className="space-y-2">
                    {serverEntries.map((server, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm"
                      >
                        <span>{server}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No servers defined</p>
                )}
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Raw Configuration
                </h5>
                <pre className="bg-gray-50 p-2 rounded text-sm overflow-x-auto">
                  {block.content}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UpstreamBlock;
