# Architecture Document — IT Competition Management Platform

| Metadata | Value |
|---|---|
| Product | IT Competition Management Platform |
| Architecture Version | 1.0.0 |
| Baseline | `PRD.md`, `AGENTS.md` |
| Backend | Laravel 13.x (PHP 8.3+) |
| Frontend | React 18/19 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Database | MySQL 8.0+ |
| Authentication | Laravel Sanctum (SPA Cookie/Session Authentication) |
| API | REST JSON under `/api/v1` |

---

## 1. Executive Summary & Purpose

Dokumen ini mendefinisikan batas-batas arsitektur teknis, pola desain, konvensi kode, serta model integrasi antara frontend SPA (React + TypeScript + Tailwind) dan backend API (Laravel + MySQL) untuk platform manajemen kompetisi IT. Dokumen ini merupakan pelengkap teknis dari `PRD.md` dan mematuhi seluruh aturan rekayasa dalam `AGENTS.md`.

Sistem melayani tiga area antarmuka utama:
1. **Public Website**: Menampilkan informasi umum, daftar kompetisi, timeline/jadwal, pengumuman publik, dan FAQ. Dapat diakses publik tanpa autentikasi.
2. **Participant Portal**: Portal mandiri untuk peserta kompetisi mengelola profil, tim, proses pendaftaran multi-tahap, unggah dokumen persyaratan, submisi karya, serta memantau status verifikasi dan revisi.
3. **Admin Portal**: Panel operasional panitia untuk memverifikasi pendaftaran, dokumen, submisi karya, manajemen kompetisi/acara, CMS pengumuman/jadwal/FAQ, laporan data, dan log audit operasional.

---

## 2. Diagram Konteks Sistem (System Context)

```text
+---------------------------------------------------------------------------------------+
|                                     WEB CLIENT                                        |
|                                                                                       |
|  +------------------------+  +--------------------------+  +-----------------------+  |
|  |     Public Website     |  |    Participant Portal    |  |     Admin Portal      |  |
|  | (Katalog, Jadwal, FAQ) |  | (Profil, Tim, Dokumen)   |  | (Verifikasi, CMS, Log)|  |
|  +------------------------+  +--------------------------+  +-----------------------+  |
|               \                            |                            /             |
|                \                           |                           /              |
|                 +--------------------------+--------------------------+               |
|                                            |                                          |
|                          React + TypeScript + Tailwind CSS                            |
|                          Axios Client (withCredentials: true)                         |
+--------------------------------------------+------------------------------------------+
                                             |
                                  HTTPS / JSON REST API
                          Cookies: laravel_session, XSRF-TOKEN
                                             |
+--------------------------------------------v------------------------------------------+
|                                   LARAVEL BACKEND                                     |
|                                                                                       |
|   /sanctum/csrf-cookie ------------------> CSRF Handshake Initializer                 |
|   /api/v1/auth/*       ------------------> Authentication & Password Lifecycle        |
|   /api/v1/public/*     ------------------> Public Data Endpoints                      |
|   /api/v1/participant/*------------------> Participant Protected API (Policy Checked)|
|   /api/v1/admin/*      ------------------> Admin Protected API (Admin Role Checked)   |
|   /api/v1/documents/*  ------------------> Secure Authorized Document Streaming       |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   | Controller -> Form Request -> Middleware -> Policy -> Service -> API Resource |   |
|   +-------------------------------------------------------------------------------+   |
+----------------------+------------------------------------+---------------------------+
                       |                                    |
          Database Queries (PDO)                Private / Public File Storage
                       |                                    |
                       v                                    v
            +--------------------+              +-----------------------+
            |    MySQL 8.0+      |              | Local Private Storage |
            |  (InnoDb, UTF8mb4) |              | (storage/app/private) |
            |   Transactions     |              | - Dokumen Peserta     |
            |   Foreign Keys     |              | - File Submisi Karya  |
            |   Unique Indexes   |              | - Bukti Pembayaran    |
            +--------------------+              +-----------------------+
```

---

## 3. Prinsip Arsitektur Utama

