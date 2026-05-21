# 📋 Product Requirements Document (PRD)
## LAPOR MALANG — Sistem Pelaporan Kerusakan Fasilitas Publik
**Versi:** 1.0.0  
**Tanggal:** Mei 2026  
**Author:** Engineering Team  
**Status:** Draft

---

## 1. Executive Summary

**LAPOR MALANG** adalah platform digital berbasis web yang menghubungkan warga Kabupaten Malang dengan pemerintah daerah untuk pelaporan, verifikasi, dan pemantauan perbaikan fasilitas publik secara transparan dan real-time.

Platform ini terdiri dari:
- **Web App User** — Antarmuka bagi warga untuk melapor dan memantau
- **Web App Admin** — Dashboard bagi dinas/pemerintah untuk mengelola laporan
- **REST API** — Backend Express.js sebagai penghubung semua sistem

---

## 2. Problem Statement

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | Tidak ada kanal terpusat untuk laporan kerusakan fasilitas publik | Laporan hilang, tidak tertindaklanjuti |
| 2 | Pemerintah tidak punya peta kondisi fasilitas yang aktual | Prioritas perbaikan tidak objektif |
| 3 | Tidak ada feedback loop ke pelapor setelah perbaikan | Kepercayaan publik rendah |
| 4 | Data historis kerusakan tidak tercatat terstruktur | Sulit perencanaan anggaran pemeliharaan |
| 5 | Proses pelaporan konvensional (datang langsung ke dinas) tidak efisien | Banyak warga tidak melapor |

---

## 3. Goals & Success Metrics

### 3.1 Business Goals
- Meningkatkan partisipasi warga dalam pemeliharaan fasilitas publik
- Meningkatkan akuntabilitas dan transparansi pemerintah daerah
- Mempersingkat waktu respons penanganan kerusakan fasilitas

### 3.2 Success Metrics (KPI — 6 Bulan Pertama)

| Metric | Target |
|--------|--------|
| User terdaftar | ≥ 5.000 akun |
| Laporan masuk per bulan | ≥ 500 laporan |
| Rata-rata waktu verifikasi admin | < 24 jam |
| Laporan selesai dalam 30 hari | ≥ 70% |
| Rating kepuasan user | ≥ 4.2 / 5.0 |
| Uptime sistem | ≥ 99.5% |

---

## 4. User Personas

### Persona 1 — Budi (Warga Pelapor)
- Pria, 34 tahun, warga Kecamatan Kepanjen
- Menemukan jalan berlubang di depan rumahnya
- Ingin melapor cepat dari smartphone
- Ingin tahu status dan kapan diperbaiki
- Frustrasi jika laporan tidak ada kabar

### Persona 2 — Ibu Sari (Admin Dinas)
- Perempuan, 42 tahun, staf Dinas PUPR
- Memverifikasi laporan masuk setiap hari kerja
- Butuh dashboard yang jelas dan efisien
- Mendelegasikan perbaikan ke tim lapangan
- Wajib mengunggah foto bukti setelah perbaikan selesai

### Persona 3 — Pak Rudi (Kepala Dinas)
- Pria, 52 tahun, Kepala Dinas PUPR
- Memantau kinerja tim dan rekapitulasi laporan
- Butuh visualisasi data dan sebaran kerusakan per kecamatan

---

## 5. Features & Scope

### 5.1 In Scope — v1.0

#### Modul User (Warga)
- Registrasi akun (NIK + nomor HP + email)
- Login / Logout / Lupa Password
- Buat laporan kerusakan (foto + GPS + kategori + tingkat kerusakan)
- Riwayat dan detail laporan sendiri
- Pantau status laporan real-time
- Notifikasi in-app (status berubah, laporan selesai + foto bukti)
- Peta interaktif seluruh laporan Kabupaten Malang
- Filter peta (kategori, tingkat kerusakan, status)
- Rating kepuasan setelah laporan selesai

#### Modul Admin (Dinas/Pemerintah)
- Login / Logout admin
- Dashboard ringkasan (total laporan, per kategori, per kecamatan)
- Daftar semua laporan masuk dengan filter dan search
- Detail laporan + foto pelapor
- Verifikasi laporan (ubah status: Diproses / Ditolak)
- Upload foto bukti perbaikan (WAJIB sebelum status Selesai)
- Peta sebaran laporan aktif
- Export laporan ke CSV/PDF
- Manajemen akun admin (super admin)

### 5.2 Out of Scope — v1.0

