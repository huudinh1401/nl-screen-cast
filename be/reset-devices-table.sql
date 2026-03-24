-- Reset bảng devices với cấu trúc mới
DROP TABLE IF EXISTS `connection_requests`;
DROP TABLE IF EXISTS `devices`;

-- Bảng sẽ được tạo lại tự động bởi Sequelize khi restart server