1. **Separation of Concerns (Pemisahan Tanggung Jawab)**:
   - Frontend React bertanggung jawab penuh atas *user experience*, navigasi SPA, interaksi form, *client validation*, serta *loading/empty/error states*.
   - Backend Laravel bertanggung jawab penuh atas validasi otoritatif (*Form Requests*), aturan bisnis (*Services*), proteksi otorisasi (*Policies & Middleware*), serta integritas data (*Database Transactions & Constraints*).
   - Frontend tidak boleh melakukan kalkulasi aturan kelayakan (eligibility), tenggat waktu (deadline), atau penetapan status secara sepihak.

2. **Backend is Authoritative (Backend adalah Sumber Kebenaran)**:
   - Semua input klien tidak boleh dipercaya secara langsung.
   - Hak akses pengguna, peran (`role`), status pendaftaran, batas anggota tim, dan relasi kepemilikan selalu divalidasi di backend.
   - Frontend Route Guards hanya untuk navigasi UX; proteksi mutlak berada di *backend routes* dan *policies*.

3. **Explicit API Contracts (Kontrak API Eksplisit)**:
   - Seluruh payload request dan response memiliki tipe data yang jelas di TypeScript (`types/api.ts`) dan diserialisasi di Laravel menggunakan *API Resources*.
   - Standar envelope respons JSON seragam untuk sukses maupun error.

4. **Security by Default (Aman Secara Baku)**:
   - Autentikasi berbasis session cookie aman melalui Laravel Sanctum SPA.
   - Token sensitif dan sesi tidak disimpan di `localStorage` atau `sessionStorage` untuk menghindari serangan XSS.
   - Dokumen pribadi peserta (KTM, Kartu Pelajar, berkas submisi) disimpan di direktori privat (`storage/app/private`), tidak pernah diekspos melalui symlink publik, dan diakses hanya lewat endpoint unduhan berotorisasi.

5. **Pragmatic & Modular (Hindari Kompleksitas Dini)**:
   - Tidak menggunakan *message queue* terdistribusi, *microservices*, atau *event bus* eksternal sebelum terdapat kebutuhan skalabilitas riil.
   - Alur bisnis multi-tabel dibungkus dalam *Database Transactions* (`DB::transaction`) di *Service Layer*.

---

## 4. Struktur Folder Repositori (Monorepo Layout)

Struktur folder monorepo memisahkan kode sumber backend dan frontend secara bersih:

