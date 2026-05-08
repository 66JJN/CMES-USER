# SKILL.md — CMES-USER Repository

> **CMES** (Content Management & Entertainment System) — ระบบ Digital Signage สำหรับร้านเหล้า/ผับ/บาร์
> Repo นี้คือ **User-facing** app: ให้ลูกค้าอัปโหลดรูป/ข้อความ/ของขวัญขึ้นจอ, ชำระเงิน, ดูโปรไฟล์

---

## 1. Project Overview

| Item | Detail |
|------|--------|
| **App Type** | Mobile-first PWA (User Frontend + Backend) |
| **Architecture** | Monorepo — `frontend/` (React) + `backend/` (Express) |
| **Multi-tenant** | ใช้ `shopId` แยกร้าน — ส่งผ่าน URL query param + `x-shop-id` header |
| **Production** | Frontend: Vercel, Backend: Render |
| **Database** | MongoDB Atlas (database: `cmes-user`) |
| **File Storage** | Cloudinary |
| **Realtime** | Socket.IO (เชื่อมไปยัง Admin server) |

---

## 2. Tech Stack

### Frontend (`frontend/`)
| Tech | Version | Purpose |
|------|---------|---------|
| React | 19.x | UI Framework (CRA — Create React App) |
| React Router DOM | 7.x | Client-side routing |
| Axios | 1.x | HTTP client (บางส่วนใช้ `fetch` ตรง) |
| Socket.IO Client | 4.x | Realtime communication |
| React Icons | 5.x | Icon library |
| @react-oauth/google | 0.13.x | Google OAuth login |

### Backend (`backend/`)
| Tech | Version | Purpose |
|------|---------|---------|
| Express | 4.x | Web framework |
| Mongoose | 8.x | MongoDB ODM |
| Socket.IO | 4.x | Realtime server |
| JWT (jsonwebtoken) | 9.x | Authentication tokens |
| bcryptjs | 2.x | Password hashing |
| Multer + Cloudinary | — | File upload → cloud storage |
| Tesseract.js | 5.x | OCR สำหรับตรวจสลิปโอนเงิน |
| Nodemailer | 6.x | Email verification |
| ES Modules | `"type": "module"` | ใช้ `import/export` ไม่ใช่ `require` |

---

## 3. Folder Structure

```
CMES-USER/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── 01_Home/          # Home.js + Home.css (หน้าหลัก)
│   │   ├── 02_Profile/       # โปรไฟล์ผู้ใช้
│   │   ├── 03_Register/      # สมัคร/ล็อกอิน (+ Google OAuth)
│   │   ├── 04_Payment/       # ชำระเงิน (QR Code + Slip upload)
│   │   ├── 05_Select/        # เลือกประเภทบริการ
│   │   ├── 06_Slip upload/   # อัปโหลดสลิป
│   │   ├── 07_Report/        # รายงานปัญหา
│   │   ├── 08_Gift/          # ส่งของขวัญ
│   │   ├── 09_Upload/        # อัปโหลดรูป/ข้อความ
│   │   ├── 10_Status/        # สถานะคำสั่ง
│   │   ├── config/
│   │   │   ├── apiConfig.js      # API_BASE_URL, ADMIN_API_URL, REALTIME_URL
│   │   │   └── googleConfig.js   # Google OAuth config
│   │   ├── authService.js    # ★ Auth utility — token, shopId, apiCall()
│   │   ├── ProtectedRoute.js # ★ Route guards (ProtectedRoute + PublicRoute)
│   │   ├── App.js            # Router + Auth initialization
│   │   ├── App.css
│   │   ├── index.js
│   │   └── utils.js
│   └── package.json
│
├── backend/
│   ├── server.js             # ★ Main entry — Express + Socket.IO + ทุก API route
│   ├── middleware/
│   │   └── authMiddleware.js # verifyAuthToken, optionalAuth, getCurrentUser
│   ├── models/
│   │   ├── User.js           # Mongoose User schema
│   │   ├── GiftOrder.js      # Gift order schema
│   │   └── Report.js         # Report schema (deprecated — ส่งไป Admin แทน)
│   ├── routes/
│   │   ├── auth-mongodb.js   # ★ Auth routes (register/login/logout/verify/profile)
│   │   └── auth.js           # Legacy auth (JSON-based)
│   └── package.json
│
├── README.md
└── SKILL.md                  # ← ไฟล์นี้
```

