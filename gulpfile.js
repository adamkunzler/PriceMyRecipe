'use strict';

// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var htmlmin = require('gulp-htmlmin');
var versionNumber = require('gulp-version-number');
var ngAnnotate = require('gulp-ng-annotate');

const versionConfig = {
    'value': '%MDS%',
    'append': {
        'key': 'v',
        'to': ['css', 'js']
    }
};

gulp.task('html', function() {
    return gulp.src('app/**/*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(versionNumber(versionConfig))
        .pipe(gulp.dest('dist/app/'))
});

// Lint Task
gulp.task('lint', function() {
    return gulp.src('app/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src('app/**/*.js')
        .pipe(concat('priceMyRecipe.js'))
        .pipe(gulp.dest('dist/dist/js'))
        .pipe(rename('priceMyRecipe.min.js'))
        .pipe(ngAnnotate())
        .pipe(uglify())
        .pipe(gulp.dest('dist/dist/js'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch(['app/**/*.js', 'app/**/*.css'], ['lint', 'scripts']);
});

// Default Task
gulp.task('default', ['lint', 'scripts', 'watch']);

gulp.task('deployprod', ['lint', 'scripts', 'html']);