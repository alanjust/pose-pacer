// Stub to prevent TurboModuleRegistry.getEnforcing('RNGestureHandlerModule')
// from crashing. We don't use gesture handler features directly — react-native-screens
// only imports its type definitions. If gesture handler is ever actively used,
// remove this stub and set up GestureHandlerRootView properly.
export default {};
