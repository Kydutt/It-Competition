# PRD — HIMATIF IT Competition

## 1. Informasi Produk

* **Nama:** HIMATIF IT Competition
* **Jenis:** Platform Kompetisi Teknologi
* **Penyelenggara:** HIMATIF
* **Wilayah:** Ciayumajakuning
* **Target:** Mahasiswa dan siswa SMA/SMK/Sederajat
* **Frontend:** React + Tailwind CSS
* **Backend:** Laravel + PHP
* **Database:** MySQL

---

## 2. Latar Belakang

HIMATIF akan menyelenggarakan IT Competition yang mencakup beberapa cabang lomba untuk mahasiswa dan siswa SMA/SMK/sederajat di wilayah Ciayumajakuning.

Website digunakan sebagai pusat informasi, pendaftaran, pengumpulan karya, verifikasi peserta, penjurian, pengumuman, dan pengelolaan kompetisi oleh panitia.

Platform dirancang agar dapat digunakan kembali untuk event pada tahun berikutnya.

---

## 3. Tujuan

1. Menjadi website resmi HIMATIF IT Competition.
2. Mempermudah peserta mendapatkan informasi lomba.
3. Mempermudah proses pendaftaran.
4. Memusatkan pengelolaan data peserta.
5. Memfasilitasi pengumpulan karya.
6. Membantu panitia melakukan verifikasi.
7. Menyediakan sistem penilaian untuk juri.
8. Menampilkan pengumuman dan pemenang.
9. Membuat platform yang dapat digunakan untuk event berikutnya.

---

# 4. Cabang Kompetisi

## 4.1 Mahasiswa

### UI/UX Competition

Peserta membuat rancangan UI/UX berdasarkan tema atau studi kasus yang diberikan.

### Web Development Competition

Peserta membuat aplikasi website berdasarkan tema atau studi kasus yang diberikan.

---

## 4.2 SMA/SMK/Sederajat

### LKTI

Peserta membuat karya tulis ilmiah sesuai tema kompetisi.

### Poster Competition

Peserta membuat karya poster berdasarkan tema yang ditentukan.

---

# 5. User Roles

## 5.1 Guest

Guest dapat:

* Melihat landing page.
* Melihat competition.
* Melihat detail competition.
* Melihat timeline.
* Melihat FAQ.
* Melihat announcement.
* Melihat sponsor.
* Melihat pemenang.
* Melakukan registrasi.

## 5.2 Participant

Participant dapat:

* Login.
* Mengelola profil.
* Membuat tim.
* Mengundang anggota.
* Mendaftar competition.
* Upload dokumen.
* Upload karya.
* Upload bukti pembayaran.
* Melihat status pendaftaran.
* Melihat pengumuman.

## 5.3 Admin

Admin dapat:

* Mengelola competition.
* Mengelola peserta.
* Mengelola tim.
* Memverifikasi pendaftaran.
* Memverifikasi pembayaran.
* Mengelola submission.
* Mengelola timeline.
* Mengelola announcement.
* Mengelola FAQ.
* Mengelola sponsor.
* Mengelola pemenang.
* Melihat statistik.

## 5.4 Judge

Judge dapat:

* Melihat submission yang ditugaskan.
* Melihat detail karya.
* Memberikan nilai.
* Memberikan catatan.
* Melihat hasil penilaian sesuai permission.

---

# 6. Public Website

## 6.1 Landing Page

Landing page terdiri dari:

* Hero section
* About competition
* Competition categories
* Timeline
* Prize
* Why join
* Sponsor
* FAQ
* CTA
* Footer

Hero:

```text
HIMATIF IT COMPETITION

Create. Innovate. Compete.

Kompetisi teknologi dan kreativitas
se-Ciayumajakuning.

[ DAFTAR SEKARANG ]
[ LIHAT LOMBA ]
```

---

## 6.2 Competition Page

Menampilkan seluruh competition:

* UI/UX Competition
* Web Development
* LKTI
* Poster Competition

Competition card menampilkan:

* Nama
* Kategori peserta
* Deskripsi
* Prize
* Deadline
* Status
* Button detail

---

## 6.3 Competition Detail

Berisi:

* Nama lomba
* Deskripsi
* Tema
* Target peserta
* Biaya
* Hadiah
* Timeline
* Persyaratan
* Ketentuan
* Mekanisme
* Kriteria penilaian
* Guidebook
* FAQ

