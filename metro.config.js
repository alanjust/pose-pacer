const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // react-native-screens imports gesture handler for type definitions only.
  // We don't use gesture handler, so stub out its native module to prevent
  // TurboModuleRegistry.getEnforcing('RNGestureHandlerModule') from crashing.
  if (moduleName.endsWith('specs/NativeRNGestureHandlerModule')) {
    return {
      filePath: path.resolve(__dirname, 'gesture-handler-native-stub.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
