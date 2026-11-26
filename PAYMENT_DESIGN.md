# PAYMENT DESIGN & AUDIT — MIDTRANS SNAP INTEGRATION (IT COMP)

| Metadata | Value |
|---|---|
| Product | IT Competition Management Platform (`IT COMP`) |
| Document | Phase 0 — Audit & Midtrans Snap Payment Design |
| Version | 1.0.0 |
| Baseline Docs | `AGENTS.md`, `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `DEVELOPMENT.md`, `OPEN_QUESTIONS.md` |
| Backend | Laravel 13.42.0 (PHP 8.3+), MySQL 8.0+, Laravel Sanctum |
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| Payment Gateway | Midtrans Snap (Sandbox during development) |
| Status | Approved Final Design — Phase 1B Active |

---

## 1. Kondisi Implementasi Pembayaran Saat Ini

Hasil audit menyeluruh dari database, backend, konfigurasi, pengujian, hingga frontend menunjukkan bahwa **modul pembayaran saat ini berada dalam kondisi non-aktif dan terpecah antara skema November 2026 dan sisa prototipe lama (September 2026) yang tidak kompatibel**.

### 1.1. Ringkasan Temuan Audit per Komponen

| Komponen | Lokasi File | Kondisi Saat Ini | Status |
|---|---|---|---|
| **Migration `payments`** | `backend/database/migrations/2026_11_16_000011_create_payments_table.php` | Sudah dijalankan di MySQL (batch 4). Dirancang khusus untuk **transfer bank manual** (`payment_proof_path`, `verified_by`, `verified_at`, status `pending/verified/rejected`). | Aktif di DB, belum mendukung Midtrans |
| **Model `Payment`** | `backend/app/Models/Payment.php` | Sesuai tabel `payments` saat ini (`registration_id`, `amount`, `payment_method`, `payment_proof_path`, `status`, `rejection_reason`, `verified_by`, `verified_at`). Relasi: `registration()`, `verifier()`. | Aktif, minim helper & tanpa field Midtrans |
| **Enum `PaymentStatus`** | `backend/app/Enums/PaymentStatus.php` | Hanya memiliki 3 case: `PENDING = 'pending'`, `VERIFIED = 'verified'`, `REJECTED = 'rejected'`. | Tidak mendukung state gateway (`paid`/`expired`/`cancelled`/`failed`) |
| **Model `Registration`** | `backend/app/Models/Registration.php` | Memiliki relasi `payments(): HasMany`. Menggunakan kolom `participant_id` dan `team_id` (mutually exclusive via check constraint MySQL). Tidak memiliki `latestPayment()` atau `isPaymentCleared()`. | Aktif |
| **`PaymentService`** | `backend/app/Services/PaymentService.php` | **Sisa prototipe lama yang rusak/tidak kompatibel** dengan skema DB aktif: mereferensikan `$registration->user_id`, kolom `payments.user_id`, `proof_path`, `submitted_at`, `reviewed_at`, `reviewed_by`, enum `PaymentStatus::Pending/Submitted/UnderReview/Approved/Rejected`, serta method `$payment->isApproved()`, `$payment->canUploadProof()`, `$payment->status->label()` yang semuanya **tidak ada**. | **Rusak / Incompatible** |
| **Controllers Pembayaran** | `backend/app/Http/Controllers/Api/Participant/PaymentController.php`, `Admin/PaymentController.php` | **Tidak terdaftar di `routes/api.php`**. Meng-extend `ApiController` (`App\Traits\ApiResponse`) yang berbeda konvensi dari controller aktif lainnya, serta bergantung pada `PaymentService` lama dan `$payment->user_id` / `$registration->user_id`. | **Tidak Aktif & Rusak** |
| **Webhook Controller** | — | Belum ada controller/route untuk menerima notifikasi HTTP webhook Midtrans. | **Belum Ada** |
| **Routes API** | `backend/routes/api.php` | **Tidak ada satu pun route** `/participant/payments*`, `/admin/payments*`, maupun `/webhooks/midtrans`. | **Belum Terdaftar** |
| **Policy** | `backend/app/Policies/PaymentPolicy.php` | Ada, namun merujuk ke field non-eksisten (`$payment->user_id`, `$payment->registration->user_id`, `$payment->canUploadProof()`, `$payment->isApproved()`) dan tidak dipanggil di controller. | **Rusak / Incompatible** |
| **API Resources** | `backend/app/Http/Resources/PaymentResource.php`, `RegistrationResource.php` | `PaymentResource` merujuk field lama (`proof_path`, `submitted_at`, `reviewed_by`, `reviewer`, `competition->title`, `team->code`, `status->label()`) dan hardcode `bank_info => config('payment')`. `RegistrationResource` belum menyertakan `payments` / `payment_status`. | **Rusak / Belum Lengkap** |
| **Form Requests** | `StorePaymentRequest`, `UploadPaymentProofRequest`, `PaymentProofRequest`, `VerifyPaymentRequest`, `RejectPaymentRequest` | Didesain untuk alur upload bukti transfer manual. `PaymentProofRequest` bahkan mengizinkan input `amount` dari klien (risiko keamanan jika dipakai). | Perlu dirapikan untuk Midtrans |
| **Konfigurasi & Env** | `backend/config/payment.php`, `config/services.php`, `.env.example`, `composer.json` | `config/payment.php` hanya berisi info rekening BCA manual. Belum ada `MIDTRANS_*` di `.env.example` / `config/`, dan belum ada SDK Midtrans di `composer.json`. | **Belum Dikonfigurasi** |
| **Event Settings & Fee** | `SettingController.php`, `competitions.registration_fee` | `competitions.registration_fee` (`decimal(12,2)`) sudah ada di DB, model, resource, dan form request admin, **tetapi input `registration_fee` tidak ada di form UI `Admin/CompetitionsPage.tsx`**. `SettingsPage.tsx` menampilkan badge statis `payment_enabled = 'false'`. | Sebagian ada, UI admin belum lengkap |
| **Participant Portal** | `frontend/src/App.tsx`, `ParticipantLayout.tsx`, `participantService.ts`, `RegistrationDetailPage.tsx` | Tidak ada halaman pembayaran atau integrasi Snap. `RegistrationDetailPage.tsx` menampilkan `registration_fee` dan masih memiliki opsi dropdown dokumen manual `bukti_pembayaran`. File `frontend/src/services/paymentService.js` adalah sisa prototipe JS lama yang tidak terpakai. | **Belum Ada di Active TS SPA** |
| **Admin Portal** | `frontend/src/App.tsx`, `AdminLayout.tsx`, `adminService.ts`, `RegistrationDetailPage.tsx` | Tidak ada menu atau halaman `/admin/payments`. Detail registrasi admin tidak menampilkan status pembayaran. | **Belum Ada** |
| **Audit Log & Notifikasi** | `ActivityLogService.php`, `Models/Notification.php` | `ActivityLogService::log()` bersifat append-only dan mendukung `$actor = null` (cocok untuk webhook). `App\Models\Notification` memakai tabel custom (`user_id`, `title`, `message`, `type`, `action_url`, `read_at`). *Catatan bug existing*: `RegistrationService::updateStatus()` hanya mengirim notifikasi ke `$registration->participant_id` (null pada pendaftaran tim) dengan `action_url` `/portal/...` (padahal route frontend `/participant/...`). | Infrastruktur siap, perlu konsistensi target notifikasi tim |
| **Automated Tests** | `backend/tests/Feature/PaymentTest.php`, `Phase4SecurityTest.php` | Kedua file adalah test prototipe lama (menggunakan enum `UserRole`, `CompetitionType`, `Registration::$user_id`, `isPaymentCleared()`) sehingga **gagal/error saat dijalankan**. Test aktif November 2026 belum mencakup pembayaran. | **Perlu Test Suite Baru** |

---

## 2. Struktur Database Saat Ini

### 2.1. Tabel `payments` (`2026_11_16_000011_create_payments_table.php`)

| Kolom | Tipe | Null | Default | Keterangan / Constraint |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | No | Auto | Primary Key |
| `registration_id` | `BIGINT UNSIGNED` | No | — | FK → `registrations.id` (`ON DELETE RESTRICT`) |
| `amount` | `DECIMAL(12, 2)` | No | — | Nominal pembayaran |
| `payment_method` | `VARCHAR(50)` | Yes | `NULL` | Metode pembayaran |
| `payment_proof_path` | `VARCHAR(255)` | Yes | `NULL` | Path bukti transfer manual (private storage) |
| `status` | `ENUM('pending', 'verified', 'rejected')` | No | `'pending'` | Status verifikasi manual |
| `rejection_reason` | `TEXT` | Yes | `NULL` | Alasan penolakan manual |
| `verified_by` | `BIGINT UNSIGNED` | Yes | `NULL` | FK → `users.id` (`ON DELETE SET NULL`) |
| `verified_at` | `DATETIME` | Yes | `NULL` | Waktu verifikasi |
| `created_at` | `TIMESTAMP` | Yes | — | Standar Laravel |
| `updated_at` | `TIMESTAMP` | Yes | — | Standar Laravel |

**Indeks:** `INDEX (registration_id, status)`

### 2.2. Tabel Terkait Lainnya

- **`competitions` (`2026_11_16_000004`)**:
  - Sudah memiliki `registration_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00`.
  - Memiliki `status` enum (`draft`, `published`, `registration_open`, `registration_closed`, `ongoing`, `completed`, `archived`), `registration_start`, `registration_deadline`, `registration_type` (`individual`, `team`).
- **`registrations` (`2026_11_16_000007` & `2026_11_16_000018`)**:
  - `registration_number VARCHAR(64) UNIQUE` (format `ITC-YYYY-XXXXX`).
  - `competition_id`, `participant_id` (nullable), `team_id` (nullable).
  - Check constraint `chk_registration_subject`: tepat salah satu dari `participant_id` atau `team_id` wajib terisi.
  - Virtual columns `active_participant_id` dan `active_team_id` dengan unique index mencegah duplikasi pendaftaran aktif per kompetisi.
  - `status ENUM('draft', 'submitted', 'under_review', 'revision_required', 'approved', 'rejected', 'cancelled')`.
- **`event_settings` (`2026_11_16_000017`)**:
  - `event_id` (FK → `events.id`), `setting_key VARCHAR(100)`, `setting_value LONGTEXT`, `UNIQUE (event_id, setting_key)`.
- **`notifications` (`2026_11_16_000015`)**:
  - `user_id` (FK → `users.id`), `title`, `message`, `type VARCHAR(50)`, `action_url`, `read_at`.
- **`activity_logs` (`2026_11_16_000016`)**:
  - `user_id` (nullable, FK → `users.id` `ON DELETE SET NULL`), `action VARCHAR(100)`, `entity_type VARCHAR(100)`, `entity_id`, `old_values JSON`, `new_values JSON`, `ip_address`, `user_agent`, `created_at`.

---

## 3. Kekurangan yang Harus Diperbaiki

1. **Ketidaksinkronan Kode Pembayaran Prototipe vs Skema Aktif**:
   - `PaymentService.php`, `Participant\PaymentController.php`, `Admin\PaymentController.php`, `PaymentResource.php`, `PaymentPolicy.php`, `PaymentTest.php`, dan `frontend/src/services/paymentService.js` tidak dapat berjalan sama sekali karena memakai nama kolom (`user_id`, `proof_path`, `reviewed_by`, `title`, `code`), nama enum (`PaymentStatus::Approved`), dan method model yang sudah tidak ada.
2. **Tidak Adanya Identifikasi Transaksi Gateway (`order_id` & Idempotency)**:
   - Tabel `payments` tidak memiliki `order_id` unik yang menjadi kunci utama integrasi Midtrans Snap dan idempotensi webhook.
3. **Tidak Adanya Status Transaksi Midtrans**:
   - Status saat ini hanya `pending`, `verified`, `rejected`. Untuk Midtrans Snap dibutuhkan status yang jelas untuk transaksi menunggu pembayaran (`pending`), berhasil dibayar (`paid`), kedaluwarsa (`expired`), dibatalkan (`cancelled`), gagal (`failed`), dan jika diperlukan verifikasi/rekonsiliasi (`refunded` opsional atau ditangani admin).
4. **Tidak Adanya Audit Trail & Payload Webhook**:
   - Tidak ada kolom penyimpanan `midtrans_transaction_id`, `payment_type`, `fraud_status`, `paid_at`, `expired_at`, maupun `raw_response`/`webhook_payload` untuk keperluan rekonsiliasi jika terjadi sengketa pembayaran.
5. **Admin Tidak Dapat Mengatur Biaya Kompetisi via UI**:
   - `Admin/CompetitionsPage.tsx` tidak menyediakan field input `registration_fee` pada modal tambah/edit kompetisi meskipun API backend sudah mendukungnya.
6. **Tidak Ada Kontrol Feature Flag Pembayaran yang Konsisten**:
   - `event_settings` menyimpan `payment_enabled`, tetapi belum ada helper/endpoint terpusat yang menegakkan apakah modul pembayaran aktif di backend maupun memberi tahu frontend.
7. **Tidak Ada Endpoint & UI Peserta/Admin untuk Pembayaran**:
   - Tidak ada endpoint pembuatan Snap Token, polling/sinkronisasi status transaksi, webhook receiver, daftar/detail transaksi peserta, maupun halaman manajemen pembayaran admin (`/admin/payments`).
8. **Notifikasi Pendaftaran Tim**:
   - Pada pendaftaran bertipe `team`, `participant_id` bernilai `null`. Sistem notifikasi pembayaran wajib menentukan target penerima notifikasi melalui `user_id` pembuat transaksi, `team->leader_id`, dan/atau seluruh anggota tim.

---

## 4. Rekomendasi Perubahan Database

Sesuai prinsip integritas `DATABASE.md` dan `AGENTS.md`:
- **Jangan menghapus tabel atau mengubah constraint `ON DELETE RESTRICT` pada `payments.registration_id`**.
- **Gunakan migrasi baru (additive `ALTER TABLE`)** agar data existing dan riwayat migrasi tetap aman.
- **Pertahankan struktur relasi `registrations` (`1 : N` terhadap `payments`)**, karena satu pendaftaran dapat memiliki lebih dari satu percobaan transaksi (misal transaksi pertama `expired` atau `cancelled`, lalu peserta membuat transaksi baru dengan `order_id` baru), namun hanya **maksimal satu** transaksi yang boleh berstatus `paid` (lunas).

### 4.1. Rancangan Migrasi Tambahan pada Tabel `payments`

Buat migrasi baru, misalnya `update_payments_table_for_midtrans`:

| Kolom Baru / Diubah | Tipe Data | Null | Default | Keterangan |
|---|---|---|---|---|
| `user_id` | `BIGINT UNSIGNED` | Yes | `NULL` | FK → `users.id` (`ON DELETE SET NULL`). Aktor (peserta / ketua tim) yang menginisiasi transaksi. |
| `order_id` | `VARCHAR(100)` | Yes | `NULL` | **UNIQUE**. ID order unik untuk Midtrans, misal format: `ITC-PAY-{REG_ID}-{TIMESTAMP}-{RAND5}`. *(Nullable pada level DDL untuk kompatibilitas backward dengan baris historis bila ada; wajib diisi non-null pada setiap transaksi Midtrans baru).* |
| `gateway` | `VARCHAR(30)` | No | `'midtrans'` | Penanda provider (`midtrans`). |
| `snap_token` | `VARCHAR(255)` | Yes | `NULL` | Token Snap Midtrans untuk memanggil `window.snap.pay(token)`. |
| `snap_redirect_url` | `VARCHAR(500)` | Yes | `NULL` | URL fallback redirect Snap jika popup diblokir browser. |
| `payment_type` | `VARCHAR(50)` | Yes | `NULL` | Kanal aktual dari Midtrans (misal `bank_transfer`, `qris`, `gopay`, `echannel`, `credit_card`). |
| `midtrans_transaction_id` | `VARCHAR(100)` | Yes | `NULL` | `transaction_id` unik dari Midtrans (di-index). |
| `midtrans_transaction_status` | `VARCHAR(50)` | Yes | `NULL` | Status mentah dari Midtrans (`pending`, `settlement`, `capture`, `deny`, `cancel`, `expire`, `refund`). |
| `fraud_status` | `VARCHAR(30)` | Yes | `NULL` | Hasil FDS Midtrans (`accept`, `challenge`, `deny`). |
| `status` *(diperluas)* | `VARCHAR(30)` atau `ENUM` | No | `'pending'` | Nilai kanonis: `'pending'`, `'paid'`, `'expired'`, `'cancelled'`, `'failed'`, `'verified'`, `'rejected'` (pertimbangkan `VARCHAR(30)` agar fleksibel di MySQL & SQLite tanpa `ALTER ENUM` berulang, tetap divalidasi ketat lewat PHP Enum `PaymentStatus`). |
| `paid_at` | `DATETIME` | Yes | `NULL` | Waktu transaksi dinyatakan lunas (`settlement` / `capture` accept). |
| `expired_at` | `DATETIME` | Yes | `NULL` | Batas waktu pembayaran Snap/VA. |
| `webhook_payload` | `JSON` | Yes | `NULL` | Snapshot payload webhook terakhir (disanitasi, tanpa kredensial). |
| `last_webhook_at` | `DATETIME` | Yes | `NULL` | Timestamp penerimaan webhook terakhir. |

**Indeks & Constraint Tambahan:**
- `UNIQUE (order_id)`
- `INDEX (midtrans_transaction_id)`
- `INDEX (status, created_at)`
- `INDEX (registration_id, status)`
- **Pencegahan Double-Paid (MySQL Virtual Column)**: Sama seperti pola migrasi `2026_11_16_000018`, dapat ditambahkan kolom virtual atau validasi transaksi + `lockForUpdate()` pada row `registrations` agar dalam kondisi konkuren tidak mungkin ada 2 baris `payments` untuk `registration_id` yang sama dengan status lunas (`paid`/`verified`).
  - Contoh MySQL virtual column:
    `paid_registration_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status IN ('paid', 'verified') THEN registration_id ELSE NULL END) VIRTUAL`
    `UNIQUE KEY uq_payment_single_paid_registration (paid_registration_id)`

> **Catatan Dokumentasi:** Kolom lama (`payment_proof_path`, `rejection_reason`, `verified_by`, `verified_at`) **tetap dipertahankan** agar tidak merusak skema atau data lama (`AGENTS.md`: *Do not destroy existing data without approval*).

---

## 5. Rancangan Service, Enum, Policy, Resource, dan Controller

### 5.1. Enum `App\Enums\PaymentStatus`

```text
PaymentStatus: string
- PENDING   = 'pending'     // Menunggu pembayaran peserta di Midtrans
- PAID      = 'paid'        // Lunas (settlement / capture accept)
- EXPIRED   = 'expired'     // Kedaluwarsa melewati batas waktu Midtrans
- CANCELLED = 'cancelled'   // Dibatalkan oleh peserta atau Midtrans
- FAILED    = 'failed'      // Ditolak / gagal (deny / fraud)
- VERIFIED  = 'verified'    // Kompatibilitas verifikasi manual (jika pernah ada)
- REJECTED  = 'rejected'    // Kompatibilitas penolakan manual
```

Helper methods pada `PaymentStatus`:
- `isPaid(): bool` → `in_array($this, [self::PAID, self::VERIFIED], true)`
- `isFinal(): bool` → `in_array($this, [self::PAID, self::VERIFIED, self::EXPIRED, self::CANCELLED, self::FAILED, self::REJECTED], true)`
- `isRetryable(): bool` → `in_array($this, [self::EXPIRED, self::CANCELLED, self::FAILED, self::REJECTED], true)`
- `label(): string` → Label Bahasa Indonesia yang konsisten.

### 5.2. Konfigurasi `backend/config/midtrans.php`

Menggunakan environment variables (bukan hardcoded) dengan pemisahan kunci sesuai standar keamanan Midtrans terbaru (per 28 Oktober 2026):
- `server_key` → `env('MIDTRANS_SERVER_KEY')` *(hanya untuk autentikasi HTTP Basic Auth request API ke Midtrans)*
- `signature_secret` → `env('MIDTRANS_SIGNATURE_SECRET')` *(khusus untuk verifikasi `signature_key` webhook SHA-512; **tidak boleh** menggunakan `server_key` sebagai pengganti jika akun memakai Signature Secret Key terpisah)*
- `client_key` → `env('MIDTRANS_CLIENT_KEY')` *(untuk frontend Snap.js)*
- `is_production` → `env('MIDTRANS_IS_PRODUCTION', false)` (**wajib `false` selama pengembangan**)
- `is_sanitized` → `env('MIDTRANS_IS_SANITIZED', true)`
- `is_3ds` → `env('MIDTRANS_IS_3DS', true)`
- `expiry_minutes` → `env('MIDTRANS_EXPIRY_MINUTES', 1440)` (24 jam default, atau mengikuti `registration_deadline` jika lebih dekat sesuai **PD-06**)
- `timeout_seconds` → `env('MIDTRANS_TIMEOUT_SECONDS', 15)`
- `snap_url` → otomatis diturunkan dari `is_production` (`https://app.sandbox.midtrans.com/snap/v1/transactions` vs `https://app.midtrans.com/snap/v1/transactions`), plus `api_base_url` (`https://api.sandbox.midtrans.com/v2` vs `https://api.midtrans.com/v2`).
- `snap_script_url` → `https://app.sandbox.midtrans.com/snap/snap.js` vs `https://app.midtrans.com/snap/snap.js`.

