var gulp = require('gulp')
var plugins = require('gulp-load-plugins')()
var del = require('del')
var es = require('event-stream')
var bowerFiles = require('main-bower-files')
var Q = require('q')

// == PATH STRINGS ========

var paths = {
  scripts: ['app/components/**/*.js', 'app/app.js'],
  conf: {dev: 'app/env/dev-config.js', stage: 'app/env/stage-config.js', prod: 'app/env/prod-config.js'},
  styles: ['./app/styles/**/*.css', './app/styles/**/*.scss'],
  images: 'app/images/**/*',
  assets: 'app/assets/**/*',
  fonts: 'bower_components/bootstrap/dist/fonts/*',
  index: './app/index.html',
  partials: ['app/**/*.html', '!app/index.html'],
  plugins: './app/plugins/**/*',
  distDev: './dist.dev',
  distProd: './dist.prod',
  distScriptsProd: './dist.prod/scripts',
  scriptsDevServer: 'devServer/**/*.js',
  env: 'dev'
}

// == PIPE SEGMENTS ========

var pipes = {}

pipes.orderedVendorScripts = function () {
  return plugins.order(['jquery.js', 'angular.js'])
}

pipes.orderedAppScripts = function () {
  return plugins.angularFilesort()
}

pipes.minifiedFileName = function () {
  return plugins.rename(function (path) {
    path.extname = '.min' + path.extname
  })
}

pipes.validatedAppScripts = function () {
  var conf = gulp.src(paths.conf[paths.env])
      .pipe(plugins.rename('envConfig.js'))

  return es.merge(gulp.src(paths.scripts), conf)
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
}

pipes.builtAppScriptsDev = function () {
  return pipes.validatedAppScripts()
        .pipe(gulp.dest(paths.distDev))
}

pipes.builtAppScriptsProd = function () {
  var scriptedPartials = pipes.scriptedPartials()
  var validatedAppScripts = pipes.validatedAppScripts()

  return es.merge(scriptedPartials, validatedAppScripts)
        .pipe(pipes.orderedAppScripts())
        .pipe(plugins.sourcemaps.init())
            .pipe(plugins.concat('app.min.js'))
            .pipe(plugins.uglify())
        .pipe(plugins.sourcemaps.write())
        .pipe(gulp.dest(paths.distScriptsProd))
}

pipes.builtVendorScriptsDev = function () {
  return gulp.src(bowerFiles())
        .pipe(gulp.dest('dist.dev/bower_components'))
}

pipes.builtVendorScriptsProd = function () {
  return gulp.src(bowerFiles('**/*.js'))
        .pipe(pipes.orderedVendorScripts())
        .pipe(plugins.concat('vendor.min.js'))
        .pipe(plugins.uglify())
        .pipe(gulp.dest(paths.distScriptsProd))
}

pipes.builtVendorStylesProd = function () {
  return gulp.src(bowerFiles('**/*.css'))
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.minifyCss())
      .pipe(plugins.sourcemaps.write())
      .pipe(pipes.minifiedFileName())
      .pipe(gulp.dest(paths.distProd))
}

pipes.validatedDevServerScripts = function () {
  return gulp.src(paths.scriptsDevServer)
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
}

pipes.validatedPartials = function () {
  return gulp.src(paths.partials)
        .pipe(plugins.htmlhint({'doctype-first': false}))
        .pipe(plugins.htmlhint.reporter())
}

pipes.builtPartialsDev = function () {
  return pipes.validatedPartials()
        .pipe(gulp.dest(paths.distDev))
}

pipes.builtPartialsProd = function () {
  return pipes.validatedPartials()
      .pipe(gulp.dest(paths.distProd))
}

pipes.scriptedPartials = function () {
  return pipes.validatedPartials()
        .pipe(plugins.htmlhint.failReporter())
        .pipe(plugins.htmlmin({collapseWhitespace: true, removeComments: true}))
        .pipe(plugins.ngHtml2js({
          moduleName: 'nApp'
        }))
}

pipes.builtStylesDev = function () {
  return gulp.src(paths.styles)
        .pipe(plugins.sass())
        .pipe(gulp.dest(paths.distDev))
}

pipes.builtStylesProd = function () {
  return gulp.src(paths.styles)
        .pipe(plugins.sourcemaps.init())
            .pipe(plugins.sass())
            .pipe(plugins.minifyCss())
        .pipe(plugins.sourcemaps.write())
        .pipe(pipes.minifiedFileName())
        .pipe(gulp.dest(paths.distProd))
}

pipes.processedImagesDev = function () {
  return gulp.src(paths.images)
        .pipe(gulp.dest(paths.distDev + '/images/'))
}

