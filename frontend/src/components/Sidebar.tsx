import { Activity, Server, Settings } from "lucide-react";

import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <nav className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-8">
        <Server className="h-6 w-6 text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">Nginx Manager</h1>
      </div>
      <div className="space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <Activity className="h-5 w-5" />
          Traffic Monitor
        </Link>
        <Link
          to="/load-balancer"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <Server className="h-5 w-5" />
          Load Balancer
        </Link>
        <Link
          to="/config"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <Settings className="h-5 w-5" />
          Configuration
        </Link>
      </div>
    </nav>
  );
};

export default Sidebar;