### 5.3. Service Layer

#### A. `App\Services\MidtransService`
Bertanggung jawab eksklusif untuk komunikasi HTTP dengan Midtrans API menggunakan **Laravel HTTP Client (`Illuminate\Support\Facades\Http`)** tanpa paket `midtrans/midtrans-php` (sesuai keputusan **PD-04**):
- `createSnapTransaction(array $payload): array` → Mengirim `POST /snap/v1/transactions` dengan `withBasicAuth($serverKey, '')` dan mengembalikan `['token' => ..., 'redirect_url' => ...]`.
- `getTransactionStatus(string $orderId): array` → Memanggil `GET /v2/{order_id}/status` ke Midtrans untuk sinkronisasi manual atau pasca-popup (Fase 2).
- `cancelTransaction(string $orderId): array` → Opsional jika transaksi pending dibatalkan.
- `verifySignature(string $orderId, string $statusCode, string $grossAmount, string $signatureKey): bool` → Menggunakan `hash_equals()` terhadap `hash('sha512', $orderId . $statusCode . $grossAmount . config('midtrans.signature_secret'))`. Wajib menolak jika `signature_secret` kosong (tidak pernah fallback diam-diam ke `server_key`).
- `getPublicConfig(): array` → Mengembalikan `client_key`, `snap_script_url`, dan `is_production` (JANGAN pernah mengekspos `server_key` atau `signature_secret`).

