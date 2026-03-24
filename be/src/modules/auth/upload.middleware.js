/**
 * Simple Upload Middleware - Avatar Only
 * Chỉ hỗ trợ upload avatar vào thư mục /uploads/avatar
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục avatar nếu chưa tồn tại
const avatarDir = path.join(__dirname, '../../uploads/avatar');
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

// Cấu hình storage cho avatar
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarDir);
    },
    filename: (req, file, cb) => {
        // Tạo tên file: userId_timestamp.extension
        const userId = req.user ? req.user.id : 'unknown';
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        cb(null, `${userId}_${timestamp}${extension}`);
    }
});

// Kiểm tra file type cho avatar
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.mimetype)) {
        const error = new Error("Chỉ hỗ trợ file hình ảnh: JPEG, PNG, GIF, WebP");
        error.status = 400;
        return cb(error, false);
    }
    
    cb(null, true);
};

// Cấu hình multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // Giới hạn 5MB cho avatar
    },
    fileFilter: fileFilter
});

module.exports = upload;