### Naming Convention — Page Folders
- ใช้ prefix ตัวเลข `01_`, `02_`, ... เรียงตาม flow การใช้งาน
- แต่ละ folder มี `PageName.js` + `PageName.css` (1 component = 1 CSS file)

---

## 4. Design System & Styling

### 4.1 Design Theme
| Property | Value |
|----------|-------|
| **Mode** | Dark mode only |
| **Background** | `linear-gradient(180deg, #0a0e27, #151338, #0f0c29)` |
| **Primary Color** | Purple — `#8b5cf6` / `rgba(139, 92, 246, *)` |
| **Accent Colors** | Pink `#ec4899`, Cyan `#06b6d4`, Amber `#fbbf24` |
| **Success** | Green `#10b981` |
| **Danger** | Red `#ef4444` |
| **Font** | `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` |
| **Max Width** | `430px` (mobile-optimized) |
| **Border Radius** | Cards: `18px`, Buttons: `12-16px`, Badges: `999px` |

### 4.2 CSS Patterns
```css
/* ★ Glassmorphism Card — ใช้ทั่วทั้ง app */
.card {
  background: rgba(255, 255, 255, .06);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, .08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, .2);
}

/* ★ Gradient border effect (pseudo-element) */
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(139, 92, 246, .3), rgba(236, 72, 153, .2));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0;
  transition: opacity .3s;
}

/* ★ Floating animated background shapes */
.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  animation: float 12s ease-in-out infinite;
}
```

### 4.3 Layout Pattern
- **Container**: `100dvh`, `flex-direction: column`, `overflow: hidden`
- **Wrapper**: `max-width: 430px`, `flex: 1`, scroll content area
- **Bottom Nav**: Fixed bottom bar, `z-index: 100`, blur background
- **Modals**: Bottom sheet style (`slideUp` animation), `max-height: 85vh`

### 4.4 CSS Rules
- ใช้ **Vanilla CSS** ไฟล์แยกต่อ component (ไม่ใช้ Tailwind ใน runtime)
- Import Google Fonts ที่ต้นไฟล์ CSS: `@import url('https://fonts.googleapis.com/css2?family=Inter...')`
- ใช้ `100dvh` แทน `100vh` สำหรับ mobile viewport
- ซ่อน scrollbar: `-ms-overflow-style: none; scrollbar-width: none;`
- Touch-friendly: `-webkit-tap-highlight-color: transparent`
- Active state ใช้ `transform: scale(.95)` แทน `:hover`

---

## 5. Authentication Pattern

### 5.1 Flow
1. User เปิด app ด้วย URL: `https://app.com/?shopId=xxx`
2. `App.js` → `useEffect` → ดักจับ `shopId` จาก URL → เก็บใน `localStorage`
3. `initializeAuth()` ตรวจ token ใน `localStorage` → verify กับ backend
4. ถ้า token valid → redirect ไป `/home` (via `PublicRoute`)
5. ถ้าไม่มี token → อยู่หน้า Register `/`

