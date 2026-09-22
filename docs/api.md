# REST API Reference — HIMATIF IT Competition

**Base URL:** `http://127.0.0.1:8000/api/v1`

Semua request yang mengirimkan data format JSON wajib menyertakan header:
```http
Content-Type: application/json
Accept: application/json
```

Endpoint yang diproteksi wajib menyertakan Sanctum Bearer Token:
```http
Authorization: Bearer <your_access_token>
```

---

## 1. Authentication Endpoints

### `POST /auth/register`
Mendaftarkan akun baru (default role: `participant`).

* **Request Body:**
```json
{
    "name": "Arya Santoso",
    "email": "arya@example.com",
    "password": "Password123!",
    "password_confirmation": "Password123!",
    "phone": "081234567890",
    "institution": "Universitas Ciayumajakuning"
}
```

* **Response (201 Created):**
```json
{
    "success": true,
    "message": "Registration successful",
    "data": {
        "user": {
            "id": 4,
            "name": "Arya Santoso",
            "email": "arya@example.com",
            "role": "participant",
            "phone": "081234567890",
            "institution": "Universitas Ciayumajakuning"
        },
        "token": "4|aBcDeFgHiJkLmNoP..."
    }
}
```

---

### `POST /auth/login`
Autentikasi akun pengguna.

* **Request Body:**
```json
{
    "email": "admin@example.com",
    "password": "password123"
}
```

* **Response (200 OK):**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": 1,
            "name": "Administrator HIMATIF",
            "email": "admin@example.com",
            "role": "admin"
        },
        "token": "5|xYz123..."
    }
}
```

---

### `GET /auth/me`
Mengambil profil akun user yang sedang aktif.

* **Auth:** Required
* **Response (200 OK):**
```json
{
    "success": true,
    "message": "User profile retrieved",
    "data": {
        "id": 1,
        "name": "Administrator HIMATIF",
        "email": "admin@example.com",
        "role": "admin"
    }
}
```

---

### `POST /auth/logout`
Mencabut token autentikasi aktif.

* **Auth:** Required
* **Response (200 OK):**
```json
{
    "success": true,
    "message": "Successfully logged out",
    "data": {}
}
```

---

## 2. Public Information Endpoints

### `GET /competitions` (atau `GET /public/competitions`)
Menampilkan daftar kompetisi yang telah dipublikasikan (`is_published: true`) dengan dukungan filter, pencarian, dan paginasi.

* **Query Parameters:**
  * `page` (int, default: 1): Nomor halaman paginasi.
  * `per_page` (int, default: 10): Jumlah item per halaman.
  * `category` (string, opsional): `ui_ux`, `web_development`, `lkti`, `poster`.
  * `target_level` (string, opsional): `university`, `high_school`.
  * `search` (string, opsional): Mencari nama, slug, tema, atau deskripsi.
  * `sort_by` (string, opsional): `created_at`, `name`, `registration_fee`, `registration_start`, `registration_end`, `submission_deadline`.
  * `sort_order` (string, opsional): `asc`, `desc` (default).

* **Response (200 OK):**
```json
{
    "success": true,
    "message": "Competitions retrieved successfully",
    "data": {
        "data": [
            {
                "id": 1,
                "name": "UI/UX Competition",
                "slug": "ui-ux-competition",
                "category": "ui_ux",
                "category_label": "UI/UX Competition",
                "theme": "Inovasi Desain Solusi Digital untuk Kemajuan Ciayumajakuning",
                "target_level": "university",
                "target_level_label": "Mahasiswa (Perguruan Tinggi)",
                "registration_fee": 75000,
                "quota": 50,
                "min_team_member": 1,
                "max_team_member": 3,
                "registration_start": "2026-10-01T00:00:00.000000Z",
                "registration_end": "2026-10-20T23:59:59.000000Z",
                "submission_start": "2026-10-05T00:00:00.000000Z",
                "submission_deadline": "2026-10-25T23:59:59.000000Z",
                "status": "registration_open",
                "status_label": "Pendaftaran Dibuka",
                "is_published": true
            }
        ],
        "meta": {
            "current_page": 1,
            "last_page": 1,
            "per_page": 10,
            "total": 4
        }
    }
}
```

---

### `GET /competitions/{slug}` (atau `GET /public/competitions/{slug}`)
Mengambil rincian spesifik satu kompetisi aktif beserta rubrik kriteria penilaian.

* **Response (200 OK):** Mengembalikan objek kompetisi lengkap.
* **Response (404 Not Found):** Jika kompetisi tidak ditemukan atau `is_published: false`.

---

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/competitions` | Menampilkan seluruh cabang kompetisi aktif |
| `GET` | `/competitions/{slug}` | Menampilkan detail spesifik kompetisi dan kriteria penjurian |
| `GET` | `/announcements` | Menampilkan daftar pengumuman resmi |
| `GET` | `/announcements/{slug}` | Menampilkan detail isi pengumuman |
| `GET` | `/faqs` | Menampilkan daftar tanya jawab umum |
| `GET` | `/sponsors` | Menampilkan daftar sponsor dan media partner |
| `GET` | `/winners` | Menampilkan daftar pemenang kompetisi |

---

## 3. Participant Protected Endpoints (`role:participant`)

### Tim Peserta (Team Management)
* `GET /participant/teams`: Menampilkan seluruh tim yang diketuai atau diikuti oleh pengguna.
* `POST /participant/teams`: Membentuk tim baru (hanya untuk lomba beregu/team-based).
  - Body: `{"competition_id": 1, "name": "Syntax Squad", "institution": "Universitas..."}`
* `POST /participant/teams/join`: Bergabung ke dalam tim menggunakan kode unik undangan.
  - Body: `{"code": "HITC-WEB01"}`