pipes.processedImagesProd = function () {
  return gulp.src(paths.images)
        .pipe(gulp.dest(paths.distProd + '/images/'))
}

pipes.processedAssetsDev = function () {
  return gulp.src(paths.assets)
      .pipe(gulp.dest(paths.distDev + '/assets/'))
}

pipes.processedAssetsProd = function () {
  return gulp.src(paths.assets)
      .pipe(gulp.dest(paths.distProd + '/assets/'))
}

pipes.processedPluginsDev = function () {
  return gulp.src(paths.plugins)
      .pipe(gulp.dest(paths.distDev + '/plugins/'))
}

pipes.processedPluginsProd = function () {
  return gulp.src(paths.plugins)
      .pipe(gulp.dest(paths.distProd + '/plugins/'))
}

pipes.processedFontsDev = function () {
  return gulp.src(paths.fonts)
      .pipe(gulp.dest(paths.distDev + '/bower_components/bootstrap/dist/fonts/'))
}

pipes.processedFontsProd = function () {
  return gulp.src(paths.plugins)
      .pipe(gulp.dest(paths.distProd + '/plugins/'))
}

pipes.validatedIndex = function () {
  return gulp.src(paths.index)
        .pipe(plugins.htmlhint())
        .pipe(plugins.htmlhint.reporter())
}

var prefixCss = function (filepath) {
  return '<link rel="stylesheet" href="/' + filepath + '">'
}

var prefixJs = function (filepath) {
  return '<script src="/' + filepath + '"></script>'
}

pipes.builtIndexDev = function () {
  var orderedVendorScripts = pipes.builtVendorScriptsDev()
        .pipe(pipes.orderedVendorScripts())

  var orderedAppScripts = pipes.builtAppScriptsDev()
      .pipe(pipes.orderedAppScripts())

  var appStyles = pipes.builtStylesDev()

  return pipes.validatedIndex()
        .pipe(gulp.dest(paths.distDev)) // write first to get relative path for inject
        .pipe(plugins.inject(orderedVendorScripts, {relative: true, name: 'bower', transform: prefixJs}))
        .pipe(plugins.inject(orderedAppScripts, {relative: true, name: 'app', transform: prefixJs}))
        .pipe(plugins.inject(appStyles, {relative: true, name: 'app', transform: prefixCss}))
        .pipe(gulp.dest(paths.distDev))
}

pipes.builtIndexProd = function () {
  var vendorScripts = pipes.builtVendorScriptsProd()
  var vendorStyles = pipes.builtVendorStylesProd()
  var appScripts = pipes.builtAppScriptsProd()
  var appStyles = pipes.builtStylesProd()

  return pipes.validatedIndex()
        .pipe(gulp.dest(paths.distProd)) // write first to get relative path for inject
        .pipe(plugins.inject(vendorScripts, {relative: true, name: 'bower', transform: prefixJs}))
        .pipe(plugins.inject(vendorStyles, {relative: true, name: 'bower', transform: prefixCss}))
        .pipe(plugins.inject(appScripts, {relative: true, name: 'app', transform: prefixJs}))
        .pipe(plugins.inject(appStyles, {relative: true, name: 'app', transform: prefixCss}))
        .pipe(plugins.htmlmin({collapseWhitespace: true, removeComments: true}))
        .pipe(gulp.dest(paths.distProd))
}

pipes.builtAppDev = function () {
  return es.merge(pipes.builtIndexDev(), pipes.builtPartialsDev(), pipes.processedImagesDev(), pipes.processedAssetsDev(), pipes.processedPluginsDev(), pipes.processedFontsDev())
}

pipes.builtAppProd = function () {
  return es.merge(pipes.builtIndexProd(), pipes.builtPartialsProd(), pipes.processedImagesProd(), pipes.processedAssetsProd(), pipes.processedPluginsProd(), pipes.processedFontsProd())
}

// == TASKS ========

// set env

gulp.task('set-stage-env', function () {
  paths.env = 'stage'
  return paths.env
})

gulp.task('set-prod-env', function () {
  paths.env = 'prod'
  return paths.env
})

// removes all compiled dev files
gulp.task('clean-dev', function () {
  var deferred = Q.defer()
  del(paths.distDev, function () {
    deferred.resolve()
  })
  return deferred.promise
})

// removes all compiled production files
gulp.task('clean-prod', function () {
  var deferred = Q.defer()
  del(paths.distProd, function () {
    deferred.resolve()
  })
  return deferred.promise
})

// checks html source files for syntax errors
gulp.task('validate-partials', pipes.validatedPartials)

// checks index.html for syntax errors
gulp.task('validate-index', pipes.validatedIndex)

// moves html source files into the dev environment
gulp.task('build-partials-dev', pipes.builtPartialsDev)

