# API Specification Contract — IT Competition Management Platform

| Metadata | Value |
|---|---|
| Product | IT Competition Management Platform |
| API Version | v1 (`/api/v1`) |
| Baseline | `PRD.md`, `AGENTS.md`, `ARCHITECTURE.md` |
| Format | REST JSON (Requests & Responses) |
| Authentication | Laravel Sanctum First-Party SPA Session Cookie |
| Pagination | Standard Page-based (`page`, `per_page`) |
| Timezone | ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`), displayed in `Asia/Jakarta` |

---

## 1. Standar Envelope & Kode HTTP

Seluruh respons API mengembalikan struktur JSON konsisten:

### 1.1. Single Item / Aksi Sukses (200 OK / 201 Created)
```json
{
  "success": true,
  "message": "Operasi berhasil dilakukan.",
  "data": {
    "id": 1,
    "name": "Contoh Data"
  },
  "meta": null
}
```

### 1.2. Koleksi Data Terpaginasi (200 OK)
```json
{
  "success": true,
  "message": "Daftar data berhasil diambil.",
  "data": [
    {
      "id": 1,
      "name": "Item 1"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 68
  }
}
```

### 1.3. Validasi Gagal (422 Unprocessable Content)
```json
{
  "success": false,
  "message": "Data yang dikirimkan tidak valid.",
  "errors": {
    "email": [
      "Format alamat email tidak valid."
    ],
    "password": [
      "Password minimal harus terdiri dari 8 karakter."
    ]
  }
}
```

### 1.4. Autentikasi & Otorisasi Error (401 Unauthorized / 403 Forbidden)
```json
{
  "success": false,
  "message": "Sesi telah berakhir atau belum terautentikasi."
}
```

### 1.5. State Conflict Error (409 Conflict)
```json
{
  "success": false,
  "message": "Transisi status pendaftaran tidak diizinkan dari status saat ini."
}
```

---

## 2. Alur Handshake Sanctum CSRF & Autentikasi

Sebelum melakukan login atau request mutasi (POST/PUT/PATCH/DELETE), klien SPA wajib melakukan inisialisasi cookie proteksi CSRF:

1. **Inisialisasi CSRF Cookie**:
   - `GET /sanctum/csrf-cookie`
   - Respons: 204 No Content. Backend menetapkan cookie `XSRF-TOKEN` dan `laravel_session`.
2. **Kirim Kredensial**:
   - `POST /api/v1/auth/login` dengan header `X-XSRF-TOKEN` yang diambil dari cookie browser.

---

## 3. Daftar Endpoint Lengkap

### 3.1. Autentikasi & Akun (`/api/v1/auth`)

| Metode | Endpoint | Akses | Deskripsi & Payload Ringkas |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Publik | Registrasi peserta baru. Payload: `name`, `email`, `password`, `password_confirmation`, `terms_accepted`. Menetapkan role `participant`. |
| `POST` | `/api/v1/auth/login` | Publik (Rate Limited) | Autentikasi akun. Payload: `email`, `password`. Memberikan respons user data dan status session. |
| `POST` | `/api/v1/auth/logout` | Authenticated | Mengakhiri sesi pengguna aktif dan meregenerasi token sesi. |
| `GET` | `/api/v1/auth/me` | Authenticated | Mengambil data profil user yang sedang login beserta relasi profilnya. |
| `POST` | `/api/v1/auth/forgot-password` | Publik (Rate Limited) | Permintaan link reset password ke email terdaftar. |
| `POST` | `/api/v1/auth/reset-password` | Publik | Reset password menggunakan token valid. |

---

### 3.2. Data Publik (`/api/v1/*`)
Seluruh endpoint publik dapat diakses tanpa login dan hanya mengembalikan data yang berstatus publik/published.

| Metode | Endpoint | Query Params | Deskripsi |
|---|---|---|---|
| `GET` | `/api/v1/events` | - | Daftar acara aktif dan published. |
| `GET` | `/api/v1/events/{slug}` | - | Detail acara berdasarkan slug. |
| `GET` | `/api/v1/categories` | - | Daftar kategori kompetisi IT. |
| `GET` | `/api/v1/competitions` | `category`, `search`, `page`, `per_page` | Daftar kompetisi yang berstatus published dengan filter. |
| `GET` | `/api/v1/competitions/{slug}` | - | Detail lengkap kompetisi, peraturan, dan kriteria. |
| `GET` | `/api/v1/schedules` | `event_id` | Jadwal timeline acara yang dipublikasikan. |
| `GET` | `/api/v1/announcements` | `page`, `per_page` | Pengumuman dengan audience `public`. |
| `GET` | `/api/v1/announcements/{slug}` | - | Detail pengumuman publik. |
| `GET` | `/api/v1/faqs` | `category` | Daftar pertanyaan umum (FAQ) terurut. |
| `GET` | `/api/v1/public/statistics` | - | Agregat metrik publik aman (total kompetisi, jumlah pendaftar terverifikasi). |
| `GET` | `/api/v1/public/payment-config` | - | Status aktivasi modul pembayaran (`payment_enabled`) dan konfigurasi publik Midtrans Snap (`client_key`, `snap_script_url`, `is_production`). Tidak mengekspos secret key. |

---

### 3.3. Portal Peserta (`/api/v1/participant/*`)
Memerlukan header autentikasi sesi dan peran `participant`. Setiap resource dibatasi ketat oleh kepemilikan data peserta (`ParticipantPolicy`).

#### Profil Peserta
| Metode | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/participant/dashboard` | Ringkasan dashboard peserta (status registrasi, deadline terdekat, pengumuman terbaru). |
| `GET` | `/api/v1/participant/profile` | Mengambil data profil detail peserta. |
| `PUT` | `/api/v1/participant/profile` | Memperbarui nomor telepon, institusi, jenjang pendidikan, dan alamat. |
| `POST` | `/api/v1/participant/profile/avatar` | Mengunggah foto profil (multipart/form-data: `image`). |

#### Manajemen Tim
| Metode | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/participant/teams` | Mengambil daftar tim yang diketuai atau diikuti oleh peserta. |
| `POST` | `/api/v1/participant/teams` | Membuat tim baru (ketua otomatis user aktif). Payload: `name`. |
| `GET` | `/api/v1/participant/teams/{id}` | Detail tim beserta seluruh anggota terdaftar. |
| `PUT` | `/api/v1/participant/teams/{id}` | Mengubah nama tim (hanya ketua dan sebelum registrasi disubmit). |
| `POST` | `/api/v1/participant/teams/{id}/members` | Menambahkan anggota ke dalam tim berdasarkan email terdaftar. |
| `DELETE` | `/api/v1/participant/teams/{id}/members/{memberId}` | Menghapus anggota tim (hanya ketua). |

#### Pendaftaran Kompetisi
| Metode | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/participant/registrations` | Mengambil daftar registrasi kompetisi milik peserta/timnya (menyertakan `registration_fee_snapshot` dan `fee_locked_at`). |
| `POST` | `/api/v1/participant/registrations` | Membuat draf registrasi kompetisi baru dan mengunci snapshot biaya pendaftaran (`registration_fee_snapshot`) pada saat registrasi dibuat. Payload: `competition_id`, `team_id` (jika mode team). |
| `GET` | `/api/v1/participant/registrations/{id}` | Mengambil detail registrasi, snapshot biaya terkunci (`registration_fee_snapshot`), daftar dokumen yang diunggah, dan catatan admin. |
| `PUT` | `/api/v1/participant/registrations/{id}` | Memperbarui catatan atau info pendaftaran (hanya jika status `draft` atau `revision_required`). |
| `POST` | `/api/v1/participant/registrations/{id}/documents` | Mengunggah berkas persyaratan (multipart: `document_type`, `file`). |
| `POST` | `/api/v1/participant/registrations/{id}/submit` | Men-submit registrasi secara final untuk ditinjau oleh panitia (mengubah status dari `draft`/`revision_required` menjadi `submitted`). |

#### Pengumpulan Karya (Submisi)
| Metode | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/participant/submissions` | Mengambil daftar submisi karya pada pendaftaran yang telah disetujui. |
| `POST` | `/api/v1/participant/submissions` | Mengumpulkan karya awal. Payload: `registration_id`, `title`, `description`, `file` (opsional), `external_url`, `repository_url`. |
| `GET` | `/api/v1/participant/submissions/{id}` | Detail karya dan catatan peninjauan admin. |
| `POST` | `/api/v1/participant/submissions/{id}/revisions` | Mengunggah revisi berkas karya jika diminta panitia. |

#### Pembayaran Pendaftaran (Midtrans Snap)
| Metode | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/participant/payments` | Daftar riwayat transaksi pembayaran milik peserta / timnya (termasuk `reversal_reason`, `cumulative_refunded_amount`, `net_paid_amount`, `reversal_history` tersanitasi, `registration.team.leader_id`, `registration.competition.event_id`, `registration.competition.registration_deadline`). |
| `GET` | `/api/v1/participant/payments/{id}` | Detail transaksi pembayaran (dilindungi `PaymentPolicy`: pemilik / anggota tim; `snap_token` hanya dikirim ke pemilik / ketua tim saat masih `pending` dan aktif). |
| `GET` | `/api/v1/participant/registrations/{id}/payments` | Daftar transaksi pembayaran pada suatu registrasi milik peserta / timnya. |
| `POST` | `/api/v1/participant/registrations/{id}/payments` | Membuat atau mengambil transaksi Snap `pending` yang masih aktif (hanya peserta pemilik / ketua tim pada status `submitted`/`under_review` dengan biaya > 0 dan `payment_enabled = true`). |
| `POST` | `/api/v1/participant/payments/{id}/sync` | Sinkronisasi dan rekonsiliasi status transaksi langsung ke Midtrans Status API (dilindungi `PaymentPolicy::sync`). |

#### Notifikasi & Pengumuman Peserta
| Metode | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/participant/notifications` | Daftar notifikasi peserta. |
| `PATCH` | `/api/v1/participant/notifications/{id}/read` | Menandai satu notifikasi telah dibaca. |
| `PATCH` | `/api/v1/participant/notifications/read-all` | Menandai seluruh notifikasi telah dibaca. |
| `GET` | `/api/v1/participant/announcements` | Pengumuman khusus untuk peserta atau kompetisi yang diikutinya. |

---

### 3.4. Panel Admin (`/api/v1/admin/*`)
Memerlukan autentikasi sesi dan peran `admin` (`EnsureAdmin` middleware).

#### Dashboard & Pelaporan
| Metode | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/admin/dashboard` | Metrik ringkasan (total pendaftar, registrasi menunggu verifikasi, submisi karya). |
| `GET` | `/api/v1/admin/reports/registrations` | Ekspor/data pendaftaran terfilter (dapat format JSON/CSV). |
| `GET` | `/api/v1/admin/reports/submissions` | Ekspor data submisi karya. |
| `GET` | `/api/v1/admin/reports/participants` | Ekspor data peserta terdaftar. |
| `GET` | `/api/v1/admin/activity-logs` | Mengambil riwayat log audit tindakan administratif. |

#### Manajemen Acara, Kategori & Kompetisi
| Metode | Endpoint | Deskripsi |
|---|---|---|
| `GET` / `POST` | `/api/v1/admin/events` | List dan create acara perhelatan. |
| `GET` / `PUT` / `DELETE` | `/api/v1/admin/events/{id}` | Detail, update, dan arsip acara. |
| `GET` / `POST` | `/api/v1/admin/categories` | List dan create kategori kompetisi. |
| `GET` / `PUT` / `DELETE` | `/api/v1/admin/categories/{id}` | Detail, update, dan hapus kategori. |
| `GET` / `POST` | `/api/v1/admin/competitions` | List (`withCount('registrations')`) dan create cabang lomba. `registration_fee` divalidasi bilangan bulat Rupiah `>= 0` (input create kosong otomatis bernilai `0`). |
| `GET` / `PUT` / `DELETE` | `/api/v1/admin/competitions/{id}` | Detail read-only, update (dengan `lockForUpdate()` transaksional dan audit log; perubahan `registration_fee` tidak mengubah snapshot pendaftar lama), dan arsip/hapus kompetisi. |

#### Verifikasi Pendaftaran & Submisi
| Metode | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/admin/registrations` | Daftar registrasi masuk dengan filter status, kompetisi, tanggal. |
| `GET` | `/api/v1/admin/registrations/{id}` | Detail lengkap pendaftar, anggota tim, dan berkas persyaratan. |
| `PATCH` | `/api/v1/admin/registrations/{id}/status` | Mengubah status registrasi (`under_review`, `approved`, `rejected`, `revision_required`) disertai catatan wajib pada penolakan/revisi. |
| `PATCH` | `/api/v1/admin/documents/{id}/verify` | Memverifikasi satu per satu berkas dokumen (`verified`, `rejected`). |
| `GET` | `/api/v1/admin/submissions` | Daftar submisi karya peserta yang masuk. |
| `GET` | `/api/v1/admin/submissions/{id}` | Detail karya dan histori revisi. |
| `PATCH` | `/api/v1/admin/submissions/{id}/review` | Memperbarui status peninjauan karya (`under_review`, `accepted`, `rejected`, `revision_required`). |

#### Manajemen Pembayaran (Midtrans Snap)
| Metode | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/admin/payments` | *(Planned — Fase 4)* Daftar transaksi pembayaran terpaginasi dengan filter & metrik. |
| `GET` | `/api/v1/admin/payments/{id}` | *(Planned — Fase 4)* Detail transaksi pembayaran beserta metadata Midtrans. |
| `POST` | `/api/v1/admin/payments/{id}/sync` | *(Planned — Fase 4)* Sinkronisasi status transaksi langsung ke Midtrans API. |
| `GET` | `/api/v1/admin/reports/payments` | *(Planned — Fase 4)* Ekspor laporan pembayaran terfilter ke CSV. |

### 3.6. Webhook Payment Gateway
| Metode | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `POST` | `/api/v1/webhooks/midtrans` | Server Midtrans (`throttle:120,1`, tanpa `auth:sanctum`) | Menerima HTTP notification Midtrans dengan verifikasi SHA-512 (`SHA512(order_id + status_code + gross_amount + MIDTRANS_SIGNATURE_SECRET)` via `hash_equals`), validasi `gross_amount`, proteksi idempotency & out-of-order, serta pencatatan audit & notifikasi peserta secara aman. |

#### CMS Konten & Pengaturan
| Metode | Endpoint | Deskripsi |
|---|---|---|
| `GET` / `POST` | `/api/v1/admin/schedules` | CRUD jadwal acara. |
| `GET` / `PUT` / `DELETE` | `/api/v1/admin/schedules/{id}` | Detail, edit, dan hapus jadwal. |
| `GET` / `POST` | `/api/v1/admin/announcements` | CRUD pengumuman panitia. |
| `GET` / `PUT` / `DELETE` | `/api/v1/admin/announcements/{id}` | Detail, update, dan hapus pengumuman. |
| `GET` / `POST` | `/api/v1/admin/faqs` | CRUD pertanyaan umum (FAQ). |
| `GET` / `PUT` / `DELETE` | `/api/v1/admin/faqs/{id}` | Detail, update, dan hapus FAQ. |
| `GET` / `PATCH` | `/api/v1/admin/settings` | Mengambil dan memperbarui konfigurasi branding dan kontak situs. |

---

### 3.5. Unduhan Berkas Berotorisasi (`/api/v1/documents/*`)

| Metode | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/api/v1/documents/registration/{id}/download` | Pemilik / Admin | Mengunduh berkas identitas/persyaratan dari private storage secara aman. |
| `GET` | `/api/v1/documents/submission/{id}/download` | Pemilik / Admin | Mengunduh berkas submisi karya lomba dari private storage secara aman. |

---

## 4. Mesin Status & Aturan Transisi (State Machine)

### 4.1. Transisi Status Pendaftaran (`registrations.status`)
```text
[ draft ]
    |
    v (Peserta melakukan submit final)
[ submitted ]
    |
    v (Admin mulai meninjau berkas)
[ under_review ]
    |------------------------+-------------------------+
    |                        |                         |
    v                        v                         v
[ approved ]         [ revision_required ]        [ rejected ]
                             |
                             v (Peserta upload perbaikan & submit)
                     [ submitted ]
```

Aturan:
- Status `approved`, `rejected`, dan `cancelled` adalah status terminal atau memerlukan persetujuan khusus admin untuk dibuka kembali.
- Pengubahan status ke `revision_required` atau `rejected` wajib menyertakan atribut `note` yang jelas untuk peserta.
- Klien tidak dapat mengirimkan status sepihak; pengubahan status diatur oleh controller khusus pada endpoint `/status`.

### 4.2. Transisi Status Submisi (`submissions.status`)
```text
[ submitted ]
    |
    v
[ under_review ]
    |------------------------+-------------------------+
    |                        |                         |
    v                        v                         v
[ accepted ]         [ revision_required ]        [ rejected ]
                             |
                             v
                     [ submitted ]
```