#### B. `App\Services\PaymentService` (Refactor Total)
Menangani seluruh aturan bisnis pembayaran dalam `DB::transaction()`:
1. `isPaymentEnabled(?int $eventId = null): bool`:
   - Mengecek `EventSetting` untuk key `payment_enabled` (`'true'` / `'1'`), dengan fallback aman `false` (**PD-07**).
2. `createOrReuseSnapPayment(User $user, Registration $registration): array`:
   - Memastikan modul pembayaran aktif (`409` jika dinonaktifkan — **PD-07**).
   - Memastikan kepemilikan registrasi (`RegistrationPolicy` / owner / team leader — pada registrasi tim, **hanya ketua tim** yang dapat menginisiasi pembayaran sesuai **PD-05**).
   - Memastikan status registrasi valid untuk dibayar: hanya `submitted` atau `under_review` (sudah dikirim dan belum disetujui/ditolak/dibatalkan sesuai **PD-01**).
   - Menghitung nominal **100% dari backend**: `(float) $registration->competition->registration_fee` (konversi integer IDR untuk Midtrans `gross_amount`).
   - Menolak jika `registration_fee <= 0` (`422` — *"Kompetisi ini gratis dan tidak memerlukan pembayaran"*).
   - Menggunakan `DB::transaction()` + `lockForUpdate()` (non-SQLite) pada `$registration`:
     - Jika sudah ada payment berstatus `paid`/`verified` → tolak dengan `409 Conflict` (*"Pendaftaran ini sudah lunas"*).
     - Menghitung batas kedaluwarsa (**PD-06**): `min(now()->addMinutes(expiry_minutes), $competition->registration_deadline)`. Menolak (`422`) bila `registration_deadline` sudah lewat.
     - Jika sudah ada payment berstatus `pending` yang masih aktif (`expired_at->isFuture()`) dan nominalnya cocok dengan `registration_fee`: **kembalikan payment existing** (`created = false`, HTTP `200`).
     - Jika payment `pending` lama sudah lewat `expired_at`, tandai sebagai `expired`. Jika nominal kompetisi berubah, tandai `cancelled`. Lalu buat transaksi baru.
     - Generate `order_id` unik: `ITC-PAY-{$registration->id}-` . `now()->format('YmdHis')` . `-` . `Str::upper(Str::random(5))`.
     - Panggil Midtrans Snap API, simpan record `Payment` dengan status `pending`, `snap_token`, `snap_redirect_url`, `expired_at`.
     - Catat `ActivityLogService::log('payment.create', 'Payment', $payment->id, ...)` untuk jejak audit.
