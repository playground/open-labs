const path = require('path');
const fs = require('fs');
const { ContextReplacementPlugin, IgnorePlugin } = require('webpack');
const dist = 'dist';  // be aware 'dist' folder is also used for tsconfig output
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

var nodeModules = {};

module.exports = {
  entry: {
    'index': `./src/index.ts`
  },
  output: {
    path: path.resolve(__dirname, dist),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        },
        exclude: /node_modules/
      }
    ],
  },
  plugins: [
  ],
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    plugins: [
      new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })
    ],
    alias: {
      '@common/*': 'common'
    }
  },
  externals: nodeModules,
  mode: 'production',
  target: 'node',
  node: {
    __dirname: true
  }
}
