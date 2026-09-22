# Architecture Documentation — HIMATIF IT Competition

## 1. System Overview

**HIMATIF IT Competition** adalah platform multi-event kompetisi teknologi terintegrasi untuk mahasiswa dan siswa SMA/SMK/Sederajat di wilayah Ciayumajakuning (Cirebon, Indramayu, Majalengka, Kuningan).

Platform ini dibangun dengan arsitektur **Decoupled Client-Server (Headless REST API)** yang memisahkan seluruh lapisan backend dan frontend menjadi dua aplikasi independen.

```
+-----------------------------------------------------------------------+
|                           CLIENT LAYER                                |
|                                                                       |
|   React SPA (Single Page Application) + Vite + Tailwind CSS           |
|   - Public Pages & Competition Catalog                                |
|   - Participant Dashboard & Team Portal                               |
|   - Admin Control & Verification Center                               |
|   - Judge Assessment Portal                                           |
+-----------------------------------┬-----------------------------------+
                                    |
                            HTTP/REST (JSON)
                    Bearer Token Authorization (Sanctum)
                                    |
+-----------------------------------▼-----------------------------------+
|                           API GATEWAY / ROUTING                       |
|                                                                       |
|   Laravel Routes (/api/v1/...)                                        |
|   - Middleware: EnsureUserRole (role:admin, role:judge, etc.)         |
|   - Rate Limiting, Exception Formatting, CORS                         |
+-----------------------------------┬-----------------------------------+
                                    |
+-----------------------------------▼-----------------------------------+
|                        APPLICATION SERVICES LAYER                     |
|                                                                       |
|   Controllers (Thin HTTP Handlers)                                    |
|         │                                                             |
|         ▼                                                             |
|   Form Request Validation                                             |
|         │                                                             |
|         ▼                                                             |
|   Domain Services (AuthService, RegistrationService, etc.)            |
|         │                                                             |
|         ▼                                                             |
|   Eloquent Models & Policies (Fine-grained Authorization)             |
+-----------------------------------┬-----------------------------------+
                                    |
+-----------------------------------▼-----------------------------------+
|                           DATA PERSISTENCE                            |
|                                                                       |
|   MySQL Database (Relational Engine, Foreign Keys, UTF8MB4)           |
+-----------------------------------------------------------------------+
```

---

## 2. Frontend / Backend Separation

* **Backend (`/backend`)**:
  - Framework: Laravel 13 running on PHP 8.5.
  - Tanggung jawab: Pengolahan bisnis, autentikasi stateful/stateless, validasi request, persistensi data ke MySQL, penerbitan event & notifikasi.
  - Seluruh output berupa REST API JSON terstruktur (tidak menyajikan view Blade untuk fitur interaktif).

* **Frontend (`/frontend`)**:
  - Library/Build Tool: React 18 + Vite.
  - Styling: Tailwind CSS dengan palet warna brand oranye HIMATIF.
  - Tanggung jawab: Antarmuka interaktif, perutean klien via React Router, client-side caching, dan konsumsi API melalui Axios.
  - Komunikasi murni melalui HTTP REST API dengan base URL `http://127.0.0.1:8000/api/v1`.

---

## 3. API Architecture & Versioning

Semua endpoint API diproteksi dengan versioning eksplisit:

```
/api/v1/...
```

### Response Envelope Standard

Setiap response API dari backend mengikuti envelope standar:

#### Response Sukses (HTTP 200, 201)
```json
{
    "success": true,
    "message": "Request successful",
    "data": {}
}
```