3. `syncPaymentStatusFromMidtrans(Payment $payment, ?User $actor = null): Payment` *(Fase 2)*:
   - Memanggil `MidtransService::getTransactionStatus($payment->order_id)`.
   - Meneruskan ke method terpusat `applyMidtransStatusUpdate($payment, $payload, $actor, 'sync')`.
4. `handleWebhook(array $payload): Payment` *(Fase 2)*:
   - Validasi kelengkapan field (`order_id`, `status_code`, `gross_amount`, `signature_key`, `transaction_status`).
   - Verifikasi `signature_key` via `MidtransService::verifySignature()` menggunakan `MIDTRANS_SIGNATURE_SECRET`. Jika tidak valid → catat warning log & lempar exception `403`.
   - Dalam `DB::transaction()` dengan `Payment::where('order_id', $orderId)->lockForUpdate()->first()`:
     - Jika tidak ditemukan → lempar `404`.
     - Verifikasi `gross_amount` (perbandingan numerik/integer IDR terhadap `(int) round($payment->amount)`). Jika mismatch → catat `Log::critical` dan tolak pembaruan status ke `paid`!
     - Cek **idempotency**: jika status saat ini sudah `paid`/`verified` dan notifikasi masuk lagi untuk status sukses yang sama (atau status final yang tidak boleh mundur), kembalikan langsung tanpa menimpa `paid_at` atau mengirim notifikasi ganda!
     - Panggil `applyMidtransStatusUpdate(...)`.
5. `applyMidtransStatusUpdate(...)` *(Fase 2)*:
   - Mapping status Midtrans → `PaymentStatus` internal (lihat Bagian 7).
   - **JANGAN PERNAH mengubah `registrations.status` menjadi `approved` secara otomatis**. Status registrasi tetap terpisah.
   - Pada `RegistrationService::updateStatus()` (**PD-02 Strict**): jika `targetStatus === approved` dan `registration_fee > 0`, wajib memverifikasi `$registration->hasPaidPayment()` (`paid` atau `verified`) **tanpa bergantung pada nilai `event_settings.payment_enabled`**. Kompetisi gratis (`registration_fee = 0`) tetap dapat disetujui tanpa pembayaran.
   - Catat ke `ActivityLogService::log(...)` bila terjadi transisi status.
   - Kirim `App\Models\Notification` ke peserta individu atau ketua + anggota tim jika status berubah menjadi `paid`, `expired`, atau `failed`.

### 5.4. Policy, Resource, dan Controller

- **`PaymentPolicy`**:
  - `view(User $user, Payment $payment)`: `true` jika `$user->isAdmin()`, atau `$payment->user_id === $user->id`, atau `$payment->registration->participant_id === $user->id`, atau `$user` adalah anggota `team` terkait.
  - `create(User $user, Registration $registration)`: `true` jika `$registration->participant_id === $user->id` atau `$registration->team?->leader_id === $user->id`.
  - `sync(User $user, Payment $payment)`: sama dengan `view` (atau `create` / admin).
- **`PaymentResource`**:
  - Mengembalikan struktur bersih sesuai `API.md` dan data aktual:
    `id`, `order_id`, `registration_id`, `status`, `status_label`, `amount`, `gateway`, `payment_type`, `payment_method`, `snap_token` (hanya untuk pemilik saat status `pending`), `snap_redirect_url`, `midtrans_transaction_id`, `midtrans_transaction_status`, `fraud_status`, `paid_at`, `expired_at`, `created_at`, `registration` (ringkas: `id`, `registration_number`, `status`, `competition`, `team`), `payer` (`user`).
- **`RegistrationResource`**:
  - Tambahkan field opsional (menggunakan `whenLoaded`):
    - `latest_payment` → `new PaymentResource($this->whenLoaded('latestPayment'))`
    - `payment_summary` (atau `is_paid`: boolean diturunkan dari relasi bila dimuat)
- **Controllers**:
  - `App\Http\Controllers\Api\Participant\PaymentController` (extends `Controller`, thin controller memakai `Gate::authorize`, `PaymentService`, `PaymentResource`).
  - `App\Http\Controllers\Api\Admin\PaymentController` (extends `Controller`, pagination, filter `competition_id`, `status`, `payment_type`, `date_from`, `date_to`, `search`, detail, sync, export CSV).
  - `App\Http\Controllers\Api\Webhook\MidtransWebhookController` (extends `Controller`, tanpa auth Sanctum karena dipanggil server-to-server oleh Midtrans, dilindungi signature SHA-512 & rate limit).

---

## 6. Rancangan Endpoint API

Seluruh endpoint berada di bawah prefix `/api/v1` (`bootstrap/app.php`) dengan format envelope sesuai `API.md`.

### 6.1. Public / Config

| Metode | Endpoint | Middleware | Deskripsi |
|---|---|---|---|
| `GET` | `/api/v1/public/payment-config` | — (Publik aman) | Mengembalikan `payment_enabled` (boolean) dan `midtrans_client_key` + `snap_script_url` + `is_production` (hanya key publik client, **tidak pernah** `server_key`). |

### 6.2. Portal Peserta (`/api/v1/participant/payments*`)

Middleware: `['auth:sanctum', 'participant']`

| Metode | Endpoint | Deskripsi | Status Code | Fase |
|---|---|---|---|---|
| `GET` | `/api/v1/participant/payments` | Daftar riwayat transaksi pembayaran milik peserta / timnya (terpaginasi). | `200`, `401`, `403` | **Fase 1B** |
| `GET` | `/api/v1/participant/registrations/{registration}/payments` | Daftar transaksi pembayaran untuk satu registrasi tertentu. | `200`, `401`, `403`, `404` | **Fase 1B** |
| `POST` | `/api/v1/participant/registrations/{registration}/payments` | Membuat atau mengambil transaksi Snap aktif untuk `registration` (hanya peserta pemilik / ketua tim, status registrasi `submitted`/`under_review`). Nominal dihitung backend. | `200`/`201`, `401`, `403`, `404`, `409`, `422`, `502` | **Fase 1B** |
| `GET` | `/api/v1/participant/payments/{payment}` | Detail transaksi pembayaran (dicek via `PaymentPolicy::view`). | `200`, `401`, `403`, `404` | **Fase 1B** |
| `POST` | `/api/v1/participant/payments/{payment}/sync` | Sinkronisasi status transaksi ke Midtrans API (digunakan setelah popup Snap selesai/ditutup atau tombol "Cek Status"). | `200`, `401`, `403`, `404`, `502` | **Fase 2** |
| `POST` | `/api/v1/participant/payments/{payment}/cancel` | Membatalkan transaksi yang masih `pending` agar bisa membuat transaksi baru jika diperlukan. | `200`, `401`, `403`, `404`, `409` | **Fase 2** |