---

## 6.4 Timeline

Timeline:

```text
Pendaftaran
    ↓
Technical Meeting
    ↓
Pengumpulan Karya
    ↓
Seleksi
    ↓
Penjurian
    ↓
Final
    ↓
Pengumuman Pemenang
```

Timeline harus dapat dikelola admin.

---

## 6.5 Announcement

Admin dapat membuat:

* Pengumuman peserta.
* Pengumuman technical meeting.
* Pengumuman finalis.
* Pengumuman pemenang.
* Informasi perubahan jadwal.

---

## 6.6 Winners

Menampilkan:

* Juara 1
* Juara 2
* Juara 3
* Special Award jika tersedia.

---

## 6.7 Sponsor & Partner

Menampilkan:

* Sponsor
* Media partner
* Community partner
* Institutional partner

---

## 6.8 FAQ

FAQ dapat dikelola admin.

Contoh:

* Siapa yang dapat mengikuti lomba?
* Apakah lomba hanya untuk wilayah Ciayumajakuning?
* Berapa biaya pendaftaran?
* Berapa anggota dalam satu tim?
* Bagaimana cara mengirim karya?
* Bagaimana sistem penilaian?
* Kapan pemenang diumumkan?

---

# 7. Authentication

## Register

Field:

* Nama lengkap
* Email
* Password
* Konfirmasi password
* Nomor WhatsApp
* Institusi
* Jenjang pendidikan
* Kabupaten/Kota

## Login

* Email
* Password
* Remember me
* Forgot password
* Logout

Authentication menggunakan Laravel Sanctum.

---

# 8. Participant Dashboard

Struktur:

```text
Dashboard
├── Overview
├── Profile
├── My Competition
├── My Team
├── Submission
├── Payment
├── Announcement
└── Settings
```

Dashboard menampilkan:

* Competition yang diikuti.
* Status pendaftaran.
* Status pembayaran.
* Status verifikasi.
* Deadline submission.
* Announcement terbaru.

---

# 9. Team Management

Peserta dapat:

* Membuat tim.
* Mengubah nama tim.
* Menambahkan anggota.
* Menghapus anggota.
* Mengundang anggota.
* Melihat status anggota.

Struktur:

```text
Team
├── Team Name
├── Leader
├── Member
├── Member
└── Member
```

Jumlah anggota harus configurable berdasarkan competition.

---

# 10. Registration Flow

```text
Register Account
       ↓
Login
       ↓
Choose Competition
       ↓
Create / Join Team
       ↓
Complete Registration
       ↓
Upload Documents
       ↓
Payment
       ↓
Upload Payment Proof
       ↓
Submit Registration
       ↓
Admin Verification
       ↓
Approved / Rejected
```

---

# 11. Submission System

Submission berbeda berdasarkan competition.

## UI/UX

* Figma URL
* PDF
* Prototype URL

## Web Development

* GitHub URL
* Deployment URL
* Documentation
* Source code archive

## LKTI

* PDF karya ilmiah
* Dokumen pendukung

## Poster

* PDF
* PNG/JPG

Submission memiliki:

* Deadline
* Status
* Timestamp
* Version
* Reviewer status

Submission tidak dapat dilakukan setelah deadline kecuali admin membuka kembali submission.

---

# 12. Payment

Untuk competition berbayar:

Peserta melihat:

* Biaya pendaftaran.
* Bank/e-wallet.
* Nomor rekening.
* Nama pemilik rekening.

Peserta:

1. Melakukan pembayaran.
2. Upload bukti pembayaran.
3. Submit.

Admin dapat:

* Approve.
* Reject.

Status:

```text
Pending
Approved
Rejected
```

MVP tidak menggunakan payment gateway.

---

# 13. Admin Dashboard

Dashboard menampilkan:

* Total peserta.
* Total tim.
* Total pendaftaran.
* Pending verification.
* Total submission.
* Total competition.
* Total pembayaran.

---

# 14. Competition Management

Admin dapat membuat competition.

Field:

* Name
* Slug
* Category
* Description
* Theme
* Target level
* Registration fee
* Quota
* Minimum team member
* Maximum team member
* Registration start
* Registration end
* Submission deadline
* Status

Status:

```text
Draft
Published
Registration Open
Registration Closed
Submission Open
Judging
Finished
Archived
```

---

# 15. Participant Management

Admin dapat:

