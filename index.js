var gutil       = require('gulp-util');
var path        = require('path');
var through     = require('through2');
var jsdom       = require('jsdom');
var chalk       = require('chalk');
var Q           = require("q");
var request     = require('request');
var fs          = require("fs");

// Colors
var errorbold   = chalk.bold.red;
var error       = chalk.bold.red;
var allgood     = chalk.green;
var allgoodbold = chalk.bold.green;
var gray        = chalk.gray;

function slang(file, opt) {
    // if no options passed, create options object
    if (!opt) opt = {};
        
    // Set defaults for options
    var HOST        = opt.host || 'localhost';
    var PORT        = opt.port || 4502;
    var USER        = opt.username || 'admin';
    var PASS        = opt.password || 'admin';
    var deferred    = Q.defer();
    var URL;


    // if jcr_root is in file system path, remove before setting destination
    var destPath = file.path;
    if (path.dirname(destPath).indexOf('jcr_root/') !== -1) {
        destPath = destPath.substring(path.dirname(destPath)
            .indexOf('jcr_root/') + 9);
    }

    // create full URL for curl path
    URL = 'http://' + USER + ':' + PASS + '@' +
        HOST + ':' + PORT + '/' + path.dirname(destPath);
    
    var r = request.post( URL , function optionalCallback (err, httpResponse, body) {

        
        if (err) {
            return deferred.reject( err );
        }

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
                    gutil.log(allgoodbold('File Upload Successful to port ') + allgood(PORT) + allgood(" : ") +
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
            gutil.log(errorbold('File Upload Failed - Check Username and Password'));
            
        }

        deferred.resolve( body );

    }).auth("admin","admin");

    var form = r.form();

    form.append('*', fs.createReadStream( file.path ) );
    form.append('@TypeHint', "nt:file");

    
    return deferred.promise;
}

module.exports = slang;
