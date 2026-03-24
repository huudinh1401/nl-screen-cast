# NL ScreenCast Backend

Backend cho hệ thống kết nối giữa Mobile App (iOS) và Web (PC) qua WebSocket.

## Cài đặt

```bash
cd be
npm install
```

## Cấu hình Database

Tạo database MySQL:
```sql
CREATE DATABASE db_livescreen;
```

File `.env` đã được tạo với cấu hình:
- DB_HOST=localhost
- DB_USER=root
- DB_PASSWORD=
- DB_NAME=db_livescreen
- DB_PORT=3306

## Chạy Server

```bash
npm run dev
```

Server chạy tại: http://localhost:3000

## Socket Events

### Mobile App (iOS)

**1. Đăng ký thiết bị (tự động sinh mã)**
```javascript
socket.emit('mobile:register', {
  deviceInfo: { model: 'iPhone 14', os: 'iOS 16' }
});

socket.on('mobile:registered', (data) => {
  console.log(data.deviceCode); // "NL-AB12CD" (tự động sinh)
  console.log(data.isNewDevice); // true
  // Lưu deviceCode vào storage để dùng lại
});
```

**1b. Đăng ký lại với mã cũ**
```javascript
socket.emit('mobile:register', {
  deviceCode: 'NL-AB12CD', // mã đã lưu
  deviceInfo: { model: 'iPhone 14', os: 'iOS 16' }
});

socket.on('mobile:registered', (data) => {
  console.log(data.isNewDevice); // false
});
```

**2. Nhận yêu cầu kết nối**
```javascript
socket.on('mobile:incoming_request', (data) => {
  // Hiển thị popup xác nhận
  console.log('Request ID:', data.requestId);
});
```

**3. Phản hồi yêu cầu**
```javascript
socket.emit('mobile:response', {
  requestId: 'uuid-request-id',
  accept: true // hoặc false
});
```

### Web (PC)

**1. Gửi yêu cầu kết nối**
```javascript
socket.emit('web:connect_request', {
  deviceCode: 'NL-AB12CD'
});

socket.on('web:request_sent', (data) => {
  console.log(data.message); // "Yêu cầu kết nối đã được gửi"
});
```

**2. Nhận kết quả**
```javascript
socket.on('web:connect_result', (data) => {
  if (data.success) {
    console.log('Kết nối thành công');
  } else {
    console.log('Lỗi:', data.message);
  }
});
```

## REST API

### Tạo mã thiết bị mới
```
POST /api/devices/generate
Body: { "deviceInfo": { "model": "iPhone 14" } }
```

### Kiểm tra trạng thái thiết bị
```
GET /api/devices/status/:deviceCode
```

### Lấy thông tin thiết bị
```
GET /api/devices/info/:deviceCode
```

## Error Codes

- `DEVICE_OFFLINE`: Thiết bị không trực tuyến
- `INVALID_CODE`: Mã thiết bị không hợp lệ
- `REQUEST_NOT_FOUND`: Không tìm thấy yêu cầu
- `TIMEOUT`: Yêu cầu hết thời gian chờ

## Database Schema

### devices
- id (UUID)
- device_code (STRING)
- socket_id (STRING)
- status (ENUM: online/offline)
- device_info (JSON)
- last_connected (DATE)

### connection_requests
- id (UUID)
- device_code (STRING)
- client_socket_id (STRING)
- status (ENUM: pending/accepted/rejected/timeout)
- requested_at (DATE)
- responded_at (DATE)
