import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import TrafficDashboard from "./components/TrafficDashboard";
import LoadBalancer from "./components/LoadBalancer";
import ConfigManager from "./components/ConfigManager";
import useNginxMetadataStore from "./store/nginxMetadataStore";
import { useEffect } from "react";
import { healthApi } from "./utils/api";
function App() {
  // check nginx status
  const { setNginxStatus, setNginxConfigStatus, setNginxIsSymlinked } =
    useNginxMetadataStore();

  const checkNginxStatus = async () => {
    const response = await healthApi.check();
    setNginxStatus(response.nginx_installed ? "installed" : "not_installed");
    setNginxConfigStatus(
      response.has_configs ? "configured" : "not_configured"
    );
    setNginxIsSymlinked(response.nginx_installed);
  };

  useEffect(() => {
    checkNginxStatus();
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<TrafficDashboard />} />
          <Route path="/load-balancer" element={<LoadBalancer />} />
          <Route path="/config" element={<ConfigManager />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
