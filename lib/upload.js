"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var rmdir = require("rmdir");
var FormData = require("form-data");
var _rootdir = path_1.join(__dirname, '..');
var _uploaddir = path_1.join(_rootdir, 'upload-files');
if (fs_1.existsSync(_uploaddir)) {
    rmdir(_rootdir, 'upload-files');
}
else {
    fs_1.mkdirSync(_uploaddir);
}
var upload = function (url, filepath, content) {
    if (!url) {
        return Promise.reject('upload url is required');
    }
    return new Promise(function (resolve, reject) {
        var form = new FormData();
        var _f = filepath;
        if (content) {
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
