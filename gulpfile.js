var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var uglify = require('gulp-uglify');
var browserify = require('browserify');
var minifyHTML = require('gulp-minify-html');
var minifyInline = require('gulp-minify-inline');
var babelify = require('babelify');
var watchify = require('watchify');
var mergeStream = require('merge-stream');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
//var assign = require('lodash/object/assign');

var jsBundles = ['src/js/main.js'];

gulp.task('js', function(){
	return gulp.src('src/js/*.js')
	.pipe(uglify())
	.pipe(browserify())
	.pipe(gulp.dest('dist/js'));
});

function bundle(src){
	src = [src];
	var customOpts = {
		entries: src,
		debug: true
	};
	//var opts = assign({}, watchify.args, customOpts);
	var b = watchify(browserify(src));

	b.transform(babelify);

	//b.transform(hbsfy);
	
	return b.bundle()
	.on('error', function(error) {console.log('Erroooo', error);})
	.pipe(gulp.dest('dist/js'));
}

gulp.task('js-bundle', function(){
	// return gulp.src(jsBundles, { read: false }).pipe(browserify({
	// 	insertGlobals : true,
	// 	debug : !gulp.env.production
	// })).pipe(gulp.dest('dist/js'));
	// return browserify('src/js/main.js')
	// .transform(babelify.configure({
	// 	stage: 1
	// }))
	// .bundle()
	// .pipe(gulp.dest('dist/js'));
	var bundler = browserify('src/js/main.js', { debug: true }).transform(babelify);
	return bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
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


gulp.task('default', ['js-bundle', 'sw', 'html'], function(){

});

gulp.task('serve',['default'], function(){
	browserSync.init({
		server:'dist/'});
	browserSync.stream();

});
