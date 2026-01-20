#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Find the bun binary - check multiple locations
function findBun() {
  const scriptDir = path.dirname(fs.realpathSync(__filename));
  const packageRoot = path.dirname(scriptDir);

  // Possible locations for the bun binary
  const candidates = [
    // Local node_modules/.bin/bun
    path.join(packageRoot, "node_modules", ".bin", "bun"),
    // Windows variant
    path.join(packageRoot, "node_modules", ".bin", "bun.exe"),
    // Direct from bun package
    path.join(packageRoot, "node_modules", "bun", "bin", "bun"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback to global bun
  return "bun";
}

const bunPath = findBun();
const entryPoint = path.join(path.dirname(fs.realpathSync(__filename)), "..", "src", "index.tsx");

const result = spawnSync(bunPath, ["run", entryPoint], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error("Failed to start ATM:", result.error.message);
  console.error("Make sure Bun is installed. You can install it with: npm install -g bun");
  process.exit(1);
}

process.exit(result.status ?? 0);
