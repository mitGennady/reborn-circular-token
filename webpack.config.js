const path = require("path");
const webpack = require("webpack");

module.exports = {
  context: __dirname,
  devtool: false,
  entry: "./src/index",
  mode: "development",
  target: "node",
  watch: true,

  optimization: {
    minimize: false,
  },
  resolve: {
    fallback: {
      os: require.resolve("os-browserify"),
      https: require.resolve("https-browserify"),
      http: require.resolve("stream-http"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
    },
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
  externals: {
    bufferutil: "bufferutil",
    "utf-8-validate": "utf-8-validate",
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, "static/"),
    },
    port: 3000,
    hot: true,
    open: true,
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ],
};
