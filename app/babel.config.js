module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin', // Required for Reanimated
    ['@babel/plugin-transform-class-properties', { loose: true }], // Set loose mode to true
    ['@babel/plugin-transform-private-methods', { loose: true }],  // Set loose mode to true
    ['@babel/plugin-transform-private-property-in-object', { loose: true }] // Set loose mode to true
  ],
};
