const path = require('path')
const webpack = require('webpack')
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: ["regenerator-runtime/runtime.js", path.resolve(__dirname, './src/index.jsx')],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  resolve: {
    extensions: ['*', '.js', '.jsx'],
    fallback: {
      "https": require.resolve("https-browserify"),
      "http": require.resolve("http-browserify"),
      "util": require.resolve("util/"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
      "process": require.resolve('process')
    }
  },
  output: {
    path: path.resolve(__dirname, './public'),
    filename: 'bundle.js',
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        format: {comments: false},
      },
      extractComments: false,
    })],
  },
  devServer: {
    contentBase: path.resolve(__dirname, './public'),
  },
}