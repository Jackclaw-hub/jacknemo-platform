const parseMultipart = (req, res, next) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk.toString();
    });

    req.on('end', () => {
        try {
            const boundary = req.headers['content-type'].split('; ')[1].split('=')[1];
            const parts = data.split(`--${boundary}`).slice(1, -1);

            req.body = {};
            req.files = [];

            parts.forEach(part => {
                if (part.includes('Content-Disposition: form-data')) {
                    const headers = part.split('\r\n\r\n')[0];
                    const content = part.split('\r\n\r\n')[1];

                    const nameMatch = headers.match(/name="([^"]+)"/);
                    const filenameMatch = headers.match(/filename="([^"]+)"/);
                    const contentTypeMatch = headers.match(/Content-Type: ([\w/\-]+)/);

                    if (filenameMatch && filenameMatch[1]) {
                        // This is a file
                        req.files.push({
                            fieldname: nameMatch ? nameMatch[1] : 'file',
                            originalname: filenameMatch[1],
                            mimetype: contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream',
                            buffer: Buffer.from(content, 'binary') // Assuming binary content
                        });
                    } else if (nameMatch && nameMatch[1]) {
                        // This is a field
                        req.body[nameMatch[1]] = content.trim();
                    }
                }
            });
            next();
        } catch (error) {
            console.error('Multipart parsing error:', error);
            res.status(400).json({ error: 'Failed to parse multipart/form-data' });
        }
    });
};

module.exports = parseMultipart;