* Melihat peserta.
* Search peserta.
* Filter competition.
* Filter sekolah/universitas.
* Filter kabupaten/kota.
* Melihat detail.
* Mengubah status.
* Export data.

Wilayah:

* Cirebon
* Indramayu
* Majalengka
* Kuningan

---

# 16. Verification

Flow:

```text
Registration
     ↓
Document Check
     ↓
Payment Check
     ↓
Verification
     ↓
Approved
```

Status:

* Pending
* Approved
* Rejected
* Revision Required

Admin wajib memberikan alasan ketika melakukan reject atau revision.

---

# 17. Judging System

Admin dapat menentukan kriteria penilaian setiap competition.

Contoh:

| Kriteria      | Bobot |
| ------------- | ----: |
| User Research |   20% |
| UX Flow       |   25% |
| UI Design     |   25% |
| Creativity    |   15% |
| Presentation  |   15% |

Total bobot harus:

```text
100%
```

Perhitungan:

```text
Final Score = Σ(Score × Weight)
```

---

# 18. Database

## users

```text
id
name
email
password
phone
education_level
institution
city
role
created_at
updated_at
```

## competitions

```text
id
name
slug
category
description
theme
target_level
registration_fee
quota
min_team_member
max_team_member
registration_start
registration_end
submission_deadline
status
created_at
updated_at
```

## teams

```text
id
competition_id
name
leader_id
created_at
updated_at
```

## team_members

```text
id
team_id
user_id
role
status
created_at
updated_at
```

## registrations

```text
id
user_id
competition_id
team_id
registration_number
status
registered_at
verified_at
verified_by
```

## submissions

```text
id
competition_id
team_id
file
external_url
version
status
submitted_at
```

## payments

```text
id
registration_id
amount
payment_method
proof
status
verified_by
verified_at
```

## judging_criteria

```text
id
competition_id
name
description
weight
```

## scores

```text
id
criterion_id
submission_id
judge_id
score
notes
created_at
updated_at
```

## announcements

```text
id
title
slug
content
published_at
status
created_by
```

## faqs

```text
id
question
answer
competition_id
status
created_at
updated_at
```

## sponsors

```text
id
name
logo
website
category
status
```

## winners

```text
id
competition_id
team_id
rank
award
description
```

---

# 19. API

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Competition

```text
GET    /api/competitions
GET    /api/competitions/{slug}
POST   /api/competitions/{id}/register
```

## Participant

```text
GET    /api/profile
PUT    /api/profile
GET    /api/teams
POST   /api/teams
PUT    /api/teams/{id}
DELETE /api/teams/{id}
GET    /api/registrations
GET    /api/submissions
POST   /api/submissions
GET    /api/payments
POST   /api/payments
```

## Admin

```text
GET    /api/admin/dashboard
GET    /api/admin/users
GET    /api/admin/competitions
POST   /api/admin/competitions
PUT    /api/admin/competitions/{id}
DELETE /api/admin/competitions/{id}
GET    /api/admin/registrations
GET    /api/admin/submissions
GET    /api/admin/payments
GET    /api/admin/announcements
GET    /api/admin/sponsors
GET    /api/admin/winners
```

## Judge

```text
GET  /api/judge/submissions
GET  /api/judge/submissions/{id}
POST /api/judge/scores
```

---

# 20. UI/UX

## Brand Direction

Website menggunakan warna dominan orange.

Recommended palette:

```text
Primary       #F97316
Primary Dark  #C2410C
Primary Light #FFEDD5
Background    #FFFFFF
Dark          #111827
Gray          #6B7280
```

Style:

* Modern.
* Clean.
* Technology-oriented.
* Competitive.
* Energetic.
* Youthful.
* Professional.

Hindari desain yang terlalu ramai.

---

# 21. Responsive

Website wajib mendukung:

* Mobile.
* Tablet.
* Laptop.
* Desktop.

Admin dashboard juga harus dapat digunakan melalui mobile browser.

Prioritas:

```text
Mobile First
↓
Tablet
↓
Desktop
```

---

# 22. Security

Security merupakan prioritas P0.

Wajib menggunakan:

* Laravel Sanctum.
* Password hashing.
* Authentication middleware.
* Authorization middleware.
* Role-based access control.
* Request validation.
* CSRF protection.
* Rate limiting.
* File validation.
* Secure storage.
* SQL injection protection.
* XSS protection.

Peserta tidak boleh:

* Mengakses admin.
* Mengakses data peserta lain.
* Mengakses submission peserta lain.
* Mengubah nilai.

Juri tidak boleh:

* Mengakses admin management.
* Mengubah submission peserta.
* Mengubah nilai juri lain tanpa permission.

---

# 23. File Upload

Allowed:

```text
PDF
PNG
JPG
JPEG
ZIP
```

File upload wajib:

* Validasi MIME type.
* Validasi ukuran.
* Menggunakan generated filename.
* Tidak menggunakan executable file.
* Tidak mengizinkan file PHP.
* Disimpan menggunakan Laravel Storage.

---

# 24. SEO

Public website harus memiliki:

* SEO-friendly URL.
* Meta title.
* Meta description.
* Open Graph.
* Sitemap.
* robots.txt.
* Semantic HTML.

URL:

```text
/competition
/competition/ui-ux
/competition/web-development
/competition/lkti
/competition/poster
/announcement
/winners
```

---

# 25. Performance

Target:

* Fast loading.
* Lazy loading.
* Image optimization.
* API pagination.
* Database indexing.
* Efficient query.
* Avoid N+1 query.
* Frontend code splitting.

---

# 26. Notification

MVP menggunakan notification di dashboard.

Contoh:

```text
Pendaftaran berhasil dikirim.
Pembayaran berhasil diverifikasi.
Pendaftaran telah disetujui.
Submission berhasil diterima.
Terdapat pengumuman baru.
```

P1:

* Email notification.
* WhatsApp notification.

---

# 27. Audit Log

Aktivitas penting harus dicatat.

Data:

```text
User
Action
Entity
Entity ID
Timestamp
IP Address
```

Contoh:

```text
Admin
Approved Registration
REG-00124
20 September 2026
```

---

# 28. MVP

## P0

### Public

* Landing page.
* Competition list.
* Competition detail.
* Timeline.
* FAQ.
* Announcement.
* Contact.
* Registration.
* Login.

### Participant

* Dashboard.
* Profile.
* Team management.
* Competition registration.
* Document upload.
* Submission.
* Payment proof.
* Registration status.

### Admin

* Dashboard.
* Competition CRUD.
* Participant management.
* Registration verification.
* Submission management.
* Payment verification.
* Announcement CRUD.
* FAQ CRUD.
* Sponsor CRUD.
* Winner management.

### Judge

* Login.
* Judge dashboard.
* Assigned submission.
* Submission review.
* Scoring.
* Score calculation.

---

# 29. P1

Fitur setelah MVP:

* Email notification.
* WhatsApp notification.
* Certificate generator.
* Automatic certificate download.
* Advanced judging.
* Public leaderboard.
* Analytics.
* Excel export.
* PDF export.
* QR participant.
* QR check-in.
* Attendance system.

---

# 30. P2

Future development:

* Payment gateway.
* WhatsApp automation.
* Mobile application.
* Push notification.
* AI-assisted judging.
* AI plagiarism detection.
* AI poster analysis.
* Recommendation system.
* Multi-event management.
* Competition archive.

---

# 31. Development Phase

## Phase 1 — Foundation

* Setup React.
* Setup Tailwind.
* Setup Laravel.
* Setup MySQL.
* Setup API.
* Setup authentication.
* Setup role system.
* Setup database migration.

## Phase 2 — Public Website

* Landing page.
* Competition.
* Competition detail.
* Timeline.
* FAQ.
* Announcement.
* Sponsor.
* Contact.

## Phase 3 — Participant

* Dashboard.
* Profile.
* Team.
* Registration.
* Payment.
* Submission.

## Phase 4 — Admin

* Admin dashboard.
* Competition CRUD.
* Participant management.
* Verification.
* Payment management.
* Submission management.
* Content management.

## Phase 5 — Judge

* Judge dashboard.
* Assigned competition.
* Submission review.
* Scoring.
* Score calculation.

## Phase 6 — Finalization

* Security testing.
* Responsive testing.
* Performance optimization.
* SEO.
* Error handling.
* Logging.
* Deployment.

---

# 32. Acceptance Criteria

## Authentication

* User dapat register.
* Email tidak boleh duplicate.
* User dapat login/logout.
* Password tersimpan secara hashed.
* Role diterapkan dengan benar.

## Registration

* User dapat memilih competition.
* User dapat membuat/join team.
* User dapat mengirim registration.
* Registration memiliki status.
* Admin dapat melakukan verifikasi.

