# HIMATIF IT Competition — Platform Multi-Event Ciayumajakuning

Platform resmi website **HIMATIF IT Competition** yang dirancang khusus untuk penyelenggaraan ajang kompetisi teknologi dan kreativitas tahunan se-wilayah Ciayumajakuning (Cirebon, Indramayu, Majalengka, Kuningan) bagi Mahasiswa dan Siswa SMA/SMK/Sederajat.

Aplikasi ini mengadopsi arsitektur terpisah (*decoupled architecture*) dengan backend **Laravel REST API** dan frontend **React SPA** dengan **Tailwind CSS**.

---

## 🏆 Cabang Kompetisi

### 1. Kategori Mahasiswa
* **UI/UX Competition:** Perancangan antarmuka dan pengalaman pengguna inovatif berbasis studi kasus nyata.
* **Web Development Competition:** Pengembangan aplikasi web modern, fungsional, dan responsif.

### 2. Kategori Siswa SMA/SMK/Sederajat
* **LKTI (Lomba Karya Tulis Ilmiah):** Penulisan gagasan dan karya ilmiah berbasis sains dan teknologi.
* **Poster Competition:** Pembuatan karya visual poster edukatif dan persuasif.

---

## 🛠 Tech Stack

* **Backend:** Laravel 13 (PHP 8.5)
* **API Authentication:** Laravel Sanctum (Bearer Token)
* **Database:** MySQL 8.x
* **Frontend:** React 18, React Router v6
* **Styling:** Tailwind CSS (Palet HIMATIF: `#F97316` Orange, `#111827` Dark)
* **Build Tool:** Vite 6
* **HTTP Client:** Axios (Centralized Interceptors)

---

## 📂 Project Structure

```text
himatif-it-competition/
│
├── backend/                  # Laravel 13 REST API Application
│   ├── app/
│   │   ├── Enums/            # Backed Enums (UserRole, RegistrationStatus, PaymentStatus, etc.)
│   │   ├── Http/
│   │   │   ├── Controllers/Api/ (Auth, Public, Participant, Admin, Judge)
│   │   │   ├── Requests/     # Form Request Validation
│   │   │   └── Resources/    # Eloquent API Resources
│   │   ├── Models/           # 13 Eloquent Models
│   │   ├── Policies/         # Authorization Policies (Competition, Team, Registration, etc.)
│   │   └── Services/         # Business Logic Layer (AuthService, RegistrationService, etc.)
│   ├── database/             # Migrations & Seeders
│   └── routes/api.php        # API versioning endpoints (/api/v1/...)
│
├── frontend/                 # React SPA Application (Vite)
│   ├── src/
│   │   ├── components/       # Atomic UI, Common Layouts, Competition Cards
│   │   ├── contexts/         # AuthContext (Sanctum state & token sync)
│   │   ├── layouts/          # PublicLayout, ParticipantLayout, AdminLayout, JudgeLayout
│   │   ├── pages/            # Public, Auth, Participant, Admin, Judge pages
│   │   ├── routes/           # React Router declarative routes with ProtectedRoute
│   │   └── services/         # Axios API services
│   └── vite.config.js
│
├── docs/                     # Technical Documentation
│   ├── architecture.md       # Sistem arsitektur, auth, dan otorisasi
│   ├── database.md           # ERD relasi tabel dan status lifecycle
│   ├── api.md                # Katalog endpoint REST API & payload
│   └── development.md        # Panduan instalasi dan deployment
│
├── .gitignore
├── README.md
└── .env.example
```

---

## 🚀 Persyaratan Sistem (Requirements)

* **PHP:** >= 8.3 (PHP 8.5 disarankan)
* **Composer:** >= 2.0
* **Node.js:** >= 18.0 (Node 20+ disarankan)
* **MySQL:** >= 8.0 (atau MariaDB 10.4+)

---

## ⚡ Instalasi Cepat (Quick Start)

### 1. Setup Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
```

Pastikan kredensial database di `backend/.env` telah terkonfigurasi:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=himatif_it_competition
DB_USERNAME=root
DB_PASSWORD=
```

Jalankan migrasi database dan database seeder:
```bash
php artisan migrate:fresh --seed
```

Jalankan server API backend:
```bash
php artisan serve
```
*Backend API aktif di `http://127.0.0.1:8000`.*

---

### 2. Setup Frontend

Buka terminal baru di folder `frontend`:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
*Frontend aktif di `http://127.0.0.1:5173`.*

---

## 🧪 Testing & Verifikasi

### Menjalankan Backend Test Suite (PHPUnit)
```bash
cd backend
php artisan test
```
*Menguji endpoint autentikasi, otorisasi peran via Sanctum token, dan API publik.*

### Membangun Production Bundle Frontend
```bash
cd frontend
npm run build
```

---

## 🔑 Kredensial Testing Bawaan

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password123` |
| **Judge** | `judge@example.com` | `password123` |
| **Participant** | `participant@example.com` | `password123` |

---

## 📚 Dokumentasi Terperinci

* [Arsitektur Sistem & Otorisasi](docs/architecture.md)
* [Spesifikasi Skema Database & Relasi](docs/database.md)
* [Dokumentasi Lengkap REST API](docs/api.md)
* [Panduan Development & Setup Lokal](docs/development.md)

---

## 📄 Lisensi

Platform ini dikembangkan untuk Himpunan Mahasiswa Teknik Informatika (HIMATIF) dan dilisensikan di bawah [MIT License](LICENSE).
