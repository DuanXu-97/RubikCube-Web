var env = process.env["NODE_ENV"];
var webpack = require("webpack");


var assets = "./assets";
var config = {
    entry: assets + "/main",
    output: {
        path: __dirname + "/../static/js",
        filename: "bundle.js",
        publicPath: "/../static/js/"
    },
    module: {
        loaders: [
            { test: /assets\/\.css$/, loader: "style!css" },
            { test: /assets\/\main.js$/, loader: 'expose-loader?cube' }
        ]
    },
    plugins: [
    ]

};

if (env === "production") {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin());
}

module.exports = config;