## Team

* Leader dapat mengelola team.
* Jumlah anggota mengikuti konfigurasi competition.
* Team tidak dapat melebihi batas anggota.

## Submission

* Hanya registration approved yang dapat submit.
* File harus sesuai format.
* File memiliki batas ukuran.
* Submission memiliki timestamp.
* Submission tidak dapat dilakukan setelah deadline.

## Payment

* Peserta dapat upload bukti.
* Admin dapat approve/reject.
* Status payment terlihat peserta.

## Judging

* Juri hanya melihat submission yang ditugaskan.
* Juri dapat memberikan nilai.
* Sistem menghitung weighted score.
* Peserta tidak dapat mengubah nilai.

## Admin

* Admin dapat CRUD competition.
* Admin dapat mengelola peserta.
* Admin dapat memverifikasi registration.
* Admin dapat mengelola submission.
* Admin dapat mengelola announcement.
* Admin dapat mengelola FAQ.
* Admin dapat mengelola sponsor.
* Admin dapat mengelola winner.

---

# 33. Business Rules

1. Satu akun dapat mengikuti lebih dari satu competition jika diperbolehkan.
2. Satu team hanya dapat mengikuti satu competition.
3. Leader bertanggung jawab atas registration team.
4. Peserta hanya dapat mengakses data miliknya.
5. Submission hanya dapat dilakukan setelah registration approved.
6. Submission memiliki deadline.
7. Admin dapat membuka kembali submission.
8. Setiap competition memiliki konfigurasi team sendiri.
9. Setiap competition memiliki kriteria penilaian sendiri.
10. Setiap competition dapat memiliki biaya berbeda.
11. Competition dapat gratis atau berbayar.
12. Admin dapat mengubah status competition.
13. Data yang masuk tahap judging tidak boleh diubah peserta.
14. Aktivitas penting admin dan juri dicatat dalam audit log.

---

# 34. Project Architecture

## Frontend

```text
src/
├── components/
├── layouts/
├── pages/
│   ├── public/
│   ├── auth/
│   ├── participant/
│   ├── admin/
│   └── judge/
├── hooks/
├── services/
├── contexts/
├── routes/
├── utils/
└── assets/
```

## Backend

```text
app/
├── Http/
│   ├── Controllers/
│   ├── Requests/
│   └── Resources/
├── Models/
├── Services/
├── Policies/
└── Notifications/

database/
├── migrations/
├── seeders/
└── factories/

routes/
├── api.php
└── web.php
```

---

# 35. Long-Term Architecture

Platform tidak boleh dibuat khusus hanya untuk event 2026.

Struktur harus mendukung multi-event:

```text
Competition Platform
│
├── IT Competition 2026
│   ├── UI/UX
│   ├── Web Development
│   ├── LKTI
│   └── Poster
│
├── IT Competition 2027
│   ├── Competition A
│   ├── Competition B
│   └── Competition C
│
└── IT Competition 2028
    └── ...
```

Dengan demikian, sistem dapat digunakan kembali tanpa membangun ulang aplikasi.

---

# 36. Definition of Done

Project dianggap selesai apabila:

* Semua fitur P0 berjalan.
* Authentication berjalan.
* Authorization berjalan.
* Competition CRUD berjalan.
* Registration berjalan.
* Team management berjalan.
* Submission berjalan.
* Payment verification berjalan.
* Judging berjalan.
* Admin dashboard berjalan.
* Responsive berjalan.
* Security testing selesai.
* Database migration berjalan.
* Production build berhasil.
* API terdokumentasi.
* Deployment berhasil.

---

# 37. Success Metrics

Sistem dapat mengukur:

* Total visitor.
* Total registered account.
* Total participant.
* Total team.
* Participant per competition.
* Registration conversion.
* Total submission.
* Participant berdasarkan kabupaten/kota.
* Jumlah sekolah.
* Jumlah universitas.
* Jumlah competition yang aktif.

---

# 38. Product Vision

HIMATIF IT Competition tidak hanya menjadi website pendaftaran event.

Platform diarahkan menjadi:

> **Competition Management Platform HIMATIF**

yang dapat digunakan untuk berbagai event kompetisi HIMATIF pada tahun-tahun berikutnya.

```text
One Platform
     ↓
Multiple Events
     ↓
Multiple Competitions
     ↓
Multiple Participants
     ↓
Centralized Competition Management
```
