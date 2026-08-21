// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js resolves a `ws` subpath export that Metro's default
// package.json:exports resolution can't follow on React Native.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