// moves html source files into the dev environment
gulp.task('build-partials-prod', pipes.builtPartialsDev)

// converts partials to javascript using html2js
gulp.task('convert-partials-to-js', pipes.scriptedPartials)

// runs jshint on the dev server scripts
gulp.task('validate-devserver-scripts', pipes.validatedDevServerScripts)

// runs jshint on the app scripts
gulp.task('validate-app-scripts', pipes.validatedAppScripts)

// moves app scripts into the dev environment
gulp.task('build-app-scripts-dev', pipes.builtAppScriptsDev)

// concatenates, uglifies, and moves app scripts and partials into the prod environment
gulp.task('build-app-scripts-prod', pipes.builtAppScriptsProd)

// compiles app sass and moves to the dev environment
gulp.task('build-styles-dev', pipes.builtStylesDev)

// compiles and minifies app sass to css and moves to the prod environment
gulp.task('build-styles-prod', pipes.builtStylesProd)

// moves vendor scripts into the dev environment
gulp.task('build-vendor-scripts-dev', pipes.builtVendorScriptsDev)

// concatenates, uglifies, and moves vendor scripts into the prod environment
gulp.task('build-vendor-scripts-prod', pipes.builtVendorScriptsProd)

// validates and injects sources into index.html and moves it to the dev environment
gulp.task('build-index-dev', pipes.builtIndexDev)

// validates and injects sources into index.html, minifies and moves it to the dev environment
gulp.task('build-index-prod', pipes.builtIndexProd)

// builds a complete dev environment
gulp.task('build-app-dev', pipes.builtAppDev)

// builds a complete prod environment
gulp.task('build-app-prod', pipes.builtAppProd)

// cleans and builds a complete dev environment
gulp.task('clean-build-app-dev', ['clean-dev'], pipes.builtAppDev)

// cleans and builds a complete prod environment
gulp.task('clean-build-app-prod', ['clean-prod'], pipes.builtAppProd)

// clean, build, and watch live changes to the dev environment
gulp.task('watch-dev', ['clean-build-app-dev', 'validate-devserver-scripts'], function () {
    // start nodemon to auto-reload the dev server
  plugins.nodemon({ script: 'server.js', ext: 'js', watch: ['devServer/'], env: {NODE_ENV: 'development'}, nodeArgs: ['--inspect'] })
        .on('change', ['validate-devserver-scripts'])
        .on('restart', function () {
          console.log('[nodemon] restarted dev server')
        })

    // start live-reload server
  plugins.livereload.listen({ start: true })

    // watch index
  gulp.watch(paths.index, function () {
    return pipes.builtIndexDev()
            .pipe(plugins.livereload())
  })

    // watch app scripts
  gulp.watch(paths.scripts, function () {
    return pipes.builtAppScriptsDev()
            .pipe(plugins.livereload())
  })

    // watch html partials
  gulp.watch(paths.partials, function () {
    return pipes.builtPartialsDev()
            .pipe(plugins.livereload())
  })

    // watch styles
  gulp.watch(paths.styles, function () {
    return pipes.builtStylesDev()
            .pipe(plugins.livereload())
  })
})

// clean, build, and watch live changes to the prod environment
gulp.task('watch-prod', ['clean-build-app-prod', 'validate-devserver-scripts'], function () {
    // start nodemon to auto-reload the dev server
  plugins.nodemon({ script: 'server.js', ext: 'js', watch: ['devServer/'], env: {NODE_ENV: 'production'} })
        .on('change', ['validate-devserver-scripts'])
        .on('restart', function () {
          console.log('[nodemon] restarted dev server')
        })

    // start live-reload server
  plugins.livereload.listen({start: true})

    // watch index
  gulp.watch(paths.index, function () {
    return pipes.builtIndexProd()
            .pipe(plugins.livereload())
  })

    // watch app scripts
  gulp.watch(paths.scripts, function () {
    return pipes.builtAppScriptsProd()
            .pipe(plugins.livereload())
  })

    // watch hhtml partials
  gulp.watch(paths.partials, function () {
    return pipes.builtAppScriptsProd()
            .pipe(plugins.livereload())
  })

    // watch styles
  gulp.watch(paths.styles, function () {
    return pipes.builtStylesProd()
            .pipe(plugins.livereload())
  })
})

gulp.task('deploy', ['clean-build-app-prod', 'validate-devserver-scripts'], function () {
    // start nodemon to auto-reload the dev server
  plugins.nodemon({ script: 'server.js', ext: 'js', env: {NODE_ENV: 'production'} })
      .on('restart', function () {
        console.log('[nodemon] restarted dev server')
      })
})

// default task builds for prod
gulp.task('default', ['clean-build-app-prod'])
