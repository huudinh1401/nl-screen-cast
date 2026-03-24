# Hướng dẫn quản trị hệ thống NL ScreenCast

## Tài khoản SuperAdmin mặc định

Khi khởi động server lần đầu, hệ thống tự động tạo tài khoản SuperAdmin:

```
Username: superadmin
Password: Admin@123
Email: superadmin@nltech.com
```

**LƯU Ý QUAN TRỌNG:** Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu!

---

## Phân quyền hệ thống

### Roles mặc định

1. **superadmin** - Toàn quyền quản trị
   - Quản lý tất cả users
   - Quản lý roles và permissions
   - Xem tất cả devices
   - Truy cập mọi chức năng

2. **user** - Người dùng thông thường
   - Quản lý thiết bị của mình
   - Cập nhật profile
   - Đổi mật khẩu

---

## Quản lý Users

### Tạo user mới

```bash
POST /api/users
Headers: Authorization: Bearer {accessToken}
Body: {
  "username": "user123",
  "email": "user@example.com",
  "password": "password123",
  "fullname": "Nguyễn Văn A",
  "phone": "0123456789",
  "role_id": 2
}
```

### Xem danh sách users

```bash
GET /api/users?page=1&limit=10&search=keyword
Headers: Authorization: Bearer {accessToken}
```

Filters:
- `search`: Tìm kiếm theo username, email, fullname
- `roleId`: Lọc theo role
- `isActive`: Lọc theo trạng thái (true/false)
- `sortBy`: Sắp xếp theo field (createdAt, username, email)
- `sortOrder`: ASC hoặc DESC

### Cập nhật thông tin user

```bash
PUT /api/users/:id
Headers: Authorization: Bearer {accessToken}
Body: {
  "fullname": "Tên mới",
  "email": "newemail@example.com",
  "phone": "0987654321",
  "role_id": 3
}
```

### Reset mật khẩu user

```bash
PUT /api/users/:id/reset-password
Headers: Authorization: Bearer {accessToken}
Body: {
  "newPassword": "newpass123"
}
```

### Kích hoạt/Vô hiệu hóa user

```bash
PUT /api/users/:id/toggle-status
Headers: Authorization: Bearer {accessToken}
```

### Xóa user

```bash
DELETE /api/users/:id
Headers: Authorization: Bearer {accessToken}
```

**Lưu ý:** 
- Không thể xóa chính mình
- Xóa user sẽ vô hiệu hóa tài khoản (soft delete)

---

## Quản lý Devices

### Xem tất cả devices

```bash
GET /api/devices/all?page=1&limit=20
Headers: Authorization: Bearer {accessToken}
```

Response bao gồm:
- Device code
- Device name (do user đặt)
- Status (online/offline)
- User owner
- Last connected time

### Thống kê

```bash
GET /api/users/stats
Headers: Authorization: Bearer {accessToken}
```

Trả về:
- Tổng số users
- Users đang hoạt động
- Users bị vô hiệu hóa
- Phân bố users theo role

---

## Quản lý Roles & Permissions

### Tạo role mới

```bash
POST /api/roles
Headers: Authorization: Bearer {accessToken}
Body: {
  "name": "Manager",
  "description": "Quản lý"
}
```

### Gán quyền cho role

```bash
POST /api/roles/:id/permissions
Headers: Authorization: Bearer {accessToken}
Body: {
  "permissionIds": [1, 2, 3]
}
```

---

## Logs & Monitoring

### Xem logs hệ thống

```bash
GET /api/logs?page=1&limit=50
Headers: Authorization: Bearer {accessToken}
```

Logs ghi lại:
- Đăng nhập/đăng xuất
- Tạo/sửa/xóa user
- Thay đổi quyền
- Kết nối thiết bị
- Các hành động quan trọng khác

---

## Bảo mật

### Đổi mật khẩu SuperAdmin

```bash
PUT /api/users/{superadmin_id}/change-password
Headers: Authorization: Bearer {accessToken}
Body: {
  "currentPassword": "Admin@123",
  "newPassword": "NewSecurePassword@2024"
}
```

### Best Practices

1. Đổi mật khẩu mặc định ngay lập tức
2. Sử dụng mật khẩu mạnh (ít nhất 8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt)
3. Không chia sẻ tài khoản SuperAdmin
4. Thường xuyên kiểm tra logs
5. Vô hiệu hóa users không còn sử dụng
6. Backup database định kỳ

---

## Troubleshooting

### User không đăng nhập được

1. Kiểm tra trạng thái `isActive`
2. Kiểm tra role có tồn tại không
3. Xem logs để biết lý do

### Device không kết nối được

1. Kiểm tra device code có đúng không
2. Kiểm tra status trong database
3. Xem socket logs

### Quên mật khẩu SuperAdmin

Chạy script reset:
```bash
node be/src/utils/reset-superadmin-password.js
```

---

## Database Backup

### Backup

```bash
mysqldump -u root -p db_livescreen > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
mysql -u root -p db_livescreen < backup_20240101.sql
```

---

## Support

Liên hệ: support@nltech.com
