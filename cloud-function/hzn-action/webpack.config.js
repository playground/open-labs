const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
const { TsConfigPathsPlugin } = require('awesome-typescript-loader');
const { ContextReplacementPlugin, IgnorePlugin } = require('webpack');
const dist = 'dist';  // be aware 'dist' folder is also used for tsconfig output

var nodeModules = {};
// fs.readdirSync('node_modules')
//   .filter(function(x) {
//     return ['.bin'].indexOf(x) === -1;
//   })
//   .forEach(function(mod) {
//     nodeModules[mod] = 'commonjs ' + mod;
//   });

module.exports = {
  entry: {
    'hzn-action': `./src/hzn-action.ts`
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
    new CopyPlugin([
      {
        from: 'dist/common/src/cos-client/cos-client.js',
        to: '../js/cos-client.js',
        toType: 'file',
      },
      {
        from: 'dist/common/src/utility.js',
        to: '../js/utility.js',
        toType: 'file',
      },
      {
        from: 'dist/common/src/messenger.js',
        to: '../js/messenger.js',
        toType: 'file',
      },
      {
        from: 'dist/hzn-action/src/hzn-action.js',
        to: '../index.js',
        toType: 'file',
      }
    ])
  ],
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    plugins: [
      new TsConfigPathsPlugin({configFile: './tsconfig.json'})
    ],
    alias: {
      '@common/*': '../common/src'
    }
  },
  externals: nodeModules,
  mode: 'production',
  target: 'node',
  node: {
    __dirname: true
  }
}
