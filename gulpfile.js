var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var browserify = require('browserify');
var htmlmin = require('gulp-htmlmin');
var minifyInline = require('gulp-minify-inline');
var babelify = require('babelify');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var eslint = require('gulp-eslint');
var minifyCss = require('gulp-minify-css');
var postcss      = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var minifyJS = require('gulp-minify');
var rename = require('gulp-rename');

gulp.task('js-bundle', function(){
	var bundler = browserify('src/js/main.js', { debug: true }).transform(babelify);
	return bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('main.js'))
      .pipe(buffer())  
      .pipe(minifyJS({noSource: true}))
      .pipe(rename('main.js'))
      .pipe(gulp.dest('dist/js'));
});

gulp.task('sw', function(){
	return gulp.src('src/sw.js')
	.pipe(minifyJS({noSource: true}))
    .pipe(rename('sw.js'))
	.pipe(gulp.dest('dist/'));
});

gulp.task('html', function() {
	return gulp.src('src/*.html')
	.pipe(minifyInline())
	.pipe(htmlmin({collapseWhitespace: true}))
	.pipe(gulp.dest('dist/'));
});

gulp.task('css', function(){
	return gulp.src('src/css/*.css')
	.pipe(minifyCss({compatibility: 'ie8'}))
    .pipe(postcss([ autoprefixer({ browsers: ['last 2 versions'] }) ]))
	.pipe(gulp.dest('dist/css'));
});

gulp.task('lint', function(){
	return gulp.src(['src/js/*.js', 'src/*.js']).pipe(eslint()).pipe(eslint.format());
});

gulp.task('watch-src', function(){
	gulp.watch(['src/*.html'], ['html'],reload);
	gulp.watch(['src/*.js'], ['sw'],reload);
	gulp.watch(['src/js/main.js'], ['js-bundle'],reload);
	gulp.watch(['src/css/*.css'], ['css'],reload);
});


gulp.task('default', ['js-bundle', 'sw', 'html', 'css', 'watch-src'], function(){

});

gulp.task('serve',['default'], function(){
	browserSync.init({
		server:'dist/'});
	browserSync.stream();
});
