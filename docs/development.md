# Development Guide — HIMATIF IT Competition

Panduan lengkap untuk menyiapkan lingkungan pengembangan lokal, menjalankan backend Laravel, frontend React, dan menjalankan pengujian otomatis.

---

## 1. Prerequisites

Pastikan perangkat lokal Anda telah terinstal:

* **PHP:** >= 8.3 (Aplikasi ini berjalan optimal pada PHP 8.5)
* **Composer:** >= 2.x
* **Node.js:** >= 18.x (Direkomendasikan Node.js 20+)
* **NPM:** >= 9.x
* **Database Engine:** MySQL 8.x / MariaDB (via Laragon, XAMPP, atau standalone)

---

## 2. Project Structure Overview

```text
himatif-it-competition/
├── backend/                  # Laravel REST API Application
│   ├── app/
│   │   ├── Enums/            # Backed Enums (UserRole, RegistrationStatus, dll)
│   │   ├── Http/
│   │   │   ├── Controllers/Api/ (Auth, Public, Participant, Admin, Judge)
│   │   │   ├── Requests/     # Form Request validations
│   │   │   └── Resources/    # Eloquent API Resources
│   │   ├── Models/           # Eloquent Models & Relationships
│   │   ├── Policies/         # Authorization policies
│   │   └── Services/         # Complex domain logic
│   ├── database/             # Migrations & Seeders
│   └── routes/api.php        # API versioned routes (/api/v1/...)
│
├── frontend/                 # React SPA + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # UI atoms, common layouts, competition cards
│   │   ├── contexts/         # AuthContext (Sanctum token & session)
│   │   ├── layouts/          # PublicLayout, ParticipantLayout, AdminLayout, JudgeLayout
│   │   ├── pages/            # Public, Auth, Participant, Admin, Judge pages
│   │   ├── routes/           # React Router route tree
│   │   └── services/         # Axios API service client
│   └── vite.config.js
│
├── docs/                     # Dokumentasi arsitektur, database, API, dan development
├── .gitignore
├── README.md
└── .env.example
```

---

## 3. Environment & Database Setup

### A. Konfigurasi Backend

Masuk ke folder `backend`:
```bash
cd backend
cp .env.example .env
```

Pastikan variabel database di `backend/.env` sesuai dengan MySQL lokal Anda:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=himatif_it_competition
DB_USERNAME=root
DB_PASSWORD=
```

Buat database MySQL secara manual jika belum ada:
```sql
CREATE DATABASE himatif_it_competition CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Jalankan generate application key:
```bash
php artisan key:generate
```

### B. Konfigurasi Frontend

Masuk ke folder `frontend`:
```bash
cd ../frontend
cp .env.example .env
```

Pastikan URL API mengarah ke backend lokal:
```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

---

## 4. Migrations & Database Seeding

Jalankan migrasi seluruh tabel (16 migrasi) dan seed data dasar:

```bash
cd backend
php artisan migrate:fresh --seed
```

### Akun Development Bawaan

| Role | Email | Password | Kegunaan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password123` | Pengelolaan lomba, verifikasi pendaftaran & pembayaran |
| **Judge** | `judge@example.com` | `password123` | Portal penilaian karya & pemberian skor |
| **Participant** | `participant@example.com` | `password123` | Portal pendaftaran lomba & pengumpulan karya |

> [!WARNING]
> Kredensial di atas khusus digunakan untuk lingkungan development dan testing lokal. Jangan gunakan kredensial ini di production.

---

## 5. Menjalankan Aplikasi

### Menjalankan Backend (Laravel API)
Buka terminal pertama di direktori `backend`:
```bash
cd backend
php artisan serve
```
Backend API akan aktif di: `http://127.0.0.1:8000`

### Menjalankan Frontend (React Vite)
Buka terminal kedua di direktori `frontend`:
```bash
cd frontend
npm run dev
```
Frontend aplikasi web akan aktif di: `http://127.0.0.1:5173`

---

## 6. Testing & Verifikasi Kualitas

### Menjalankan Test Backend (PHPUnit)
```bash
cd backend
php artisan test
```
*Seluruh unit test dan feature test (autentikasi, otorisasi peran, validasi, dan API kompetisi) akan dieksekusi menggunakan in-memory SQLite database.*

### Membangun Production Bundle Frontend
```bash
cd frontend
npm run build
```
*Memastikan seluruh kode React dan Tailwind CSS terkompilasi bersih tanpa kesalahan sintaks atau dependensi.*
