# 🎨 Frontend Architecture
## LAPOR MALANG — React Application
**Versi:** 1.0.0 | **Stack:** React 18 + Vite + Tailwind CSS

---

## 1. Tech Stack Frontend

| Library | Versi | Fungsi |
|---------|-------|--------|
| React | 18.x | Core UI framework |
| Vite | 5.x | Build tool & dev server |
| React Router DOM | 6.x | Client-side routing |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | latest | UI components (Radix primitives) |
| Zustand | 4.x | State management |
| Axios | 1.x | HTTP client dengan interceptor |
| React Query (TanStack) | 5.x | Server state, caching, refetch |
| Leaflet.js | 1.9.x | Peta interaktif |
| React-Leaflet | 4.x | React wrapper Leaflet |
| React Hook Form | 7.x | Form handling & validasi |
| Zod | 3.x | Schema validation |
| Recharts | 2.x | Grafik dashboard admin |
| React Dropzone | 14.x | Upload foto drag & drop |
| date-fns | 3.x | Format tanggal |
| Lucide React | latest | Icon set |

---

## 2. Struktur Folder

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Root component + router
│   │
│   ├── assets/                     # Static assets
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/                 # Shared/reusable components
│   │   ├── ui/                     # shadcn/ui base components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── Card.jsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                 # Layout components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx         # Admin sidebar
│   │   │   ├── Footer.jsx
│   │   │   └── ProtectedRoute.jsx  # Route guard
│   │   │
│   │   ├── map/                    # Peta components
│   │   │   ├── MapView.jsx         # Main map component
│   │   │   ├── ReportPin.jsx       # Custom pin marker
│   │   │   ├── ReportPopup.jsx     # Popup di peta
│   │   │   ├── MapLegend.jsx       # Legenda warna
│   │   │   └── MapFilter.jsx       # Panel filter peta
│   │   │
│   │   ├── report/                 # Report components
│   │   │   ├── ReportCard.jsx      # Card di list
│   │   │   ├── ReportStatusBadge.jsx
│   │   │   ├── ReportTimeline.jsx  # Riwayat status
│   │   │   ├── PhotoGallery.jsx    # Galeri foto
│   │   │   └── DamageLevel.jsx     # Badge tingkat kerusakan
│   │   │
│   │   └── notifications/
│   │       ├── NotificationBell.jsx
│   │       └── NotificationItem.jsx
│   │
│   ├── pages/                      # Page components (route targets)
│   │   ├── public/                 # Halaman publik (no auth)
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── ResetPasswordPage.jsx
│   │   │   └── PublicMapPage.jsx   # Peta publik (guest)
│   │   │
│   │   ├── user/                   # Halaman user terautentikasi
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── CreateReportPage.jsx
│   │   │   ├── MyReportsPage.jsx
│   │   │   ├── ReportDetailPage.jsx
│   │   │   ├── MapPage.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   │
│   │   └── admin/                  # Halaman admin
│   │       ├── AdminLoginPage.jsx
│   │       ├── AdminDashboardPage.jsx
│   │       ├── AdminReportsPage.jsx
│   │       ├── AdminReportDetailPage.jsx
│   │       ├── AdminMapPage.jsx
│   │       ├── AdminUsersPage.jsx  # Super admin only
│   │       └── AdminSettingsPage.jsx
│   │
│   ├── hooks/                      # Custom hooks
│   │   ├── useAuth.js              # Auth state hook
│   │   ├── useGeolocation.js       # GPS hook
│   │   ├── useNotifications.js     # Notifikasi polling hook
│   │   ├── useFileUpload.js        # Upload handler hook
│   │   └── useReports.js          # Reports query hooks
│   │
│   ├── stores/                     # Zustand stores
│   │   ├── authStore.js            # User auth state
│   │   ├── notificationStore.js    # Notif state & count
│   │   └── mapStore.js             # Map filter state
│   │
│   ├── services/                   # API call functions
│   │   ├── api.js                  # Axios instance + interceptors
│   │   ├── authService.js
│   │   ├── reportService.js
│   │   ├── notificationService.js
│   │   ├── adminReportService.js
│   │   └── adminUserService.js
│   │
│   ├── utils/                      # Helper functions
│   │   ├── constants.js            # DAMAGE_LEVELS, CATEGORIES, STATUS
│   │   ├── formatters.js           # Date, number formatters
│   │   ├── validators.js           # Zod schemas
│   │   ├── mapHelpers.js           # Koordinat, geocoding helpers
│   │   └── storage.js              # LocalStorage helpers
│   │
│   └── styles/
│       └── globals.css             # Tailwind imports + custom CSS
│
├── .env                            # Environment variables
├── .env.example
├── vite.config.js
├── tailwind.config.js
├── package.json
└── Dockerfile
```

---

## 3. Routing Structure

```javascript
// App.jsx — Route Definition

