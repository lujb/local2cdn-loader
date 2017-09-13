"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var loaderUtils = require("loader-utils");
var mime = require("mime");
var upload_1 = require("./upload");
var loader = function (content) {
    this.cacheable && this.cacheable();
    var options = loaderUtils.getOptions(this) || {};
    var limit = options.limit || (this.options && this.options.url && this.options.url.dataUrlLimit);
    if (limit) {
        limit = parseInt(limit, 10);
    }
    var mimetype = options.mimetype || options.minetype || mime.lookup(this.resourcePath);
    if (typeof content === "string") {
        content = new Buffer(content);
    }
    var b64Content = content.toString("base64");
    if (!limit || b64Content.length < limit) {
        return "module.exports = " + JSON.stringify("data:" + (mimetype ? mimetype + ";" : "") + "base64," + b64Content);
    }
    else {
        if (options.uploadUrl) {
            var callback_1 = this.async();
            var fn = options.uploadFn || upload_1.default;
            fn.call(null, options.uploadUrl, this.resourcePath, b64Content).then(function (_a) {
                var filepath = _a[0], url = _a[1];
                callback_1(null, "module.exports = " + JSON.stringify("" + url));
            });
        }
        else {
            var fileLoader = require('file-loader');
            return fileLoader.call(this, content);
        }
    }
};
exports.raw = true;
exports.default = loader;
