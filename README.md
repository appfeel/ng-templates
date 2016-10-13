# Template cache for angular apps

[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://npmjs.org/package/path-reducer)
[![NPM version](http://img.shields.io/npm/v/path-reducer.svg?style=flat)](https://npmjs.org/package/path-reducer)
[![Downloads](http://img.shields.io/npm/dm/path-reducer.svg?style=flat)](https://npmjs.org/package/path-reducer)
[![Build Status](http://img.shields.io/travis/appfeel/path-reducer.svg?style=flat)](https://travis-ci.org/appfeel/path-reducer)
[![dependency status](https://img.shields.io/david/appfeel/path-reducer.svg?style=flat)](https://david-dm.org/appfeel/path-reducer)

Translates Angular html template files to a unique compressed javascript file that uses `$templateCache` directive.

# Install

```
npm i templatecache --save
```

# Use it

With a callback function:

```js
templatecache({
    angularRoot: 'path/to/angular/app',
}, function (err, templatejs) {
    // err contains errors if any, null otherwise
    // templatejs contains the generated javascript file
});
```

Or as a promise:

```js
templatecache({
    angularRoot: 'path/to/angular/app',
})
    .then(function (templatejs) {
        // templatejs contains the generated javascript file
    })
    .catch(function (err) {
        // called if there has been any error
    });
```

# Options

Default options are the following ones:

```js
var options = {
    angularRoot: 'path/to/angular/app',
    moduleName: 'templates',
    isStandalone: false,
    isNgAnnotate: false,
    isCreateOutput: false,
    templatesFilePath: 'path/to/templates.js',
    progress: function (p) {
        return true;
    },
    contentModifier: function (content, filePath) {
        return content;
    },
};

templatecache(options, function (err, templatejs) {

});
```


## angularRoot (string, required)
The location of your Angular app. `templatecache` will search all `.html` files inside this directory, skipping the root `path/to/angular/app/index.html`.


## moduleName (string, optional)
The name of the module that will be created.

**Defaults**: `templates`


## isStandalone (boolean, optional)
When `true`, the module will be created as standalone, otherwise, as a dependency of moduleName.
In example, if modulename is `myTemplates`:

- `isStandalone === false` will create `angular.module("myTemplates").run(function($templateCache){$templateCache.put("...","...");...})`
- `isStandalone === true` will create `angular.module("myTemplates",[]).run(function($templateCache){$templateCache.put("...","...");...})`

**Defaults**: `false`


## isNgAnnotate (boolean, optional)
When `true`, `$templateCache` variable will be annotated, otherwise it won't be:

- `isNgAnnotate === false` will create `angular.module("myTemplates").run(function($templateCache){$templateCache.put("...","...");...})`
- `isNgAnnotate === true` will create `angular.module("myTemplates").run(["$templateCache",function($templateCache){$templateCache.put("...","...");...}])`

**Defaults**: `false`


## isCreateOutput (boolean, optional)
When true, the output file will be created. If `templatesFilePath` is specified then the file will be created in the specified value, otherwise in the default location (`path.resolve(path.join(angularRoot, 'templates.js'));`).


## templatesFilePath (string, optional)
The path to the templates file (in case a file will be generated). If the path does not exist, this module will create the needed subdirectories. If the file already exists, it will be replaced. This script is the one that should be included in your `index.html`.

```html
<script src="path/to/templates.js"></script>
```

If this value starts with a slash  (`'/templates.js'`) it will be considered as an absolute path and it will be resolved as it is.
If this value starts with a dot-slash (`'./templates.js'`) it will be considered as a relative path from where this module is being invoked.
Otherwise it will be resolved relative to `angularRoot`.

**Defaults**: `'templates.js'`


## progress (function, optional)
Called each time a template is processed. It has the following signature:

```js
function progress(filePath) {
    return true;
}
```

When it returns `true`, the file specified in `filePath` will be processed, otherwise it will be skipped.

**Defaults**: `function (p) { return true; }`


## contentModifier
Called each time a template has been read. It allows to modify the content of the template. It has the following signature:

```js
function contentModifier(content, filePath, callback) {
    return content;
}
```

It allows to return an string with same/new content, a `Promise` that resolves to the same/new content or rejects (will fail whole process) or it can be resolved with `callback(err, newContent)` (if `err` is specified it will fail the whole process). If an error is thrown it will fail the whole process. 