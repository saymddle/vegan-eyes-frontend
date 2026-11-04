// The app shares the ingredient checker and recipe converter with the rest
// of the repo (../lib), so Metro has to watch the repo root too.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [path.join(repoRoot, "lib"), path.join(repoRoot, "tests", "fixtures")];
config.resolver.nodeModulesPaths = [path.join(projectRoot, "node_modules")];

// expo-sqlite ships a .wasm file for its web build (used for previews).
config.resolver.assetExts.push("wasm");

module.exports = config;