### 6.3. Panel Admin (`/api/v1/admin/payments*`)

Middleware: `['auth:sanctum', 'admin']`

| Metode | Endpoint | Deskripsi | Status Code |
|---|---|---|---|
| `GET` | `/api/v1/admin/payments` | Daftar transaksi terpaginasi + ringkasan metrik (total lunas, pending, total pendapatan terverifikasi) dengan filter `status`, `competition_id`, `payment_type`, `date_from`, `date_to`, `search`. | `200`, `401`, `403` |
| `GET` | `/api/v1/admin/payments/{payment}` | Detail transaksi, relasi registrasi/peserta/tim, `webhook_payload`, dan audit log terkait. | `200`, `401`, `403`, `404` |
| `POST` | `/api/v1/admin/payments/{payment}/sync` | Admin memicu sinkronisasi status langsung ke Midtrans API (`GET /v2/{order_id}/status`). | `200`, `401`, `403`, `404`, `502` |
| `GET` | `/api/v1/admin/reports/payments` | Ekspor data pembayaran terfilter ke format CSV (UTF-8 BOM + sanitasi anti CSV Formula Injection). | `200`, `401`, `403` |

### 6.4. Webhook Midtrans

| Metode | Endpoint | Middleware | Deskripsi |
|---|---|---|---|
| `POST` | `/api/v1/webhooks/midtrans` | `throttle:120,1` (Tanpa `auth:sanctum`, tanpa CSRF cookie karena di bawah `api` stateless group) | Menerima HTTP Notification dari server Midtrans, memverifikasi signature SHA-512, dan memperbarui status transaksi secara idempotent. |

> **Catatan Laravel Sanctum `statefulApi()`:** Karena `bootstrap/app.php` memanggil `$middleware->statefulApi()`, request API yang menyertakan header `Origin`/`Referer` dari `SANCTUM_STATEFUL_DOMAINS` akan dikenai CSRF verification. Server-to-server webhook dari Midtrans tidak membawa cookie sesi maupun `Referer` frontend, sehingga otomatis melewati validasi CSRF SPA, namun tetap disarankan memastikan rute `/api/v1/webhooks/midtrans` dikecualikan secara eksplisit jika ada konfigurasi CSRF tambahan.

---

## 7. Rancangan Webhook Midtrans

### 7.1. Alur Verifikasi & Pemrosesan Webhook

```text
Midtrans Server
   |
   | POST /api/v1/webhooks/midtrans
   | Body: { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status, payment_type, transaction_id, ... }
   v
[1] Validasi Payload Dasar (order_id, status_code, gross_amount, signature_key, transaction_status)
   |
   v
[2] Verifikasi Signature SHA-512:
   expected = hash('sha512', order_id . status_code . gross_amount . signature_secret)
   hash_equals(expected, signature_key) == true ?
   |-- NO  --> Log Warning (IP, order_id) --> Return HTTP 403 Forbidden
   |-- YES --> Lanjut
   v
[3] DB::transaction() + Payment::where('order_id', order_id)->lockForUpdate()->first()
   |-- Tidak ada --> Log Warning --> Return HTTP 404 Not Found
   |-- Ada       --> Lanjut
   v
[4] Verifikasi Nominal (gross_amount):
   (int) round((float) gross_amount) === (int) round((float) payment->amount) ?
   |-- NO  --> Log Critical (Potensi tampering / mismatch!) --> Return HTTP 400/422 (Jangan ubah jadi PAID)
   |-- YES --> Lanjut
   v
[5] Cek Idempotency & State Guard:
   - Jika payment->status sudah PAID / VERIFIED, dan notifikasi masuk kembali (settlement/capture duplicate):
     --> Simpan log info bahwa duplicate webhook diabaikan --> Return HTTP 200 OK
   - Jangan biarkan status PAID turun menjadi PENDING/EXPIRED oleh webhook yang terlambat datang (out-of-order).
   v
[6] Mapping Status Midtrans -> PaymentStatus Internal (lihat Tabel 7.2)
   Update: status, payment_type, midtrans_transaction_id, midtrans_transaction_status,
           fraud_status, paid_at (jika PAID), webhook_payload, last_webhook_at
   v
[7] Catat ActivityLog (entity: Payment, action: payment.status_updated, actor: null)
    Kirim Notifikasi In-App ke peserta / ketua tim (jika transisi ke PAID / EXPIRED / FAILED)
   v
[8] Return HTTP 200 OK { "success": true, "message": "Webhook processed" }
```

### 7.2. Matriks Pemetaan Status Midtrans

| `transaction_status` (Midtrans) | `fraud_status` | Status Internal (`PaymentStatus`) | Keterangan |
|---|---|---|---|
| `capture` | `accept` | `paid` | Kartu kredit berhasil di-capture dan aman |
| `capture` | `challenge` | `pending` | Menunggu tinjauan FDS Midtrans (jangan set lunas dulu) |
| `capture` | `deny` | `failed` | Ditolak oleh FDS |
| `settlement` | `accept` / `null` | `paid` | Dana terkonfirmasi masuk (VA, QRIS, e-wallet, dll.) |
| `pending` | — | `pending` | Menunggu pembayaran diselesaikan |
| `deny` | — | `failed` | Pembayaran ditolak bank/gateway |
| `cancel` | — | `cancelled` | Transaksi dibatalkan |
| `expire` | — | `expired` | Batas waktu pembayaran habis |
| `refund` | — | `cancelled` | Pengembalian dana penuh (`net_paid_amount = 0`). Histori transaksi & `paid_at` tetap utuh; `paid_registration_id` dicabut (`hasPaidPayment() = false`) |
| `partial_refund` | — | `rejected` / `paid` / `cancelled` | Evaluasi `refund_amount` & `net_paid_amount` terhadap biaya lomba: `paid` jika net >= fee, `rejected` jika `0 < net < fee` (perlu pelunasan ulang), `cancelled` jika akumulasi refund mencapai 100% (`net = 0`). Seluruh histori tercatat di `webhook_payload.reversal_history` |
| `chargeback` / `partial_chargeback` | — | `failed` | Dibedakan dari refund biasa: mencatat `payment.chargeback`/`payment.partial_chargeback`, alasan sengketa bank, `paid_registration_id` dicabut (`hasPaidPayment() = false`), dan histori tetap utuh |

### 7.3. Penanganan Error Webhook

- Kembalikan **HTTP 200 OK** untuk webhook duplikat yang valid agar Midtrans tidak melakukan *retry storm*.
- Kembalikan **HTTP 403** jika `signature_key` tidak valid.
- Kembalikan **HTTP 404** jika `order_id` tidak ditemukan (atau tangani secara aman sesuai kebijakan agar webhook uji coba Midtrans dashboard bisa terpantau di log).
- Kembalikan **HTTP 500** hanya jika terjadi kegagalan sistem/DB tak terduga sehingga Midtrans akan melakukan mekanisme *retry* otomatis.

---

## 8. Rancangan Integrasi Frontend Peserta

### 8.1. Pemuatan Midtrans Snap.js

- Buat utility helper `frontend/src/lib/midtrans.ts`:
  - Menerima `snapScriptUrl` (`https://app.sandbox.midtrans.com/snap/snap.js`) dan `clientKey` dari endpoint `/api/v1/public/payment-config` (atau `import.meta.env.VITE_MIDTRANS_CLIENT_KEY`).
  - Memuat `<script src="..." data-client-key="...">` secara dinamis satu kali ke `document.head` hanya ketika modul pembayaran aktif dan halaman membutuhkan Snap.
  - Menyediakan tipe TypeScript global `window.snap.pay(token, callbacks)`.

