var path = require('path');
var fs = require('fs');
var expect = require('chai').expect;
var q = require('q');
var lint = require('mocha-eslint');
var templatecache = require('../');

lint(['lib'], {
    strict: true,
});

describe('angular template cache creator (as string)', function () {
    it('should create an angular module with minimized templates', function (done) {
        templatecache({
            angularRoot: 'test/app',
        })
            .then(function (templatejs) {
                var expected = fs.readFileSync(path.resolve('test/expected/templates.js')).toString();
                expect(templatejs).to.equal(expected);
                done();
            })
            .catch(done);
    });

    it('should create a standalone module with minimized templates', function (done) {
        templatecache({
            angularRoot: 'test/app',
            isStandalone: true,
        })
            .then(function (templatejs) {
                var expected = fs.readFileSync(path.resolve('test/expected/templatesStandalone.js')).toString();
                expect(templatejs).to.equal(expected);
                done();
            })
            .catch(done);
    });

    it('should create an angular module with minimized templates (callback style)', function (done) {
        templatecache({
            angularRoot: 'test/app',
        }, function (err, templatejs) {
            var expected = fs.readFileSync(path.resolve('test/expected/templates.js')).toString();
            expect(templatejs).to.equal(expected);
            done(err);
        });
    });

    it('should create an angular module with minimized templates (no options)', function (done) {
        templatecache(function (err, templatejs) {
            done(!err);
        })
    });
});

describe('angular template cache creator (as string) annotate', function () {
    it('should create an angular module annotated with minimized templates', function (done) {
        templatecache({
            angularRoot: 'test/app',
            isNgAnnotate: true,
        })
            .then(function (templatejs) {
                var expected = fs.readFileSync(path.join('test/expected', 'templatesAn.js')).toString();
                expect(templatejs).to.equal(expected);
                done();
            })
            .catch(done);
    });
});

describe('angular template cache creator (test progress and content modifier)', function () {
    var currPath = path.resolve('./');

    it('the content modifier callback should be called with content and filePath', function (done) {
        var allFiles = [];
        templatecache({
            angularRoot: 'test/app',
            progress: function (p) {
                allFiles.push(p.replace(currPath, ''));
                return true;
            },
        })
            .then(function () {
                expect(allFiles).deep.equal([
                    '/test/app/templates/template1.html',
                    '/test/app/templates/template2.html',
                ]);
                done();
            })
            .catch(done);
    });

    it('the content modifier callback should be called with content and filePath (plain return)', function (done) {
        var allFiles = [];
        templatecache({
            angularRoot: 'test/app',
            contentModifier: function (content, filePath) {
                var fileContent = fs.readFileSync(filePath).toString();
                expect(content).to.equal(fileContent);
                allFiles.push(filePath.replace(currPath, ''));
                return content;
            },
        })
            .then(function () {
                expect(allFiles).deep.equal([
                    '/test/app/templates/template1.html',
                    '/test/app/templates/template2.html',
                ]);
                done();
            })
            .catch(done);
    });

    it('the content modifier callback should be called with content and filePath (plain return error)', function (done) {
        var allFiles = [];
        templatecache({
            angularRoot: 'test/app',
            contentModifier: function (content, filePath) {
                var fileContent = fs.readFileSync(filePath).toString();
                expect(content).to.equal(fileContent);
                allFiles.push(filePath.replace(currPath, ''));
                throw new Error('this is an error');
            },
        })
            .then(function () {
                done('Should not return a successful response');
            })
            .catch(function () {
                done();
            });
    });

    it('the content modifier callback should be called with content and filePath (callback return)', function (done) {
        var allFiles = [];
        templatecache({
            angularRoot: 'test/app',
            contentModifier: function (content, filePath, cb) {
                var fileContent = fs.readFileSync(filePath).toString();
                expect(content).to.equal(fileContent);
                allFiles.push(filePath.replace(currPath, ''));
                cb(null, content);
            },
        })
            .then(function () {
                expect(allFiles).deep.equal([
                    '/test/app/templates/template1.html',
                    '/test/app/templates/template2.html',
                ]);
                done();
            })
            .catch(done);
    });

    it('the content modifier callback should be called with content and filePath (callback error return)', function (done) {
        var allFiles = [];
        templatecache({
            angularRoot: 'test/app',
            contentModifier: function (content, filePath, cb) {
                var fileContent = fs.readFileSync(filePath).toString();
                expect(content).to.equal(fileContent);
                allFiles.push(filePath.replace(currPath, ''));
                cb(new Error('this is an error'));
            },
        })
            .then(function () {
                done('Should not return a successful response');
            })
            .catch(function () {
                done();
            });
    });

    it('the content modifier callback should be called with content and filePath (promise return)', function (done) {
        var allFiles = [];
        templatecache({
            angularRoot: 'test/app',
            contentModifier: function (content, filePath) {
                var fileContent = fs.readFileSync(filePath).toString();
                expect(content).to.equal(fileContent);
                allFiles.push(filePath.replace(currPath, ''));
                return q.resolve(content);
            },
        })
            .then(function () {
                expect(allFiles).deep.equal([
                    '/test/app/templates/template1.html',
                    '/test/app/templates/template2.html',
                ]);
                done();
            })
            .catch(done);
    });

    it('the content modifier callback should be called with content and filePath (reject promise return)', function (done) {
        var allFiles = [];
        templatecache({
            angularRoot: 'test/app',
            contentModifier: function (content, filePath) {
                var fileContent = fs.readFileSync(filePath).toString();
                expect(content).to.equal(fileContent);
                allFiles.push(filePath.replace(currPath, ''));
                return q.reject('this is a rejection');
            },
        })
            .then(function () {
                done('Should not return a successful response');
            })
            .catch(function () {
                done();
            });
    });
});

