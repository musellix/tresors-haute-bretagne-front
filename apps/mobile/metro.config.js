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

// apps/web utilise React 18 hoistée à la racine du monorepo.
// On force TOUTES les résolutions de 'react' vers React 19 de apps/mobile.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName === 'react/jsx-runtime' || moduleName === 'react/jsx-dev-runtime') {
    const base = path.resolve(projectRoot, 'node_modules', 'react');
    const suffix = moduleName.startsWith('react/') ? moduleName.slice('react'.length) : '';
    return {
      filePath: require.resolve(path.join(base, suffix)),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