### 5.2 Auth Service (`authService.js`) — Central Auth Utility
```javascript
// ★ ทุก API call ต้องผ่าน authService
import API_BASE_URL from './config/apiConfig';

// Token management
export const getToken = () => localStorage.getItem("token");
export const setToken = (token) => localStorage.setItem("token", token);
export const removeToken = () => localStorage.removeItem("token");

// Shop management — ★ ต้องส่ง shopId ทุก request
export const getShopId = () =>
  new URLSearchParams(window.location.search).get("shopId")
  || localStorage.getItem("shopId")
  || "";

// ★ API Helper — ใช้แทน fetch/axios ตรง
export const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const shopId = getShopId();
  const headers = {
    "Content-Type": "application/json",
    "x-shop-id": shopId,       // ★ ส่งทุก request
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const urlSeparator = endpoint.includes('?') ? '&' : '?';
  const response = await fetch(
    `${API_BASE_URL}${endpoint}${urlSeparator}shopId=${shopId}`,
    { ...options, headers }
  );

  if (response.status === 401) {
    handleUnauthorized(); // Clear token + redirect
    throw new Error("Session expired");
  }
  // ...
};
```

### 5.3 Route Guards
```javascript
// ProtectedRoute — ต้อง login
export const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    const shopId = localStorage.getItem("shopId") || "";
    return <Navigate to={shopId ? `/?shopId=${shopId}` : "/"} replace />;
  }
  return children;
};

// PublicRoute — ถ้า login แล้ว redirect ไป /home
export const PublicRoute = ({ children }) => {
  if (isAuthenticated()) return <Navigate to="/home" replace />;
  return children;
};
```

### 5.4 Auth Rules
- **401 Handling**: ลบ token + redirect ไป Register **เฉพาะ** 401
- **Network errors**: **ไม่ลบ** token — เพื่อไม่ให้ user หลุดเมื่อ server ชั่วคราวล่ม
- **Token storage**: `localStorage` — key: `token`, `user`, `shopId`

---

## 6. API Pattern

### 6.1 Multi-tenant — shopId ทุก Request
```
ทุก API request ต้องมี shopId 2 ที่:
1. Query parameter: ?shopId=xxx
2. Header: x-shop-id: xxx
```

### 6.2 Response Format
```json
// Success
{ "success": true, "data": { ... } }
{ "success": true, "user": { ... } }
{ "status": "ok", "message": "..." }

// Error
{ "success": false, "message": "Error description" }
{ "status": "error", "message": "Error description" }
```

### 6.3 Error Codes (AI Caption)
```json
{
  "success": false,
  "errorCode": "QUOTA_EXCEEDED",  // NO_API_KEY | NO_IMAGE | API_ERROR | EMPTY_RESPONSE | SERVER_ERROR
  "message": "..."
}
```

### 6.4 API Base URLs (`config/apiConfig.js`)
```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://cmes-user-5b5h.onrender.com';
export const ADMIN_API_URL = process.env.REACT_APP_ADMIN_API_URL || 'https://cmes-admin.onrender.com';
export const REALTIME_URL = ADMIN_API_URL; // Socket.IO ใช้ Admin server
```

---

## 7. Backend Patterns

### 7.1 Server Structure
- **Single file**: `server.js` เป็น entry point หลัก — มีทุก route (ยกเว้น auth)
- **Auth routes**: แยกใน `routes/auth-mongodb.js`
- **Middleware**: `middleware/authMiddleware.js`

### 7.2 MongoDB Connection
```javascript
mongoose.connect(MONGODB_URI, { dbName: 'cmes-user' });
```

### 7.3 Mongoose Models — ES Modules
```javascript
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, default: null },     // null สำหรับ OAuth
  googleId: { type: String, default: null, index: true },
  authMethod: { type: String, enum: ["email", "google"], required: true },
  // ...
}, { timestamps: true });

export default mongoose.model("User", userSchema);
```

### 7.4 Auth Middleware
```javascript
// Required auth — return 401 if no token
export const verifyAuthToken = (req, res, next) => { ... };

// Optional auth — continue even without token (for guest features)
export const optionalAuth = (req, res, next) => { ... };
```

### 7.5 File Upload — Cloudinary
```javascript
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cmes/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
    public_id: (req, file) => `avatar-${Date.now()}`
  }
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 20 * 1024 * 1024 } });
```

