const express = require('express');
const router = express.Router();
const parseMultipart = require('../middleware/multipartUpload');

router.post('/upload', parseMultipart, (req, res) => {
    res.json({
        message: 'File upload and fields parsed successfully!',
        body: req.body,
        files: req.files.map(file => ({ 
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.buffer.length
        }))
    });
});

module.exports = router;
