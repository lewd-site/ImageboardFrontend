const Dotenv = require('dotenv-webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.ts',
  resolve: {
    extensions: ['.ts', '...'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.woff2?$/,
        type: 'asset/resource',
      },
    ],
  },
  output: {
    publicPath: '/assets/',
    path: path.resolve(__dirname, 'dist', 'assets'),
    filename: 'bundle.js',
    clean: true,
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new MiniCssExtractPlugin({
      filename: 'bundle.css',
    }),
    new Dotenv(),
  ],
};