### 7.6 Cross-service Communication
- User backend → Admin backend ผ่าน HTTP `fetch(ADMIN_API_BASE + '/api/...')`
- ตัวอย่าง: Report, Gift settings, Stat slip

### 7.7 CORS Configuration
```javascript
const allowedOrigins = [
  'http://localhost:3000',                    // User Frontend (Dev)
  'http://localhost:3001',                    // Admin Frontend (Dev)
  'https://cmesuserfrontend.vercel.app',      // Production
  'https://cmesadminfrontend.vercel.app',
  process.env.USER_FRONTEND_URL,
  process.env.ADMIN_FRONTEND_URL,
].filter(Boolean);
```

---

## 8. Key Features & Business Logic

| Feature | Description |
|---------|-------------|
| **Image Upload** | ลูกค้าอัปโหลดรูป + caption → แสดงบนจอ Digital Signage |
| **AI Caption** | ใช้ Google Gemini สร้าง caption อัตโนมัติ (retry + fallback models) |
| **Text Message** | ส่งข้อความขึ้นจอ |
| **Gift System** | เลือกของขวัญ → ชำระเงิน → ส่งไปยังโต๊ะ |
| **Birthday** | ตรวจวันเกิด → ส่งข้อความอวยพร (ต้องยอดใช้จ่ายขั้นต่ำ) |
| **Payment (OCR)** | อัปโหลดสลิปโอนเงิน → Tesseract OCR ตรวจจำนวนเงิน |
| **Ranking** | คะแนนสะสม (daily/monthly/all-time) → แสดง Top 3 บนหน้า Home |
| **Report** | รายงานปัญหา → ส่งไป Admin backend |
| **Profile** | แก้ไขชื่อ, อีเมล, วันเกิด, รูปโปรไฟล์ |

---

## 9. Environment Variables

### Frontend (`frontend/.env`)
```env
REACT_APP_API_BASE_URL=https://cmes-user-5b5h.onrender.com
REACT_APP_ADMIN_API_URL=https://cmes-admin.onrender.com
REACT_APP_REALTIME_URL=https://cmes-admin.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=xxx
```

### Backend (`backend/.env`)
```env
PORT=5002
MONGODB_URI=mongodb+srv://...
JWT_SECRET=xxx
ADMIN_API_BASE=https://cmes-admin-server.onrender.com
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
GEMINI_API_KEY=xxx
GOOGLE_CLIENT_ID=xxx
USER_FRONTEND_URL=https://cmesuserfrontend.vercel.app
ADMIN_FRONTEND_URL=https://cmesadminfrontend.vercel.app
```

---

## 10. Development Commands

```bash
# Frontend (port 3000)
cd frontend && npm start

# Backend (port 5002)
cd backend && npm run dev    # nodemon
cd backend && npm start      # production
```

---

## 11. Important Rules for AI

### DO ✅
- **ใช้ `authService.js`** สำหรับทุก API call — อย่า fetch/axios ตรง
- **ส่ง `shopId`** ทั้ง query param และ header ทุก request
- **ใช้ ES Modules** (`import/export`) ทั้ง frontend และ backend
- **ใช้ Vanilla CSS** ไฟล์แยก — ไม่ใช้ inline styles (ยกเว้น dynamic values)
- **Dark theme** เสมอ — background เข้ม, text สว่าง, glassmorphism cards
- **Mobile-first** — max-width 430px, touch-friendly (min 48px tap targets)
- **Handle 401** → clear token + redirect (**เฉพาะ 401 เท่านั้น**)
- **Cloudinary** สำหรับ file upload — ไม่เก็บไฟล์ใน local filesystem
- **ใช้ `100dvh`** แทน `100vh`