### 8.2. Penambahan Service & TypeScript Types

1. **`frontend/src/types/payment.ts`**:
   - Definisi interface `Payment`, `PaymentConfig`, `PaymentStatusType` (`'pending' | 'paid' | 'expired' | 'cancelled' | 'failed' | 'verified' | 'rejected'`).
   - Tambahkan field opsional `latest_payment?: Payment | null` pada interface `Registration` (`types/participant.ts`) dan `AdminRegistration` (`types/admin.ts`).
2. **`frontend/src/services/participantService.ts`**:
   - `getPaymentConfig()` → `GET /api/v1/public/payment-config`
   - `getPayments(params)` → `GET /api/v1/participant/payments`
   - `createOrGetPayment(registrationId)` → `POST /api/v1/participant/payments`
   - `getPayment(paymentId)` → `GET /api/v1/participant/payments/{id}`
   - `syncPayment(paymentId)` → `POST /api/v1/participant/payments/{id}/sync`
   - `cancelPayment(paymentId)` → `POST /api/v1/participant/payments/{id}/cancel`
3. *Cleanup Opsional Fase Implementasi*: Hapus/arsipkan file legacy `frontend/src/services/paymentService.js` agar tidak membingungkan.

### 8.3. Halaman & UI Peserta

1. **`frontend/src/pages/participant/RegistrationDetailPage.tsx`**:
   - Tampilkan format mata uang Rupiah yang rapi: `Rp ${Number(fee).toLocaleString('id-ID')}` (memperbaiki tampilan raw angka saat ini).
   - Hilangkan opsi manual `<option value="bukti_pembayaran">` ketika mode pembayaran Midtrans aktif.
   - Tambahkan **Panel Status Pembayaran** (muncul hanya jika `payment_enabled === true` dan `competition.registration_fee > 0`):
     - **Belum ada transaksi / Transaksi `expired`/`cancelled`/`failed`**:
       Menampilkan rincian biaya lomba dan tombol **"Bayar Sekarang"** (`#F47B20` primary CTA).
     - **Transaksi `pending`**:
       Menampilkan nomor `order_id`, batas waktu `expired_at`, tombol **"Lanjutkan Pembayaran"** (membuka Snap Popup dengan `snap_token` yang sama), dan tombol **"Cek Status Pembayaran"** (memanggil `syncPayment`).
     - **Transaksi `paid`**:
       Menampilkan badge hijau **"Lunas"**, `order_id`, `payment_type` (misal QRIS / BCA VA), dan waktu `paid_at`, serta catatan jelas bahwa pendaftaran tetap menunggu/mengikuti proses verifikasi berkas oleh panitia.
   - **Penanganan Callback `window.snap.pay(token, ...)`**:
     - `onSuccess`: Panggil `syncPayment(payment.id)` + `fetchDetail()` + tampilkan banner sukses *(tidak mengubah status secara sepihak di browser, tetap verifikasi ke backend)*.
     - `onPending`: Panggil `syncPayment(payment.id)` + `fetchDetail()` + tampilkan instruksi menunggu pembayaran.
     - `onError`: Tampilkan alert error ramah + opsi coba lagi/cek status.
     - `onClose`: Panggil `fetchDetail()` atau `syncPayment(payment.id)` secara silent untuk memastikan sinkronisasi.
2. **`frontend/src/pages/participant/RegistrationsPage.tsx`**:
   - Tampilkan badge ringkas status pembayaran pada setiap kartu registrasi berbayar jika `payment_enabled` aktif.
3. **`frontend/src/pages/participant/PaymentsPage.tsx`** (`/participant/payments`, ditambahkan di `ParticipantLayout.tsx` secara kondisional jika `payment_enabled` aktif):
   - Halaman riwayat seluruh transaksi pembayaran peserta/tim, status, detail `order_id`, dan aksi bayar ulang / cek status.

---

## 9. Rancangan Halaman Admin Pembayaran

1. **Menu & Route `/admin/payments`**:
   - Tambahkan route `/admin/payments` di `frontend/src/App.tsx` dan item navigasi **"Pembayaran"** di `frontend/src/components/layout/AdminLayout.tsx`.
2. **Halaman `frontend/src/pages/admin/PaymentsPage.tsx`**:
   - **Summary Cards**: Total Transaksi Lunas, Total Nominal Terkumpul (Rp), Transaksi Pending, Transaksi Gagal/Kedaluwarsa.
   - **Filter & Pencarian**: Filter berdasarkan Cabang Kompetisi, Status Pembayaran (`pending`, `paid`, `expired`, `cancelled`, `failed`), Metode Pembayaran (`payment_type`), Rentang Tanggal, serta Pencarian (`order_id`, `registration_number`, nama/email peserta, nama tim).
   - **Tabel Responsif**: Nomor Order (`order_id`), No. Registrasi (tautan ke `/admin/registrations/:id`), Peserta/Tim, Kompetisi, Nominal, Metode/Kanal, Status Pembayaran, Waktu Lunas, dan Tombol Aksi (**Detail** & **Sinkronisasi Status Midtrans**).
   - **Modal Detail Transaksi**: Menampilkan metadata Midtrans (`midtrans_transaction_id`, `midtrans_transaction_status`, `fraud_status`), riwayat waktu (`created_at`, `expired_at`, `paid_at`, `last_webhook_at`), dan tombol **"Sinkronisasi ke Midtrans"**.
   - **Ekspor CSV**: Tombol unduh laporan pembayaran CSV dengan proteksi anti-formula injection.
3. **Pembaruan Halaman Admin Terkait**:
   - **`Admin/CompetitionsPage.tsx`**: Tambahkan input **`Biaya Pendaftaran (Rp)` (`registration_fee`)** pada modal Tambah & Edit Cabang Kompetisi (default `0` untuk gratis) serta tampilkan biaya di daftar tabel kompetisi.
   - **`Admin/RegistrationDetailPage.tsx`**: Tambahkan kartu ringkasan status pembayaran registrasi (`order_id`, nominal, status lunas/pending) dengan tautan ke `/admin/payments` agar panitia dapat mengecek kelengkapan pembayaran sebelum klik *Approve* pendaftaran.
   - **`Admin/SettingsPage.tsx`**: Tampilkan status konfigurasi modul pembayaran (aktif/nonaktif serta mode Sandbox/Production Midtrans yang read-only dari environment backend demi keamanan).

---

## 10. Alur Bisnis dari Registrasi Sampai Pembayaran

### 10.1. Pemisahan State Machine (Aturan Wajib)

Status **Registrasi** (`registrations.status`) dan status **Pembayaran** (`payments.status`) **harus terpisah** dan tidak boleh dicampur:
- **Status Registrasi Kanonis (Tetap Dipertahankan)**:
  `draft` → `submitted` → `under_review` → `revision_required` / `approved` / `rejected` (`cancelled`).
- **Status Pembayaran**:
  `pending` → `paid` / `expired` / `cancelled` / `failed`.
- **Aturan Kritis**:
  - Pembayaran `paid` **TIDAK** otomatis mengubah `registrations.status` menjadi `approved`. Admin tetap harus memverifikasi berkas persyaratan peserta (KTM, surat delegasi, dll.) secara eksplisit.
  - Kompetisi dengan `registration_fee == 0` melewati proses pembayaran sepenuhnya (`Gratis`).

### 10.2. Diagram Alur End-to-End (Registrasi → Pembayaran → Verifikasi Admin)

