# 🎵 Player Station - Trình phát nhạc Spotify

Trình phát nhạc nền web hiện đại, sử dụng API của Spotify mang đến trải nghiệm nghe nhạc cá nhân hóa cho người dùng. Đăng nhập bằng tài khoản Spotify Premium của bạn và tận hưởng toàn bộ playlist của mình trong một giao diện hoàn toàn mới.

> [**Xem Demo trực tiếp**](https://play.trchicuong.id.vn/)

---

### ⚙️ Cài đặt & Khởi chạy

#### Yêu cầu

* [Node.js](https://nodejs.org/) (phiên bản 18.x trở lên)

* Tài khoản [Spotify for Developers](https://developer.spotify.com/dashboard/) và một tài khoản Spotify Premium.

#### Hướng dẫn

1. **Tải về (Clone repository):**
```bash
git clone https://github.com/your-username/player-station.git
cd player-station
```
Hoặc tải file `.zip` trực tiếp từ repository.

2. **Cấu hình API Key:**

* Truy cập [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/) và tạo một ứng dụng mới.

* Sao chép `Client ID` của bạn.

* Trong phần **Settings** của ứng dụng, thêm **Redirect URI**. Đối với môi trường phát triển, nó thường là `http://localhost:5173/` (địa chỉ Vite cung cấp).

* Đổi tên file `.env.example` thành `.env` ở thư mục gốc của dự án.

* Thay thế bằng Client ID của bạn:

  ```
  VITE_SPOTIFY_CLIENT_ID="YOUR_SPOTIFY_CLIENT_ID_HERE"
  ```

3. **Cài đặt các gói phụ thuộc:**
```bash
npm install
```

4. **Chạy dự án:**
```bash
npm run dev
```

Mở trình duyệt và truy cập vào địa chỉ `http://localhost:5173/`.

---

### 📁 Cấu trúc thư mục

```
player-station/
├── public/
│   └── ... (videos, images)
├── src/
│   ├── main.js
│   └── style.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── README.md
```

---

### 🤝 Đóng góp

Dự án này luôn chào đón các đóng góp! Nếu bạn muốn sửa lỗi, thêm một công cụ mới, hoặc cải thiện mã nguồn, hãy thoải mái tạo một `Pull Request`.

---

### ✉️ Góp ý & Liên hệ

Nếu bạn có bất kỳ ý tưởng nào để cải thiện công cụ hoặc phát hiện lỗi, đừng ngần ngại mở một `Issue` trên repo này.

Mọi thông tin khác, bạn có thể liên hệ với tôi qua:
[**trchicuong.id.vn**](https://trchicuong.id.vn/)