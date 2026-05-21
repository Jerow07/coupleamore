module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
        },
      ],
    ],
    plugins: [
      // reanimated/plugin siempre al final
      'react-native-reanimated/plugin',
    ],
  };
};