```text
it-comp/
├── AGENTS.md                  # Aturan rekayasa mandatori agen AI
├── PRD.md                     # Sumber kebenaran kebutuhan produk (PRD)
├── ARCHITECTURE.md            # Batasan dan keputusan arsitektur (dokumen ini)
├── DATABASE.md                # Skema data relasional dan integritas data
├── API.md                     # Kontrak endpoint REST JSON v1
├── DEVELOPMENT.md             # Panduan fase pengembangan dan verifikasi
├── OPEN_QUESTIONS.md          # Log keputusan produk yang belum selesai
├── CHANGELOG.md               # Log perubahan proyek
│
├── backend/                   # Laravel REST API Application
│   ├── app/
│   │   ├── Enums/             # PHP Enums: Role, RegistrationStatus, SubmissionStatus, dll.
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   └── Api/
│   │   │   │       ├── Auth/          # Login, Register, Logout, Password Reset
│   │   │   │       ├── Public/        # Event, Competition, Schedule, FAQ, Announcement
│   │   │   │       ├── Participant/   # Profile, Team, Registration, Submission, Notification
│   │   │   │       └── Admin/         # Event, Competition, Verification, CMS, Report, Log
│   │   │   ├── Middleware/            # EnsureRole, EnsureRegistrationOwner, dll.
│   │   │   ├── Requests/              # Form Requests untuk validasi input
│   │   │   │   ├── Auth/
│   │   │   │   ├── Participant/
│   │   │   │   └── Admin/
│   │   │   └── Resources/             # JsonResource untuk serialisasi output
│   │   │       ├── Public/
│   │   │       ├── Participant/
│   │   │       └── Admin/
│   │   ├── Models/                    # Eloquent Models (User, Competition, Team, Registration, dll.)
│   │   ├── Policies/                  # Otorisasi kepemilikan (RegistrationPolicy, TeamPolicy, dll.)
│   │   ├── Services/                  # Multi-step workflows (RegistrationService, SubmissionService)
│   │   └── Notifications/             # Notifikasi internal / email
│   ├── bootstrap/
│   │   └── app.php                    # Konfigurasi routing API v1, middleware, exceptions
│   ├── config/                        # cors.php, sanctum.php, database.php, filesystems.php
│   ├── database/
│   │   ├── factories/                 # Model factories untuk testing
│   │   ├── migrations/                # Database migrations
│   │   └── seeders/                   # Initial seeders (Admin seeder, Demo categories)
│   ├── routes/
│   │   ├── api.php                    # Routes terdaftar di bawah /api/v1
│   │   ├── console.php
│   │   └── web.php
│   ├── storage/
│   │   └── app/
│   │       ├── private/               # Dokumen pendaftaran & berkas submisi karya
│   │       └── public/                # Gambar sampul kompetisi & avatar publik
│   └── tests/
│       ├── Feature/                   # Feature tests untuk setiap endpoint API
│       └── Unit/                      # Unit tests untuk Services dan Enums
│
└── frontend/                  # React + TypeScript + Vite SPA
    ├── public/                # Static assets (favicon, branding dasar)
    └── src/
        ├── app/
        │   ├── layouts/       # PublicLayout, ParticipantLayout, AdminLayout, AuthLayout
        │   ├── providers/     # AuthProvider, ToastProvider, Query/State Provider
        │   └── router/        # React Router configuration & Protected Route Guards
        ├── assets/            # SVGs, gambar lokal, font
        ├── components/
        │   ├── ui/            # Reusable primitives: Button, Input, Modal, Badge, Card, dll.
        │   ├── forms/         # Form field wrappers, FileUploader, SelectField
        │   ├── feedback/      # Toast, Alert, LoadingSkeleton, EmptyState, ErrorState
        │   └── navigation/    # PublicNavbar, ParticipantSidebar, AdminSidebar, Breadcrumbs
        ├── features/          # Feature-based domain modules
        │   ├── auth/          # Login, Register, ForgotPassword pages & forms
        │   ├── public/        # Home, CompetitionCatalog, Detail, Schedule, Announcements, FAQ
        │   ├── participant/   # Dashboard, Profile, Teams, RegistrationWizard, Submissions
        │   └── admin/         # Dashboard, Competitions, Verifications, CMS, Reports, Logs
        ├── hooks/             # Custom hooks (useAuth, useDebounce, usePagination)
        ├── lib/
        │   ├── axios.ts       # Central Axios instance (CSRF header, baseURL, interceptors)
        │   └── utils.ts       # Formatting helper (tanggal Jakarta, format mata uang)
        ├── services/          # API service calls terpusat (authService, competitionService, dll.)
        ├── styles/            # Tailwind CSS globals & typography
        └── types/             # TypeScript interfaces (models, API responses, form schemas)
```

---

## 5. Tanggung Jawab Komponen Backend

1. **Controllers**:
   - Berada di bawah namespace `App\Http\Controllers\Api\{Auth,Public,Participant,Admin}`.
   - Menjaga controller tetap ramping (*thin controllers*).
   - Menyerahkan validasi ke *Form Request*, otorisasi ke *Policy*, alur transaksi ke *Service*, dan serialisasi data ke *API Resource*.
   - Tidak menulis query Eloquent mentah panjang atau logika transaksi langsung di dalam controller.

2. **Form Requests**:
   - Memastikan seluruh masukan memiliki batasan ketat (*type, max length, regex, mime types, file size*).
   - Mencegah manipulasi field sensitif (seperti `role`, `status`, `verified_by`, `price`, `user_id`).
   - Menyediakan pesan error validasi dalam Bahasa Indonesia yang ramah dan jelas.

