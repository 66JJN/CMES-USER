# SKILL.md — CMES-USER Repository

> **CMES** (Content Management & Entertainment System) — ระบบ Digital Signage สำหรับร้านเหล้า/ผับ/บาร์
> Repo นี้คือ **User-facing** app: ให้ลูกค้าอัปโหลดรูป/ข้อความ/ของขวัญขึ้นจอ, ชำระเงิน, ดูโปรไฟล์
> 📎 Design System → ดูที่ [`DESIGN.md`](./DESIGN.md)

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
| **Realtime** | Socket.IO (เชื่อมไปยัง Admin server ผ่าน Global `SocketContext`) |
| **Auth** | JWT + Google OAuth |

---

## 2. Tech Stack

### Frontend (`frontend/`)
| Tech | Version | Purpose |
|------|---------|---------|
| React | 19.x | UI Framework (CRA — Create React App) |
| React Router DOM | 7.x | Client-side routing |
| Axios | 1.x | HTTP client (บางส่วนใช้ `fetch` ตรง) |
| Socket.IO Client | 4.x | Realtime communication (Global Context only) |
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
| Google Apps Script | — | Email OTP delivery (ผ่าน GMAIL_SCRIPT_URL) |
| Helmet | 8.x | Security headers |
| express-rate-limit | — | API rate limiting |
| ES Modules | `"type": "module"` | ใช้ `import/export` ไม่ใช่ `require` |

---

## 3. Folder Structure

```
CMES-USER/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # ★ Shared UI Components Layer (Toast, Badges, Overlays)
│   │   │   ├── Toast.js
│   │   │   └── Toast.css
│   │   ├── config/           # ★ API & App Configuration
│   │   │   ├── apiConfig.js      # API_BASE_URL, ADMIN_API_URL, REALTIME_URL
│   │   │   └── googleConfig.js   # Google OAuth config
│   │   ├── contexts/         # ★ Global React Contexts (SocketContext)
│   │   │   └── SocketContext.js   # ★ Global Socket.IO Provider (singleton)
│   │   ├── hooks/            # ★ Custom Hooks (Application/Logic Layer)
│   │   │   ├── useHomeData.js    # Home page state & socket logic
│   │   │   ├── useProfileData.js # Profile page state & logic
│   │   │   └── useSelectData.js  # Service selection logic
│   │   ├── pages/            # ★ Pure Presentation Pages (Clean & Grouped)
│   │   │   ├── Home/             # Home.js + Home.css (หน้าหลัก)
│   │   │   ├── Profile/          # Profile.js + Profile.css (โปรไฟล์)
│   │   │   ├── Register/         # Register.js + CSS (สมัคร/ล็อกอิน)
│   │   │   ├── Payment/          # Payment.js + Payment.css (ชำระเงิน)
│   │   │   ├── Select/           # Select.js + Select.css (เลือกบริการ)
│   │   │   ├── SlipUpload/       # SlipUpload.js + SlipUpload.css (อัปโหลดสลิป)
│   │   │   ├── Report/           # Report.js + Report.css (รายงานปัญหา)
│   │   │   ├── Gift/             # Gift.js + Gift.css (ส่งของขวัญ)
│   │   │   ├── Upload/           # Upload.js + Upload.css (อัปโหลดรูป/ข้อความ)
│   │   │   └── Status/           # Status.js + Status.css (สถานะคำสั่ง)
│   │   ├── services/         # ★ Data & Infrastructure Layer (API Gateway)
│   │   │   └── authService.js    # Central Auth utility — token, shopId, apiCall()
│   │   ├── ProtectedRoute.js # ★ Route guards (ProtectedRoute + PublicRoute)
│   │   ├── App.js            # Router + Auth init + <SocketProvider> wrapper
│   │   ├── App.css
│   │   ├── index.js
│   │   └── utils.js
│   └── package.json

### Naming Convention — Page Folders
- เก็บใน `src/pages/PageName/` ตามมาตรฐานเดียวกับ `CMES-ADMIN`
- ห้ามใช้ตัวเลขนำหน้า หรือเว้นวรรคในชื่อโฟลเดอร์ (เช่น ใช้ `pages/SlipUpload/` ไม่ใช้ `06_Slip upload/`)
- แต่ละโฟลเดอร์มี `PageName.js` + `PageName.css` (1 component = 1 CSS file)
│
├── backend/
│   ├── server.js             # ★ Main entry — Express + Socket.IO + route mounting
│   ├── controllers/
│   │   ├── giftController.js    # Gift order logic
│   │   ├── systemController.js  # System status/config APIs
│   │   └── uploadController.js  # Image/slip upload + AI caption
│   ├── middleware/
│   │   ├── authMiddleware.js    # verifyAuthToken, optionalAuth, getCurrentUser
│   │   ├── errorMiddleware.js   # Global error handler
│   │   └── securityMiddleware.js # Mongo sanitization
│   ├── models/
│   │   ├── User.js              # Mongoose User schema
│   │   └── GiftOrder.js         # Gift order schema
│   ├── routes/
│   │   ├── auth-mongodb.js      # ★ Auth routes (register/login/logout/verify/profile)
│   │   ├── authRoutes.js        # Auth route barrel export
│   │   ├── giftRoutes.js        # Gift API routes
│   │   ├── uploadRoutes.js      # Upload API routes
│   │   └── systemRoutes.js      # System status routes
│   ├── services/
│   │   ├── adminService.js      # Cross-service calls to Admin backend
│   │   ├── emailService.js      # Email OTP via Google Apps Script
│   │   ├── geminiService.js     # AI Caption (Gemini API)
│   │   └── ocrService.js        # Slip OCR (Tesseract)
│   └── package.json
│
├── docs/
│   ├── SKILL.md              # ← ไฟล์นี้ (Coding rules & architecture standards)
│   ├── DESIGN.md             # ← Design system & visual patterns
│   ├── AUTH_SETUP.md         # Auth documentation
│   ├── BUGLOG.md             # Bug history log
│   ├── QUICK_START.md        # Quick start guide
│   ├── skills/               # Engineering skills (Debug Mantra, etc.)
│   └── screenshots/          # UI reference screenshots
└── .gitignore
```

