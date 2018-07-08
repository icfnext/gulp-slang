const path = require('path')
const through = require('through2')
const signale = require('signale')
const request = require('request')
const fs = require('fs')

function slang(opt) {
    // if no options passed, create options object
    if (!opt) opt = {};
    // Set defaults for options
    const HOST = opt.host || 'localhost'
    const PORT = opt.port || 4502
    const USER = opt.username || 'admin'
    const PASS = opt.password || 'admin'

    // return stream to gulp
    const stream = through.obj((file, enc, cb) => {
        if (file.isNull()) {
            cb(new PluginError('gulp-slang', 'No file passed'));
            return
        }

        if (file.isStream()) {
            cb(new PluginError('gulp-slang', 'Streaming not supported'));
            return
        }
        // if jcr_root is in file system path, remove before setting destination
        let destPath = file.path;
        if (path.dirname(destPath).indexOf('jcr_root') !== -1) {
            destPath = destPath.substring(path.dirname(destPath)
                .indexOf('jcr_root') + 9);
        }

        // create full URL for curl path
        const URL = `http://${USER}:${encodeURIComponent(PASS)}@${HOST}:${PORT}/${path.dirname(destPath)}.json`
        const options = {
            url: URL,
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        }

        function handler (err, response, body) {
            //console.log(err, response && response.statusCode)
            if (err) {
                console.log('error')
                signale.error('File Upload Failed')
                return
            }

            try {
                const response = JSON.parse( body )

                const status = response['status.code'] ? response['status.code'] : 201
                const message = response['status.message'] ? response['status.message'] : 'File Created'
                const location = response.location ? response.location : file.path

                if (status === 200 || status === 201 ) {
                    signale.success(`File Upload Successful to port ${PORT} ${status} - ${message}`)
                    signale.info(`Uploaded to: ${location}`)
                } else {
                    signale.error(`File Upload Failed`)
                    signale.info(`${(status == 500) ? 'File destination may not exist' : message}`)
                }
            } catch(err) {
                // generic error most often given with username and password
                if (response && response.statusCode == 401){
                    signale.error('[UNAUTHORIZED] File Upload Failed - Check Username and Password')
                }
            }

            // deferred.resolve( responseBody);
            cb(null, file)

        }

        const r = request(options, handler).auth(USER, PASS)

        const form = r.form()
        form.append('*', fs.createReadStream(file.path));
        form.append('@TypeHint', "nt:file");
    });

    return stream;
}

module.exports = slang;