describe('angular template cache creator (as string), don\'t process any file', function () {
    it('should create an empty angular module', function (done) {
        templatecache({
            angularRoot: 'test/app',
            progress: function (p) {
                return false;
            },
        })
            .then(function (templatejs) {
                expect(templatejs).to.equal('angular.module("templates").run(function($templateCache){});');
                done();
            })
            .catch(done);
    });

    it('should create an empty standalone module', function (done) {
        templatecache({
            angularRoot: 'test/app',
            templatesFilePath: 'templatesStandalone.js',
            isStandalone: true,
            progress: function (p) {
                return false;
            },
        })
            .then(function (templatejs) {
                expect(templatejs).to.equal('angular.module("templates",[]).run(function($templateCache){});');
                done();
            })
            .catch(done);
    });

    it('should create an empty angular module with name "tpls"', function (done) {
        templatecache({
            angularRoot: 'test/app',
            moduleName: 'tpls',
            progress: function (p) {
                return false;
            },
        })
            .then(function (templatejs) {
                expect(templatejs).to.equal('angular.module("tpls").run(function($templateCache){});');
                done();
            })
            .catch(done);
    });
});

describe('angular template cache creator (as string), modify template content', function () {
    it('should create an angular module with same content', function (done) {
        templatecache({
            angularRoot: 'test/app',
            contentModifier: function (content, filePath) {
                return '<div></div>';
            },
        })
            .then(function (templatejs) {
                expect(templatejs).to.equal('angular.module("templates").run(function($templateCache){$templateCache.put("templates/template1.html","<div></div>");$templateCache.put("templates/template2.html","<div></div>");});');
                done();
            })
            .catch(done);
    });

    it('should create a standalone module', function (done) {
        templatecache({
            angularRoot: 'test/app',
            templatesFilePath: 'templatesStandalone.js',
            isStandalone: true,
            contentModifier: function (content, filePath) {
                return '<div></div>';
            },
        })
            .then(function (templatejs) {
                expect(templatejs).to.equal('angular.module("templates",[]).run(function($templateCache){$templateCache.put("templates/template1.html","<div></div>");$templateCache.put("templates/template2.html","<div></div>");});');
                done();
            })
            .catch(done);
    });
});