3. **Services**:
   - Menangani alur bisnis multi-tabel dan multi-tahap, antara lain:
     - `RegistrationService`: Validasi kelayakan peserta/tim, generate nomor registrasi unik (`ITC-YYYY-XXXXX`), penyimpanan dokumen, pencatatan status pendaftaran dalam `DB::transaction`.
     - `TeamService`: Pembuatan tim, verifikasi batas kapasitas anggota, validasi apakah tim sedang dalam status pendaftaran aktif.
     - `SubmissionService`: Verifikasi tenggat waktu kompetisi, pencatatan revisi submisi karya baru, pengarsipan versi lama.
     - `ActivityLogService`: Pencatatan log aktivitas admin secara *append-only*.

4. **Policies**:
   - Menjamin bahwa peserta hanya dapat melihat, mengedit, atau mengunggah data pada tim, registrasi, atau submisi miliknya sendiri.
   - Menjamin bahwa hanya akun dengan peran `admin` yang dapat mengakses fitur manajemen dan verifikasi.

5. **API Resources**:
   - Menghindari pengembalian model Eloquent secara mentah.
   - Memfilter kolom privat (seperti `password`, `remember_token`, path penyimpanan internal absolut).

---

## 6. Tanggung Jawab Komponen Frontend

1. **Routing & Guards**:
   - `PublicRoute`: Dapat diakses tanpa login.
   - `ProtectedRoute`: Memeriksa apakah user sudah terautentikasi melalui `AuthProvider`.
   - `RoleRoute`: Memeriksa apakah `user.role === 'admin'` untuk rute `/admin/*` atau `user.role === 'participant'` untuk rute `/participant/*`.
   - Menjaga rute tetap responsif dengan *fallback loading skeleton*.

2. **State Management & Data Fetching**:
   - Autentikasi dan data user aktif dikelola oleh `AuthContext` / `useAuth`.
   - Service layer terpusat pada `src/services/` (menggunakan Axios) sehingga panggilan HTTP tidak tercecer di komponen visual.
   - Mengelola state form secara bersih menggunakan `react-hook-form` dipadukan dengan skema validasi `zod`.

3. **UI/UX & Desain**:
   - Mengikuti *Design System* resmi PRD:
     - Primary Accent: Orange `#F47B20` (Hover: `#D96512`, Soft: `#FFF1E6`).
     - Secondary Accent: Blue `#1769AA` (Hover: `#104C80`, Soft: `#EAF4FC`).
     - Background: `#F8FAFC`, Surface: `#FFFFFF`, Text Primary: `#0F172A`.
   - Memastikan tersedianya 4 status antarmuka: **Loading**, **Empty**, **Error**, dan **Success**.

---

## 7. Model Autentikasi & Sesi (Laravel Sanctum SPA)

Sistem menggunakan autentikasi *First-Party SPA Cookie/Session* resmi dari Laravel Sanctum:

```text
Browser / React SPA                                Laravel Sanctum API
        |                                                   |
   1.   | GET /sanctum/csrf-cookie                          |
        |-------------------------------------------------->| (Set-Cookie: XSRF-TOKEN)
        |                                                   |
   2.   | POST /api/v1/auth/login                           |
        | Header: X-XSRF-TOKEN                              |
        | Body: { email, password }                         |
        |-------------------------------------------------->| Validasi kredensial
        |                                                   | Set-Cookie: laravel_session
        |                                                   |
   3.   | GET /api/v1/auth/me                               |
        | Cookies dikirim otomatis oleh browser             |
        |-------------------------------------------------->| Return User & Profile data
        |                                                   |
   4.   | POST /api/v1/participant/registrations            |
        | Authenticated requests                            |
        |-------------------------------------------------->| Otorisasi via Session
        |                                                   |
   5.   | POST /api/v1/auth/logout                          |
        |-------------------------------------------------->| Invalidate Session & Regenerate CSRF
```

Aturan Teknis Sanctum:
- Konfigurasi `SANCTUM_STATEFUL_DOMAINS` harus mencakup hostname dan port frontend (misal: `localhost:5173`).
- Konfigurasi CORS pada backend wajib menetapkan:
  - `allowed_origins` = `['http://localhost:5173']` (atau domain produksi).
  - `supports_credentials` = `true`.
- Axios pada frontend wajib mengaktifkan `withCredentials: true` dan `withXSRFToken: true`.
- Tidak ada token Bearer yang disimpan di `localStorage` atau `sessionStorage`.

