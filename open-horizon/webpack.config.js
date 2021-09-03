const path = require('path');
const dist = 'dist';  // be aware 'dist' folder is also used for tsconfig output
const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

var nodeModules = {};

module.exports = {
  entry: {
    'mms-deploy': `./src/mms/deploy.ts`,
    'service-deploy': `./src/service/deploy.ts`
  },
  output: {
    path: path.resolve(__dirname, dist),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
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
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true
    })
  ],
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    plugins: [
      new TsConfigPathsPlugin({configFile: './tsconfig.json'})
    ],
    alias: {
      '@common/*': 'common/src'
    }
  },
  externals: [nodeExternals(), nodeModules],
  mode: 'production',
  target: 'node',
  node: {
    __dirname: true
  }
}
