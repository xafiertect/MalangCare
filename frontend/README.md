# LAPOR MALANG — Frontend

Antarmuka web untuk platform LAPOR MALANG, dibangun dengan **React 18 + Vite + Tailwind CSS**.

Mencakup dua interface dalam satu aplikasi:
- **Web App User** — warga melapor dan memantau kerusakan fasilitas
- **Web App Admin** — staf dinas memverifikasi dan mengelola laporan

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Struktur Folder](#struktur-folder)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Environment Variables](#environment-variables)
- [Routing](#routing)
- [State Management](#state-management)
- [API Service Layer](#api-service-layer)
- [Peta Interaktif](#peta-interaktif)
- [Konvensi Kode](#konvensi-kode)

---

## Tech Stack

| Library | Versi | Fungsi |
|---------|-------|--------|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool & dev server |
| React Router DOM | 6.x | Client-side routing |
| Tailwind CSS | 3.x | Utility-first styling |
| Zustand | 4.x | State management (global) |
| Axios | 1.x | HTTP client + JWT interceptor |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Schema validation (form + data) |
| @hookform/resolvers | 3.x | Integrasi Zod dengan React Hook Form |
| Leaflet.js | 1.9.x | Peta interaktif (OpenStreetMap) |
| React-Leaflet | 4.x | React wrapper untuk Leaflet |
| Recharts | 2.x | Grafik dashboard admin |
| React Dropzone | 14.x | Upload foto drag & drop |
| date-fns | 3.x | Format dan manipulasi tanggal |
| Lucide React | latest | Icon set |
| clsx | 2.x | Conditional className helper |

---

## Struktur Folder

```
frontend/
├── index.html                  # HTML template + Google Fonts + Leaflet CSS
├── vite.config.js              # Vite config (port 3000, hot reload Docker)
├── tailwind.config.js          # Tailwind config + custom brand colors
├── postcss.config.js
├── .env.example                # Template environment variables
│
└── src/
    ├── main.jsx                # Entry point React DOM
    ├── App.jsx                 # Router setup + semua route definitions
    │
    ├── styles/
    │   └── globals.css         # Tailwind imports + custom utility classes
    │
    ├── utils/
    │   ├── constants.js        # DAMAGE_LEVELS, REPORT_STATUS, FACILITY_CATEGORIES, KECAMATAN
    │   ├── formatters.js       # formatDate, formatDateTime, formatRelative, truncate
    │   └── storage.js          # localStorage helpers (access/refresh token)
    │
    ├── stores/                 # Zustand global state
    │   ├── authStore.js        # User auth state (user, accessToken, isAuthenticated)
    │   ├── notificationStore.js # Notifikasi + unreadCount
    │   └── mapStore.js         # Filter state peta (kategori, tingkat, status, kecamatan)
    │
    ├── services/               # Axios API calls (thin wrappers)
    │   ├── api.js              # Axios instance + JWT interceptor + auto-refresh
    │   ├── authService.js      # register, login, logout, forgot/reset password
    │   ├── reportService.js    # CRUD laporan + rating + peta publik
    │   ├── notificationService.js
    │   ├── userService.js      # Profil + avatar
    │   ├── adminReportService.js  # Kelola laporan + export CSV
    │   ├── adminUserService.js    # Manajemen akun admin
    │   └── adminDashboardService.js
    │
    ├── hooks/                  # Custom React hooks
    │   ├── useGeolocation.js   # GPS browser + error handling
    │   └── useNotifications.js # Polling notifikasi setiap 30 detik
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.jsx        # Top nav (user app) + notif bell + user menu
    │   │   ├── Sidebar.jsx       # Side nav (admin app) + logout
    │   │   └── ProtectedRoute.jsx # Route guard berdasarkan role
    │   │
    │   ├── map/
    │   │   ├── MapView.jsx       # Komponen peta utama (Leaflet + marker warna)
    │   │   ├── MapFilter.jsx     # Panel filter peta (kategori, tingkat, status, kecamatan)
    │   │   └── MapLegend.jsx     # Legenda warna marker
    │   │
    │   ├── report/
    │   │   ├── ReportCard.jsx      # Card laporan di list view
    │   │   ├── ReportStatusBadge.jsx # Badge warna berdasarkan status
    │   │   ├── ReportTimeline.jsx  # Riwayat perubahan status
    │   │   └── PhotoGallery.jsx    # Grid foto + lightbox
    │   │
    │   └── notifications/
    │       ├── NotificationBell.jsx  # Bell icon + unread badge
    │       └── NotificationItem.jsx  # Item notifikasi di list
    │
    └── pages/
        ├── public/             # Halaman tanpa auth
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx     # + OTP verification step
        │   ├── ForgotPasswordPage.jsx
        │   ├── ResetPasswordPage.jsx
        │   └── PublicMapPage.jsx    # Peta publik (guest)
        │
        ├── user/               # Halaman user terautentikasi
        │   ├── DashboardPage.jsx    # Stat cards + laporan terbaru
        │   ├── CreateReportPage.jsx # Multi-step form (Lokasi → Detail → Foto → Review)
        │   ├── MyReportsPage.jsx    # Daftar laporan + filter status
        │   ├── ReportDetailPage.jsx # Detail + timeline + rating
        │   ├── MapPage.jsx
        │   ├── NotificationsPage.jsx
        │   └── ProfilePage.jsx      # Edit profil + upload avatar
        │
        └── admin/              # Halaman admin terautentikasi
            ├── AdminLoginPage.jsx
            ├── AdminDashboardPage.jsx   # Stats + charts (Recharts) + top kecamatan
            ├── AdminReportsPage.jsx     # Tabel laporan + filter + export CSV
            ├── AdminReportDetailPage.jsx # Detail + verifikasi + upload evidence + reject modal
            ├── AdminMapPage.jsx
            └── AdminUsersPage.jsx       # Manajemen akun admin (super admin only)
```

---

## Instalasi & Menjalankan

### Development (tanpa Docker)

```bash
# Install dependencies
npm install

# Salin dan isi environment variables
cp .env.example .env

# Jalankan dev server (port 3000)
npm run dev
```

### Build Production

```bash
npm run build
# Output: dist/
```

### Dengan Docker

```bash
# Dari root monorepo (dev mode — hot reload)
docker compose up -d frontend

# Build production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d frontend
```

---

## Environment Variables

Buat file `.env` berdasarkan `.env.example`:

```env
# URL backend API
VITE_API_URL=http://localhost:5000/api

# Koordinat default peta (pusat Kabupaten Malang)
VITE_MAP_DEFAULT_LAT=-8.1654
VITE_MAP_DEFAULT_LNG=112.6208
VITE_MAP_DEFAULT_ZOOM=11
```

> Semua variabel diawali `VITE_` agar dapat diakses di kode React via `import.meta.env.VITE_*`

---

## Routing

Semua route didefinisikan di `src/App.jsx`:

| Path | Halaman | Auth |
|------|---------|------|
| `/` | Landing Page | — |
| `/login` | Login User | — |
| `/register` | Registrasi + OTP | — |
| `/forgot-password` | Lupa Password | — |
| `/reset-password` | Reset Password | — |
| `/peta` | Peta Publik | — |
| `/dashboard` | Dashboard User | User |
| `/laporan/baru` | Buat Laporan | User |
| `/laporan` | Laporan Saya | User |
| `/laporan/:id` | Detail Laporan | User |
| `/peta-saya` | Peta (logged in) | User |
| `/notifikasi` | Notifikasi | User |
| `/profil` | Profil | User |
| `/admin/login` | Login Admin | — |
| `/admin/dashboard` | Dashboard Admin | Admin |
| `/admin/laporan` | Kelola Laporan | Admin |
| `/admin/laporan/:id` | Detail Laporan Admin | Admin |
| `/admin/peta` | Peta Admin | Admin |
| `/admin/pengguna` | Manajemen Admin | Super Admin |

### Protected Route

Komponen `ProtectedRoute` di `src/components/layout/ProtectedRoute.jsx` menangani:
- Redirect ke `/login` jika tidak terautentikasi
- Redirect sesuai role jika mengakses halaman yang tidak diizinkan

```jsx
// Penggunaan di App.jsx
<Route element={<ProtectedRoute allowedRoles={['user']} />}>
  <Route path="/dashboard" element={<DashboardPage />} />
</Route>

<Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
  <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
</Route>
```

---

## State Management

Tiga Zustand store di `src/stores/`:

### `authStore.js`

```js
{
  user,            // { id, name, email, role, avatar_url }
  accessToken,     // string
  isAuthenticated, // boolean

  setAuth(user, accessToken, refreshToken),
  updateToken(accessToken),
  updateUser(updates),
  clearAuth(),
}
```

### `notificationStore.js`

```js
{
  notifications,   // array
  unreadCount,     // number

  setNotifications(notifications),
  markRead(id),
  markAllRead(),
}
```

### `mapStore.js`

```js
{
  filters: { category, damage_level, status, district },

  setFilter(key, value),
  resetFilters(),
}
```

---

## API Service Layer

Semua API call ada di `src/services/`. Setiap service adalah thin wrapper di atas instance Axios dari `src/services/api.js`.

### JWT Interceptor (`api.js`)

- Setiap request otomatis menyisipkan `Authorization: Bearer <token>`
- Jika response 401 → otomatis request refresh token
- Jika refresh gagal → `clearAuth()` + redirect ke `/login`
- Queue request yang gagal selama proses refresh berlangsung (mencegah race condition)

```js
// Contoh penggunaan
import { reportService } from './services/reportService.js';

const { data } = await reportService.getMyReports();
```

---

## Peta Interaktif

Menggunakan **Leaflet.js** via `react-leaflet`. Komponen utama: `src/components/map/MapView.jsx`.

### Warna Marker

| Tingkat Kerusakan | Warna | Status Selesai |
|-------------------|-------|----------------|
| Ringan | Hijau `#22c55e` | Abu `#6b7280` |
| Sedang | Kuning `#eab308` | — |
| Berat | Merah `#ef4444` | — |

### Tile Layer

Menggunakan **OpenStreetMap** (gratis, tanpa API key):
```
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### Filter Peta

State filter disimpan di `mapStore`. Setiap perubahan filter otomatis trigger re-fetch data laporan dari API.

---

## Konvensi Kode

- **Named exports** untuk komponen: `export function MyComponent() {}`
- **Default exports** untuk halaman: `export default function MyPage() {}`
- **File naming:** PascalCase untuk komponen (`.jsx`), camelCase untuk utilities (`.js`)
- **Tailwind utility classes** — tidak ada CSS module atau styled components
- **Custom classes** di `globals.css` untuk pola berulang: `.btn-primary`, `.card`, `.input-field`, `.label`, `.badge-*`
- **Zod + React Hook Form** untuk semua form dengan validasi
- **Zustand** untuk state yang perlu diakses lintas komponen; `useState` untuk state lokal komponen
