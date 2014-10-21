gulp-slang
==============

Curl files to running JCR

## Install

```shell
    npm install gulp-slang --save-dev
```

## Example
```js
    var gulp = require('gulp');
    var slang = require('gulp-slang');

    gulp.task('watch', function() {
        gulp.watch('js/*.js', function(e) {
            var path = e.path;
            return gulp.src(path)
                .pipe(slang(path, {
                    port: 4503
                }));
        });
    });
```

## Options
### host
Type: `string`
Default: `localhost`

hostname to running sling instance.
### port
Type: `number`
Default: `4502`

Port for running sling instance.
### username
Type: `string`
Default: `admin`

Username for authentication.
### password
Type: `string`
Default: `admin`

Password for authentication.