describe('angular template cache creator (as file)', function () {
    afterEach(function (done) {
        fs.unlink(path.resolve('test/app/templates.js'), done);
    });

    it('should create angular module with minimized templates', function (done) {
        templatecache({
            angularRoot: 'test/app',
            isCreateOutput: true,
        })
            .then(function (templatejs) {
                fs.readFile(path.resolve('test/app/templates.js'), function (err, data) {
                    if (err) {
                        done(err);
                    } else {
                        var expected = fs.readFileSync(path.resolve('test/expected/templates.js')).toString();
                        expect(data.toString()).to.equal(expected);
                        done();
                    }
                });
            })
            .catch(done);
    });

    it('should create angular module with minimized templates', function (done) {
        templatecache({
            angularRoot: 'test/app',
            isCreateOutput: true,
        })
            .then(function (templatejs) {
                fs.readFile(path.resolve('test/app/templates.js'), function (err, data) {
                    if (err) {
                        done(err);
                    } else {
                        var expected = fs.readFileSync(path.resolve('test/expected/templates.js')).toString();
                        expect(data.toString()).to.equal(expected);
                        done();
                    }
                });
            })
            .catch(done);
    });

    it('should create standalone module with minimized templates', function (done) {
        templatecache({
            angularRoot: 'test/app',
            isStandalone: true,
            isCreateOutput: true,
        })
            .then(function (templatejs) {
                fs.readFile(path.resolve('test/app/templates.js'), function (err, data) {
                    if (err) {
                        done(err);
                    } else {
                        var expected = fs.readFileSync(path.resolve('test/expected/templatesStandalone.js')).toString();
                        expect(data.toString()).to.equal(expected);
                        done();
                    }
                });
            })
            .catch(done);
    });
});

describe('angular template cache creator (as file in custom location)', function () {
    it('should create angular module with minimized templates in absolute location', function (done) {
        templatecache({
            angularRoot: 'test/app',
            templatesFilePath: '/tmp/location/myTemplates.js',
            isCreateOutput: true,
        })
            .then(function (templatejs) {
                fs.readFile(path.resolve('/tmp/location/myTemplates.js'), function (err, data) {
                    if (err) {
                        done(err);
                    } else {
                        var expected = fs.readFileSync(path.resolve('test/expected/templates.js')).toString();
                        expect(data.toString()).to.equal(expected);
                        fs.unlink(path.resolve('/tmp/location/myTemplates.js'), function (err) {
                            if (err) {
                                done(err);
                            } else {
                                fs.rmdir(path.resolve('/tmp/location'), done);
                            }
                        });
                    }
                });
            })
            .catch(done);
    });

    it('should create angular module with minimized templates in relative location (with dot)', function (done) {
        templatecache({
            angularRoot: 'test/app',
            templatesFilePath: './test/tmp/location/myTemplates.js',
            isCreateOutput: true,
        })
            .then(function (templatejs) {
                console.log('b', path.resolve('./test/tmp/location/myTemplates.js'));
                fs.readFile(path.resolve('./test/tmp/location/myTemplates.js'), function (err, data) {
                    if (err) {
                        done(err);
                    } else {
                        var expected = fs.readFileSync(path.resolve('test/expected/templates.js')).toString();
                        expect(data.toString()).to.equal(expected);
                        fs.unlink(path.resolve('./test/tmp/location/myTemplates.js'), function (err) {
                            if (err) {
                                done(err);
                            } else {
                                fs.rmdir(path.resolve('./test/tmp/location'), done);
                            }
                        });
                    }
                });
            })
            .catch(done);
    });

    it('should create angular module with minimized templates in relative location', function (done) {
        templatecache({
            angularRoot: 'test/app',
            templatesFilePath: 'tpl/templates.js',
            isCreateOutput: true,
            contentModifier: function (content, filePath) {
                return content;
            },
        })
            .then(function (templatejs) {
                console.log(path.resolve('test/app/tpl/templates.js'));
                fs.readFile(path.resolve('test/app/tpl/templates.js'), function (err, data) {
                    if (err) {
                        done(err);
                    } else {
                        var expected = fs.readFileSync(path.resolve('test/expected/templates.js')).toString();
                        expect(data.toString()).to.equal(expected);
                        fs.unlink(path.resolve('test/app/tpl/templates.js'), function (err) {
                            if (!err) {
                                fs.rmdir(path.resolve('test/app/tpl'), done);
                            } else {
                                done(err);
                            }
                        });
                    }
                });
            })
            .catch(done);
    });
});
