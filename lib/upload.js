"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var FormData = require("form-data");
var sha1 = require("sha1");
var log_1 = require("./log");
var cache_1 = require("./cache");
var _rootdir = path_1.join(__dirname, '..');
var _uploaddir = path_1.join(_rootdir, 'upload-files');
if (fs_1.existsSync(_uploaddir)) {
    try {
        var filenames = fs_1.readdirSync(_uploaddir);
        if (filenames.length > 32) {
            filenames.forEach(function (filename) {
                fs_1.unlinkSync(path_1.join(_uploaddir, filename));
            });
        }
    }
    catch (err) {
        // ignore
    }
}
else {
    fs_1.mkdirSync(_uploaddir);
}
var upload = function (url, filepath, content) {
    if (!url) {
        return Promise.reject('upload url is required');
    }
    var key = sha1(content + " of " + path_1.basename(filepath));
    var value = cache_1.default.get(key, filepath);
    if (value) {
        var out = [filepath, value];
        log_1.default.info("found cached cdn url: " + value + ", for " + filepath);
        return Promise.resolve(out);
    }
    else {
        log_1.default.note("uploading " + filepath + " to " + url + " ...");
        return doUpload(key, url, filepath, content);
    }
};
var doUpload = function (key, url, filepath, content) {
    return new Promise(function (resolve, reject) {
        var form = new FormData();
        var _f = filepath;
        if (!path_1.isAbsolute(filepath)) {
            _f = path_1.join(_uploaddir, path_1.basename(filepath));
            fs_1.writeFileSync(_f, content, 'utf8');
        }
        form.append('https', '1');
        form.append('keepName', '1');
        form.append('file', fs_1.createReadStream(_f));
        form.submit(url, function (err, res) {
            if (err) {
                reject(err);
            }
            else {
                var rawData_1 = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) { return rawData_1 += chunk; });
                res.on('end', function () {
                    var out = JSON.parse(rawData_1);
                    if (out.error === 0) {
                        cache_1.default.set(key, out.url, filepath);
                        resolve([filepath, out.url]);
                    }
                    else {
                        reject(out);
                    }
                });
            }
        });
    });
};
exports.default = upload;
