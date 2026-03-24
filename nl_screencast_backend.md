# NL ScreenCast - Backend Design (v1)

## 🎯 Mục tiêu
Xây dựng backend cho hệ thống:

- Mobile app (iOS):
  - Sinh device code cố định
  - Nhận request kết nối từ PC
  - Hiển thị popup xác nhận

- Web (PC):
  - Nhập device code
  - Gửi request kết nối

---

## 🧠 Tổng quan kiến trúc

Mobile App (iOS)
        ↓
    WebSocket
        ↓
     Backend (Node.js)
        ↑
    WebSocket / HTTP
        ↑
      Web (PC)

---

## 🔑 Khái niệm chính

### Device Code
- Ví dụ: NL-AB12CD
- Unique, không đổi, dễ nhập

### Session
- PC nhập code → tạo session → chờ mobile xác nhận

---

## 🧱 Data structure

### Device
{
  "deviceId": "uuid",
  "deviceCode": "NL-AB12CD",
  "socketId": "abc123",
  "status": "online"
}

### Connection Request
{
  "requestId": "uuid",
  "deviceCode": "NL-AB12CD",
  "clientSocketId": "xyz456",
  "status": "pending | accepted | rejected"
}

---

## 🔌 Socket Events

### 1. mobile:register
{
  "deviceCode": "NL-AB12CD"
}

### 2. web:connect_request
{
  "deviceCode": "NL-AB12CD"
}

### 3. mobile:incoming_request
{
  "requestId": "req_123"
}

### 4. mobile:response
{
  "requestId": "req_123",
  "accept": true
}

### 5. web:connect_result
{
  "status": "accepted"
}

---

## ⚙️ Flow

1. Mobile connect → register
2. Web nhập code → gửi request
3. Backend → gửi sang mobile
4. Mobile accept/reject
5. Backend → trả về web

---

## ❌ Error

DEVICE_OFFLINE  
INVALID_CODE  
TIMEOUT

---

## 🛠️ Tech

- Node.js
- socket.io
- Redis (optional)

---

## 📦 Structure

server/
 ├── src/
 │   ├── socket/
 │   ├── services/
 │   ├── utils/
 │   └── index.js

---

## 🔢 Generate Code

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'NL-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

---

## ✅ Checklist

- Socket server chạy
- Mobile register ok
- Web gửi request ok
- Mobile nhận event
- Accept → web nhận kết quả
