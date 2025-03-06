import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { healthApi } from "../utils/api";
import { HealthCheckResponse } from "../types";

interface NginxStatusProps {
  onClose?: () => void;
}

const NginxStatus: React.FC<NginxStatusProps> = ({ onClose }) => {
  const [healthCheck, setHealthCheck] = useState<HealthCheckResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkNginxStatus();
  }, []);

  const checkNginxStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await healthApi.check();
      setHealthCheck(response);
    } catch (err) {
      console.error("Failed to check Nginx status:", err);
      setError("Failed to check Nginx status. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start space-x-3 text-red-600">
          <AlertCircle className="h-6 w-6 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium">Error</h3>
            <p className="mt-1">{error}</p>
            <button
              onClick={checkNginxStatus}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!healthCheck) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-6">
        {/* Status Header */}
        <div className="flex items-start space-x-3">
          {healthCheck.nginx_installed ? (
            <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
          ) : (
            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
          )}
          <div>
            <h3 className="text-lg font-medium">
              {healthCheck.nginx_installed
                ? "Nginx is installed"
                : "Nginx is not installed"}
            </h3>
            <p className="mt-1 text-gray-600">{healthCheck.message}</p>
          </div>
        </div>

        {/* Installation Instructions */}
        {!healthCheck.nginx_installed &&
          healthCheck.installation_instructions && (
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-gray-900">
                Installation Instructions
              </h4>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h5 className="font-medium mb-2">
                  Select your operating system:
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {Object.entries(healthCheck.installation_instructions).map(
                    ([os, instructions]) => (
                      <button
                        key={os}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => {
                          const instructionsElement = document.getElementById(
                            "installation-instructions"
                          );
                          if (instructionsElement) {
                            instructionsElement.textContent = instructions;
                          }
                        }}
                      >
                        {os.charAt(0).toUpperCase() + os.slice(1)}
                      </button>
                    )
                  )}
                </div>

                <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
                  <pre
                    id="installation-instructions"
                    className="whitespace-pre-wrap"
                  >
                    {Object.values(healthCheck.installation_instructions)[0]}
                  </pre>
                </div>

                <p className="mt-4 text-sm text-gray-600 flex items-center">
                  <Terminal className="h-4 w-4 mr-2" />
                  Copy and paste these commands into your terminal to install
                  Nginx
                </p>
              </div>
            </div>
          )}

        {/* Next Steps */}
        {healthCheck.next_steps && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Next Steps</h4>
            <p className="text-blue-700">{healthCheck.next_steps}</p>
          </div>
        )}

        {/* Configuration Status */}
        {healthCheck.nginx_installed && (
          <div className="mt-4 flex items-start space-x-3">
            {healthCheck.has_configs ? (
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
            )}
            <div>
              <h3 className="text-lg font-medium">
                {healthCheck.has_configs
                  ? "Configuration files found"
                  : "No configuration files found"}
              </h3>
              <p className="mt-1 text-gray-600">
                {healthCheck.has_configs
                  ? "Your Nginx configuration files are ready to be managed."
                  : "No Nginx configuration files were found. You can create a new configuration file to get started."}
              </p>
            </div>
          </div>
        )}

        {/* Documentation Link */}
        <div className="mt-6">
          <a
            href="https://nginx.org/en/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Nginx Documentation
          </a>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={checkNginxStatus}
            className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Check Again
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NginxStatus;
