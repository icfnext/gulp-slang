var gulp = require('gulp');
var slang = require('./index.js');
var yargs = require('yargs').default({p: 4502}).argv;
var livereload = require('gulp-livereload');
var less = require('gulp-less');
var path = require('path');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

var paths = {
    js: 'js/**/*.js',
    styles: {
        app: {
            dir: 'otherless/**/*.less',
            less: 'otherless/app.less',
            compiled: 'otherless/compiled'
        },
        theme: {
            dir: 'less/**/*.less',
            less: 'less/base.less',
            compiled: 'less/compiled'
        }
    },
    css: 'otherless/**/*.css'
}

function doSlang(e) {
    var path = e.path;
    return gulp.src(path)
        .pipe(slang(path, {
            port: yargs.p
        }));
}

gulp.task('browser-sync', function() {
    browserSync({
        proxy: 'localhost:' + yargs.p + ''
    });
});

gulp.task('app-less', function() {
    return gulp.src(paths.styles.app.less)
        .pipe(less())
        .pipe(gulp.dest(paths.styles.app.compiled));
});

gulp.task('less', function() {
    return gulp.src(paths.styles.theme.less)
        .pipe(less())
        .pipe(gulp.dest(paths.styles.theme.compiled));
});

gulp.task('watch', function() {
    livereload.listen();
    gulp.watch(paths.styles.app.dir, ['app-less'], doSlang);
    gulp.watch(paths.styles.theme.dir, ['less'], doSlang);
    gulp.watch([paths.js, paths.jsp, paths.css, paths.txt], doSlang);
});

gulp.task('default', ['browser-sync', 'watch']);
