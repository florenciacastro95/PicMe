const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'uploads', 
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return 'img-' + uniqueSuffix;
        },
    },
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
    storage: storage,
    fileFiltro: fileFiltro,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = upload;