### Naming Convention — Page Folders
- ใช้ prefix ตัวเลข `01_`, `02_`, ... เรียงตาม flow การใช้งาน
- แต่ละ folder มี `PageName.js` + `PageName.css` (1 component = 1 CSS file)

### Naming Convention — Backend Layers
- **Routes** → `xxxRoutes.js` — เฉพาะ URL mapping + middleware chain
- **Controllers** → `xxxController.js` — business logic + request/response handling
- **Services** → `xxxService.js` — external API calls, pure logic, reusable units
- **Models** → `ModelName.js` (PascalCase) — Mongoose schema definitions
- **Middleware** → `xxxMiddleware.js` — request interceptors (auth, error, sanitize)

---

## 4. Authentication Pattern

### 4.1 Flow
1. User เปิด app ด้วย URL: `https://app.com/?shopId=xxx`
2. `App.js` → `useEffect` → ดักจับ `shopId` จาก URL → เก็บใน `localStorage`
3. `initializeAuth()` ตรวจ token ใน `localStorage` → verify กับ backend
4. ถ้า token valid → redirect ไป `/home` (via `PublicRoute`)
5. ถ้าไม่มี token → อยู่หน้า Register `/`

### 4.2 Auth Service (`authService.js`) — Central Auth Utility
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

### 4.3 Route Guards
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

### 4.4 Auth Rules
- **401 Handling**: ลบ token + redirect ไป Register **เฉพาะ** 401
- **Network errors / 500**: **ไม่ลบ** token — เพื่อไม่ให้ user หลุดเมื่อ server ชั่วคราวล่ม
- **Token storage**: `localStorage` — keys: `token`, `user`, `shopId`
- **Google OAuth**: ใช้ `@react-oauth/google` → ได้ credential → ส่ง backend verify → ได้ JWT token

### 4.5 Token Deletion Decision Tree
```
Response received?
├── YES → Status 401?
│   ├── YES → ลบ token + redirect (session expired จริง)
│   └── NO (500, 503, etc.) → เก็บ token ไว้
└── NO (Network error, timeout) → เก็บ token ไว้
```

---

## 5. API Pattern

### 5.1 Multi-tenant — shopId ทุก Request
```
ทุก API request ต้องมี shopId 2 ที่:
1. Query parameter: ?shopId=xxx
2. Header: x-shop-id: xxx
```

### 5.2 Response Format
```json
// Success
{ "success": true, "data": { ... } }
{ "success": true, "user": { ... } }
{ "status": "ok", "message": "..." }

// Error
{ "success": false, "message": "Error description" }
{ "status": "error", "message": "Error description" }
```