---

## 8. Model Otorisasi & Kontrol Akses

Dua peran resmi:
- `participant`: Pengguna umum yang mendaftar melalui website. Hanya berhak mengelola data miliknya.
- `admin`: Pengelola kompetisi yang dibuat melalui database seeder atau command internal. Berhak memverifikasi dan mengelola acara.

Lapisan Pertahanan Otorisasi:
1. **Middleware `auth:sanctum`**: Menolak request yang tidak memiliki sesi valid (`401 Unauthorized`).
2. **Middleware `EnsureUserRole`**: Memastikan role pengguna cocok dengan rute (`admin` vs `participant`). Request yang melanggar mendapat respons `403 Forbidden`.
3. **Laravel Policies**: Memverifikasi kepemilikan data spesifik:
   - Peserta A tidak dapat melihat/mengedit registrasi Peserta B.
   - Peserta hanya dapat mengunggah submisi pada registrasi miliknya yang berstatus `approved`.
4. **Service Level Invariants**: Mencegah aksi ilegal pada status tertentu (misal: registrasi yang sudah `submitted` tidak dapat diubah tanpa permintaan revisi resmi dari admin).

---

## 9. Penyimpanan Berkas & Keamanan Dokumen

Penyimpanan berkas diklasifikasikan ke dalam 2 kategori:

1. **Public Storage (`storage/app/public` melalui symlink `public/storage`)**:
   - Gambar sampul kompetisi (`competitions/covers/`).
   - Gambar pengumuman (`announcements/thumbnails/`).
   - Logo acara / branding publik.
   - Aman diakses langsung oleh browser via URL statis.

2. **Private Storage (`storage/app/private` tanpa symlink publik)**:
   - Dokumen identitas peserta (KTM, Kartu Pelajar, Surat Pernyataan).
   - Berkas submisi karya lomba (ZIP, PDF proposal, source code).
   - Bukti pembayaran pendaftaran (jika modul pembayaran aktif).
   - Hanya dapat diunduh melalui endpoint khusus: `GET /api/v1/documents/{id}/download`.
   - Endpoint tersebut memvalidasi apakah penyeru request adalah pemilik sah dokumen atau seorang `admin` sebelum melakukan streaming file dengan header `Content-Disposition: attachment`.

---

## 10. Strategi Database & Transaksi

- Engine: **MySQL InnoDB** (mendukung penuh ACID transactions dan Foreign Key Constraints).
- Karakter set: `utf8mb4`, Collation: `utf8mb4_unicode_ci`.
- Integritas Transaksional:
  - Alur submit pendaftaran, penambahan anggota tim, dan verifikasi status pendaftaran wajib dijalankan dalam `DB::transaction()`.
  - Menggunakan *Pessimistic Locking* (`lockForUpdate()`) jika diperlukan pencegahan *race conditions* pada pengecekan kuota atau duplikasi registrasi concurrent.
- Integritas Hapus:
  - Registrasi, pembayaran, submisi karya, dan log audit **tidak boleh di-cascade delete**.
  - Menggunakan `onDelete('restrict')` untuk relasi kritis agar data historis audit terjaga.

---

## 11. Penanganan Kesalahan & Observabilitas

1. **JSON Error Response Seragam**:
   - Format error validasi:
     ```json
     {
       "success": false,
       "message": "Data yang dikirim tidak valid.",
       "errors": {
         "email": ["Alamat email sudah terdaftar."]
       }
     }
     ```
   - Format error otorisasi/sistem:
     ```json
     {
       "success": false,
       "message": "Anda tidak memiliki izin untuk mengakses sumber daya ini."
     }
     ```
2. **Penyembunyian Exception Detail**:
   - Pada environment non-local (`APP_DEBUG=false`), pesan trace exception internal PHP/SQL tidak boleh dikirim ke klien.
3. **Audit Log Mandatori**:
   - Setiap keputusan verifikasi pendaftaran (`approved`, `rejected`, `revision_required`) wajib mencatat `admin_id`, `previous_status`, `new_status`, `note`, dan `timestamp` ke dalam tabel `activity_logs`.
   - Log aktivitas berformat *append-only*.
