import { useEffect } from "react";
import {
  File,
  Save,
  Plus,
  RefreshCw,
  AlertCircle,
  Check,
  Trash2,
  Play,
  Info,
} from "lucide-react";
import { configApi } from "../utils/api";
import NginxStatus from "./NginxStatus";
import CreateConfigModal from "./CreateConfigModal";
import { useConfigStore } from "../store/configStore";

function ConfigManager() {
  const {
    configs,
    selectedConfig,
    editedContent,
    loading,
    saving,
    deleting,
    deploying,
    error,
    successMessage,
    nginxReady,
    isCreateModalOpen,
    isCreating,
    showSymlinkInfo,
    checkNginxStatus,
    fetchConfigs,
    saveConfig,
    createConfig,
    deleteConfig,
    deployConfig,
    setSelectedConfig,
    setEditedContent,
    setCreateModalOpen,
    setShowSymlinkInfo,
    setError,
  } = useConfigStore();

  useEffect(() => {
    checkNginxStatus();
  }, []);

  useEffect(() => {
    if (nginxReady) {
      fetchConfigs();
    }
  }, [nginxReady]);

  const handleCreateConfig = () => {
    setCreateModalOpen(true);
  };

  const handleCreateConfigSubmit = async (name: string, content: string) => {
    await createConfig(name, content);
  };

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
        <h2 className="text-2xl font-bold text-gray-900">
          Configuration Manager
        </h2>
        <NginxStatus onClose={() => checkNginxStatus()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showSymlinkInfo && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-start">
          <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">
              Important: Nginx Configuration Permissions
            </p>
            <p className="text-sm">
              Configurations are stored in{" "}
              <code className="bg-blue-100 px-1 rounded">
                ~/.nginx-web/configs
              </code>{" "}
              but Nginx needs access to them. After creating a configuration,
              you'll need to create a symlink with this command:
            </p>
            <p className="text-sm mt-2">
              Replace{" "}
              <code className="bg-blue-100 px-1 rounded">your-config.conf</code>{" "}
              with your actual configuration filename.
            </p>
            <button
              onClick={() => setShowSymlinkInfo(false)}
              className="text-sm text-blue-600 hover:text-blue-800 mt-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Configuration Manager
        </h2>
        <div className="flex gap-2">
          <button
            onClick={fetchConfigs}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleCreateConfig}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Config
          </button>
          <button
            onClick={saveConfig}
            disabled={saving || loading || !selectedConfig}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
          <button
            onClick={deployConfig}
            disabled={deploying || saving || loading || !selectedConfig}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Play className="h-4 w-4 mr-2" />
            Deploy
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
      ) : configs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">No configuration files found.</p>
          <button
            onClick={handleCreateConfig}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Configuration
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {/* Config Files List */}
          <div className="col-span-1 bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Configuration Files</h3>
            <div className="space-y-2">
              {configs.map((config) => (
                <button
                  key={config.id}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${
                    selectedConfig?.id === config.id
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                  onClick={async () => {
                    try {
                      const fullConfig = await configApi.get(config.id);
                      setSelectedConfig(fullConfig);
                      setEditedContent(fullConfig.content);
                    } catch (err) {
                      console.error("Failed to fetch config:", err);
                      setError("Failed to fetch config details.");
                    }
                  }}
                >
                  <File className="h-5 w-5" />
                  <div className="flex-1 text-left">
                    {config.name}
                    {config.symlink_created !== undefined && (
                      <span
                        className={`ml-2 inline-block px-1.5 py-0.5 text-xs rounded-full ${
                          config.symlink_created
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {config.symlink_created ? "Linked" : "Not Linked"}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Config Editor */}
          <div className="col-span-3 bg-white rounded-lg shadow p-4">
            {selectedConfig ? (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedConfig.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedConfig.path}
                    </p>
                    {selectedConfig.symlink_created !== undefined && (
                      <div className="mt-1">
                        {selectedConfig.symlink_created ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            Symlink created at {selectedConfig.symlink_path}
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Symlink not created
                            </span>
                            {selectedConfig.symlink_path && (
                              <div className="mt-1 text-xs text-gray-600">
                                Run this command to create the symlink:
                                <pre className="mt-1 bg-gray-100 p-1 rounded overflow-x-auto">
                                  {`sudo bash -c 'mkdir -p ${selectedConfig.symlink_path.substring(
                                    0,
                                    selectedConfig.symlink_path.lastIndexOf("/")
                                  )} && [ -e ${
                                    selectedConfig.symlink_path
                                  } ] && rm ${
                                    selectedConfig.symlink_path
                                  } ; ln -s ${selectedConfig.path} ${
                                    selectedConfig.symlink_path
                                  }'`}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={deployConfig}
                      disabled={deploying}
                      className="inline-flex items-center px-3 py-1 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Deploy
                    </button>
                    <button
                      onClick={deleteConfig}
                      disabled={deleting}
                      className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Configuration
                  </label>
                  <textarea
                    className="w-full h-96 font-mono text-sm p-4 border rounded-lg"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    disabled={saving || deleting || deploying}
                  />
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center h-64 text-gray-500">
                Select a configuration file to edit
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Config Modal */}
      <CreateConfigModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateConfigSubmit}
        isLoading={isCreating}
      />
    </div>
  );
}

export default ConfigManager;