### 5.3 Error Codes (AI Caption)
```json
{
  "success": false,
  "errorCode": "QUOTA_EXCEEDED",  // NO_API_KEY | NO_IMAGE | API_ERROR | EMPTY_RESPONSE | SERVER_ERROR
  "message": "..."
}
```

### 5.4 API Base URLs (`config/apiConfig.js`)
```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://cmes-user-5b5h.onrender.com';
export const ADMIN_API_URL = process.env.REACT_APP_ADMIN_API_URL || 'https://cmes-admin.onrender.com';
export const REALTIME_URL = ADMIN_API_URL; // Socket.IO ใช้ Admin server
```

---

## 6. Backend Architecture

### 6.1 Layered Architecture (MVC + Services)
```
Request → Route → Middleware → Controller → Service → Model → Database
                                    ↓
                              Response (JSON)
```

- **Routes**: เฉพาะ URL mapping + middleware chain — ห้ามใส่ business logic
- **Controllers**: request/response handling + orchestration — เรียก services
- **Services**: business logic ที่ reusable + external API calls
- **Models**: Mongoose schema definitions + static methods
- **Middleware**: cross-cutting concerns (auth, rate limit, error, sanitize)

### 6.2 Server Entry Point (`server.js`)
- Main entry → Express + Socket.IO + Database connection + Route mounting
- **ห้าม** เขียน route handlers ตรงใน server.js — ให้ mount ผ่าน `app.use()`

### 6.3 MongoDB Connection
```javascript
mongoose.connect(MONGODB_URI, { dbName: 'cmes-user' });
```

### 6.4 Mongoose Models — ES Modules
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

### 6.5 Auth Middleware
```javascript
// Required auth — return 401 if no token
export const verifyAuthToken = (req, res, next) => { ... };

// Optional auth — continue even without token (for guest features)
export const optionalAuth = (req, res, next) => { ... };
```

### 6.6 File Upload — Cloudinary
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

### 6.7 Cross-service Communication
- User backend → Admin backend ผ่าน HTTP `fetch(ADMIN_API_BASE + '/api/...')`
- ตัวอย่าง: Report, Gift settings, Stat slip
- **ห้าม** hardcode Admin URL — ใช้ `process.env.ADMIN_API_BASE`

### 6.8 CORS Configuration
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

### 6.9 Backend Route Pattern
```javascript
// ★ ทุก route ใช้ middleware + shopId
app.get('/api/resource', verifyAuthToken, async (req, res) => {
  try {
    const shopId = req.headers['x-shop-id'] || req.query.shopId;
    const data = await Model.find({ shopId }).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    console.error('GET /api/resource error:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});
```

### 6.10 Rate Limiting Strategy
```
Global API:       10,000 req / 15 min
Auth endpoints:     100 req / 15 min
Upload endpoints:   200 req / 15 min
AI Caption:          50 req / 15 min
```

### 6.11 Security Stack
| Layer | Implementation |
|-------|---------------|
| **Headers** | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| **Input Sanitization** | Custom `mongoSanitize` middleware (strip `$` operators) |
| **Rate Limiting** | express-rate-limit (per-route granularity) |
| **Auth** | JWT verification middleware (`verifyAuthToken`) |
| **CORS** | Whitelist-based origin validation |
| **Password** | bcryptjs hashing (salt rounds: 10) |
| **Queue Media Upload** | Browser accepts JPG/PNG/WebP up to 5 MB (QR up to 2 MB); User/Admin servers enforce JPG/PNG/WebP with a 10 MB hard limit + Cloudinary |

---

## 7. Key Features & Business Logic

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

## 8. Environment Variables

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
GMAIL_SCRIPT_URL=https://script.google.com/macros/s/.../exec
```

> ⚠️ **อย่าเก็บ `.env` ใน Git** — ใช้ `.env.example` สำหรับ template
> ⚠️ **อย่า hardcode** secrets ใน source code — ดึงจาก `process.env` เสมอ

---

## 9. Development Commands

```bash
# Frontend (port 3000)
cd frontend && npm start

# Backend (port 5002)
cd backend && npm run dev    # nodemon
cd backend && npm start      # production

