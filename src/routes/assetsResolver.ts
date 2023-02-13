const express = require('express');
const router = express.Router();
const glob = require('glob');

type FileType = {
    name: string;
    mimeType: string;
};

export const CSS: FileType = {
    name: 'css',
    mimeType: 'text/css'
};

export const JS: FileType = {
    name: 'js',
    mimeType: 'text/javascript; charset=UTF-8'
};


/* GET home page. */
router.get('/', function (req, res) {
    let requestedFile: String = req.requested_file;
    let requestedFileType: FileType = req.requested_file_type;
    let assetsPath: String = req.assets_path;
    let fileSearchPattern = `${assetsPath}/static/${requestedFile}`;
    glob(fileSearchPattern, (err, files: string[]) => {
        if (err) {
            console.log(err);
            res.statusCode = 500;
            res.write('Internal error');
            res.end();
        } else {
            if (files && files.length > 0) {
                const headers = {'Content-Type': requestedFileType.mimeType}
                res.set('Cache-control', 'public, max-age=300')
                res.sendFile(files[0], {headers: headers, lastModified: false, etag: false})
            } else {
                console.log(`Requested file not found in ${fileSearchPattern}`);
                res.statusCode = 404;
                res.write('Not found');
                res.end();
            }
        }
    });
})

export default router;
