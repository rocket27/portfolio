// --------------------------------------------------------------- //
// Plugins
// --------------------------------------------------------------- //

const del          = require('del'),
      gulp         = require('gulp'),
      sass         = require('gulp-sass'),
      sftp         = require('gulp-sftp'),
      wait         = require('gulp-wait'),
      cache        = require('gulp-cache'),
      concat       = require('gulp-concat'),
      uglify       = require('gulp-uglify'),
      notify       = require('gulp-notify'),
      gulpIf       = require('gulp-if'),
      rename       = require('gulp-rename'),
      plumber      = require('gulp-plumber'),
      imageMin     = require('gulp-imagemin'),
      minifyCss    = require('gulp-csso'),
      sourceMaps   = require('gulp-sourcemaps'),
      runSequence  = require('run-sequence'),
      browserSync  = require('browser-sync'),
      autoPrefixer = require('gulp-autoprefixer');
      
// --------------------------------------------------------------- //
// Settings
// --------------------------------------------------------------- //

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

let jsModules = [ // Массив своих JS файлов в необходимом порядке
    'src/js/main.js'
    // остальные файлы
]

let vendorJs = [ // Массив сторонних библиотек JS в необходимом порядке
    'node_modules/jquery/dist/jquery.js',
    'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.js'
    // 'node_modules/owl.carousel/dist/owl.carousel.js'
    // остальные файлы
]

let vendorCss = [ // Массив сторонних библиотек CSS в необходимом порядке
    'node_modules/normalize.css/normalize.css',
    'node_modules/font-awesome/css/font-awesome.css',
    'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.css'
    // остальные файлы
]

// --------------------------------------------------------------- //
// Task: HTML. Перенос HTML файлов в /dist
// --------------------------------------------------------------- //

gulp.task('html', function() {
    return gulp.src('src/*.html')
        .pipe(gulp.dest('dist'))
});

// --------------------------------------------------------------- //
// Task: FONTS. Перенос шрифтов в /dist/fonts
// --------------------------------------------------------------- //

gulp.task('fonts', function() {
    return gulp.src('src/fonts/**/*.*')
        .pipe(gulp.dest('dist/fonts'))
});

// --------------------------------------------------------------- //
// Task: FILES. Перенос файлов в /dist/files
// --------------------------------------------------------------- //

gulp.task('files', function() {
    return gulp.src('src/files/**/*.*')
        .pipe(gulp.dest('dist/files'))
});

// --------------------------------------------------------------- //
// Task: IMAGES. Оптимизация и перенос картинок в /dist/img
// --------------------------------------------------------------- //

gulp.task('images', function () {
    return gulp.src(['src/img/**/*.*', '!**/*.svg'])
        .pipe(cache(imageMin({
            optimizationLevel: 3, 
            progressive: true, 
            interlaced: true,
            svgoPlugins: [{removeViewBox: true}]
        })))
        .pipe(gulp.dest('dist/img/'));
});

// --------------------------------------------------------------- //
// Task: SVG. Перенос SVG в /dist/img без оптимизации (imagemin портит svg)
// --------------------------------------------------------------- //

gulp.task('svg', function () {
    return gulp.src('src/img/**/*.svg')
        .pipe(gulp.dest('dist/img/'));
});

// --------------------------------------------------------------- //
// Task: FAVICON. Перенос FAVICON в /dist
// --------------------------------------------------------------- //

gulp.task('favicon', function () {
    return gulp.src('src/favicon.ico')
        .pipe(gulp.dest('dist'));
});

// --------------------------------------------------------------- //
// Task: STYLES. 
// --------------------------------------------------------------- //

gulp.task('styles', function() {
    return gulp.src('src/scss/main.scss')
        .pipe(wait(500))
        .pipe(plumber({
            errorHandler: notify.onError(function (error) {
                return {title: 'SCSS error!', message: error.message}
            })
        }))
        .pipe(gulpIf(isDevelopment, sourceMaps.init()))
        .pipe(sass())
        .pipe(autoPrefixer('last 2 versions'))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifyCss())
        .pipe(gulpIf(isDevelopment, sourceMaps.write()))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.stream())
});

