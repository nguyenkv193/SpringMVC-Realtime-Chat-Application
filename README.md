# Realtime Chat

Nền tảng chat thời gian thực xây bằng Spring Boot, Spring MVC và WebSocket/STOMP.

## Yêu cầu

- JDK 21
- JDK 21 (Gradle Wrapper đã đi kèm)

## Chạy ứng dụng

```powershell
.\gradlew.bat bootRun
```

Truy cập `http://localhost:8080` bằng hai cửa sổ trình duyệt để thử gửi/nhận tin nhắn tức thời. Trang giao diện đăng nhập mẫu ở `http://localhost:8080/login`.

## Cấu trúc chính

- `config/WebSocketConfig`: endpoint SockJS `/ws`, broker `/topic`, tiền tố gửi `/app`.
- `chat/ChatController`: nhận `/app/chat.send` và phát tin đến `/topic/public`.
- `templates/index.html`: giao diện chat mẫu.

Hiện tại broker là in-memory, phù hợp phát triển cục bộ. Khi triển khai nhiều instance, thay bằng RabbitMQ/Redis broker relay và bổ sung xác thực người dùng, lưu lịch sử chat.