#### Response Gagal / Validasi (HTTP 400, 422, 401, 403, 404, 500)
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "email": ["The email field is required."]
    }
}
```

---

## 4. Authentication Architecture

Platform menggunakan **Laravel Sanctum** untuk menerbitkan token API berkinerja tinggi (Personal Access Tokens).

1. **Registrasi**: User mendaftar melalui `POST /api/v1/auth/register`. Akun otomatis memiliki role default `participant`.
2. **Login**: User mengirimkan email dan password melalui `POST /api/v1/auth/login`. Jika valid, server mengembalikan token plain text dan data profil user.
3. **Penyimpanan Token di Klien**: Token disimpan di `localStorage` frontend dan disuntikkan secara otomatis pada header request:
   ```http
   Authorization: Bearer <sanctum_token>
   ```
4. **Logout**: Endpoint `POST /api/v1/auth/logout` menghapus token aktif dari database `personal_access_tokens`.

---

## 5. Role & Authorization Foundation

### Tiga Peran Utama (User Roles)

Sistem membedakan tiga role menggunakan PHP Backed Enum `App\Enums\UserRole`:

1. **`participant`**:
   - Mendaftar ke platform sebagai peserta / ketua tim.
   - Mengisi profil, membentuk tim kompetisi, dan mengundang anggota.
   - Melakukan checkout registrasi cabang lomba.
   - Mengunggah bukti pembayaran biaya lomba.
   - Mengunggah berkas karya akhir (proposal, presentasi, Figma, repositori GitHub).

2. **`admin`**:
   - Memiliki kendali penuh terhadap platform.
   - Menambah, mengubah, dan mengarsipkan cabang kompetisi.
   - Memverifikasi berkas pendaftaran dan mengubah status registrasi.
   - Memverifikasi bukti transfer dan memperbarui status pembayaran.
   - Mempublikasikan pengumuman resmi, FAQ, sponsor, dan penetapan pemenang.

3. **`judge`**:
   - Mengakses karya peserta (submission) yang ditugaskan.
   - Mengakses link demo, berkas karya, dan repositori proyek.
   - Menginput skor penilaian untuk setiap kriteria bobot lomba (0 - 100).
   - Memberikan umpan balik dan catatan evaluasi kepada peserta.

### Mekanisme Otorisasi

1. **Middleware `EnsureUserRole`**:
   Dipasang pada routing group di `routes/api.php` untuk memvalidasi peran user pada level request:
   ```php
   Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(...);
   Route::middleware(['auth:sanctum', 'role:judge'])->prefix('judge')->group(...);
   Route::middleware(['auth:sanctum', 'role:participant'])->prefix('participant')->group(...);
   ```

2. **Eloquent Policies**:
   Menangani otorisasi kepemilikan data (ownership authorization) agar peserta tidak dapat melihat atau memodifikasi data milik tim lain:
   - `CompetitionPolicy`: Menentukan visibilitas kompetisi publik vs admin draft.
   - `TeamPolicy`: Memastikan hanya ketua tim yang dapat mengubah data tim.
   - `RegistrationPolicy`: Mengontrol akses melihat berkas pendaftaran.
   - `SubmissionPolicy`: Menjaga keamanan berkas karya.
   - `PaymentPolicy`: Membatasi visibilitas bukti pembayaran.
   - `ScorePolicy`: Mengatur hak input nilai hanya untuk juri penilai.

---

## 6. Service Layer Pattern

Untuk menjaga controllers tetap bersih (*thin controllers*), logika bisnis didelegasikan ke **Service Classes**:

```text
Controller (Menerima input HTTP)
    │
    ▼
Form Request (Validasi tipe & aturan data)
    │
    ▼
Service Class (Menjalankan business logic, database transaction, kalkulasi)
    │
    ▼
Model & Database (Eloquent ORM & MySQL Engine)
    │
    ▼
API Resource (Transformasi format JSON seragam)
```

Daftar Service yang diimplementasikan:
* `AuthService`: Logika registrasi, hashing kata sandi, validasi token, dan logout.
* `CompetitionService`: Pengelolaan kompetisi, kriteria penilaian, dan status aktif.
* `TeamService`: Pembuatan tim, kode unik tim, dan pendaftaran anggota.
* `RegistrationService`: Nomor pendaftaran otomatis, verifikasi status, audit timestamp.
* `PaymentService`: Pencatatan transaksi, verifikasi bukti pembayaran, update status registrasi.
* `SubmissionService`: Pengelolaan berkas submisi karya dan tautan proyek.
* `JudgingService`: Validasi rentang skor, kalkulasi bobot kriteria, dan agregasi nilai.

---

## 7. Competition Domain Architecture (Phase 2)

### 7.1 Architecture Flow

```text
ADMIN FLOW:
Admin SPA
    ↓ (Bearer Sanctum Token + EnsureUserRole:admin)