### DON'T ❌
- **อย่าลบ token** เมื่อเจอ network error หรือ 500 — แค่ 401 เท่านั้น
- **อย่าใช้ `require()`** — ใช้ `import` เสมอ (ES Modules)
- **อย่าใช้สี plain** (red, blue) — ใช้ palette ตาม design system
- **อย่าเปลี่ยน font** — ใช้ Inter เสมอ
- **อย่าสร้าง Context** ใหม่ — repo นี้ไม่มี Context (ต่างจาก Admin ที่มี ShopContext)
- **อย่าเพิ่ม dependencies** โดยไม่จำเป็น
- **อย่าเก็บ sensitive data** ใน client-side code
- **อย่าลบ comments ภาษาไทย** ที่มีอยู่เดิม — เป็น documentation

---

## 12. Common Bugs & Solutions

| Bug | สาเหตุ | วิธีแก้ |
|-----|--------|---------|
| Render crash (exit status 1) | ไม่มี env variable ที่จำเป็น | เช็ค `.env` ใน Render dashboard — ต้องมี `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*` |
| Gemini 429 Rate Limit | ใช้ model เก่า / key ผิด / quota เต็ม | ใช้ `gemini-2.5-flash` เท่านั้น, เช็ค API key ใน Google AI Studio |
| CORS error | origin ไม่อยู่ใน whitelist | เพิ่ม URL ใน `allowedOrigins` ใน `server.js` |
| Socket ไม่ connect | shopId ไม่ถูกส่งตอน handshake | เช็ค `handshake.query.shopId` — ต้องมีค่า |
| Production ไม่แสดง packages | ไม่ส่ง `shopId` ใน API call | ทุก API ต้องมี `?shopId=xxx` + header `x-shop-id` |
| Token หาย / user หลุด | ลบ token ตอน network error | **ลบ token เฉพาะ 401 เท่านั้น** — network error ให้เก็บ token ไว้ |
| รูปไม่แสดงบน production | ใช้ local file path แทน Cloudinary URL | ใช้ `req.file.path` (Cloudinary URL) ไม่ใช่ `req.file.filename` |
| OCR อ่านสลิปไม่ได้ | ตัวเลขไทยไม่ถูกแปลง | ใช้ `thaiToArabic()` แปลง ๐-๙ → 0-9 ก่อนเทียบ |

---

## 13. AI Caption (Gemini)

| Setting | Value |
|---------|-------|
| **Model** | `gemini-2.5-flash` (primary) → `gemini-2.0-flash` → `gemini-2.0-flash-lite` (fallback) |
| **Free Tier Limit** | ~20 RPD (requests per day) |
| **Rate Limit per User** | 30 วินาที cooldown (frontend enforce) |
| **Max Caption Length** | 36 ตัวอักษร |
| **Retry** | 2 ครั้งต่อ model ก่อน fallback model ถัดไป |
| **Backoff** | Exponential — 5s, 10s, 15s... (max 30s) |

### Prompt Spec
- สร้าง caption **ภาษาไทย สไตล์ Gen Z** สำหรับร้านเหล้า/ผับ/บาร์
- วิเคราะห์เพศ, จำนวนคน, บรรยากาศในรูป
- ห้าม hashtag, ห้าม emoji
- ความยาวไม่เกิน 36 ตัวอักษร
- ตอบแค่ caption เดียว ไม่ต้องอธิบาย

### Error Codes
| Code | Meaning | User Message |
|------|---------|-------------|
| `NO_API_KEY` | ไม่มี GEMINI_API_KEY ใน .env | — |
| `NO_IMAGE` | ไม่ได้ส่งรูป | กรุณาอัปโหลดรูปภาพก่อน |
| `QUOTA_EXCEEDED` | ใช้ quota เต็ม (429) | AI ใช้งานเต็มแล้ว กรุณารอ 1-2 นาที |
| `API_ERROR` | Gemini error อื่นๆ | AI ไม่สามารถสร้างแคปชั่นได้ |
| `EMPTY_RESPONSE` | Gemini ตอบเปล่า | AI ไม่สามารถวิเคราะห์รูปภาพได้ |
| `SERVER_ERROR` | Server crash | เกิดข้อผิดพลาดในการสร้างแคปชั่น |