# Build check (ก่อน push ทุกครั้ง)
cd frontend && npm run build
```

---

## 10. Absolute Engineering Rules (MANDATORY)

> 🛑 **กฎเหล่านี้เป็น NON-NEGOTIABLE — ต้องปฏิบัติตามทุกครั้งที่แตะโค้ดหรือโครงสร้าง**

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
- **อ้างอิง `DESIGN.md`** สำหรับสี, component styles, animation ก่อน hardcode CSS
- **แยก CSS file** ต่อ page — `Home.css`, `Register.css`, etc.
- **ใช้ `useSocket()`** จาก `SocketContext` สำหรับ real-time ทุกหน้า
- **รัน `npm run build`** ตรวจสอบ compilation ก่อน push / deploy ทุกครั้ง
- **ลบ dead code, unused imports** ทันทีที่เจอ — อย่าปล่อยทิ้งไว้

### DON'T ❌
- **อย่าลบ token** เมื่อเจอ network error หรือ 500 — แค่ 401 เท่านั้น
- **อย่าใช้ `require()`** — ใช้ `import` เสมอ (ES Modules)
- **อย่าใช้สี plain** (red, blue) — ใช้ palette ตาม design system
- **อย่าเปลี่ยน font** — ใช้ Inter เสมอ
- **อย่าเพิ่ม dependencies** โดยไม่จำเป็น — ถ้ามี built-in ให้ใช้ built-in ก่อน
- **อย่าเก็บ sensitive data** ใน client-side code
- **อย่าลบ comments ภาษาไทย** ที่มีอยู่เดิม — เป็น documentation
- **อย่าใช้ `100vh`** — ใช้ `100dvh` เสมอสำหรับ mobile viewport
- **อย่า hardcode สี** — อ้างอิง DESIGN.md
- **อย่าสร้าง socket connection ใน component** — ใช้ Global `SocketContext` เท่านั้น
- **อย่า `console.log` ข้อมูลลับ** (token, password, API keys) — ลบก่อน production

---

## 11. Clean Code & Scalability Standards

> 📐 **ทุกบรรทัดโค้ดที่เพิ่ม ลบ หรือแก้ไข ต้องผ่านเกณฑ์เหล่านี้**

### 11.1 Code Quality Checklist
ก่อน commit หรือ submit code ทุกครั้ง ต้องตอบ YES ทุกข้อ:

| # | Question | Pass? |
|---|----------|-------|
| 1 | มี unused imports / dead code หลงเหลืออยู่ไหม? | ❌ ต้องไม่มี |
| 2 | มี `console.log` ที่ใช้ debug แล้วลืมลบไหม? | ❌ ต้องไม่มี (ยกเว้น `[SocketContext]` + error logs) |
| 3 | มี hardcoded secrets / API keys ใน source ไหม? | ❌ ต้องไม่มี |
| 4 | Error handling ครบทุก async call ไหม? | ✅ ต้องมี try/catch หรือ .catch() |
| 5 | มี magic numbers / strings ที่ควรเป็น constant ไหม? | ❌ ใช้ named constants |
| 6 | Function ยาวเกิน 50 บรรทัดไหม? | ❌ แยก sub-functions |
| 7 | Component ยาวเกิน 300 บรรทัดไหม? | ⚠️ พิจารณาแยก custom hook |
| 8 | ใช้ `apiCall()` จาก `authService.js` แทน raw `fetch` ไหม? | ✅ ต้องใช้ |

### 11.2 Single Responsibility Principle
```
❌ BAD: Component ที่ทำ data fetching + socket listening + state management + rendering ในไฟล์เดียว
✅ GOOD: Component renders → Custom Hook manages state/effects → Service handles API
```

### 11.3 DRY (Don't Repeat Yourself)
- ถ้าเจอ logic เดียวกันซ้ำ ≥ 2 ที่ → Extract เป็น utility function ใน `utils.js` หรือ service
- ถ้าเจอ API call pattern เดียวกันซ้ำ → ใช้ `apiCall()` wrapper
- ถ้าเจอ CSS pattern ซ้ำ → ดูว่า DESIGN.md มี class ให้ใช้หรือยัง

### 11.4 Error Handling Hierarchy
```javascript
// ★ ทุก async operation ต้องมี error boundary
try {
  const result = await apiCall('/api/endpoint');
  if (!result.success) {
    // Handle application-level error (e.g., validation failed)
    setError(result.message);
    return;
  }
  // Handle success
} catch (err) {
  // Handle network/system error (e.g., timeout, 500)
  console.error("API Error:", err.message);
  // ★ อย่า clear token ที่นี่ — authService จัดการ 401 ให้แล้ว
}
```

### 11.5 Naming Conventions
| Type | Convention | Example |
|------|-----------|---------|
| **Components** | PascalCase | `Home.js`, `GiftOrder.js` |
| **Hooks** | camelCase, prefix `use` | `useSocket`, `useHomeData` |
| **Functions** | camelCase, verb prefix | `fetchOrders`, `handleSubmit` |
| **Constants** | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_FILE_SIZE` |
| **CSS classes** | kebab-case | `.home-container`, `.gift-card` |
| **State** | camelCase, descriptive | `isLoading`, `orderList`, `selectedItem` |
| **Event handlers** | `handle` + Event | `handleClick`, `handleSubmit` |
| **Boolean state** | `is/has/should` prefix | `isProcessing`, `hasError` |

