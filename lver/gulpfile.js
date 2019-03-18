var gulp = require('gulp');
var stylus = require('gulp-stylus');
var rename = require('gulp-rename');

gulp.task('stylus', function() {
	return gulp.src('pages/index/index.stylus')
		.pipe(stylus())
		.pipe(rename((path) => path.extname = ".wxss"))
		.pipe(gulp.dest('pages/index'))
	})

gulp.watch('pages/index/index.stylus', ['stylus'])