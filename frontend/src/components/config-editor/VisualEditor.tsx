import React, { useState } from "react";
import ServerBlock from "./ServerBlock";
import UpstreamBlock from "./UpstreamBlock";
import GlobalDirectives from "./GlobalDirectives";
import { Plus } from "lucide-react";

interface VisualEditorProps {
  config: string;
  onChange: (updatedConfig: string) => void;
}

interface ConfigBlock {
  type: "server" | "upstream" | "global";
  content: string;
  full: string;
}

const VisualEditor: React.FC<VisualEditorProps> = ({ config, onChange }) => {
  // Parse config into blocks
  const [blocks, setBlocks] = useState<ConfigBlock[]>(() =>
    parseConfig(config)
  );
  const [globalDirectives, setGlobalDirectives] = useState<string>(() => {
    const globalContent = extractGlobalDirectives(config);
    return globalContent;
  });

  // Function to parse Nginx config into blocks
  function parseConfig(configText: string): ConfigBlock[] {
    const blocks: ConfigBlock[] = [];

    // Extract server blocks
    const serverRegex = /server\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g;
    let serverMatch;
    while ((serverMatch = serverRegex.exec(configText)) !== null) {
      blocks.push({
        type: "server",
        content: serverMatch[1].trim(),
        full: serverMatch[0],
      });
    }

    // Extract upstream blocks
    const upstreamRegex = /upstream\s+([^\s{]+)\s*{([^}]*)}/g;
    let upstreamMatch;
    while ((upstreamMatch = upstreamRegex.exec(configText)) !== null) {
      blocks.push({
        type: "upstream",
        content: upstreamMatch[2].trim(),
        full: upstreamMatch[0],
      });
    }

    return blocks;
  }

  // Function to extract global directives (everything not in server or upstream blocks)
  function extractGlobalDirectives(configText: string): string {
    // Remove all server and upstream blocks
    let globalContent = configText
      .replace(/server\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g, "")
      .replace(/upstream\s+([^\s{]+)\s*{([^}]*)}/g, "")
      .trim();

    return globalContent;
  }

  // Function to update a block
  const handleBlockUpdate = (index: number, updatedBlock: ConfigBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);

    // Reconstruct the full config
    updateFullConfig(newBlocks, globalDirectives);
  };

  // Function to update global directives
  const handleGlobalUpdate = (updatedGlobal: string) => {
    setGlobalDirectives(updatedGlobal);
    updateFullConfig(blocks, updatedGlobal);
  };

  // Function to reconstruct the full config
  const updateFullConfig = (configBlocks: ConfigBlock[], global: string) => {
    let fullConfig = global + "\n\n";

    configBlocks.forEach((block) => {
      fullConfig += block.full + "\n\n";
    });

    onChange(fullConfig.trim());
  };

  // Function to add a new server block
  const handleAddServer = () => {
    const newServerBlock: ConfigBlock = {
      type: "server",
      content: `
    listen 80;
    server_name example.com;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
    }`,
      full: `server {
    listen 80;
    server_name example.com;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}`,
    };

    const newBlocks = [...blocks, newServerBlock];
    setBlocks(newBlocks);
    updateFullConfig(newBlocks, globalDirectives);
  };

  // Function to add a new upstream block
  const handleAddUpstream = () => {
    const newUpstreamBlock: ConfigBlock = {
      type: "upstream",
      content: `
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;`,
      full: `upstream backend {
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;
}`,
    };

    const newBlocks = [...blocks, newUpstreamBlock];
    setBlocks(newBlocks);
    updateFullConfig(newBlocks, globalDirectives);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2 mb-4">
        <button
          onClick={handleAddServer}
          className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Server
        </button>
        <button
          onClick={handleAddUpstream}
          className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Upstream
        </button>
      </div>

      <div className="mb-4">
        <GlobalDirectives
          content={globalDirectives}
          onChange={handleGlobalUpdate}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Configuration Blocks
        </h3>
        {blocks.map((block, index) => (
          <div key={index}>
            {block.type === "server" ? (
              <ServerBlock
                block={block}
                onChange={(updatedBlock) =>
                  handleBlockUpdate(index, updatedBlock)
                }
              />
            ) : block.type === "upstream" ? (
              <UpstreamBlock
                block={block}
                onChange={(updatedBlock) =>
                  handleBlockUpdate(index, updatedBlock)
                }
              />
            ) : null}
          </div>
        ))}

        {blocks.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            No configuration blocks found. Add a server or upstream block to get
            started.
          </p>
        )}
      </div>
    </div>
  );
};

export default VisualEditor;
