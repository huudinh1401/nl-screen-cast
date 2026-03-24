/**
 * Main server entry point
 * Khởi tạo Express app, Socket.IO, database và các services
 */
require("dotenv").config();
const app = require("./src/app");
const PORT = process.env.PORT || 3000;
const http = require('http');
const socketIo = require('socket.io');

// Database connection and setup
const db = require("./src/config/sequelize");
const { setupAssociations, RolePermission } = require("./src/config/associations");

// Import models
const User = require('./src/modules/user/user.model');
const Role = require('./src/modules/role/role.model');
const Permission = require('./src/modules/permission/permission.model');
const Auth = require('./src/modules/auth/auth.model');
const Log = require('./src/modules/log/log.model');
const UuidLogin = require('./src/modules/auth/uuid_login.model');
const Device = require('./src/modules/device/device.model');
const ConnectionRequest = require('./src/modules/connection/connection.model');

// Setup model associations
setupAssociations();

/**
 * Đồng bộ database và tạo bảng
 */
const syncDatabase = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Connected to the database");

    // Sync từng model riêng lẻ theo đúng thứ tự phụ thuộc để đảm bảo ràng buộc khóa ngoại
    await Role.sync({ alter: false });
    console.log("Role model synchronized");

    await Permission.sync({ alter: false });
    console.log("Permission model synchronized");

    await RolePermission.sync({ alter: false });
    console.log("RolePermission model synchronized");

    await User.sync({ alter: false });
    console.log("User model synchronized");

    await Auth.sync({ alter: false });
    console.log("Auth model synchronized");

    await UuidLogin.sync({ alter: false });
    console.log("UuidLogin model synchronized");

    await Log.sync({ alter: false });
    console.log("Log model synchronized");

    await Device.sync({ alter: false });
    console.log("Device model synchronized");

    await ConnectionRequest.sync({ alter: false });
    console.log("ConnectionRequest model synchronized");

    console.log("All models synchronized successfully");
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    throw error;
  }
};

var server = http.createServer(app);
let io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
  },
  transports: ['websocket', 'polling']
});

// Import Socket Handler
const SocketHandler = require('./src/socket/socket.handler');
const socketHandler = new SocketHandler(io);

// Kết nối với Socket.IO
io.on('connection', (socket) => {
  socketHandler.handleConnection(socket);
});

// Setup timeout cleanup
socketHandler.setupTimeoutCleanup();

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    // 1. Đồng bộ database trước tiên
    await syncDatabase();
    console.log('Database đã được đồng bộ thành công');

    // 2. Tạo SuperAdmin nếu chưa có
    const createSuperAdmin = require('./src/utils/create-superadmin');
    await createSuperAdmin();

    console.log('Hệ thống đã khởi tạo hoàn tất và sẵn sàng hoạt động!');

  } catch (error) {
    console.error('Lỗi khi khởi tạo hệ thống:', error);
    console.log('Server sẽ dừng do lỗi khởi tạo');
    process.exit(1);
  }
});

// Xử lý khi server đóng
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  process.exit(0);
});
