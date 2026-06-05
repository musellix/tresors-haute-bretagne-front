const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// React 18 (apps/web) est hoistée à la racine du monorepo et entre en conflit
// avec React 19 (apps/mobile). On bloque la version racine pour Metro.
function esc(str) {
  return str.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}
config.resolver.blockList = [
  new RegExp(`^${esc(path.resolve(workspaceRoot, 'node_modules', 'react'))}($|\\${path.sep}.+$)`),
  new RegExp(`^${esc(path.resolve(workspaceRoot, 'node_modules', 'react-native'))}($|\\${path.sep}.+$)`),
];

module.exports = config;
