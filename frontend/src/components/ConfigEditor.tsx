import React, { useState, useEffect } from "react";
import {
  Save,
  RefreshCw,
  AlertCircle,
  Code,
  Eye,
  Check,
  AlertTriangle,
} from "lucide-react";
import { configApi } from "../utils/api";
import { NginxConfig } from "../types";
import VisualEditor from "./config-editor/VisualEditor";

const ConfigEditor: React.FC = () => {
  const [config, setConfig] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"code" | "visual">("code");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await configApi.getConfig();
      setConfig(response.content);
    } catch (err) {
      setError(
        "Failed to load configuration: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await configApi.updateConfig({ content: config });
      setSuccess("Configuration saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        "Failed to save configuration: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeploy = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await configApi.deployConfig();
      setSuccess("Configuration deployed successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        "Failed to deploy configuration: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfigChange = (newConfig: string) => {
    setConfig(newConfig);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Nginx Configuration</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode("code")}
            className={`px-3 py-1 rounded flex items-center ${
              viewMode === "code"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            <Code className="h-4 w-4 mr-1" />
            Code
          </button>
          <button
            onClick={() => setViewMode("visual")}
            className={`px-3 py-1 rounded flex items-center ${
              viewMode === "visual"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            <Eye className="h-4 w-4 mr-1" />
            Visual
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="px-3 py-1 bg-green-600 text-white rounded flex items-center hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </button>
          <button
            onClick={handleDeploy}
            disabled={isLoading || isSaving}
            className="px-3 py-1 bg-purple-600 text-white rounded flex items-center hover:bg-purple-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4 mr-1" />
            Deploy
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
          <Check className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg">
          {viewMode === "code" ? (
            <textarea
              className="w-full h-96 p-4 font-mono text-sm"
              value={config}
              onChange={(e) => handleConfigChange(e.target.value)}
              disabled={isSaving}
            />
          ) : (
            <div className="p-4">
              <VisualEditor config={config} onChange={handleConfigChange} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConfigEditor;
