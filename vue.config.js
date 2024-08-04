/*
 * @Author: lisong
 * @Date: 2021-12-03 17:16:20
 * @Description:
 */
const monacoWebpackPlugin = require("monaco-editor-webpack-plugin");
module.exports = {
    lintOnSave: false,
    publicPath: './',
    outputDir: './electron/render',
    configureWebpack: {
        plugins: [new monacoWebpackPlugin()],
    },
};