```text
+-------------------+       +------------------------+       +---------------------+
|  Peserta / Ketua  |       |    Backend Laravel     |       |   Midtrans Snap     |
+---------+---------+       +-----------+------------+       +----------+----------+
          |                             |                               |
          | 1. Buat Draft Registrasi    |                               |
          |    POST /registrations      |                               |
          |---------------------------->| status = 'draft'              |
          |                             |                               |
          | 2. Unggah Dokumen & Submit  |                               |
          |    POST .../documents       |                               |
          |    POST .../submit          |                               |
          |---------------------------->| status = 'submitted'          |
          |                             |                               |
          | 3. Cek Biaya > 0?           |                               |
          |    Klik "Bayar Sekarang"    |                               |
          |    POST /payments           |                               |
          |---------------------------->| Lock reg, cek fee dari DB,    |
          |                             | cek belum ada status PAID     |
          |                             | Request Snap Token ---------->|
          |                             |<-- snap_token & redirect_url -|
          |<-- Return Payment (pending)-| Simpan payment (pending)      |
          |                             |                               |
          | 4. Buka window.snap.pay()   |                               |
          |============================================================>|
          |    Peserta pilih VA/QRIS/EW |                               |
          |    & selesaikan pembayaran  |                               |
          |<== Callback onSuccess() ====|                               |
          |                             |                               |
          | 5a. SPA panggil /sync       | 5b. Webhook Notification      |
          |---------------------------->|     POST /webhooks/midtrans   |
          |                             |<------------------------------|
          |                             | Verifikasi SHA-512 & Nominal  |
          |                             | Idempotent Lock -> status='paid'
          |                             | Log Activity + Notifikasi     |
          |<-- Return Payment (paid) ---|                               |
          |                             |                               |
          | 6. Admin Tinjau Pendaftaran |                               |
          |    Cek Dokumen + Cek Status |                               |
          |    Pembayaran = 'paid'      |                               |
          |    PATCH .../status=approved|                               |
          |---------------------------->| registration.status='approved'|
          |                             | (Peserta boleh submit karya)  |
```

*(Sesuai keputusan final **PD-01** & **PD-02**, pembayaran dilakukan setelah `submitted` dan sebelum admin `approved`, dan admin wajib memastikan status pembayaran `paid` sebelum approval lomba berbayar).*

---

## 11. Keamanan dan Potensi Risiko

| No | Risiko / Ancaman | Dampak | Mitigasi Wajib |
|---|---|---|---|
| 1 | **Manipulasi Nominal (`Price Tampering`)** | Peserta mengirim `amount: 1` lewat API. | Backend mengabaikan total input `amount` dari klien; `amount` **selalu** diambil dari `competitions.registration_fee` di database. Webhook juga memvalidasi `gross_amount == payment.amount`. |
| 2 | **IDOR (Mengakses / Membayar / Sync Transaksi Orang Lain)** | Peserta A melihat `snap_token` atau riwayat transaksi Peserta B. | Terapkan `PaymentPolicy` (`Gate::authorize`) pada semua endpoint `show`, `sync`, `cancel`, dan `create`. Cek `participant_id` atau keanggotaan tim aktif. |
| 3 | **Spoofing / Pemalsuan Webhook Midtrans** | Penyerang mengirim JSON `settlement` palsu ke `/api/v1/webhooks/midtrans`. | Validasi `signature_key` menggunakan `hash_equals(hash('sha512', order_id . status_code . gross_amount . signature_secret), $signatureKey)` dengan `MIDTRANS_SIGNATURE_SECRET` terpisah (standar Midtrans per 28 Okt 2026) + catat IP pengirim di log. |
| 4 | **Webhook Ganda / Out-of-Order / Race Condition** | Double notification, status `paid` tertimpa oleh `pending`/`expire` yang datang terlambat, atau 2 payment lunas untuk 1 registrasi. | Gunakan `DB::transaction()` + `lockForUpdate()`, guard state terminal (`paid` tidak bisa turun ke `pending`/`expired`), dan unique constraint `order_id` + virtual column single-paid per `registration_id`. |
| 5 | **Kebocoran `MIDTRANS_SERVER_KEY` & `MIDTRANS_SIGNATURE_SECRET`** | Penyerang dapat membuat transaksi/signature palsu. | Simpan `MIDTRANS_SERVER_KEY` dan `MIDTRANS_SIGNATURE_SECRET` hanya di `.env` backend. Jangan pernah mengirimnya ke API resource, log, atau frontend (`VITE_*` / public config hanya boleh menyimpan `client_key`). |
| 6 | **Ketergantungan pada Callback Browser (`onSuccess` Snap)** | Peserta memodifikasi JS client untuk memicu endpoint sukses tanpa membayar. | Callback Snap di frontend hanya digunakan sebagai trigger UI untuk memanggil `/sync` yang bertanya langsung ke server Midtrans (`GET /v2/{order_id}/status`), bukan mempercayai payload dari browser. |
| 7 | **Salah Environment (Production Key di Dev)** | Uang asli terpotong saat pengujian development. | Set `MIDTRANS_IS_PRODUCTION=false` di `.env.example` dan guard di service/test agar URL mengarah ke `sandbox.midtrans.com`. |
| 8 | **Webhook Terblokir oleh CSRF Sanctum atau Rate Limit Terlalu Ketat** | Midtrans gagal mengirim notifikasi `settlement`. | Pastikan route `/api/v1/webhooks/midtrans` tidak mewajibkan autentikasi Sanctum/CSRF session dan memiliki rate limit cukup (`throttle:120,1`) serta tidak mengembalikan error 500 pada retry duplikat. |
| 9 | **Perubahan `registration_fee` Saat Ada Transaksi Berjalan** | Peserta bayar nominal lama setelah admin menaikkan harga. | Simpan snapshot `amount` di tabel `payments` saat transaksi dibuat; jika transaksi `pending` dan harga di kompetisi berubah, batalkan transaksi lama saat peserta meminta token baru. |
| 10 | **CSV Formula Injection pada Ekspor Laporan Keuangan** | Eksekusi formula berbahaya saat admin membuka ekspor CSV pembayaran di Excel. | Terapkan sanitasi prefix `'` untuk karakter awal `=`, `+`, `-`, `@`, `\t`, `\r` sama seperti pada `Admin\RegistrationController::exportCsv()`. |

---

## 12. Rencana Testing

Pengujian akan menggantikan/memperbarui suite test prototipe lama yang error dan menambahkan cakupan menyeluruh:

### 12.1. Backend Feature & Unit Tests (PHPUnit, SQLite `:memory:` + `Http::fake()`)

1. **`PaymentServiceTest` (Unit)**:
   - Menghitung nominal dari `competitions.registration_fee` (mengabaikan manipulasi input).
   - Menolak pembuatan pembayaran untuk kompetisi gratis (`registration_fee = 0`).
   - Mengembalikan transaksi `pending` yang masih valid (token reuse) alih-alih membuat order duplikat.
   - Membuat transaksi baru jika transaksi sebelumnya `expired` / `cancelled` / `failed`.
   - Menolak pembuatan transaksi baru jika sudah ada pembayaran berstatus `paid`.
   - Verifikasi kalkulasi dan validasi signature SHA-512.
2. **`ParticipantPaymentApiTest` (Feature)**:
   - Peserta individu berhasil membuat transaksi Snap dan menerima `order_id` + `snap_token`.
   - Ketua tim berhasil membuat transaksi Snap untuk registrasi tim; anggota non-ketua ditolak (sesuai policy).
   - Peserta B ditolak (`403 Forbidden`) saat mengakses `GET /payments/{id}`, `POST /payments/{id}/sync`, atau membuat payment untuk registrasi Peserta A.
   - Admin ditolak (`403`) di endpoint participant (`EnsureParticipant`), dan unauthenticated mendapat `401`.
   - Sinkronisasi status (`POST .../sync`) memperbarui status dari `pending` ke `paid` berdasarkan respons API Midtrans (mocked via `Http::fake()`).
   - Pembayaran lunas (`paid`) **tidak** otomatis mengubah `registrations.status` menjadi `approved`.