// --------------------------------------------------------------- //
// Task: Vendor CSS. Сборка и сжатие сторонних CSS файлов с последующим 
// перемещением готового файла в dist/css
// --------------------------------------------------------------- //

gulp.task('vendor:css', function() {
    return gulp.src(vendorCss) // Берем массив сторонних CSS файлов
        .pipe(concat('vendor.min.css')) // Собираем все в новом файле vendor.min.css
        .pipe(minifyCss()) // Сжимаем файл
        .pipe(gulp.dest('dist/css')); // Кладем готовый файл в папку dist/css
});

// --------------------------------------------------------------- //
// Task: Vendor JS. Сборка и сжатие сторонних JS файлов с последующим 
// перемещением готового файла в dist/js
// --------------------------------------------------------------- //

gulp.task('vendor:js', function() {
    return gulp.src(vendorJs) // Берем массив внешних библиотек JS
        .pipe(concat('vendor.min.js')) // Собираем все в новом файле vendor.min.js
        .pipe(uglify()) // Сжимаем файл
        .pipe(gulp.dest('dist/js')); // Кладем готовый файл в папку dist/js 
});

// --------------------------------------------------------------- //
// Task: JS. Сборка и сжатие своих файлов JS с последующим перемещением
// готового файла в dist/js
// --------------------------------------------------------------- //

gulp.task('js', function() {
    return gulp.src(jsModules)
        .pipe(plumber({
            errorHandler: notify.onError(function (error) {
                return {title: 'JavaScript error!', message: error.message}
            })
        }))
        .pipe(gulpIf(isDevelopment, sourceMaps.init()))
        .pipe(concat('main.min.js'))
        .pipe(uglify())
        .pipe(gulpIf(isDevelopment, sourceMaps.write()))
        .pipe(gulp.dest('dist/js'))
});

// --------------------------------------------------------------- //
// Task: BrowserSync. Запускаем сервер. Предварительно выполнив задачи
// HTML, FONTS, FILES, IMAGES, Vendor CSS, Vendor JS, STYLES, JS. Сервер 
// наблюдает за папкой "./dist".
// --------------------------------------------------------------- //

gulp.task('browser-sync', [
    'html',
    'fonts',
    'files',
    'images',
    'svg',
    'favicon',
    'vendor:css',
    'vendor:js',
    'styles',
    'js'  
], function() {
    browserSync.init({
        server: {
            baseDir: "./dist"
        }
    });
    browserSync.watch(['./dist/**/*.*', '!**/*.css'], browserSync.reload);
});

// --------------------------------------------------------------- //
// Task: Watch.
// --------------------------------------------------------------- //

gulp.task('watch', function() {
    gulp.watch('src/*.html', ['html']);
    gulp.watch('src/scss/**/*.scss', ['styles']);
    gulp.watch('src/js/**/*.js', ['js']);
    gulp.watch(['src/img/**/*.*', '!**/*.svg'], ['images']);
    gulp.watch('src/img/**/*.svg', ['svg']);
    gulp.watch('src/favicon.ico', ['favicon']);
    gulp.watch('src/files/**/*.*', ['files']);
});

// --------------------------------------------------------------- //
// Task: Default.
// --------------------------------------------------------------- //

gulp.task('default', ['browser-sync', 'watch']);

// --------------------------------------------------------------- //
// Task: Clean.
// --------------------------------------------------------------- //

gulp.task('clean', function() {
    return del(['dist'], {force: true}).then(paths => {
        console.log('Deleted files and folders in dist');
    });
});

// --------------------------------------------------------------- //
// Task: Build. Выполняем перенос шрифтов, картинок, сторонних CSS и 
// JS файлов в папку dist
// --------------------------------------------------------------- //

gulp.task('build', function(callback) {
    runSequence(['clean'], [
        'html',
        'fonts',
        'files',
        'images',
        'svg',
        'favicon',
        'vendor:css',
        'vendor:js',
        'styles',
        'js'
    ], callback);
});

// --------------------------------------------------------------- //
// Task: Deploy.
// --------------------------------------------------------------- //

gulp.task('deploy', function () {
    return gulp.src('dist/**/*.*')
        .pipe(sftp({
            host: 'hostName',
            user: 'userName',
            pass: 'password',
            remotePath: 'projectFolder/public_html/'
        }));
});