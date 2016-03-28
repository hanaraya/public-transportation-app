var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var uglify = require('gulp-uglify');
var browserify = require('browserify');
var minifyHTML = require('gulp-minify-html');
var minifyInline = require('gulp-minify-inline');

gulp.task('js', function(){
	return gulp.src('src/js/*.js')
	//.pipe(uglify())
	//.pipe(browserify())
	.pipe(gulp.dest('dist/js'));
});

gulp.task('sw', function(){
	return gulp.src('src/*.js')
	.pipe(uglify())
	//.pipe(browserify())
	.pipe(gulp.dest('dist/'));
});

gulp.task('html', function() {
	return gulp.src('src/*.html')
	.pipe(minifyInline())
	.pipe(minifyHTML())
	.pipe(gulp.dest('dist/'));
});


gulp.task('default', ['js', 'sw', 'html'], function(){

});

gulp.task('serve',['default'], function(){
	browserSync.init({
		server:'dist/'});
	browserSync.stream();

});
