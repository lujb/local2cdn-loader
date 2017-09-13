"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var fs_1 = require("fs");
var log_1 = require("./log");
var _dbpath = path_1.join(process.env.HOME || process.cwd(), '.local2cdn.cache');
var _cache = {};
var KEEP = 28;
var THRESHOLD = 1000;
var TODAY = Math.floor(Date.now() / (1000 * 24 * 3600));
var NEWEXPIREDDAY = TODAY + KEEP;
// init
fs_1.readFile(_dbpath, 'utf8', function (err, content) {
    if (!err) {
        try {
            var oldCache = JSON.parse(content);
            var cache = oldCache;
            if (Object.keys(oldCache).length > THRESHOLD) {
                // clean old cache
                cache = {};
                for (var key in oldCache) {
                    var data = oldCache[key];
                    var _a = data.expiredDay, expiredDay = _a === void 0 ? 0 : _a;
                    if (expiredDay > TODAY) {
                        cache[key] = data;
                    }
                }
            }
            for (var key in cache) {
                _cache[key] = cache[key];
            }
            flush();
        }
        catch (err) {
            log_1.default.warn("failed to read cache file: " + _dbpath + ", for:", err.message);
        }
    }
    else {
        log_1.default.warn("failed to read cache file: " + _dbpath + ", for:", err.message);
    }
});
// async flush
var flush = function () {
    var content = JSON.stringify(_cache, null, 2);
    fs_1.writeFile(_dbpath, content, function (err) {
        if (err) {
            log_1.default.error("failed to write cache file: " + _dbpath + ", for:", err.message);
        }
    });
};
var get = function (key, path) {
    if (key) {
        var data = _cache[key];
        if (data) {
            var shouldFlush = false;
            if (data.expiredDay !== NEWEXPIREDDAY) {
                data.expiredDay = NEWEXPIREDDAY;
                shouldFlush = true;
            }
            if (path && !data.paths.includes(path)) {
                data.paths.push(path);
                shouldFlush = true;
            }
            shouldFlush && flush();
            return data.value;
        }
    }
    return null;
};
var set = function (key, value, path) {
    if (key) {
        _cache[key] = { value: value, expiredDay: NEWEXPIREDDAY };
        if (path) {
            _cache[key].paths = [path];
        }
        flush();
        return true;
    }
    return false;
};
exports.default = { get: get, set: set };
