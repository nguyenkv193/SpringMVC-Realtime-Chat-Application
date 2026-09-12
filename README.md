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

## Đăng nhập bằng Google

Tạo OAuth Client loại Web application trong Google Cloud Console và thêm redirect URI:

```text
http://localhost:8080/login/oauth2/code/google
```

Thiết lập credentials trước khi chạy ứng dụng:

```powershell
$env:GOOGLE_CLIENT_ID="your-google-client-id"
$env:GOOGLE_CLIENT_SECRET="your-google-client-secret"
.\gradlew.bat bootRun
```

Không commit client secret vào repository. Khi deploy, thêm redirect URI HTTPS tương ứng với domain production.

## Cấu trúc chính

- `config/WebSocketConfig`: endpoint SockJS `/ws`, broker `/topic`, tiền tố gửi `/app`.
- `chat/ChatController`: nhận `/app/chat.send` và phát tin đến `/topic/public`.
- `templates/index.html`: giao diện chat mẫu.

Hiện tại broker là in-memory, phù hợp phát triển cục bộ. Khi triển khai nhiều instance, thay bằng RabbitMQ/Redis broker relay và bổ sung xác thực người dùng, lưu lịch sử chat.
