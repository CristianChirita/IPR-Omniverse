const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

const coreDistDir = "node_modules/@gamestream/ragnarok-core/dist/";
const externals = require(path.resolve(__dirname, coreDistDir, "externals"))

// Removes the coreDistDir from the beginning of absoluteFilename. Assumes
// absoluteFilename is a child of coreDistDir.
const transformCorePath = ({ context, absoluteFilename }) => {
    return Promise.resolve(path.relative(coreDistDir, absoluteFilename));
};

var config = {
    mode: "production",
    context: __dirname,

    entry: {
        ragnarok: ["./index.js"]
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        libraryTarget: "commonjs2"
    },
    resolve: {
        extensions: [".js"]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: "pre",
                loader: "source-map-loader"
            },
            {
                test: /\.js$/,
                include: [path.resolve(__dirname, "index.js")],
                exclude: /node_modules/,
                loader: "babel-loader"
            }
        ]
    },
    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",
    plugins: [
        new webpack.optimize.ModuleConcatenationPlugin(),
        new CopyPlugin({
            patterns: [
                {
                    // Can't use path.join here because it will convert / to \ on Windows.
                    // When using globs, CopyPlugin only allows / paths.
                    from: coreDistDir + "ragnarokworker.js*",
                    to: "[name][ext]"
                },
                {
                    from: coreDistDir + "**/*.d.ts",
                    to: transformCorePath
                },
                {
                    from: coreDistDir + "node_modules/**/*",
                    to: transformCorePath
                }
            ]
        })
    ],
    optimization: {
        minimize: false,
        usedExports: true,
        splitChunks: {
            minSize: 0
        },
        concatenateModules: true
    },
    stats: {
        errorDetails: true
    },
    target: "web",
    externals: externals
};

module.exports = env => {
    return config;
};
