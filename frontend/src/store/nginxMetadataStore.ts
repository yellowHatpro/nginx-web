import { create } from "zustand";

interface NginxStore {
  nginxStatus: "installed" | "not_installed" | "loading";
  nginxConfigStatus: "configured" | "not_configured" | "loading";
  nginxIsSymlinked: boolean;
  setNginxStatus: (status: "installed" | "not_installed") => void;
  setNginxConfigStatus: (status: "configured" | "not_configured") => void;
  setNginxIsSymlinked: (isSymlinked: boolean) => void;
}

const useNginxMetadataStore = create<NginxStore>((set) => ({
  nginxStatus: "loading",
  nginxConfigStatus: "loading",
  nginxIsSymlinked: false,
  setNginxStatus: (status: "installed" | "not_installed") =>
    set({ nginxStatus: status }),
  setNginxConfigStatus: (status: "configured" | "not_configured") =>
    set({ nginxConfigStatus: status }),
  setNginxIsSymlinked: (isSymlinked: boolean) =>
    set({ nginxIsSymlinked: isSymlinked }),
}));

export default useNginxMetadataStore;
