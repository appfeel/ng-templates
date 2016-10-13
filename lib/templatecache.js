/* global logger */

var q = require('q');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var minify = require('html-minifier').minify;
var mkdirp = require('mkdirp');

var TPL_RUN = '.run(function($templateCache){';
var TPL_RUN_AN = '.run(["$templateCache",function($templateCache){';
var TPL_FOOTER = '});';
var TPL_FOOTER_AN = '}]);';
var DEFAULT_FILENAME = 'templates.js';
var DEFAULT_MODULE = 'templates';
var htmlMinOptions = {
    caseSensitive: true,
    removeComments: true,
    removeAttributeQuotes: true
};
var htmlFiles = {};

function ensurePathExists(fOut) {
    var dOut = fOut.split('/');
    dOut.pop();
    dOut = dOut.join('/');
    if (!fs.existsSync(dOut)) {
        return new q.Promise(function promise(resolve, reject) {
            mkdirp(dOut, function createdDir(err) {
                if (err) {
                    reject(err);
                } else {
                    try {
                        fs.truncateSync(fOut);
                    } catch (e) { } // eslint-disable-line no-empty
                    resolve();
                }
            });
        });
    }
    try {
        fs.truncateSync(fOut);
    } catch (e) { } // eslint-disable-line no-empty
    return q.resolve();
}

function processFiles(files, _contentModifier) {
    var contentModifier = _contentModifier || function cm(content) { return content; };
    var promises = [];
    var fLen = files.length;
    var f;
    for (f = 0; f < fLen; f += 1) {
        ~(function loop(file) {
            promises.push(new q.Promise(function promise(resolve) {
                fs.readFile(file.filePath, function read(err1, data) {
                    var minifier = function minifier(err, newContent) {
                        if (err) {
                            resolve(err);
                        } else {
                            var fContent = minify(newContent, htmlMinOptions);
                            fContent = fContent.replace(/\"/g, '\\"');
                            fContent = fContent.replace(/\n/g, '');
                            resolve('$templateCache.put("' + file.url + '","' + fContent + '");');
                        }
                    };
                    try {
                        var content = contentModifier(data.toString(), file.filePath, minifier);
                        if (content && typeof content.then === 'function') {
                            content
                                .then(function success(newContent) {
                                    minifier(null, newContent);
                                })
                                .catch(function fail(err) {
                                    resolve(err);
                                });
                        } else if (typeof content === 'string') {
                            minifier(null, content);
                        }
                    } catch (err) {
                        minifier(err);
                    }
                });
            }));
        })(files[f]);
    }

    return q.all(promises)
        .then(function successProcess(results) {
            var r;
            for (r = 0; r < results.length; r += 1) {
                if (results[r].indexOf('$templateCache.put') !== 0) {
                    return q.reject(results[r]);
                }
            }
            return q.resolve(results);
        });
}

module.exports = function templatecache(options, callback) {
    return new q.Promise(function promise(resolve, reject) {
        var opts = options;
        var cb;
        if (typeof options === 'function') {
            callback = options; // eslint-disable-line no-param-reassign
            opts = null;
        }
        cb = callback || function fcb() { };

        if (!opts) {
            reject('No options have been found');
            cb('No options have been found');
        } else {
            var angularRoot = opts.angularRoot;
            var moduleName = opts.moduleName;
            var isStandalone = opts.isStandalone;
            var isCreateOutput = opts.isCreateOutput;
            var isNgAnnotate = opts.isNgAnnotate;
            var templatesFilePath = opts.templatesFilePath || DEFAULT_FILENAME;
            var progress = opts.progress;
            var contentModifier = opts.contentModifier;
            var rootPath = path.resolve(angularRoot);
            var head = 'angular.module("' + (moduleName || DEFAULT_MODULE) + '"' + (isStandalone ? ',[]' : '') + ')';
            var pCb = progress || function pCb() { return true; };
            htmlFiles = [];

            glob(rootPath + '/**/*.html', function globResults(err, files) {
                if (err) {
                    reject(err);
                    cb(err);
                } else {
                    var f;
                    var fLen = files.length;
                    for (f = 0; f < fLen; f += 1) {
                        var url = files[f].replace(new RegExp(rootPath + '/', 'g'), '');
                        if (url !== 'index.html' && pCb(files[f])) {
                            htmlFiles.push({
                                filePath: files[f],
                                url: url
                            });
                        }
                    }
                    processFiles(htmlFiles, contentModifier)
                        .then(function successProcessAll(body) {
                            var data;
                            if (isNgAnnotate) {
                                data = head + TPL_RUN_AN + body.join('') + TPL_FOOTER_AN;
                            } else {
                                data = head + TPL_RUN + body.join('') + TPL_FOOTER;
                            }
                            if (isCreateOutput) {
                                var fOut;
                                if (/^\.?\//.test(templatesFilePath)) {
                                    fOut = path.resolve(templatesFilePath);
                                } else {
                                    fOut = path.resolve(rootPath, templatesFilePath);
                                }
                                ensurePathExists(fOut)
                                    .then(function successPath() {
                                        fs.writeFile(fOut, data, function written(e) {
                                            if (e) {
                                                reject(e);
                                                cb(e);
                                            } else {
                                                resolve(data);
                                                cb(e, data);
                                            }
                                        });
                                    })
                                    .catch(function failPath(e) {
                                        reject(e);
                                        cb(e);
                                    });
                            } else {
                                resolve(data);
                                cb(null, data);
                            }
                        })
                        .catch(function failProcessAll(e) {
                            reject(e);
                            cb(e);
                        });
                }
            });
        }
    });
};
