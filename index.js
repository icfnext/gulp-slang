var curl = require('node-curl');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through2');
var jsdom = require('jsdom');
var chalk = require('chalk');

// Colors
var errorbold = chalk.bold.red;
var error = chalk.bold.red;
var allgood = chalk.green;
var allgoodbold = chalk.bold.green;
var gray = chalk.gray;

function slang(dest, opt) {
    // if no options passed, create options object
    if (!opt) opt = {};
    // Set defaults for options
    var HOST = opt.host || 'localhost';
    var PORT = opt.port || 4502;
    var USER = opt.username || 'admin';
    var PASS = opt.password || 'admin';
    var URL;
    // return stream to gulp
    return through.obj(function(file, enc, cb) {
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
            HOST + ':' + PORT + '/' + path.dirname(destPath);

        // curl post multi-part form following sling's upload documentation
        // sling.apache.org/documentation/bundles/manipulating-content-the-slingpostservlet-servlets-post.html#file-uploads
        curl(URL, {
            MULTIPART: [
                { name: '*', file: file.path, type: 'file' },
                { name: '*@TypeHint', contents: 'nt:file' }
            ]
        }, function(e) {
            if (e) {
                return console.error('upload failed:', e);
            }
            var body = this.body;

            if (body.length) {
                // use jsdom to read response HTML and display relevant messages
                jsdom.env(body, [], function(err, window) {
                    var status = window.document.getElementById('Status') ?
                        window.document.getElementById('Status').textContent :
                        '201';
                    var message = window.document.getElementById('Message') ?
                        window.document.getElementById('Message').textContent :
                        'File Created';
                    var location = window.document.getElementById('Location') ?
                        window.document.getElementById('Location').textContent :
                        file.path;

                    if (status === '200' || status === '201') {
                        gutil.log(allgoodbold('File Upload Successful: ') +
                            allgood(status) + ' - ' + allgood(message));
                        gutil.log(gray('Uploaded To: ') + gray(location));
                    } else {
                        gutil.log(errorbold('File Upload Failed: ') +
                            error(status) + ' - ' + error(message));
                    }
                    // close jsdom window
                    window.close();
                });
            } else {
                // generic error most often given with username and password
                gutil.log(errorbold('File Upload Failed -
                    Check Username and Password'));
            }

            cb(null, file);

        });
    });
}

module.exports = slang;