* `GET /participant/teams/{team}`: Menampilkan detail tim dan anggota tim (hanya untuk anggota tim atau admin).
* `POST /participant/teams/{team}/leave`: Anggota keluar dari tim (tidak dapat dilakukan jika pendaftaran terkunci atau oleh ketua).
* `DELETE /participant/teams/{team}/members/{user}`: Ketua tim mengeluarkan anggota tim (sebelum registrasi disubmit/disetujui).
* `POST /participant/teams/{team}/transfer-leadership`: Ketua mengalihkan kepemimpinan kepada anggota aktif lain.
  - Body: `{"user_id": 2}`
* `DELETE /participant/teams/{team}`: Ketua membubarkan tim (sebelum disubmit/disetujui).

### Pendaftaran Lomba (Registration Lifecycle)
* `GET /participant/registrations`: Menampilkan daftar pendaftaran lomba peserta/tim.
* `POST /participant/registrations`: Membuat draf pendaftaran awal (`draft`).
  - Body (Tim): `{"competition_id": 1, "team_id": 3}`
  - Body (Individu): `{"competition_id": 4}`
* `GET /participant/registrations/{id}`: Menampilkan detail pendaftaran tertentu.
* `POST /participant/registrations/{registration}/submit`: Finalisasi dan submit pendaftaran untuk diverifikasi panitia (`submitted`). Memvalidasi batas min/max anggota tim dan kelayakan jenjang pendidikan seluruh anggota.
* `POST /participant/registrations/{registration}/cancel`: Membatalkan pendaftaran yang masih berstatus `draft` atau `submitted`.

### Pembayaran
* `GET /participant/payments`: Menampilkan riwayat pembayaran.
* `POST /participant/payments`: Mengunggah bukti transfer biaya pendaftaran.

### Pengumpulan Karya
* `GET /participant/submissions`: Menampilkan riwayat karya yang dikumpulkan.
* `POST /participant/submissions`: Mengirim berkas karya, link demo, dan link repositori.

---

## 4. Admin Protected Endpoints (`role:admin`)

### Verifikasi Pendaftaran (Registration Verification)
* `GET /admin/registrations`: Daftar pendaftaran terpaginasi dengan filter `competition_id`, `status`, `education_level`, `registration_date`, dan pencarian `search`.
* `GET /admin/registrations/{registration}`: Detail berkas pendaftaran peserta.
* `POST /admin/registrations/{registration}/approve`: Menyetujui pendaftaran (`approved`).
* `POST /admin/registrations/{registration}/reject`: Menolak pendaftaran (`rejected`).
  - Body: `{"rejection_reason": "Alasan penolakan berkas..."}`
* `POST /admin/registrations/{registration}/revision`: Meminta perbaikan berkas kepada peserta (`revision_required`).
  - Body: `{"revision_note": "Catatan revisi yang perlu diperbaiki..."}`

### Manajemen Kompetisi (Lifecycle & Master Data)
* `GET /admin/competitions`: Daftar seluruh kompetisi (termasuk draft & unpublish), filter status, jenjang, kategori, pencarian, dan paginasi.
* `POST /admin/competitions`: Menambahkan cabang lomba baru dengan auto-slug generator dan validasi lengkap.
* `GET /admin/competitions/{id}`: Menampilkan detail kompetisi beserta relasi rubrik kriteria penilaian.
* `PUT /admin/competitions/{id}`: Memperbarui parameter, tanggal, dan ketentuan kompetisi.
* `DELETE /admin/competitions/{id}`: Menghapus data kompetisi (hanya diizinkan jika belum memiliki tim terdaftar).
* `PATCH /admin/competitions/{id}/publish`: Mempublikasikan kompetisi agar tampil untuk publik (`is_published: true`).
* `PATCH /admin/competitions/{id}/unpublish`: Mengubah status menjadi unpublish / draft dari publik (`is_published: false`).
* `PATCH /admin/competitions/{id}/status`: Memperbarui tahapan status kompetisi dengan validasi transisi alur lifecycle:
  ```json
  {
      "status": "registration_closed"
  }
  ```

### Dashboard & Peserta
* `GET /admin/dashboard`: Statistik total kompetisi, peserta, pendaftaran, dan status pending.
* `GET /admin/participants`: Menampilkan seluruh data peserta terdaftar.

### Verifikasi
* `GET /admin/registrations`: Menampilkan berkas pendaftaran masuk.
* `PUT /admin/registrations/{id}/verify`: Mengubah status pendaftaran (`APPROVED`, `REJECTED`, dll).
* `GET /admin/payments`: Menampilkan data pembayaran masuk.
* `PUT /admin/payments/{id}/verify`: Memvalidasi bukti pembayaran (`PAID`, `PAYMENT_REJECTED`).

### Konten & Submisi
* `GET /admin/submissions`: Melihat seluruh karya masuk.
* `apiResource /admin/announcements`: Mengelola pengumuman resmi.
* `apiResource /admin/faqs`: Mengelola tanya jawab.
* `apiResource /admin/sponsors`: Mengelola mitra sponsor.
* `apiResource /admin/winners`: Menetapkan pemenang lomba.

---

## 5. Judge Protected Endpoints (`role:judge`)

* `GET /judge/dashboard`: Ringkasan jumlah karya yang perlu dan telah dinilai.
* `GET /judge/submissions`: Daftar karya peserta yang ditugaskan kepada dewan juri.
* `GET /judge/submissions/{id}`: Detail karya, berkas, link demo, dan rubrik kriteria.
* `POST /judge/scores`: Menginput nilai dan umpan balik per kriteria penilaian:
```json
{
    "submission_id": 1,
    "criterion_id": 2,
    "score": 88.5,
    "notes": "Desain UI sangat rapi dan konsisten dengan studi kasus."
}
```
