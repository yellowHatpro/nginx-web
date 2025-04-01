import { create } from "zustand";
import { configApi, healthApi } from "../utils/api";
import { NginxConfig } from "../types";

interface ConfigState {
  // States
  configs: NginxConfig[];
  selectedConfig: NginxConfig | null;
  editedContent: string;
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  deploying: boolean;
  error: string | null;
  successMessage: string | null;
  nginxReady: boolean | null;
  isCreateModalOpen: boolean;
  isCreating: boolean;
  showSymlinkInfo: boolean;

  // Actions
  checkNginxStatus: () => Promise<void>;
  fetchConfigs: () => Promise<void>;
  saveConfig: () => Promise<void>;
  createConfig: (name: string, content: string) => Promise<void>;
  deleteConfig: () => Promise<void>;
  deployConfig: () => Promise<void>;
  setSelectedConfig: (config: NginxConfig) => void;
  setEditedContent: (content: string) => void;
  setCreateModalOpen: (isOpen: boolean) => void;
  setShowSymlinkInfo: (show: boolean) => void;
  setError: (error: string | null) => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  // Initial states
  configs: [],
  selectedConfig: null,
  editedContent: "",
  loading: false,
  saving: false,
  deleting: false,
  deploying: false,
  error: null,
  successMessage: null,
  nginxReady: null,
  isCreateModalOpen: false,
  isCreating: false,
  showSymlinkInfo: true,

  // Actions
  checkNginxStatus: async () => {
    try {
      const response = await healthApi.check();
      set({ nginxReady: response.nginx_installed });
    } catch (err) {
      console.error("Failed to check Nginx status:", err);
      set({
        error: "Failed to check Nginx status. Please try again later.",
        nginxReady: false,
      });
    }
  },

  fetchConfigs: async () => {
    set({ loading: true, error: null });
    try {
      const fetchedConfigs = await configApi.list();
      set({ configs: fetchedConfigs });

      if (fetchedConfigs.length > 0) {
        const config = await configApi.get(fetchedConfigs[0].id);
        set({
          selectedConfig: config,
          editedContent: config.content,
        });
      } else {
        set({
          selectedConfig: null,
          editedContent: "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch configurations:", err);
      set({ error: "Failed to fetch configurations. Please try again later." });
    } finally {
      set({ loading: false });
    }
  },

  saveConfig: async () => {
    const { selectedConfig, editedContent } = get();
    if (!selectedConfig) return;

    set({ saving: true, error: null, successMessage: null });
    try {
      await configApi.update(selectedConfig.id, { content: editedContent });
      set({ successMessage: "Configuration saved successfully!" });
      setTimeout(() => set({ successMessage: null }), 3000);
    } catch (err) {
      console.error("Failed to save configuration:", err);
      set({
        error:
          "Failed to save configuration. Please check syntax and try again.",
      });
    } finally {
      set({ saving: false });
    }
  },

  createConfig: async (name: string, content: string) => {
    set({ isCreating: true, error: null, successMessage: null });
    try {
      const newConfig = await configApi.create(name, content);
      set({
        successMessage: "Configuration created successfully!",
        selectedConfig: newConfig,
        editedContent: newConfig.content,
        isCreateModalOpen: false,
      });

      // Refresh the config list
      await get().fetchConfigs();

      setTimeout(() => set({ successMessage: null }), 3000);
    } catch (err) {
      console.error("Failed to create configuration:", err);
      set({ error: "Failed to create configuration. Please try again." });
    } finally {
      set({ isCreating: false });
    }
  },

  deleteConfig: async () => {
    const { selectedConfig } = get();
    if (!selectedConfig) return;

    if (
      !window.confirm(`Are you sure you want to delete ${selectedConfig.name}?`)
    ) {
      return;
    }

    set({ deleting: true, error: null, successMessage: null });
    try {
      await configApi.delete(selectedConfig.id);
      set({ successMessage: "Configuration deleted successfully!" });

      // Refresh the config list
      await get().fetchConfigs();

      setTimeout(() => set({ successMessage: null }), 3000);
    } catch (err) {
      console.error("Failed to delete configuration:", err);
      set({ error: "Failed to delete configuration. Please try again." });
    } finally {
      set({ deleting: false });
    }
  },

  deployConfig: async () => {
    const { selectedConfig, editedContent } = get();
    if (!selectedConfig) return;

    if (
      !window.confirm(
        "Are you sure you want to deploy this configuration to the Nginx server? This will reload Nginx."
      )
    ) {
      return;
    }

    set({ deploying: true, error: null, successMessage: null });
    try {
      // First save any changes
      await configApi.update(selectedConfig.id, { content: editedContent });

      // Then deploy
      const result = await configApi.deploy({ config_id: selectedConfig.id });

      if (result.success) {
        set({
          successMessage: `Configuration deployed successfully! ${
            result.message || ""
          }`,
        });
      } else {
        set({
          error: `Failed to deploy configuration: ${
            result.message || "Unknown error"
          }`,
        });
      }
    } catch (err) {
      console.error("Failed to deploy configuration:", err);
      set({ error: "Failed to deploy configuration. Please try again later." });
    } finally {
      set({ deploying: false });
    }
  },

  // Simple setters
  setSelectedConfig: (config: NginxConfig) => set({ selectedConfig: config }),
  setEditedContent: (content: string) => set({ editedContent: content }),
  setCreateModalOpen: (isOpen: boolean) => set({ isCreateModalOpen: isOpen }),
  setShowSymlinkInfo: (show: boolean) => set({ showSymlinkInfo: show }),
  setError: (error: string | null) => set({ error }),
}));
