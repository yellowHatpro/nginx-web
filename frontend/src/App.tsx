import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import TrafficDashboard from "./components/TrafficDashboard";
import LoadBalancer from "./components/LoadBalancer";
import ConfigManager from "./components/ConfigManager";

function App() {
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