| Fitur | Alasan | Target |
|-------|--------|--------|
| Native Mobile App (iOS/Android) | Scope terlalu besar untuk v1 | v2.0 |
| Integrasi SIPEKAT / SiMAYA | Butuh MoU pemerintah | v2.0 |
| AI auto-klasifikasi dari foto | Butuh dataset training | v2.0 |
| Multi-bahasa | Tidak ada kebutuhan mendesak | v2.0 |
| Offline mode | Kompleksitas tinggi | v2.0 |

---

## 6. Non-Functional Requirements

| Kategori | Requirement |
|----------|-------------|
| **Performance** | API response time < 500ms untuk 95% request |
| **Performance** | Halaman load < 3 detik pada koneksi 4G |
| **Security** | Autentikasi JWT, refresh token, HTTPS wajib |
| **Security** | Upload foto hanya tipe JPG/PNG/WEBP, max 5MB |
| **Security** | Rate limiting API: 100 request/menit per IP |
| **Scalability** | Sistem mampu menangani 1.000 concurrent users |
| **Availability** | Uptime ≥ 99.5% (downtime max ~3.6 jam/bulan) |
| **Data** | Backup database harian otomatis |
| **Privacy** | NIK dan data pribadi dienkripsi di database |
| **Compliance** | Sesuai UU No. 27 Tahun 2022 tentang PDP |

---

## 7. Tech Stack

| Layer | Teknologi | Alasan Pemilihan |
|-------|-----------|-----------------|
| **Frontend** | React 18 + Vite | SPA modern, ecosystem luas, fast HMR |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid development, konsisten |
| **State Management** | Zustand | Lightweight, sederhana untuk skala ini |
| **Maps** | Leaflet.js + OpenStreetMap | Open-source, tidak berbayar, cukup untuk kebutuhan |
| **HTTP Client** | Axios | Interceptor JWT, error handling mudah |
| **Backend** | Node.js + Express.js | Tim familiar, async I/O, ecosystem NPM luas |
| **Database** | **PostgreSQL 15** | Lihat keputusan di bawah |
| **ORM** | Prisma | Type-safe, migration management, schema jelas |
| **Auth** | JWT + bcrypt | Stateless, scalable |
| **File Storage** | MinIO (self-hosted S3) | Gratis, bisa lokal/cloud |
| **Containerization** | Docker + Docker Compose | Konsistensi environment dev-prod |
| **Reverse Proxy** | Nginx | Static serve + API proxy |

### Keputusan Database: PostgreSQL vs MySQL

**Pilihan: PostgreSQL ✅**

| Kriteria | PostgreSQL | MySQL |
|----------|-----------|-------|
| Tipe data geospasial (PostGIS) | ✅ Native, sangat baik | ⚠️ Terbatas |
| JSONB untuk metadata fleksibel | ✅ Native, bisa diquery | ⚠️ JSON ada tapi lambat |
| Full-text search | ✅ Built-in, powerful | ⚠️ Terbatas |
| Transaksional integrity (ACID) | ✅ Sangat ketat | ✅ Baik |
| Concurrent writes | ✅ MVCC superior | ⚠️ Locking lebih sering |
| Open source & komunitas | ✅ | ✅ |

**Alasan utama memilih PostgreSQL:** Aplikasi ini menggunakan data geospasial (koordinat GPS, peta), JSONB untuk metadata laporan fleksibel, dan kemungkinan scale ke PostGIS di v2.0 untuk query spasial lanjutan.

---

## 8. Constraints & Assumptions

### Constraints
- Budget hosting awal terbatas — deploy di single VPS (min. 4 vCPU, 8GB RAM)
- Timeline MVP: 3 bulan dari kickoff
- Tim: 2 frontend dev, 2 backend dev, 1 DevOps, 1 UI/UX

### Assumptions
- Warga memiliki smartphone dengan kamera dan GPS
- Admin dinas memiliki akses komputer/laptop dan internet stabil
- Koneksi internet warga minimal 4G
- Pemerintah Kabupaten Malang menyediakan data kecamatan dan kategori fasilitas

---

## 9. Release Plan

| Phase | Milestone | Durasi |
|-------|-----------|--------|
| **Phase 0** | Setup infrastruktur, repo, CI/CD | 1 minggu |
| **Phase 1** | Auth system (user + admin), DB schema | 2 minggu |
| **Phase 2** | Modul pelaporan (buat, foto, GPS) | 3 minggu |
| **Phase 3** | Dashboard admin, verifikasi, foto bukti | 3 minggu |
| **Phase 4** | Peta interaktif, notifikasi, filter | 2 minggu |
| **Phase 5** | Testing, bug fix, UAT bersama dinas | 2 minggu |
| **Phase 6** | Soft launch, monitoring, iterasi | Ongoing |

**Total MVP: ~13 minggu (~3 bulan)**