---

## 12. Global Socket.IO Architecture (MANDATORY)

### 12.1 Architecture Rule
```
❌ FORBIDDEN: สร้าง Socket.IO connection ใน Component
   const socket = io(REALTIME_URL, { query: { shopId } });  // ← ห้ามทำ

✅ MANDATORY: ใช้ Global SocketContext
   const { socket, systemConfig } = useSocket();
```

### 12.2 Why?
เมื่อ component mount → `io()` สร้าง connection ใหม่ → unmount → disconnect → mount อีก → connection ใหม่อีก
ผลลัพธ์: **Connection Duplication** → HTTP Polling spam (+7 requests/navigate) → Memory leak → Server crash บน Render

### 12.3 Single Connection Architecture
```
App.js
└── <SocketProvider>         ← สร้าง 1 WebSocket connection ตอน mount
    └── <BrowserRouter>
        ├── /home  → Home.js  → useSocket()  ← ใช้ connection เดิม
        ├── /select → Select.js → useSocket() ← ใช้ connection เดิม
        ├── /gift  → Gift.js  → useSocket()  ← ใช้ connection เดิม
        └── ...
```

### 12.4 SocketContext API (`context/SocketContext.js`)
```javascript
// ★ Import
import { useSocket } from "../context/SocketContext";

// ★ Usage in any component
const { socket, isConnected, systemConfig, shopId } = useSocket();

// ★ Listen to events (with proper cleanup!)
useEffect(() => {
  if (!socket) return;

  const handleMyEvent = (data) => { /* ... */ };
  socket.on("myEvent", handleMyEvent);

  return () => {
    socket.off("myEvent", handleMyEvent);  // ✅ ถอด listener
    // ★ อย่า socket.disconnect() — Context จัดการ lifecycle
  };
}, [socket]);
```

### 12.5 Socket Configuration (Enforced)
```javascript
io(REALTIME_URL, {
  query: { shopId },
  transports: ["websocket"],    // ★ WebSocket ONLY — ห้ามใช้ polling
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 1000,
  autoConnect: true,
  // ★ ห้ามใช้ forceNew: true — จะสร้าง connection ซ้ำซ้อน
});
```

### 12.6 Component-level Socket Rules

| Rule | Description |
|------|-------------|
| **ใช้ `useSocket()` เท่านั้น** | ห้าม `import { io } from "socket.io-client"` ในไฟล์ page component |
| **Cleanup = `socket.off()` เท่านั้น** | ห้าม `socket.disconnect()` ใน component cleanup |
| **Named handler functions** | ใช้ `const handleX = (data) => {...}` แล้ว `socket.on("x", handleX)` เพื่อ `.off()` ได้ถูกตัว |
| **Guard clause** | เริ่ม useEffect ด้วย `if (!socket) return;` เสมอ |
| **Dependency array** | ใส่ `[socket]` เป็น dependency ของ useEffect ที่ผูก listener |

### 12.7 Available Socket Events
| Event | Direction | Payload | Usage |
|-------|-----------|---------|-------|
| `getConfig` | Client → Server | — | ขอ config เริ่มต้น |
| `status` | Server → Client | `{ systemOpen, enableImage, enableText, enableGift, enableBirthday, settings }` | สถานะระบบ + package list |
| `configUpdate` | Server → Client | `{ systemOpen, enableImage, ... }` | อัปเดต config แบบ partial |
| `publicRankingTypeUpdated` | Server → Client | `{ type: "daily" \| "monthly" \| "alltime" }` | เปลี่ยนประเภทอันดับ |
| `perksUpdated` | Server → Client | `{ perks: [...] }` | อัปเดตรายการสิทธิพิเศษ |

---

## 13. API Fetching & Performance Standards

