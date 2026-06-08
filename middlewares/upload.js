const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDire = path.join(__dirname, '../public/uploads');

if (!fs.existsSync(uploadDire)) {
    fs.mkdirSync(uploadDire, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDire);
    },
    filename(req, file, cb) {
        const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1E9);

        const ext = path
            .extname(file.originalname)
            .toLowerCase();

        cb(null, 'img-' + uniqueSuffix + ext);
    }
});

const fileFiltro = (req, file, cb) => {

    const allowedTypes = /jpeg|jpg|png|gif|webp/;

    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    );

    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(
            new Error(
                'Solo se permiten imágenes'
            ),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFiltro,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = upload;