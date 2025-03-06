import React, { useState } from "react";
import { X, Info } from "lucide-react";

interface CreateConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, content: string) => void;
  isLoading: boolean;
}

const defaultNginxConfig = `# Default Nginx configuration
http {
    server {
        listen 80;
        server_name example.com;

        location / {
            root /var/www/html;
            index index.html;
        }
    }
}
`;

const CreateConfigModal: React.FC<CreateConfigModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [configName, setConfigName] = useState("nginx.conf");
  const [configContent, setConfigContent] = useState(defaultNginxConfig);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(configName, configContent);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Create New Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg flex items-start">
            <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">
                Important: Nginx Configuration Permissions
              </p>
              <p>
                After creating this configuration, you'll need to create a
                symlink for Nginx to access it:
              </p>
              <pre className="bg-blue-100 p-2 rounded mt-2 text-xs overflow-x-auto">
                {`sudo bash -c 'mkdir -p /usr/local/etc/nginx && [ -e /usr/local/etc/nginx/${configName} ] && rm /usr/local/etc/nginx/${configName} ; ln -s ~/.nginx-web/configs/${configName} /usr/local/etc/nginx/${configName}'`}
              </pre>
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="configName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Configuration Name
            </label>
            <input
              id="configName"
              type="text"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="configContent"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Configuration Content
            </label>
            <textarea
              id="configContent"
              value={configContent}
              onChange={(e) => setConfigContent(e.target.value)}
              className="w-full h-80 px-3 py-2 border border-gray-300 rounded-md shadow-sm font-mono text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateConfigModal;
