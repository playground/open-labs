const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
const { ContextReplacementPlugin, IgnorePlugin } = require('webpack');
const dist = 'dist';  // be aware 'dist' folder is also used for tsconfig output
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

var nodeModules = {};
// fs.readdirSync('node_modules')
//   .filter(function(x) {
//     return ['.bin'].indexOf(x) === -1;
//   })
//   .forEach(function(mod) {
//     nodeModules[mod] = 'commonjs ' + mod;
//   });

module.exports = {
  //stats: {
  //  // Configure the console output
  //  errorDetails: true, //this does show errors
  //  colors: false,
  //  modules: true,
  //  reasons: true
  //},
  entry: {
    'demo-action': `./src/demo-action.ts`
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
    //new CopyPlugin({
    //  patterns: [
    //    {
    //      from: 'dist/common/src/cos-client.js',
    //      to: '../js/cos-client.js'
    //    },
    //    {
    //      from: 'dist/common/src/utility.js',
    //      to: '../js/utility.js'
    //    },
    //    {
    //      from: 'dist/common/src/messenger.js',
    //      to: '../js/messenger.js'
    //    },
    //    {
    //      from: 'dist/demo/src/demo-action.js',
    //      to: '../index.js'
    //    }  
    //  ]
    //})
  ],
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    plugins: [
      new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })
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