Admin API (/api/v1/admin/competitions)
    ↓
StoreCompetitionRequest / UpdateCompetitionRequest
    ↓
CompetitionService (Business rules, slug uniqueness, status transitions)
    ↓
Competition Model & Policy
    ↓
MySQL Persistence (competitions table)

PUBLIC FLOW:
Public User / Visitor (Browser)
    ↓ (GET /api/v1/competitions or /competitions/{slug})
Public Competition API
    ↓
CompetitionService (Filters only is_published = true, scopes, eager loads)
    ↓
Competition Model (Eloquent)
    ↓
CompetitionResource (JSON formatting with formatted labels and dates)
```

### 7.2 Competition Lifecycle State Machine

Status kompetisi dikontrol secara ketat menggunakan enum `CompetitionStatus` dengan aturan transisi (*lifecycle flow*) untuk mencegah perubahan status yang tidak logis:

```text
               +-------------------------------------------+
               |                                           |
               v                                           |
          +---------+                                      |
          |  DRAFT  |                                      |
          +----+----+                                      |
               |                                           |
               v                                           |
    +--------------------+                                 |
    | REGISTRATION_OPEN  |                                 |
    +----+---------------+                                 |
         |                                                 |
         v                                                 |
   +---------------------+                                 |
   | REGISTRATION_CLOSED |                                 |
   +----+----------------+                                 |
        |                                                  |
        v                                                  v
   +---------------------+                            +----------+
   |   SUBMISSION_OPEN   | ─────────────────────────> | ARCHIVED |
   +----+----------------+                            +----+-----+
        |                                                  ^
        v                                                  |
   +---------------------+                                 |
   |       JUDGING       | ────────────────────────────────+
   +----+----------------+                                 |
        |                                                  |
        v                                                  |
   +---------------------+                                 |
   |      FINISHED       | ────────────────────────────────+
   +---------------------+
```

* **Transisi Valid:**
  * `DRAFT` $\to$ `REGISTRATION_OPEN`, `ARCHIVED`
  * `REGISTRATION_OPEN` $\to$ `REGISTRATION_CLOSED`, `DRAFT`, `ARCHIVED`
  * `REGISTRATION_CLOSED` $\to$ `SUBMISSION_OPEN`, `REGISTRATION_OPEN`, `ARCHIVED`
  * `SUBMISSION_OPEN` $\to$ `JUDGING`, `REGISTRATION_CLOSED`, `ARCHIVED`
  * `JUDGING` $\to$ `FINISHED`, `SUBMISSION_OPEN`, `ARCHIVED`
  * `FINISHED` $\to$ `ARCHIVED`
  * `ARCHIVED` $\to$ `DRAFT` (restorasi ke mode penyusunan)

### 7.3 Authorization & Security
* **Visibilitas Data:** Endpoint publik hanya menampilkan kompetisi dengan `is_published: true`. Detail kompetisi yang masih berstatus draft atau `is_published: false` akan menghasilkan respon `404 Not Found` untuk publik.
* **Role Enforcement:** Seluruh endpoint `/api/v1/admin/competitions/*` dilindungi middleware `auth:sanctum` dan `role:admin`.
* **Safe Deletion vs Archiving:** Kompetisi yang telah memiliki relasi tim, pendaftaran, atau submisi dilarang dihapus secara permanen (*hard delete*) dan diarahkan untuk menggunakan status `ARCHIVED`.
* **SQL Injection Prevention:** Pengurutan (*sorting*) dibatasi pada daftar *whitelist* kolom yang diizinkan (`created_at`, `name`, `registration_fee`, dll.).
