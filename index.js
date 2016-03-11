var gutil = require('gulp-util');
var path = require('path');
var through = require('through2');
var chalk = require('chalk');
var request = require('request');
var fs = require('fs');

// Colors
var errorbold = chalk.bold.red;
var error = chalk.bold.red;
var allgood = chalk.green;
var allgoodbold = chalk.bold.green;
var gray = chalk.gray;

function slang(opt) {
    // if no options passed, create options object
    if (!opt) opt = {};
    // Set defaults for options
    var HOST = opt.host || 'localhost';
    var PORT = opt.port || 4502;
    var USER = opt.username || 'admin';
    var PASS = opt.password || 'admin';
    var URL;

    // return stream to gulp
    var stream = through.obj(function(file, enc, cb) {
        if (file.isNull()) {
            cb(new gutil.PluginError('gulp-slang', 'No file passed'));
            return;
        }

        if (file.isStream()) {
            cb(new gutil.PluginError('gulp-slang', 'Streaming not supported'));
            return;
        }
        // if jcr_root is in file system path, remove before setting destination
        var destPath = file.path;
        if (path.dirname(destPath).indexOf('jcr_root/') !== -1) {
            destPath = destPath.substring(path.dirname(destPath)
                .indexOf('jcr_root/') + 9);
        }

        // create full URL for curl path
        URL = 'http://' + USER + ':' + PASS + '@' +
            HOST + ':' + PORT + '/' + path.dirname(destPath) + ".json";

        var options = {
            url: URL,
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        };

        function optionalCallback (err, httpResponse, responseBody) {
            if (err) {
                gutil.log(errorbold('File Upload Failed'));
            }

            try {
                var response = JSON.parse( responseBody );

                var status = response['status.code'] ? response['status.code'] : 201;
                var message = response['status.message'] ? response['status.message'] : 'File Created';
                var location = response.location ? response.location : file.path;

                if (status === 200 || status === 201 ) {
                    gutil.log( allgoodbold('File Upload Successful to port ') + allgood(PORT) + allgood(" : ") +
                        allgood(status) + ' - ' + allgood(message));
                    gutil.log(gray('Uploaded To: ') + gray(location));
                } else {
                    gutil.log(errorbold('File Upload Failed: ') +
                        error(status) + ' - ' + error(message));
                }
            } catch(err) {
                // generic error most often given with username and password
                gutil.log(errorbold('File Upload Failed - Check Username and Password'));
            }

            // deferred.resolve( responseBody);
            cb(null, file);

        };

        var r = request(options , optionalCallback).auth(USER, PASS);

        var form = r.form();

        form.append('*', fs.createReadStream(file.path));
        form.append('@TypeHint', "nt:file");
    });

    return stream;
}

module.exports = slang;