### 13.1 Anti-N+1 Rule (STRICT)
```javascript
// ❌ FORBIDDEN — N+1 Waterfall (fetch ใน loop)
for (const order of orders) {
  const status = await apiCall(`/api/order/${order.id}/status`);
}

// ✅ CORRECT — Batch call หรือ aggregate endpoint
const statuses = await apiCall('/api/orders/statuses', {
  method: 'POST',
  body: JSON.stringify({ orderIds: orders.map(o => o.id) })
});
```

### 13.2 Duplicate Fetch Prevention
```javascript
// ❌ FORBIDDEN — หลาย useEffect เรียก endpoint เดียวกัน
useEffect(() => { fetchProfile(); }, []);
useEffect(() => { fetchProfile(); }, [tabIndex]); // ซ้ำ!

// ✅ CORRECT — fetch ครั้งเดียว + share state
useEffect(() => {
  if (!profileData) fetchProfile();
}, []);
```

### 13.3 Loading State Strategy
```javascript
// ❌ FORBIDDEN — Full-page overlay blocking ทุกครั้งที่กลับมาหน้าเดิม
if (loading) return <FullScreenOverlay />;

// ✅ CORRECT — แสดง cached data ทันที + background refresh
const [data, setData] = useState(() => getCachedData() || null);
const [isRefreshing, setIsRefreshing] = useState(false);

// แสดง data ที่มี + subtle refresh indicator ถ้ากำลัง revalidate
return (
  <div>
    {isRefreshing && <SubtleRefreshIndicator />}
    {data ? <DataView data={data} /> : <Skeleton />}
  </div>
);
```

### 13.4 API Call Consolidation
- **ทุก API call ต้องผ่าน `authService.js > apiCall()`** — ห้ามใช้ raw `fetch()` หรือ `axios` ตรง
- `apiCall()` จัดการ: JWT token, `x-shop-id` header, `shopId` query param, 401 auto-redirect
- ถ้าต้องเรียก Admin API → ใช้ parameter `{ baseUrl: ADMIN_API_URL }` หรือ fetch ตรงพร้อม shopId

### 13.5 Data Flow Diagram
```
Component Mount
    ├── 1. systemConfig from SocketContext (instant, 0ms)
    ├── 2. Cached data from localStorage/state (instant, 0ms)
    └── 3. Fresh API call (background, show cached data while loading)
         └── On success → update state + cache
         └── On error → keep cached data + show error toast
```

---

## 14. Security Standards

### 14.1 Frontend Security
| Concern | Rule |
|---------|------|
| **Token Storage** | `localStorage` only — keys: `token`, `user`, `shopId` |
| **XSS Prevention** | React auto-escapes JSX — ห้ามใช้ `dangerouslySetInnerHTML` |
| **Sensitive Logs** | ห้าม `console.log` token, password, API keys — ลบก่อน production |
| **API Keys** | ห้าม hardcode ใน frontend — ใช้ `REACT_APP_*` env vars |
| **401 Handling** | เฉพาะ 401 เท่านั้นที่ลบ token — ห้ามลบเมื่อ 500/network error |

### 14.2 Backend Security
| Concern | Implementation |
|---------|---------------|
| **Helmet** | Security headers (CSP, HSTS, X-Frame-Options) |
| **Rate Limiting** | Submission: 6/user or 60/guest-IP per 10 min; gift creation: 5/user or 60/guest-IP; payment confirmation: 12/user or 80/guest-IP; generic auth and AI limits remain separate |
| **Queue Capacity Guard** | At most 3 active items per logged-in user or sender phone by default (`MAX_ACTIVE_QUEUE_PER_USER`); pending/approved/playing count, completed/rejected do not |
| **Duplicate Protection** | UUID submission/order IDs plus a per-shop idempotency key prevent retrying the same server-to-server request from adding a second queue item |
| **Input Sanitization** | `mongoSanitize` middleware — strip `$` operators from request body |
| **Auth Middleware** | `verifyAuthToken` — validate JWT on every protected route |
| **CORS** | Whitelist-based origin validation (no wildcard `*` in production) |
| **File Upload** | Multer size limits + Cloudinary validation |
| **Password** | bcryptjs hashing (never store plaintext) |
| **Env Variables** | ห้าม commit `.env` — ใช้ `.env.example` + hosting dashboard |

