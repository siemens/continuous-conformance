/*
 * SPDX-FileCopyrightText: 2022 Siemens AG
 *
 * SPDX-License-Identifier: MIT
 */

const path = require("path");
const fs = require("fs");
const CopyWebpackPlugin = require("copy-webpack-plugin");

// Webpack entry points. Mapping from resulting bundle name to the source file entry.
const entries = {};

const srcDir = path.join(__dirname, "src");
fs.readdirSync(srcDir)
  .filter(dir => fs.statSync(path.join(srcDir, dir)).isDirectory())
  .forEach(dir => (entries[dir] = "./" + path.join("src", dir, dir)));

module.exports = {    
    target: "web",
    // entry: getEntries(),
    entry: entries,
    output: {
        filename: "[name]/[name].js"        
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            "azure-devops-extension-sdk": path.resolve("node_modules/azure-devops-extension-sdk")
        },
    },
    stats: {
        warnings: false
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: [
                    path.resolve(__dirname, "gulpfile.ts")
                ],
                loader: "ts-loader"
            },
            {
                test: /\.scss$/,
                use: ["style-loader", "css-loader", "azure-devops-ui/buildScripts/css-variables-loader", "sass-loader"]
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.woff$/,
                use: [{
                    loader: 'base64-inline-loader'
                }]
            },
            {
                test: /\.html$/,
                loader: "file-loader"
            }
        ]
    },
    devtool: "inline-source-map",
    devServer: {
        https: true,
        port: 44300,
        publicPath: "/dist/",
        watchOptions: {
            aggregateTimeout: 500, // delay before reloading
            poll: 1000 // enable polling since fsevents are not supported in docker
        }
    },
    plugins: [
        new CopyWebpackPlugin({
           patterns: [ 
               { from: "**/*.html", context: "src" }
           ]
        })
    ]
};
