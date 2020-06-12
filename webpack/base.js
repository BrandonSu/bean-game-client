const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HandlebarsWebpackPlugin = require("handlebars-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  mode: "development",
  devtool: "eval-source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: [/\.vert$/, /\.frag$/],
        use: "raw-loader"
      },
      {
        test: /\.(gif|png|jpe?g|svg|xml)$/i,
        use: "file-loader"
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin({
      root: path.resolve(__dirname, "../")
    }),
    new webpack.DefinePlugin({
      CANVAS_RENDERER: JSON.stringify(true),
      WEBGL_RENDERER: JSON.stringify(true)
    }),
    new HtmlWebpackPlugin({
      template: "./index.hbs"
    }),
    new HandlebarsWebpackPlugin({
      htmlWebpackPlugin: {
      enabled: true, // register all partials from html-webpack-plugin, defaults to `false`
      prefix: "html" // where to look for htmlWebpackPlugin output. default is "html"
      },
      entry: "./index.hbs",
      output: path.join(process.cwd(), "dist", "[name].html")
    })
  ]
};
