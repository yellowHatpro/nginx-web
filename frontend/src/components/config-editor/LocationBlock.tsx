import React, { useState } from "react";
import { ChevronDown, ChevronRight, Edit, Save, X } from "lucide-react";

interface LocationBlockProps {
  block: {
    content: string;
  };
  onChange: (updatedBlock: any) => void;
}

const LocationBlock: React.FC<LocationBlockProps> = ({ block, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(block.content);

  // Extract location path
  const locationMatch = block.content.match(/location\s+([^{]+)\s*{/);
  const locationPath = locationMatch ? locationMatch[1].trim() : "/";

  // Extract proxy_pass if exists
  const proxyPassMatch = block.content.match(/proxy_pass\s+([^;]+);/);
  const proxyPass = proxyPassMatch ? proxyPassMatch[1].trim() : "";

  const handleSave = () => {
    const updatedBlock = {
      ...block,
      content: editedContent,
    };
    onChange(updatedBlock);
    setIsEditing(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-2">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
          <h5 className="text-sm font-medium text-gray-900 ml-2">
            {locationPath}
          </h5>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit className="h-3 w-3" />
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="text-green-600 hover:text-green-800"
            >
              <Save className="h-3 w-3" />
            </button>
            <button
              onClick={() => {
                setEditedContent(block.content);
                setIsEditing(false);
              }}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="mt-2 pl-5">
          {isEditing ? (
            <textarea
              className="w-full h-32 p-2 border border-gray-300 rounded-md font-mono text-sm"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
          ) : (
            <div className="space-y-2">
              {proxyPass && (
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Proxy Pass
                  </label>
                  <div className="mt-1 text-xs text-gray-900 bg-gray-50 p-1 rounded">
                    {proxyPass}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Raw Configuration
                </label>
                <pre className="mt-1 text-xs text-gray-900 bg-gray-50 p-1 rounded overflow-x-auto">
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

export default LocationBlock;