### 14.3 Security Audit Checklist (ก่อน Deploy)
- [ ] ไม่มี `console.log` ที่ print sensitive data (token, password, API keys)
- [ ] ไม่มี hardcoded secrets ใน source code
- [ ] `.env` อยู่ใน `.gitignore`
- [ ] CORS whitelist ไม่มี `*` (wildcard)
- [ ] ทุก protected route มี `verifyAuthToken` middleware
- [ ] Rate limiting ครอบคลุมทุก endpoint ที่ user เรียกได้
- [ ] File upload มี size limit + format validation
- [ ] ไม่มี `eval()`, `Function()`, หรือ `dangerouslySetInnerHTML`

---

## 15. React Component Pattern

### 15.1 Standard Component Template
```javascript
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiCall, getShopId, getUser } from "../authService";
import { useSocket } from "../context/SocketContext";
import "./PageName.css";

function PageName() {
  const navigate = useNavigate();
  const shopId = getShopId();
  const user = getUser();
  const { socket, systemConfig } = useSocket();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;
    fetchData();
  }, [shopId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await apiCall('/api/endpoint');
      if (result.success) setData(result.data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-wrapper">
        {/* Content */}
      </div>
    </div>
  );
}

export default PageName;
```

### 15.2 Custom Hook Pattern (for complex pages)
```javascript
// src/hooks/useHomeData.js
import { useState, useEffect, useCallback } from "react";
import { apiCall, getShopId } from "../authService";
import { useSocket } from "../context/SocketContext";

export function useHomeData() {
  const shopId = getShopId();
  const { socket, systemConfig } = useSocket();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const result = await apiCall('/api/auth/profile');
      if (result.success) setProfile(result.user);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  }, []);

  useEffect(() => {
    if (!shopId) return;
    setLoading(true);
    Promise.all([fetchProfile(), fetchOrders()])
      .finally(() => setLoading(false));
  }, [shopId]);

  return { profile, orders, loading, refetch: fetchProfile };
}
```

---

## 16. Common Bugs & Solutions

| Bug | สาเหตุ | วิธีแก้ |
|-----|--------|---------|
| Render crash (exit status 1) | ไม่มี env variable ที่จำเป็น | เช็ค `.env` ใน Render dashboard — ต้องมี `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*` |
| Gemini 429 Rate Limit | ใช้ model อื่นที่ quota = 0 | ★ ใช้ `gemini-2.5-flash` เท่านั้น — model อื่น quota เป็น 0 |
| CORS error | origin ไม่อยู่ใน whitelist | เพิ่ม URL ใน `allowedOrigins` ใน `server.js` |
| Socket ไม่ connect | shopId ไม่ถูกส่งตอน handshake | เช็ค `handshake.query.shopId` — ต้องมีค่า |
| Socket connection duplication | สร้าง `io()` ใน component | ★ ใช้ `useSocket()` จาก `SocketContext` เท่านั้น |
| HTTP polling spam (7+ req/navigate) | `transports: ["polling", "websocket"]` | ★ ใช้ `transports: ["websocket"]` เท่านั้น |
| Production ไม่แสดง packages | ไม่ส่ง `shopId` ใน API call | ทุก API ต้องมี `?shopId=xxx` + header `x-shop-id` |
| Token หาย / user หลุด | ลบ token ตอน network error | **ลบ token เฉพาะ 401 เท่านั้น** — network error ให้เก็บ token ไว้ |
| รูปไม่แสดงบน production | ใช้ local file path แทน Cloudinary URL | ใช้ `req.file.path` (Cloudinary URL) ไม่ใช่ `req.file.filename` |
| OCR อ่านสลิปไม่ได้ | ตัวเลขไทยไม่ถูกแปลง | ใช้ `thaiToArabic()` แปลง ๐-๙ → 0-9 ก่อนเทียบ |
| Ranking past date แสดง 0 | frontend อ่าน `dailyPoints` แต่ aggregate ใช้ `points` | ใช้ `entry.dailyPoints ?? entry.points ?? 0` |
| Monthly ranking ไม่หายหลัง clear DB | ลบแค่ `rankinghistories` แต่ `rankings` ยังอยู่ | ต้องลบทั้ง 2 collection พร้อมกัน |
| Google login ไม่ทำงาน | `GOOGLE_CLIENT_ID` ไม่ตรงกัน frontend/backend | ต้องใช้ Client ID เดียวกันทั้ง 2 ฝั่ง |
| Email OTP ไม่ส่ง (Render) | SMTP port blocked | ใช้ Google Apps Script proxy (`GMAIL_SCRIPT_URL`) แทน Nodemailer SMTP |

---

## 17. AI Caption (Gemini)

| Setting | Value |
|---------|-------|
| **Model** | `gemini-2.5-flash` เท่านั้น — model อื่น quota = 0 |
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

