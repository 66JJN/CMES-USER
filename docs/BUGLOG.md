# 🐛 BUGLOG — CMES-USER

บันทึก bug ที่เคยเจอในโปรเจค CMES-USER เพื่อเป็นอ้างอิงและป้องกันไม่ให้เกิดซ้ำ

---

## Template สำหรับ bug ใหม่

```
### [วันที่] | [ชื่อ bug]
**อาการ:** 
**Root Cause:** 
**แก้:** 
**เรียนรู้:**
```

---

## บันทึก Bug ที่ผ่านมา

### 2025-12-14 | Profile Picture ไม่โหลดในหน้า Home — เรียก endpoint ผิด
**อาการ:** หน้า Home.js แสดง default avatar แทนรูป profile จริง — Console แสดง 404 `/api/user-profile`
**Root Cause:** Frontend เรียก `/api/user-profile` ซึ่งเป็น endpoint เก่า ก่อนย้ายไป MongoDB auth system
**แก้:** เปลี่ยนให้ `Home.js` เรียก `/api/auth/profile` ซึ่งเป็น endpoint ใหม่
**เรียนรู้:** เมื่อ refactor auth system ต้อง grep ทุก endpoint call ใน frontend ให้ครบ

---

### 2025-12-14 | `/api/status` endpoint ไม่มี — Frontend crash
**อาการ:** Frontend เรียก `/api/status` แต่ backend ไม่มี endpoint นี้ — ได้ 404
**Root Cause:** Endpoint นี้ยังไม่ได้สร้างใน server.js
**แก้:** เพิ่ม `GET /api/status` endpoint คืนค่า system config (enableImage, enableText, price, time)
**เรียนรู้:** ก่อน deploy frontend ใหม่ ต้องตรวจว่า backend มี endpoint ทุกตัวที่ frontend ต้องใช้

---

### 2025-12-17 | Email OTP ส่งไม่ได้ — สมัครสมาชิกค้าง
**อาการ:** กดสมัครสมาชิกแล้ว OTP ไม่เข้า email — ทำให้ verify ไม่ได้
**Root Cause:** Google App Password ไม่ได้ตั้งค่า หรือตั้งผิดใน `.env`
**แก้:** สร้าง App Password ใหม่ + ตั้ง `EMAIL_USER` / `EMAIL_PASS` ให้ถูก + เพิ่ม error logging
**เรียนรู้:** Email service ต้องมี health check ตอน startup เพื่อ catch config errors เร็ว

---

### 2026-05-23 | `alert()` ทุก notification — UX แย่มาก
**อาการ:** กดอัปโหลด, แก้ profile, submit report ทุก action ใช้ `alert()` ซึ่ง block UI
**Root Cause:** ใช้ `alert()` ตั้งแต่เริ่ม dev แล้วไม่ได้ refactor
**แก้:** สร้าง `Toast.js` + `Toast.css` ระบบ Toast notification (dark glassmorphism) + replace `alert()` ทั้งโปรเจค
**เรียนรู้:** สร้าง notification component ตั้งแต่เริ่ม — `alert()` ไม่ควรเข้า production

---

### General | Slip OCR อ่านจำนวนเงินผิด — ชำระเงินไม่ผ่าน
**อาการ:** ลูกค้าอัปโหลดสลิปจริง แต่ระบบแจ้ง "จำนวนเงินไม่ตรง"
**Root Cause:** Tesseract.js อ่านตัวเลขไทย/อังกฤษปนกัน หรือ quality รูปต่ำ ทำให้ข้อความที่แปลงไม่ตรง
**แก้:** เพิ่ม `thaiToArabic()` converter + เพิ่ม matching patterns หลายแบบ (match1-4) + log OCR text เพื่อ debug
**เรียนรู้:** OCR ไม่ได้แม่น 100% — ต้องมี fallback (manual approve) เสมอ

---

### General | CORS blocked ตอน deploy production
**อาการ:** Deploy frontend ใหม่แล้วเรียก API ไม่ได้ — browser แสดง CORS policy error
**Root Cause:** Production URL ใหม่ไม่ได้อยู่ใน `allowedOrigins` array
**แก้:** เพิ่ม URL production ใน `allowedOrigins` + ใช้ env var `USER_FRONTEND_URL`
**เรียนรู้:** Checklist ก่อน deploy: ตรวจ CORS origins, env vars, API endpoints

---

### General | Cloudinary credentials ไม่ได้ตั้ง — upload ล้มเหลว
**อาการ:** อัปโหลดรูป/สลิป ได้ error 500 — log แสดง "Must supply cloud_name"
**Root Cause:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` ไม่ได้ตั้งใน `.env`
**แก้:** ตั้งค่า Cloudinary credentials ให้ครบ
**เรียนรู้:** Validate required env vars ตอน startup — exit early ถ้าไม่ครบ ไม่ต้องรอ crash runtime

---

### General | Socket.IO CORS `origin: "*"` — ไม่ปลอดภัย
**อาการ:** Socket.IO ตั้ง `cors: { origin: "*" }` ทำให้ทุก domain เชื่อมต่อ WebSocket ได้
**Root Cause:** ตั้ง wildcard origin ตอน dev แล้วไม่ได้แก้ก่อน production
**แก้:** (ยังไม่ได้แก้ — ควรเปลี่ยนเป็น `allowedOrigins` เหมือน Express CORS)
**เรียนรู้:** Security config ต้อง review ก่อน deploy ทุกครั้ง — wildcard ไม่ควรขึ้น production