3. **`MidtransWebhookTest` (Feature)**:
   - Webhook dengan signature valid dan `transaction_status = settlement` mengubah status payment menjadi `paid`, mengisi `paid_at`, mencatat `activity_logs`, dan mengirim `notifications` ke peserta/tim.
   - Webhook `capture` dengan `fraud_status = challenge` menjaga status tetap `pending`.
   - Webhook `expire` dan `deny` mengubah status menjadi `expired` dan `failed`.
   - Webhook dengan `signature_key` tidak valid ditolak dengan `403` dan status payment tidak berubah.
   - Webhook dengan `gross_amount` tidak cocok dengan `payment.amount` ditolak dan tidak mengubah status menjadi `paid`.
   - **Idempotency**: Pengiriman webhook `settlement` berulang kali untuk `order_id` yang sama tetap mengembalikan `200 OK`, tidak mengubah `paid_at` pertama, dan tidak mengirim notifikasi ganda.
   - **Out-of-order**: Webhook `pending` atau `expire` yang datang setelah status sudah `paid` tidak menurunkan status `paid`.
4. **`AdminPaymentApiTest` (Feature)**:
   - Admin dapat melihat daftar pembayaran dengan filter (`status`, `competition_id`, `search`, `date_from/to`).
   - Admin dapat melihat detail transaksi termasuk metadata Midtrans.
   - Admin dapat memicu `/sync` ke Midtrans API.
   - Admin dapat mengekspor CSV pembayaran dan sel yang diawali `=`, `+`, `-`, `@` tersanitasi.
   - Participant mendapat `403` pada seluruh endpoint `/admin/payments*`.

### 12.2. Frontend Tests / Verifikasi

1. Verifikasi TypeScript (`npx tsc -b`), Vite build (`npm run build`), dan `npm run lint` tanpa error.
2. Verifikasi alur UI dengan mock/API lokal (atau Vitest + React Testing Library jika disetujui dipasang):
   - Tampilan `RegistrationDetailPage` untuk kompetisi gratis vs berbayar.
   - Tombol **"Bayar Sekarang"** memanggil endpoint, mencegah double-click (`isLoading`), dan memicu `window.snap.pay`.
   - Penanganan error backend (`403`, `409`, `422`, `500`) pada halaman peserta dan admin.
   - Admin `CompetitionsPage` menyimpan `registration_fee` dengan benar, dan `Admin/PaymentsPage` merender daftar, filter, modal detail, serta tombol sync.

---

## 13. Daftar Keputusan Bisnis yang Telah Disetujui (Final)

Seluruh keputusan bisnis terkait **Q-001** (`OPEN_QUESTIONS.md`) telah disetujui secara final oleh Product Owner pada **25 November 2026**:

| ID | Pertanyaan Keputusan | Keputusan Final (Disetujui) | Status |
|---|---|---|---|
| **PD-01** | **Kapan peserta melakukan pembayaran?** | **Opsi A:** Pembayaran dilakukan **setelah** peserta mengirimkan pendaftaran (`submitted` / `under_review`) dan **sebelum** admin memberikan persetujuan (`approved`). | **Disetujui** |
| **PD-02** | **Apakah pembayaran `paid` wajib sebelum Admin melakukan `Approve`?** | **Ya (Wajib Lunas — Ketat):** Pendaftaran lomba berbayar (`registration_fee > 0`) wajib berstatus pembayaran `paid` (atau `verified`) sebelum admin dapat melakukan approval. Ketentuan ini tetap berlaku meskipun `event_settings.payment_enabled = false`. Lomba gratis (`registration_fee = 0`) disetujui tanpa pembayaran. | **Disetujui (Final)** |
| **PD-03** | **Metode pembayaran yang didukung?** | **Opsi A: Midtrans Snap saja** untuk implementasi saat ini (kanal pembayaran mengikuti akun merchant Midtrans). Kolom legacy transfer manual dipertahankan non-destructive untuk kompatibilitas data historis tanpa fitur upload bukti manual baru. | **Disetujui** |
| **PD-04** | **Cara integrasi backend ke Midtrans API?** | **Opsi A: Laravel `Http` Client** melalui `App\Services\MidtransService` (tanpa package `midtrans/midtrans-php`), menggunakan `Http::fake()` untuk automated testing, dengan pemisahan `MIDTRANS_SERVER_KEY` (API Auth), `MIDTRANS_SIGNATURE_SECRET` (Webhook SHA-512), dan `MIDTRANS_CLIENT_KEY` (Frontend Snap.js). | **Disetujui** |
| **PD-05** | **Hak pembayaran & visibilitas pada pendaftaran Tim?** | **Ketua Tim** berhak menginisiasi satu transaksi pembayaran untuk satu registrasi tim (maksimal 1 transaksi lunas per registrasi). Anggota tim dapat melihat status pembayaran. | **Disetujui** |
| **PD-06** | **Masa berlaku transaksi Snap (`expired_at`)?** | **24 jam (1440 menit)** atau **sampai batas akhir pendaftaran (`registration_deadline`)**, mana yang lebih dahulu. | **Disetujui** |
| **PD-07** | **Kontrol aktivasi modul pembayaran?** | Dikendalikan melalui `event_settings.payment_enabled` (default `false`), yang **hanya** mengontrol apakah peserta dapat membuat transaksi baru (serta visibilitas tombol bayar di frontend). Jika `false`, backend menolak transaksi baru, namun admin tetap tidak boleh menyetujui lomba berbayar yang belum lunas, dan lomba gratis tetap berjalan normal. | **Disetujui (Final)** |
| **PD-08** | **Pembaruan Dokumentasi Proyek?** | `PAYMENT_DESIGN.md`, `PAYMENT_IMPLEMENTATION.md`, `PRD.md`, `DATABASE.md`, `API.md`, dan `OPEN_QUESTIONS.md` diperbarui sesuai keputusan final. | **Disetujui** |

---

## 14. Manajemen Biaya Pendaftaran & Perlindungan Pendaftar Lama (KB-01 s.d. KB-03)

- **KB-01 (Pembaruan Biaya Kapan Saja)**: Admin dapat menginput dan mengubah `competitions.registration_fee` saat membuat atau mengedit cabang kompetisi (meski sudah ada pendaftar/transaksi), disertai peringatan di UI admin saat pendaftar sudah ada, pencatatan lengkap `ActivityLogService`, dan jaminan nominal transaksi lama (`payments.amount`) maupun riwayat reversal tidak pernah dimutasi atau dihapus.
- **KB-02 (Nominal Rupiah Bilangan Bulat)**: `registration_fee` divalidasi sebagai bilangan bulat Rupiah (`integer`, minimal `0`, maksimal `1.000.000.000`; `0` = Gratis; input create kosong otomatis menjadi `0`). Seluruh perhitungan nominal aplikasi memakai `App\Support\MoneyHelper` (integer Rupiah dan integer minor unit sen untuk evaluasi `partial_refund`) tanpa floating-point arithmetic.
- **KB-03 (Detail Kompetisi Read-Only)**: Dashboard `/admin/competitions` menyediakan modal detail cabang kompetisi read-only yang hanya menampilkan field model/API yang tersedia.
- **Perlindungan Pendaftar Lama (`registration_fee_snapshot`)**:
  - Setiap registrasi (individu maupun tim) mengunci `registrations.registration_fee_snapshot` (`DECIMAL(12,2)`, nullable) dan `fee_locked_at` dari baris `Competition` yang di-lock (`lockForUpdate()` dalam hierarki penguncian satu arah `events -> competitions -> registrations -> payments`) saat pembuatan draf di `RegistrationService::createDraft()`.
  - `PaymentService::createOrReuseSnapPayment()`, guard approval `PD-02` di `RegistrationService::updateStatus()`, dan evaluasi kecukupan `partial_refund` di `PaymentService::handlePostSettlementReversal()` mengacu ke `registration_fee_snapshot`, bukan biaya kompetisi terbaru.
  - Data historis dengan `registration_fee_snapshot = NULL` (Tier 3 ambigu) **tidak pernah fallback** ke biaya kompetisi terkini; checkout dan approval ditolak (`422`) sampai dikonfirmasi secara eksplisit melalui `registrations:confirm-fee-snapshot` (atau di-backfill deterministik melalui `registrations:backfill-fee-snapshots`).
