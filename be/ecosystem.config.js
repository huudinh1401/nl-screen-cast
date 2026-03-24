module.exports = {
    apps: [{
        name: "api_hoadonNL",  // tên process của bạn
        script: "F:/BACKEND/HOADON_NL/server.js",   // đường dẫn tới file khởi chạy của bạn
        env: {
            NODE_ENV: "production",
            DB_HOST: 'localhost',
            DB_USER: 'chat32',
            DB_PASSWORD: 'WowufAH8g1',
            DB_NAME: 'billmanager',
            PORT: '7010',
            BASE_URL: "https://tailieu.nguyenluan.vn",
            // thêm các biến môi trường khác nếu cần
        }
    }]
}