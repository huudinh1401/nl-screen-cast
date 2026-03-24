# API Documentation - NL ScreenCast

## Authentication

### Đăng ký
```
POST /api/auth/register
Body: {
  "username": "user123",
  "email": "user@example.com",
  "password": "password123",
  "fullname": "Nguyễn Văn A",
  "phone": "0123456789"
}
```

### Đăng nhập
```
POST /api/auth/login
Body: {
  "username": "user123",
  "password": "password123"
}
Response: {
  "accessToken": "...",
  "refreshToken": "..."
}
```

### Refresh Token
```
POST /api/auth/refresh-token
Body: {
  "refreshToken": "..."
}
```

### Đăng xuất
```
POST /api/auth/logout
Headers: Authorization: Bearer {accessToken}
```

---

## User Management

### Lấy profile của mình
```
GET /api/users/profile
Headers: Authorization: Bearer {accessToken}
```

### Cập nhật profile
```
PUT /api/users/profile
Headers: Authorization: Bearer {accessToken}
Body: {
  "fullname": "Tên mới",
  "phone": "0987654321"
}
```

### Đổi mật khẩu
```
PUT /api/users/:id/change-password
Headers: Authorization: Bearer {accessToken}
Body: {
  "currentPassword": "old123",
  "newPassword": "new123"
}
```

---

## Device Management (User)

### Lấy danh sách thiết bị của mình
```
GET /api/devices/my-devices
Headers: Authorization: Bearer {accessToken}
```

### Liên kết thiết bị với tài khoản
```
POST /api/devices/claim
Headers: Authorization: Bearer {accessToken}
Body: {
  "deviceCode": "NL-AB12CD"
}
```

### Đổi tên thiết bị
```
PUT /api/devices/:deviceId/name
Headers: Authorization: Bearer {accessToken}
Body: {
  "deviceName": "iPhone của tôi"
}
```

### Xóa thiết bị
```
DELETE /api/devices/:deviceId
Headers: Authorization: Bearer {accessToken}
```

### Tạo mã thiết bị mới
```
POST /api/devices/generate
Headers: Authorization: Bearer {accessToken}
Body: {
  "deviceInfo": {
    "model": "iPhone 14",
    "os": "iOS 16"
  }
}
```

### Kiểm tra trạng thái thiết bị (public)
```
GET /api/devices/status/:deviceCode
```

---

## SuperAdmin APIs

### Quản lý Users

#### Lấy tất cả users
```
GET /api/users?page=1&limit=10&search=keyword&roleId=1&isActive=true
Headers: Authorization: Bearer {accessToken}
Role: superadmin
```

#### Lấy thông tin user
```
GET /api/users/:id
Headers: Authorization: Bearer {accessToken}
Role: superadmin
```

#### Tạo user mới
```
POST /api/users
Headers: Authorization: Bearer {accessToken}
Role: superadmin
Body: {
  "username": "newuser",
  "email": "new@example.com",
  "password": "password123",
  "fullname": "User Name",
  "phone": "0123456789",
  "role_id": 2
}
```

#### Cập nhật user
```
PUT /api/users/:id
Headers: Authorization: Bearer {accessToken}
Role: superadmin
Body: {
  "fullname": "Updated Name",
  "email": "updated@example.com",
  "role_id": 3
}
```

#### Reset mật khẩu user
```
PUT /api/users/:id/reset-password
Headers: Authorization: Bearer {accessToken}
Role: superadmin
Body: {
  "newPassword": "newpass123"
}
```

#### Kích hoạt/Vô hiệu hóa user
```
PUT /api/users/:id/toggle-status
Headers: Authorization: Bearer {accessToken}
Role: superadmin
```

#### Xóa user
```
DELETE /api/users/:id
Headers: Authorization: Bearer {accessToken}
Role: superadmin
```

#### Thống kê users
```
GET /api/users/stats
Headers: Authorization: Bearer {accessToken}
Role: superadmin
```

### Quản lý Devices

#### Lấy tất cả devices
```
GET /api/devices/all?page=1&limit=20
Headers: Authorization: Bearer {accessToken}
Role: superadmin
```

---

## Roles & Permissions

### Lấy tất cả roles
```
GET /api/roles
Headers: Authorization: Bearer {accessToken}
```

### Tạo role mới
```
POST /api/roles
Headers: Authorization: Bearer {accessToken}
Role: superadmin
Body: {
  "name": "Manager",
  "description": "Quản lý"
}
```

### Cập nhật role
```
PUT /api/roles/:id
Headers: Authorization: Bearer {accessToken}
Role: superadmin
```

### Xóa role
```
DELETE /api/roles/:id
Headers: Authorization: Bearer {accessToken}
Role: superadmin
```

### Gán quyền cho role
```
POST /api/roles/:id/permissions
Headers: Authorization: Bearer {accessToken}
Role: superadmin
Body: {
  "permissionIds": [1, 2, 3]
}
```

---

## Socket Events

### Mobile App

**Đăng ký thiết bị (tự sinh mã)**
```javascript
socket.emit('mobile:register', {
  deviceInfo: { model: 'iPhone 14', os: 'iOS 16' }
});

socket.on('mobile:registered', (data) => {
  // data.deviceCode: "NL-AB12CD"
  // data.isNewDevice: true
});
```

**Đăng ký lại với mã cũ**
```javascript
socket.emit('mobile:register', {
  deviceCode: 'NL-AB12CD',
  deviceInfo: { model: 'iPhone 14' }
});
```

**Nhận yêu cầu kết nối**
```javascript
socket.on('mobile:incoming_request', (data) => {
  // data.requestId
  // Hiển thị popup xác nhận
});
```

**Phản hồi yêu cầu**
```javascript
socket.emit('mobile:response', {
  requestId: 'uuid',
  accept: true // hoặc false
});
```

### Web PC

**Gửi yêu cầu kết nối**
```javascript
socket.emit('web:connect_request', {
  deviceCode: 'NL-AB12CD'
});

socket.on('web:request_sent', (data) => {
  // data.requestId
});
```

**Nhận kết quả**
```javascript
socket.on('web:connect_result', (data) => {
  // data.success: true/false
  // data.status: 'accepted'/'rejected'
  // data.message
});
```

---

## Error Codes

- `DEVICE_OFFLINE`: Thiết bị không trực tuyến
- `INVALID_CODE`: Mã thiết bị không hợp lệ
- `REQUEST_NOT_FOUND`: Không tìm thấy yêu cầu
- `TIMEOUT`: Yêu cầu hết thời gian chờ
- `REGISTER_FAILED`: Đăng ký thiết bị thất bại
- `REQUEST_FAILED`: Gửi yêu cầu thất bại
- `RESPONSE_FAILED`: Phản hồi thất bại

---

## Response Format

### Success
```json
{
  "success": true,
  "message": "Thành công",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Lỗi",
  "error": "Chi tiết lỗi"
}
```

### Pagination
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10
  }
}
```
