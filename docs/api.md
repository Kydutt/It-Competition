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

### Pembayaran (Payment Lifecycle)
* `GET /participant/payments`: Menampilkan daftar pembayaran seluruh pendaftaran peserta.
* `POST /participant/payments`: Menginisialisasi pembayaran untuk pendaftaran lomba (nominal ditentukan otomatis oleh server dari biaya lomba).
  - Body: `{"registration_id": 1, "payment_method": "Transfer Bank BCA", "transaction_reference": "REF12345", "notes": "Transfer atas nama Budi"}`
* `GET /participant/payments/{id}`: Menampilkan detail rincian pembayaran.
* `POST /participant/payments/{id}/proof`: Mengunggah berkas bukti transfer (multipart/form-data: `proof`, format JPG/PNG/PDF maks 2MB) ke penyimpanan privat server.
* `POST /participant/payments/{id}/submit`: Mengirimkan pembayaran berbukti untuk ditinjau oleh tim verifikator panitia (`submitted` -> `under_review`).
* `GET /participant/payments/{id}/proof`: Mengunduh berkas bukti transfer secara terotentikasi.

### Pengumpulan Karya (Submission Lifecycle)
* `GET /participant/submissions`: Menampilkan riwayat karya yang dikumpulkan peserta.
* `POST /participant/submissions`: Membuat entri submisi karya baru untuk pendaftaran yang telah lunas/disetujui dan berada di dalam rentang deadline.
  - Body: `{"registration_id": 1, "title": "Aplikasi Edukasi Interaktif", "description": "Platform pembelajaran berbasis web..."}`
* `GET /participant/submissions/{id}`: Menampilkan rincian karya dan daftar berkas lampiran.
* `POST /participant/submissions/{id}/files`: Mengunggah berkas lampiran karya (multipart/form-data: `file`, format ZIP/RAR/7Z/PDF/DOC/DOCX/PPT/PPTX/JPG/PNG maks 20MB).
* `DELETE /participant/submissions/{id}/files/{fileId}`: Menghapus berkas lampiran tertentu sebelum batas deadline berakhir.
* `POST /participant/submissions/{id}/submit`: Melakukan finalisasi submit karya untuk siap dinilai oleh juri (wajib minimal 1 berkas terlampir).
* `GET /participant/submissions/{id}/files/{fileId}`: Mengunduh berkas lampiran karya secara terotentikasi.

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

### Verifikasi Pembayaran (Payment Verification)
* `GET /admin/payments`: Menampilkan data pembayaran masuk (terpaginasi) dengan filter `competition_id`, `status`, dan `search`.
* `GET /admin/payments/{id}`: Menampilkan detail pembayaran dan status registrasi.
* `POST /admin/payments/{id}/approve`: Menyetujui pembayaran (`approved`). Pendaftaran otomatis dinyatakan lunas (`is_payment_cleared = true`).
* `POST /admin/payments/{id}/reject`: Menolak pembayaran dengan alasan penolakan wajib.
  - Body: `{"reason": "Nominal transfer kurang Rp 10.000 atau bukti tidak terbaca..."}`
* `GET /admin/payments/{id}/proof`: Mengunduh / melihat berkas bukti transfer dari penyimpanan privat server.

### Manajemen Karya Masuk (Submissions)
* `GET /admin/submissions`: Melihat seluruh karya masuk dari peserta dengan filter `competition_id`, `status`, dan `search`.
* `GET /admin/submissions/{id}`: Detail karya peserta, deskripsi solusi, dan daftar berkas lampiran.
* `GET /admin/submissions/{id}/files/{fileId}`: Mengunduh berkas karya lampiran secara aman.

### Manajemen Kompetisi (Lifecycle & Master Data)
* `GET /admin/competitions`: Daftar seluruh kompetisi (termasuk draft & unpublish), filter status, jenjang, kategori, pencarian, dan paginasi.
* `POST /admin/competitions`: Menambahkan cabang lomba baru dengan auto-slug generator dan validasi lengkap.
* `GET /admin/competitions/{id}`: Menampilkan detail kompetisi beserta relasi rubrik kriteria penilaian.
* `PUT /admin/competitions/{id}`: Memperbarui parameter, tanggal, dan ketentuan kompetisi.
* `DELETE /admin/competitions/{id}`: Menghapus data kompetisi (hanya diizinkan jika belum memiliki tim terdaftar).
* `PATCH /admin/competitions/{id}/publish`: Mempublikasikan kompetisi agar tampil untuk publik (`is_published: true`).
* `PATCH /admin/competitions/{id}/unpublish`: Mengubah status menjadi unpublish / draft dari publik (`is_published: false`).
* `PATCH /admin/competitions/{id}/status`: Memperbarui tahapan status kompetisi dengan validasi transisi alur lifecycle.

### Dashboard & Peserta
* `GET /admin/dashboard`: Statistik total kompetisi, peserta, pendaftaran, pending pembayaran, dan submission.
* `GET /admin/participants`: Menampilkan seluruh data peserta terdaftar.

### Konten Publik Website
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