---

## 18. Deployment Checklist

| Step | Detail |
|------|--------|
| **1. Backend env** | ตั้ง env variables ทั้งหมดใน Render dashboard |
| **2. Frontend env** | ตั้ง `REACT_APP_*` env ใน Vercel project settings |
| **3. CORS** | เพิ่ม production URL ใน `allowedOrigins` ของ `server.js` |
| **4. MongoDB** | เพิ่ม Render IP ใน MongoDB Atlas Network Access |
| **5. Cloudinary** | ตรวจสอบ API key + cloud name ตรงกัน |
| **6. Google OAuth** | `GOOGLE_CLIENT_ID` ต้องตรงกัน frontend + backend |
| **7. Gemini** | ใช้ `gemini-2.5-flash` เท่านั้น — model อื่น quota = 0 |
| **8. Build** | Frontend: `npm run build` ต้อง pass ก่อน deploy |
| **9. Socket** | ตรวจสอบ `REALTIME_URL` → Admin server URL |
| **10. Email** | ตรวจสอบ `GMAIL_SCRIPT_URL` ใน backend .env |

---

## 19. Standard Engineering Skills (9arm-style)

เพื่อรักษามาตรฐานงานวิศวกรรมให้สูงอยู่เสมอ โปรเจคนี้ได้นำระเบียบปฏิบัติต่อไปนี้มาใช้:

| Skill | Description | Location |
|-------|-------------|----------|
| **Debug Mantra** | ระเบียบ 4 ขั้นในการไล่บัค (Reproduce -> Trace -> Falsify -> Ledger) | [`docs/skills/debug-mantra.md`](./skills/debug-mantra.md) |
| **Post-mortem** | การบันทึกรายละเอียดการแก้บัคสำคัญ เพื่อเป็นความรู้ให้ทีม | [`docs/skills/post-mortem.md`](./skills/post-mortem.md) |
| **Scrutinize** | การรีวิวแผนงานหรือโค้ดจากมุมมองคนนอก (Intent-first review) | [`docs/skills/scrutinize.md`](./skills/scrutinize.md) |
| **Management Talk** | การสื่อสารงานเทคนิคให้ผู้บริหารหรือคนนอกเข้าใจ | [`docs/skills/management-talk.md`](./skills/management-talk.md) |

### การจดบันทึก Post-mortem
เมื่อมีการแก้บัคที่มีความสำคัญหรือซับซ้อน ให้สร้างไฟล์บันทึกไว้ที่ [`docs/postmortems/`](./postmortems/) โดยใช้ Template จากไฟล์ skill ด้านบน

---

## 20. Code Review Checklist (สำหรับ AI & Human Reviewers)

ก่อนอนุมัติหรือ merge โค้ดใดๆ ต้องตรวจทุกข้อ:

### Architecture & Structure
- [ ] ไม่มีการสร้าง `io()` socket connection ใน component — ใช้ `useSocket()` เท่านั้น
- [ ] ไม่มี business logic ใน route files (backend) — logic อยู่ใน controller/service
- [ ] ไม่มี raw `fetch()` / `axios` — ใช้ `apiCall()` จาก `authService.js`
- [ ] ไม่มี HTTP request ใน loop (N+1 problem)

### Security
- [ ] ไม่มี hardcoded secrets / API keys
- [ ] ไม่มี `console.log` ที่ expose sensitive data
- [ ] Protected routes มี auth middleware
- [ ] Token ถูกลบเฉพาะเมื่อ 401

### Performance
- [ ] ไม่มี duplicate API calls ในหน้าเดียวกัน
- [ ] Socket listeners มี cleanup (`socket.off`) ใน useEffect return
- [ ] `transports: ["websocket"]` — ไม่มี polling fallback

### Code Quality
- [ ] ไม่มี unused imports / dead code
- [ ] ใช้ ES Modules (`import/export`)
- [ ] Error handling ครบทุก async operation
- [ ] Naming conventions ถูกต้อง (ตาม section 11.5)
- [ ] `npm run build` ผ่านโดยไม่มี errors (warnings ตรวจสอบแล้ว)

### UI/UX
- [ ] ใช้ `100dvh` ไม่ใช่ `100vh`
- [ ] Dark theme + glassmorphism ตาม DESIGN.md
- [ ] Mobile-first (max-width 430px, min 48px tap targets)
- [ ] ไม่มี hardcoded colors — ใช้ design system palette
