import React, { useState } from "react";
import { ChevronDown, ChevronRight, Edit, Save, X } from "lucide-react";
import LocationBlock from "./LocationBlock";

interface ServerBlockProps {
  block: {
    content: string;
    full: string;
  };
  onChange: (updatedBlock: any) => void;
}

const ServerBlock: React.FC<ServerBlockProps> = ({ block, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(block.content);

  // Extract server name and port from content
  const serverNameMatch = block.content.match(/server_name\s+([^;]+);/);
  const serverName = serverNameMatch ? serverNameMatch[1].trim() : "Unknown";

  const listenMatch = block.content.match(/listen\s+([^;]+);/);
  const port = listenMatch ? listenMatch[1].trim() : "80";

  // Extract location blocks
  const locationBlocks: string[] = [];
  const locationRegex = /location\s+([^{]+)\s*{([^}]*)}/g;
  let match;
  while ((match = locationRegex.exec(block.content)) !== null) {
    locationBlocks.push(match[0]);
  }

  const handleSave = () => {
    const updatedBlock = {
      ...block,
      content: editedContent,
    };
    onChange(updatedBlock);
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
            {serverName} (Port: {port})
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
            <textarea
              className="w-full h-40 p-2 border border-gray-300 rounded-md font-mono text-sm"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Server Name
                  </label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {serverName}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Port
                  </label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {port}
                  </div>
                </div>
              </div>

              {locationBlocks.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Location Blocks
                  </h5>
                  <div className="space-y-2">
                    {locationBlocks.map((locationBlock, index) => (
                      <LocationBlock
                        key={index}
                        block={{ content: locationBlock }}
                        onChange={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServerBlock;