/* PUBLIC ROUTES */
/                          → LandingPage
/login                     → LoginPage
/register                  → RegisterPage
/forgot-password           → ForgotPasswordPage
/reset-password/:token     → ResetPasswordPage
/map                       → PublicMapPage (guest bisa lihat)

/* USER ROUTES (Protected — butuh auth, role: user) */
/dashboard                 → DashboardPage
/laporan/baru              → CreateReportPage
/laporan                   → MyReportsPage
/laporan/:id               → ReportDetailPage
/peta                      → MapPage
/notifikasi                → NotificationsPage
/profil                    → ProfilePage

/* ADMIN ROUTES (Protected — butuh auth, role: admin|super_admin) */
/admin/login               → AdminLoginPage
/admin/dashboard           → AdminDashboardPage
/admin/laporan             → AdminReportsPage
/admin/laporan/:id         → AdminReportDetailPage
/admin/peta                → AdminMapPage
/admin/pengguna            → AdminUsersPage (super_admin only)
/admin/settings            → AdminSettingsPage
```

---

## 4. State Management — Zustand

```javascript
// stores/authStore.js
const useAuthStore = create((set) => ({
  user: null,           // {id, name, email, role, avatar}
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,

  setAuth: (user, token) => set({
    user, accessToken: token, isAuthenticated: true
  }),
  clearAuth: () => set({
    user: null, accessToken: null, isAuthenticated: false
  }),
  updateUser: (updates) => set((state) => ({
    user: { ...state.user, ...updates }
  })),
}));

// stores/notificationStore.js
const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (data) => set({
    notifications: data,
    unreadCount: data.filter(n => !n.is_read).length
  }),
  markRead: (id) => set((state) => ({
    notifications: state.notifications.map(n =>
      n.id === id ? { ...n, is_read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),
}));

// stores/mapStore.js
const useMapStore = create((set) => ({
  filters: {
    category: 'all',
    damageLevel: 'all',
    status: 'active',
    district: 'all',
  },
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),
  resetFilters: () => set({ filters: { category: 'all', damageLevel: 'all', status: 'active', district: 'all' } }),
}));
```

---

## 5. Axios Instance & JWT Interceptor

```javascript
// services/api.js
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request Interceptor — Inject JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor — Auto Refresh Token
let isRefreshing = false;
let failedQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = data;
        useAuthStore.getState().setAuth(
          useAuthStore.getState().user,
          accessToken
        );
        localStorage.setItem('accessToken', accessToken);

        failedQueue.forEach((prom) => prom.resolve(accessToken));
        failedQueue = [];

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach((prom) => prom.reject(refreshError));
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 6. Protected Route

```javascript
// components/layout/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// Penggunaan di App.jsx:
// <Route element={<ProtectedRoute allowedRoles={['user']} />}>
//   <Route path="/dashboard" element={<DashboardPage />} />
// </Route>
//
// <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
//   <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
// </Route>
```

---

