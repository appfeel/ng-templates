/* global logger */

var q = require('q');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var minify = require('html-minifier').minify;

var TPL_RUN = '.run(function($templateCache) {';
var TPL_RUN_AN = '.run(["$templateCache", function($templateCache) {\n';
var TPL_FOOTER = '});';
var TPL_FOOTER_AN = '}]);';
var DEFAULT_FILENAME = 'templates.js';
var DEFAULT_MODULE = 'templates';
var htmlMinOptions = {
    caseSensitive: true,
    removeComments: true,
    removeAttributeQuotes: true,
};
var htmlFiles = {};

function ensureOutFileExists(dOut, fOut) {
    try {
        if (!fs.existsSync(dOut)) {
            fs.mkdirSync(dOut);
        }
        fs.truncateSync(fOut);
    } catch (e) { } // eslint-disable-line no-empty
}

function processFiles(files, _contentModifier) {
    var contentModifier = _contentModifier || function (content) { return content; };
    var promises = [];
    for (var filePath in files) {
        if (files.hasOwnProperty(filePath)) {
            promises.push(new Promise(function (resolve, reject) {
                fs.readFile(filePath, function (err1, data) {
                    var url = files[filePath];
                    var minifier = function (err, newContent) {
                        if (err) {
                            reject(err);
                        } else {
                            var fContent = minify(content, htmlMinOptions);
                            fContent = fContent.replace(/\"/g, '\\"');
                            fContent = fContent.replace(/\n/g, '');
                            resolve('$templateCache.put("' + url + '","' + fContent + '");\n');
                        }
                    }
                    var content = contentModifier(data.toString(), filePath, minifier);
                    if (typeof content.then === 'function') {
                        content
                            .then(function (newContent) {
                                minifier(null, newContent);
                            })
                            .catch(function (e) {
                                reject(e);
                            });
                    } else if (typeof content === 'string') {
                        minifier(null, content);
                    }
                });
            }));
        }
    }

    return q.all(promises);
}

module.exports = function (options, callback) {
    return new Promise(function (resolve, reject) {
        var opts = options || {};
        var cb;
        if (typeof options === 'function') {
            cb = options;
            opts = {};
        }
        cb = callback || function () { };

        var angularRoot = opts.angularRoot;
        var fileName = opts.fileName;
        var moduleName = opts.moduleName;
        var standalone = opts.standalone;
        var templatesLocation = opts.templatesLocation;
        var contentModifier = opts.contentModifier;
        var progress = opts.progress;
        var isCreateOutput = opts.isCreateOutput;
        var rootPath = path.resolve(angularRoot);
        var head = 'angular.module("' + (moduleName || DEFAULT_MODULE) + '"' + (standalone ? ', []' : '') + ')';
        var pCb = progress || function () { return true; };
        htmlFiles = {};

        glob(rootPath + '/**/*.html', function (err, files) {
            for (var filePath of files) {
                var url = filePath.replace(new RegExp(rootPath + '/', 'g'), '');
                if (url !== 'index.html' && pCb(filePath)) {
                    htmlFiles[filePath] = url;
                }
            }
            processFiles(htmlFiles, contentModifier)
                .then(function (body) {
                    var data;
                    if (options.ngAnnotate) {
                        data = head + TPL_RUN_AN + body.join('') + TPL_FOOTER_AN;
                    } else {
                        data = head + TPL_RUN + body.join('') + TPL_FOOTER;
                    }
                    if (isCreateOutput) {
                        var dOut = path.resolve(rootPath, templatesLocation || '');
                        var fOut = path.resolve(dOut, fileName || DEFAULT_FILENAME);
                        ensureOutFileExists(dOut, fOut);
                        fs.writeFileSync(fOut, data);
                    }
                    resolve(data);
                    cb(null, data);
                })
                .catch(function (e) {
                    reject(e);
                    cb(e);
                });
        });
    });
};