## 7. Komponen Kritis

### 7.1 Create Report — Multi-Step Form

```javascript
// pages/user/CreateReportPage.jsx
// Step 1: Lokasi (GPS + Peta)
// Step 2: Detail (kategori + tingkat + deskripsi)
// Step 3: Upload Foto (dropzone)
// Step 4: Review & Submit

const STEPS = [
  { id: 1, label: 'Lokasi', icon: MapPin },
  { id: 2, label: 'Detail', icon: FileText },
  { id: 3, label: 'Foto', icon: Camera },
  { id: 4, label: 'Review', icon: CheckCircle },
];

// State disimpan per step, hanya submit di step terakhir
// Foto diupload sebagai FormData multipart
```

### 7.2 Peta Interaktif

```javascript
// components/map/MapView.jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Custom marker icon berdasarkan tingkat kerusakan
const getMarkerIcon = (damageLevel, status) => {
  if (status === 'RESOLVED') return grayIcon;
  const colors = { RINGAN: 'green', SEDANG: 'yellow', BERAT: 'red' };
  return createCustomIcon(colors[damageLevel]);
};

// TileLayer menggunakan OpenStreetMap (gratis)
<TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution='© OpenStreetMap contributors'
/>
```

### 7.3 Notifikasi Polling

```javascript
// hooks/useNotifications.js
// Poll setiap 30 detik selama user login
useEffect(() => {
  if (!isAuthenticated) return;

  const fetchNotifications = async () => {
    const data = await notificationService.getUnread();
    setNotifications(data);
  };

  fetchNotifications(); // Initial fetch
  const interval = setInterval(fetchNotifications, 30000);

  return () => clearInterval(interval);
}, [isAuthenticated]);
```

---

## 8. Environment Variables

```env
# frontend/.env.example
VITE_API_URL=http://localhost:5000/api
VITE_MINIO_PUBLIC_URL=http://localhost:9000
VITE_MAP_DEFAULT_LAT=-8.1654
VITE_MAP_DEFAULT_LNG=112.6208
VITE_MAP_DEFAULT_ZOOM=11
```

---

## 9. Konstanta Aplikasi

```javascript
// utils/constants.js

export const DAMAGE_LEVELS = {
  RINGAN: { label: 'Ringan', color: 'green', mapColor: '#22c55e' },
  SEDANG: { label: 'Sedang', color: 'yellow', mapColor: '#eab308' },
  BERAT:  { label: 'Berat',  color: 'red',   mapColor: '#ef4444' },
};

export const REPORT_STATUS = {
  PENDING:     { label: 'Menunggu',  color: 'gray'   },
  IN_PROGRESS: { label: 'Diproses',  color: 'blue'   },
  RESOLVED:    { label: 'Selesai',   color: 'green'  },
  REJECTED:    { label: 'Ditolak',   color: 'red'    },
};

export const FACILITY_CATEGORIES = [
  { value: 'JALAN',              label: 'Jalan' },
  { value: 'JEMBATAN',           label: 'Jembatan' },
  { value: 'DRAINASE',           label: 'Drainase' },
  { value: 'LAMPU_JALAN',        label: 'Lampu Jalan' },
  { value: 'TAMAN',              label: 'Taman' },
  { value: 'FASILITAS_OLAHRAGA', label: 'Fasilitas Olahraga' },
  { value: 'LAINNYA',            label: 'Lainnya' },
];

export const KECAMATAN_MALANG = [
  'Kepanjen', 'Malang Tengah', 'Singosari', 'Lawang',
  'Tumpang', 'Pakis', 'Dau', 'Karangploso', /* ... 33 kecamatan */
];
```

---

## 10. Dockerfile — Frontend

```dockerfile
# frontend/Dockerfile

# === Stage 1: Build ===
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# === Stage 2: Serve dengan Nginx ===
FROM nginx:alpine

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config untuk SPA (handle client-side routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback — semua route ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```
