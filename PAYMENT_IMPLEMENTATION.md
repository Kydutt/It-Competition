# IT COMP --- Payment Gateway Implementation Guide

## Integrasi Midtrans Snap untuk Biaya Pendaftaran Kompetisi

**Dokumen:** `PAYMENT_IMPLEMENTATION.md`\
**Status:** Panduan implementasi lanjutan setelah Fase 0\
**Stack:** Laravel 13, React + TypeScript + Vite, MySQL, Laravel
Sanctum\
**Provider:** Midtrans Snap\
**Tujuan:** Pembayaran biaya pendaftaran kompetisi

------------------------------------------------------------------------

## 1. Tujuan dan aturan penggunaan dokumen

Dokumen ini menjadi sumber arahan implementasi pembayaran untuk AI
Agent, developer, dan reviewer setelah audit Fase 0 selesai.

Agent wajib membaca dokumen ini bersama:

-   `AGENTS.md`
-   `PRD.md`
-   `ARCHITECTURE.md`
-   `DATABASE.md`
-   `API.md`
-   `DEVELOPMENT.md`
-   `OPEN_QUESTIONS.md`
-   `PAYMENT_DESIGN.md` (hasil Fase 0)

Jika ada konflik, jangan memilih sendiri. Catat konflik, tunjukkan file
dan bagian yang bertentangan, lalu minta keputusan pemilik proyek.

### Aturan mutlak

1.  Jangan mengarang fitur, tabel, kolom, endpoint, status, atau aturan
    bisnis.
2.  Audit implementasi yang sudah ada sebelum mengubahnya. Entitas
    `payments` dan `PaymentService` mungkin sudah tersedia.
3.  Jangan membuat tabel pembayaran duplikat.
4.  Jangan menghapus migration lama atau mengubah riwayat migration
    hanya agar test berjalan.
5.  Jangan menggunakan cascade delete untuk mengakali relasi pembayaran
    atau registrasi.
6.  Jangan mengubah autentikasi Sanctum, role, atau workflow registrasi
    yang tidak terkait tanpa persetujuan.
7.  Jangan menandai registrasi `approved` hanya karena pembayaran
    berhasil.
8.  Jangan mempercayai nominal, status, order ID, atau identitas
    transaksi dari frontend.
9.  Jangan mengaktifkan transaksi Production selama pengembangan dan
    pengujian.
10. Kerjakan satu fase pada satu waktu. Setelah laporan fase selesai,
    berhenti dan tunggu persetujuan eksplisit.
11. Jangan mengklaim test, build, lint, atau browser E2E berhasil jika
    perintahnya tidak benar-benar dijalankan.
12. Jangan menghapus, menimpa, atau merapikan file yang tidak berkaitan
    dengan fase aktif.

------------------------------------------------------------------------

## 2. Konteks proyek yang harus dipertahankan

IT COMP adalah platform manajemen kompetisi dengan:

-   Backend Laravel 13.
-   Frontend React + TypeScript + Vite.
-   Database MySQL.
-   REST API dengan prefix `/api/v1`.
-   Authentication menggunakan Laravel Sanctum SPA/session.
-   Role: `participant` dan `admin`.
-   Modul registrasi peserta, tim, kompetisi, dokumen, submission,
    notifikasi, dan admin portal.
-   Modul pembayaran pernah direncanakan sebagai opsional dan nonaktif
    secara default.

### Keputusan arsitektur

**Status pembayaran dan status registrasi adalah dua domain berbeda.**

Pembayaran berhasil hanya membuktikan transaksi pembayaran berhasil.
Pembayaran tidak otomatis berarti dokumen valid, peserta memenuhi
syarat, atau registrasi disetujui admin.

Status registrasi kanonis yang sudah digunakan proyek:

-   `draft`
-   `submitted`
-   `under_review`
-   `revision_required`
-   `approved`
-   `rejected`
-   `cancelled`

Jangan menambah atau mengganti status registrasi untuk mewakili status
pembayaran.

Status pembayaran internal yang diusulkan untuk dipetakan ke
implementasi aktual:

-   `pending`
-   `paid`
-   `failed`
-   `expired`
-   `cancelled`
-   `refunded`

Daftar ini adalah rancangan awal. Sebelum implementasi, cocokkan dengan
enum, migration, model, dan aturan yang sudah ada. Jangan mengubah enum
atau data lama tanpa rencana migrasi yang aman.

------------------------------------------------------------------------

## 3. Keputusan bisnis yang sudah dikunci (Approved 25 Nov 2026)

Seluruh keputusan bisnis terkait Q-001 (`OPEN_QUESTIONS.md`) dan `PAYMENT_DESIGN.md` telah disetujui secara final oleh Product Owner:

1. **PD-01 (Waktu Pembayaran):** Pembayaran dilakukan **setelah** peserta mengirimkan pendaftaran (`submitted` / `under_review`) dan **sebelum** admin memberikan persetujuan (`approved`).
2. **PD-02 (Syarat Approval — Ketat):** Pendaftaran lomba berbayar (`registration_fee > 0`) wajib memiliki status pembayaran `paid` (atau `verified`) sebelum admin dapat melakukan `approved`, **meskipun `event_settings.payment_enabled = false`**. Kompetisi gratis (`registration_fee = 0`) tetap dapat disetujui tanpa pembayaran.
3. **PD-03 (Metode Pembayaran):** **Midtrans Snap saja** (Opsi A). Tidak ada fitur upload bukti transfer bank manual; kolom legacy di tabel `payments` dipertahankan non-destructive untuk kompatibilitas data historis.
4. **PD-04 (Integrasi Backend):** **Laravel HTTP Client** melalui `App\Services\MidtransService` tanpa menambah package `midtrans/midtrans-php`. Menggunakan `Http::fake()` untuk automated testing.
5. **PD-05 (Pendaftaran Tim):** Untuk pendaftaran tim, **ketua tim** berhak menginisiasi satu transaksi pembayaran untuk satu registrasi tim (maksimal 1 pembayaran lunas per registrasi). Anggota tim dapat melihat status pembayaran.
6. **PD-06 (Masa Berlaku Transaksi):** **24 jam (1440 menit)** atau sampai **batas akhir pendaftaran (`registration_deadline`)**, mana yang lebih dahulu.
7. **PD-07 (Aktivasi Modul):** Dikendalikan melalui `event_settings.payment_enabled` (default `false`). Pengaturan ini **hanya** mengontrol pembuatan transaksi baru dan tampilan tombol bayar di frontend: jika `false`, backend menolak pembuatan transaksi baru, admin tetap tidak boleh menyetujui lomba berbayar yang belum lunas, dan lomba gratis tetap diproses tanpa pembayaran.
8. **PD-08 (Dokumentasi):** `PAYMENT_DESIGN.md`, `PAYMENT_IMPLEMENTATION.md`, `PRD.md`, `DATABASE.md`, `API.md`, dan `OPEN_QUESTIONS.md` diperbarui sesuai keputusan final.
9. **Kompetisi Gratis:** Kompetisi dengan `registration_fee = 0` melewati proses pembayaran sepenuhnya.
10. **Snapshot Nominal:** Nominal ditentukan 100% di backend dari `competitions.registration_fee` dan menjadi nilai immutable pada order yang sudah dibuat.

------------------------------------------------------------------------

## 4. Provider dan mode integrasi

Gunakan **Midtrans Snap** untuk checkout.

Dokumentasi resmi yang harus menjadi rujukan implementasi:

-   Snap overview: https://docs.midtrans.com/docs/snap
-   Snap integration guide:
    https://docs.midtrans.com/docs/snap-snap-integration-guide
-   HTTP notification:
    https://docs.midtrans.com/docs/https-notification-webhooks
-   Transaction status:
    https://docs.midtrans.com/docs/transaction-status-cycle
-   Access keys: https://docs.midtrans.com/docs/access-keys

Agent wajib memeriksa dokumentasi resmi terkini sebelum implementasi
karena detail SDK, autentikasi, signature, dan payload dapat berubah.

### Prinsip integrasi

1.  Laravel membuat transaksi ke Midtrans.
2.  Laravel menyimpan catatan transaksi lokal.
3.  Laravel mengirim Snap token ke frontend.
4.  React membuka Snap checkout menggunakan token.
5.  Midtrans mengirim HTTP notification ke endpoint webhook Laravel.
6.  Laravel memverifikasi notifikasi dan memperbarui status pembayaran.
7.  Frontend membaca status terbaru dari API Laravel.

Redirect browser atau callback JavaScript dari Snap bukan bukti final
pembayaran berhasil. Webhook terverifikasi dan/atau pengecekan status
transaksi server-to-server menjadi dasar sinkronisasi.

------------------------------------------------------------------------

## 5. Konfigurasi environment

Nama variabel berikut adalah rancangan. Samakan dengan konvensi
konfigurasi proyek dan dokumentasi SDK yang dipilih.

``` env
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_IS_SANITIZED=true
MIDTRANS_IS_3DS=true
MIDTRANS_SIGNATURE_SECRET=
```

Aturan:

-   `MIDTRANS_SERVER_KEY` hanya boleh digunakan backend untuk autentikasi request API ke Midtrans.
-   `MIDTRANS_SIGNATURE_SECRET` hanya boleh digunakan backend untuk verifikasi `signature_key` notifikasi webhook Midtrans (standar pemisahan key Midtrans sejak 28 Oktober 2026). **Jangan** menggunakan `MIDTRANS_SERVER_KEY` sebagai pengganti `MIDTRANS_SIGNATURE_SECRET` jika akun menggunakan sistem key terbaru.
-   `MIDTRANS_CLIENT_KEY` boleh dipakai frontend sesuai pola integrasi Snap.js.
-   Jangan menulis nilai secret asli ke source code, dokumentasi yang
    di-commit, screenshot, log, atau laporan agent.
-   `.env` tidak boleh masuk Git.
-   Perbarui `.env.example` dengan placeholder kosong, bukan kredensial
    asli.
-   Mode awal wajib Sandbox.
-   Production hanya diaktifkan setelah persetujuan dan checklist
    deployment terpenuhi.

------------------------------------------------------------------------

## 6. Rancangan domain dan data

### 6.1 Audit sebelum migration

Periksa minimal:

-   Migration pembayaran yang sudah ada.
-   Model `Payment`.
-   Model `Registration`.
-   Relasi `Registration`--`Payment`.
-   Enum/status pembayaran.
-   Payment service/controller/request/resource.
-   Event/competition settings dan biaya.
-   Activity log.
-   Notification system.
-   Test pembayaran dan registrasi.

Jangan membuat migration baru sebelum audit menyatakan struktur yang ada
tidak cukup.

### 6.2 Data transaksi yang secara logis dibutuhkan

Sesuaikan dengan struktur aktual. Field berikut bukan instruksi untuk
menambahkan semuanya:

  Data logis                    Tujuan
  ----------------------------- --------------------------------------------
  ID pembayaran                 Identitas internal
  Registration ID               Relasi ke registrasi
  Provider                      Identifikasi provider, misalnya `midtrans`
  Order ID                      ID transaksi unik merchant
  Transaction ID                ID transaksi dari Midtrans
  Gross amount                  Nominal transaksi
  Currency                      Mata uang, umumnya IDR
  Internal status               Status pembayaran aplikasi
  Provider transaction status   Status asli dari provider
  Payment type                  Metode pembayaran
  Snap token                    Token checkout jika memang perlu disimpan
  Expiry time                   Batas pembayaran
  Paid time                     Waktu pembayaran berhasil
  Provider response/metadata    Data tambahan yang diseleksi dan aman
  Timestamps                    Waktu pembuatan/perubahan

### 6.3 Aturan data dan indeks

-   `order_id` harus unik.
-   Relasi pembayaran ke registrasi harus memakai foreign key yang
    sesuai.
-   Nominal harus disimpan dalam tipe numerik yang aman, bukan
    floating-point.
-   Pastikan nominal transaksi tidak dapat berubah diam-diam setelah
    order dibuat.
-   Tentukan kebijakan beberapa percobaan transaksi untuk satu
    registrasi.
-   Jangan menyimpan seluruh payload sensitif tanpa seleksi.
-   Simpan informasi yang dibutuhkan untuk audit dan rekonsiliasi.
-   Pertahankan integritas foreign key.
-   Hindari menyimpan data kartu atau kredensial pembayaran yang tidak
    diperlukan.

### 6.4 Snapshot biaya

Jika biaya kompetisi dapat berubah, putuskan apakah nominal transaksi
memakai snapshot biaya pada saat registrasi/transaksi dibuat.
Rekomendasi: nominal yang sudah menjadi bagian dari order harus
immutable untuk transaksi tersebut. Perubahan biaya berikutnya tidak
boleh mengubah nominal order lama.

------------------------------------------------------------------------

## 7. Status dan pemetaan transaksi

Simpan status asli provider secara terpisah dari status internal bila
struktur memungkinkan.

Pemetaan awal yang harus diverifikasi terhadap dokumentasi Midtrans dan
kebutuhan proyek:

  -----------------------------------------------------------------------
  Status/provider condition           Tindakan internal yang diharapkan
  ----------------------------------- -----------------------------------
  `pending`                           `pending`

  `settlement`                        Kandidat `paid` setelah validasi

  `capture` + fraud accept            Kandidat `paid` setelah validasi

  `capture` + fraud challenge         Jangan tandai paid otomatis

  `deny`                              `failed`

  `expire`                            `expired`

  `cancel`                            `cancelled`

  `failure`                           `failed`, jika status ini
                                      benar-benar diterima dari provider

  `refund`                            `cancelled` (pengembalian penuh, net = 0,
                                      histori & `paid_at` utuh, hak `paid` dicabut)

  `partial_refund`                    Evaluasi `net_paid_amount` vs biaya lomba:
                                      `paid` bila net >= fee, `rejected` bila
                                      `0 < net < fee`, `cancelled` bila akumulasi
                                      refund 100%; histori per `refund_key` utuh

  `chargeback` / `partial_chargeback` `failed` (dibedakan eksplisit dari refund,
                                      histori utuh, hak `paid` dicabut)
  -----------------------------------------------------------------------

Pemetaan akhir harus didasarkan pada dokumentasi provider terkini dan
respons nyata Sandbox.

### Aturan transisi

-   Jangan menurunkan status `paid` menjadi `pending` akibat notifikasi
    lama.
-   Jangan menganggap notifikasi datang berurutan.
-   Notifikasi duplikat tidak boleh menggandakan efek.
-   Status yang tidak dikenal harus dicatat dan ditangani secara aman,
    bukan dianggap sukses.
-   Refund harus mengikuti prosedur dan otorisasi yang disetujui.
-   Perubahan status pembayaran tidak boleh mengubah status registrasi
    secara otomatis kecuali ada aturan bisnis eksplisit yang disetujui.
-   Jika status provider bertentangan dengan data lokal, catat konflik
    dan jalankan rekonsiliasi.

------------------------------------------------------------------------

## 8. Rancangan backend

Nama class dan endpoint adalah usulan. Gunakan pola penamaan yang sudah
ada jika setara.

### 8.1 Service

Tanggung jawab service pembayaran:

-   Menghitung/menentukan nominal berdasarkan data server.
-   Memastikan registrasi milik peserta yang sedang login.
-   Memastikan registrasi memenuhi syarat untuk dibayar.
-   Membuat order ID unik.
-   Membuat transaksi Snap melalui Midtrans.
-   Menyimpan transaksi lokal.
-   Memverifikasi notifikasi.
-   Memetakan status provider ke status internal.
-   Memproses notifikasi secara idempotent.
-   Memeriksa status transaksi ke Midtrans untuk rekonsiliasi.

Hindari menaruh seluruh logika transaksi di controller.

### 8.2 Endpoint kandidat

Audit `API.md` dan route yang sudah ada terlebih dahulu. Jangan membuat
duplikat endpoint.

  -------------------------------------------------------------------------------------------------------------
  Method                  Endpoint kandidat                                             Fungsi
  ----------------------- ------------------------------------------------------------- -----------------------
  POST                    `/api/v1/participant/registrations/{registration}/payments`   Membuat transaksi
                                                                                        pembayaran

  GET                     `/api/v1/participant/registrations/{registration}/payments`   Melihat transaksi
                                                                                        registrasi

  GET                     `/api/v1/participant/payments/{payment}`                      Detail pembayaran milik
                                                                                        peserta

  POST                    `/api/v1/webhooks/midtrans`                                   Menerima HTTP
                                                                                        notification

  GET                     `/api/v1/admin/payments`                                      Daftar pembayaran untuk
                                                                                        admin

  GET                     `/api/v1/admin/payments/{payment}`                            Detail pembayaran admin
  -------------------------------------------------------------------------------------------------------------

Endpoint di atas hanya kandidat desain. Prefix/struktur route final
harus mengikuti pola route yang sudah dipakai proyek.

Webhook provider tidak boleh bergantung pada sesi login peserta, tetapi
harus dilindungi dengan verifikasi signature dan validasi transaksi.

### 8.3 Validasi pembuatan transaksi

Backend wajib memastikan:

-   Pengguna terautentikasi sebagai participant.
-   Registrasi benar-benar milik pengguna atau tim yang berhak.
-   Registrasi berada pada status yang diizinkan.
-   Kompetisi memang memiliki biaya yang wajib dibayar.
-   Nominal berasal dari database/backend.
-   Registrasi belum memiliki pembayaran sukses.
-   Order ID belum pernah dipakai.
-   Transaksi baru tidak dibuat berulang tanpa aturan yang jelas.
-   Request bersifat aman terhadap klik ganda dan retry.

### 8.4 Respons API

Gunakan format respons yang konsisten dengan API proyek.

Frontend hanya menerima data yang diperlukan, misalnya:

-   ID pembayaran internal.
-   Order ID.
-   Nominal.
-   Status pembayaran.
-   Snap token bila dibutuhkan untuk membuka checkout.
-   Expiry time.

Jangan mengirim Server Key, signature secret, atau kredensial rahasia ke
frontend.

------------------------------------------------------------------------

## 9. Webhook: aturan keamanan dan konsistensi

Webhook adalah bagian kritis integrasi.

### Wajib dilakukan

1.  Terima notifikasi Midtrans pada endpoint khusus.
2.  Validasi signature menggunakan metode resmi dan kredensial yang
    benar.
3.  Cocokkan `order_id` dengan transaksi lokal.
4.  Cocokkan nominal, mata uang, dan identitas transaksi sesuai payload
    yang tersedia.
5.  Validasi status dan fraud status.
6.  Pastikan transaksi provider benar-benar sesuai dengan order lokal.
7.  Gunakan database transaction/locking bila diperlukan untuk mencegah
    race condition.
8.  Proses event secara idempotent.
9.  Simpan status provider, waktu notifikasi, dan informasi audit yang
    aman.
10. Kembalikan HTTP response sesuai kontrak webhook Midtrans.
11. Catat kegagalan tanpa membocorkan secret atau data sensitif.
12. Sediakan cara untuk retry/reconciliation yang aman.

### Idempotency

Webhook dapat dikirim lebih dari sekali. Implementasi harus memastikan:

-   Notifikasi sama tidak menggandakan perubahan.
-   Pembayaran tidak dicatat dua kali.
-   Activity log tidak dibuat berulang tanpa alasan.
-   Status tidak mundur karena notifikasi lama.
-   Proses paralel tidak membuat dua efek pembayaran.

Jangan hanya mengandalkan pengecekan sederhana di frontend. Perlindungan
harus berada di backend dan database.

### Signature

Gunakan formula dan mekanisme yang dinyatakan dokumentasi resmi Midtrans
terkini. Jangan menyalin contoh lama tanpa memeriksa versi dokumentasi.
Jangan menganggap Server Key selalu sama dengan secret untuk signature
notification.

------------------------------------------------------------------------

## 10. Rancangan frontend

### 10.1 Portal peserta

Tambahkan integrasi ke alur registrasi yang sudah ada, bukan membuat
alur pendaftaran alternatif.

Komponen/halaman yang mungkin diperlukan:

-   Ringkasan biaya pendaftaran.
-   Status biaya: gratis/berbayar.
-   Ringkasan order.
-   Tombol `Bayar Sekarang`.
-   Pembukaan Snap checkout.
-   Status pending.
-   Status paid.
-   Status expired/failed/cancelled.
-   Riwayat transaksi.
-   Aksi membuat transaksi baru jika aturan mengizinkan.
-   Tampilan instruksi pembayaran dari metode yang dipilih.

### 10.2 Perilaku frontend

-   Tombol bayar memiliki loading state dan mencegah double click.
-   Frontend tidak mengirim nominal sebagai sumber kebenaran.
-   Frontend tidak mengubah status menjadi paid sendiri.
-   Setelah kembali dari Snap, frontend meminta status terbaru dari
    Laravel.
-   Jika status masih pending, tampilkan pending dan sediakan
    refresh/status check yang wajar.
-   Jangan menganggap redirect sukses sebagai bukti pembayaran.
-   Jangan menampilkan Snap token atau data sensitif pada log browser.
-   Tangani kegagalan jaringan dan sesi habis dengan jelas.

### 10.3 Portal admin

Tampilkan data yang dibutuhkan untuk operasional:

-   Order ID.
-   Peserta/tim dan registrasi terkait.
-   Kompetisi.
-   Nominal.
-   Provider.
-   Metode pembayaran.
-   Status internal.
-   Status provider.
-   Waktu transaksi/pembayaran.
-   Riwayat perubahan.

Admin tidak boleh memiliki tombol yang mengubah transaksi menjadi `paid`
tanpa verifikasi provider. Jika ada fitur rekonsiliasi atau tindakan
manual khusus, harus memiliki otorisasi, alasan, audit log, dan
persetujuan kebijakan.

------------------------------------------------------------------------

## 11. Testing wajib

Test harus memakai pola testing proyek dan tidak bergantung pada
transaksi Production.

### Backend unit/feature tests

1.  Peserta dapat membuat transaksi untuk registrasi yang memenuhi
    syarat.
2.  Peserta tidak dapat membayar registrasi milik peserta lain.
3.  Peserta tidak dapat membuat transaksi untuk registrasi yang tidak
    memenuhi syarat.
4.  Nominal diambil dari backend, bukan request client.
5.  Registrasi gratis tidak membuat transaksi berbayar.
6.  Order ID unik.
7.  Transaksi sukses tidak dapat dibayar ulang tanpa aturan yang
    disetujui.
8.  Signature webhook valid diterima.
9.  Signature webhook tidak valid ditolak.
10. Order ID tidak dikenal ditangani aman.
11. Nominal webhook tidak cocok ditolak atau ditandai untuk investigasi.
12. Webhook duplikat idempotent.
13. Notifikasi lama tidak menurunkan status sukses.
14. Status `pending` tidak ditandai paid.
15. `capture` dengan fraud challenge tidak otomatis paid.
16. `settlement` yang valid diproses sesuai aturan.
17. Refund diproses sesuai kebijakan.
18. Admin dapat melihat daftar/detail pembayaran.
19. Participant tidak dapat mengakses admin payment API.
20. Pembayaran tidak otomatis mengubah registrasi menjadi approved.

### Frontend tests/E2E

1.  Peserta melihat biaya yang benar.
2.  Peserta dapat memulai checkout.
3.  Tombol bayar mencegah request ganda.
4.  UI menampilkan pending.
5.  UI menampilkan paid setelah backend mengonfirmasi.
6.  UI menampilkan expired/failed.
7.  Peserta tidak dapat melihat pembayaran peserta lain.
8.  Riwayat transaksi tampil dengan benar.
9.  Halaman tetap konsisten ketika browser ditutup sebelum redirect
    kembali.

### Sandbox scenarios

-   Pembayaran berhasil.
-   Pending.
-   Expired.
-   Denied/failure.
-   Cancelled.
-   Refund jika tersedia pada skenario Sandbox.
-   Webhook duplikat.
-   Webhook terlambat.
-   Signature tidak valid.
-   Nominal tidak cocok.
-   Order ID tidak dikenal.
-   Browser ditutup setelah pembayaran.
-   Koneksi frontend terputus setelah transaksi dibuat.

Catat hasil setiap skenario: `PASS`, `FAIL`, atau `NOT TESTED`.

------------------------------------------------------------------------

## 12. Tahapan implementasi dan approval gates

### Fase 0 --- Audit & design (DONE — Approved)

Output: - `PAYMENT_DESIGN.md` - Audit struktur saat ini. - Daftar file
dan komponen terkait. - Daftar perubahan database yang diperlukan. -
Rancangan API dan webhook. - Daftar keputusan bisnis PD-01 s.d. PD-08 (seluruhnya disetujui 25 Nov 2026).

### Fase 1A --- Dokumentasi & Penguncian Desain (DONE)

Sinkronisasi `PAYMENT_DESIGN.md`, `PAYMENT_IMPLEMENTATION.md`, `PRD.md`, `DATABASE.md`, `API.md`, dan `OPEN_QUESTIONS.md` sesuai keputusan final PD-01 s.d. PD-08.

### Fase 1B --- Backend foundation (DONE)

Pekerjaan: - Konfigurasi Sandbox (`config/midtrans.php` & `.env.example` dengan pemisahan `MIDTRANS_SERVER_KEY`, `MIDTRANS_SIGNATURE_SECRET`, `MIDTRANS_CLIENT_KEY`). - Additive migration tabel `payments` (tanpa menghapus kolom legacy). - Integrasi API Midtrans via Laravel HTTP Client (`App\Services\MidtransService`, tanpa `midtrans/midtrans-php`). - Refactor `PaymentService` untuk pembuatan/reuse transaksi Snap, validasi `payment_enabled`, validasi registrasi `submitted`/`under_review`, validasi ketua tim, nominal dari server, `order_id` unik, batas waktu `min(24 jam, registration_deadline)`. - Guard PD-02 ketat pada `RegistrationService::updateStatus()` (lomba berbayar wajib `paid`/`verified` sebelum `approved`, independen dari `payment_enabled`). - `PaymentPolicy`, `PaymentResource`, `Participant\PaymentController`, `Public\PaymentConfigController`, dan rute Phase 1B. - Unit & Feature tests dengan `Http::fake()` (termasuk skenario PD-02/PD-07 ketat).

Output: - Implementasi backend foundation Phase 1B. - Test pembuatan transaksi & policy lulus. - Dokumentasi konfigurasi.

**Gate:** Lulus & disetujui Product Owner (Phase 1B + Correction).

### Fase 2 --- Webhook & reconciliation (DONE)

Pekerjaan: - Endpoint webhook stateless `POST /api/v1/webhooks/midtrans` (`MidtransWebhookController` + `MidtransWebhookRequest`, `throttle:120,1`). - Verifikasi signature SHA-512 ketat memakai `MIDTRANS_SIGNATURE_SECRET` via `hash_equals()` tanpa fallback ke `MIDTRANS_SERVER_KEY`. - Validasi keberadaan `order_id`, kesesuaian `gross_amount`, dan aturan satu pembayaran sukses per registrasi (lock hierarchy `Registration -> Payment` + explicit handling `QueryException` 1062). - Idempotency, proteksi out-of-order & transaksi final dengan `DB::transaction()` + `lockForUpdate()`, sanitasi payload/log tanpa membocorkan secret, serta rollback otomatis jika gagal. - Mapping status resmi Midtrans termasuk `capture`+`challenge` (tetap `pending`) dan penanganan eksplisit `refund`, `partial_refund`, `chargeback`, `partial_chargeback` dengan jejak `reversal_history` & evaluasi nominal bersih. - Rekonsiliasi status transaksi melalui Midtrans Status API (`POST /api/v1/participant/payments/{payment}/sync` via `PaymentService::syncPaymentStatusFromMidtrans()`). - Suite uji otomatis `MidtransWebhookAndReconciliationTest` (`Http::fake()`) + `MySqlPaymentConcurrencyTest` (MySQL 8.0.30).

Output: - Webhook & reconciliation terimplementasi dan teruji (termasuk Phase 2A Hardening). - Test keamanan, concurrency MySQL, & idempotency webhook lulus. - Dokumentasi endpoint, signature, mapping, idempotency, dan reconciliation diperbarui.

**Gate:** Lulus & disetujui Product Owner (Phase 2 + Phase 2A).

### Fase 3 --- Participant frontend (DONE)

Pekerjaan: - Penambahan read-only serializer aman pada `PaymentResource` (`reversal_reason`, `cumulative_refunded_amount`, `net_paid_amount`, `reversal_history` tersanitasi, `registration.team.leader_id`, `registration.competition.event_id`, `registration.competition.registration_deadline`) dan eager-load `latestPayment` di `DashboardController`. - Tipe TypeScript eksplisit (`types/payment.ts`, `types/participant.ts`), utilitas Rupiah (`Rp150.000`), mapper status UI (`utils/paymentStatus.ts`), dan dynamic loader Midtrans Snap.js (`lib/midtrans.ts`) berbasis `GET /api/v1/public/payment-config`. - Komponen `RegistrationPaymentPanel` & `PaymentStatusBadge` terintegrasi di `RegistrationDetailPage` (hapus opsi manual `bukti_pembayaran` tanpa mengubah upload dokumen lain, tombol checkout anti double-click, pemegang `snap_token` in-memory tanpa `localStorage`, sync ke backend di callback `onSuccess`/`onPending`/`onError`/`onClose`). - Halaman mandiri riwayat pembayaran `/participant/payments` (`PaymentsPage.tsx`) + badge status biaya di `RegistrationsPage`, `RegistrationCreatePage`, dan `DashboardPage`.

Output: - Alur pembayaran peserta & integrasi Midtrans Snap teruji. - Build TypeScript/Vite, lint, backend test, dan verifikasi Browser E2E + Console + Network lulus.

**Gate:** alur peserta teruji dan seluruh status dikonfirmasi dari backend. Tunggu persetujuan sebelum Fase 4.

### Fase 4 --- Admin payment management

Pekerjaan: - Daftar dan detail pembayaran. - Filter dan pencarian. -
Riwayat status. - Rekonsiliasi sesuai kewenangan. - Audit log.

Output: - Admin dapat memantau transaksi. - Test authorization.

**Gate:** participant tidak dapat mengakses endpoint admin dan tidak ada
perubahan status tanpa verifikasi.

### Fase 5 --- Full QA & deployment readiness

Pekerjaan: - Seluruh backend tests. - Frontend build dan lint. - Browser
E2E. - Sandbox end-to-end. - Verifikasi environment. - Verifikasi
webhook URL. - Checklist production.

Output: - `PAYMENT_QA_REPORT.md` - Daftar risiko tersisa. - Checklist
deployment. - Rekomendasi go-live atau no-go.

**Gate:** Production hanya boleh diaktifkan setelah persetujuan
eksplisit pemilik proyek.

------------------------------------------------------------------------

## 13. Definition of Done

-   [ ] Struktur pembayaran lama sudah diaudit dan digunakan kembali
    jika sesuai.
-   [ ] Tidak ada tabel/model/endpoint duplikat.
-   [ ] Keputusan biaya dan waktu pembayaran sudah disetujui.
-   [ ] Nominal ditentukan backend.
-   [ ] Order ID unik.
-   [ ] Secret hanya berada di backend.
-   [ ] Snap checkout berfungsi di Sandbox.
-   [ ] Webhook signature diverifikasi.
-   [ ] Webhook idempotent.
-   [ ] Nominal dan order ID diverifikasi.
-   [ ] Status pembayaran terpisah dari status registrasi.
-   [ ] Pembayaran tidak otomatis membuat registrasi approved.
-   [ ] Authorization peserta/admin benar.
-   [ ] Activity log dan riwayat transaksi konsisten.
-   [ ] Backend tests lulus.
-   [ ] Frontend build dan lint lulus.
-   [ ] Browser E2E lulus.
-   [ ] Sandbox end-to-end lulus.
-   [ ] Tidak ada secret atau data sensitif di repository/log.
-   [ ] Dokumentasi proyek diperbarui.
-   [ ] Pemilik proyek menyetujui deployment Production.

------------------------------------------------------------------------

## 14. File dokumentasi yang harus diperbarui

Setelah implementasi disetujui dan benar-benar selesai, perbarui
seperlunya:

-   `PAYMENT_DESIGN.md`: keputusan desain final.
-   `DATABASE.md`: perubahan tabel, kolom, indeks, relasi.
-   `API.md`: endpoint dan format response.
-   `ARCHITECTURE.md`: alur payment service dan webhook.
-   `DEVELOPMENT.md`: konfigurasi Sandbox dan cara menjalankan.
-   `OPEN_QUESTIONS.md`: tutup pertanyaan yang sudah diputuskan.
-   `CHANGELOG.md`: ringkasan perubahan tiap fase.
-   `PAYMENT_QA_REPORT.md`: hasil test dan E2E.

Jangan mengubah dokumentasi untuk mengklaim fitur yang belum tersedia.

------------------------------------------------------------------------

## 15. Template laporan wajib setiap fase

Agent wajib mengakhiri setiap fase dengan format berikut:

``` text
PHASE:
STATUS: PASS / PARTIAL / FAIL

1. Ringkasan pekerjaan
2. File yang dibuat
3. File yang diubah
4. File yang dihapus (beserta alasan dan persetujuan)
5. Perubahan database/migration
6. Perubahan API
7. Perubahan UI
8. Security checks
9. Backend test: jumlah passed/failed/skipped
10. Frontend build
11. Frontend lint
12. Browser E2E
13. Masalah yang belum selesai
14. Risiko dan keputusan yang dibutuhkan
15. Rekomendasi fase berikutnya
```

Jangan menyatakan `PASS` jika ada test wajib yang belum dijalankan.
Gunakan `PARTIAL` atau `NOT TESTED` secara jujur.

**Setelah laporan fase diberikan, berhenti dan tunggu persetujuan
pemilik proyek. Jangan otomatis melanjutkan fase berikutnya.**

------------------------------------------------------------------------

## 16. Instruksi pertama untuk AI Agent

Mulai dengan Fase 0 saja.

1.  Baca seluruh dokumentasi proyek.
2.  Audit implementasi pembayaran dan registrasi yang benar-benar ada di
    repository.
3.  Periksa dokumentasi resmi Midtrans terkini.
4.  Buat `PAYMENT_DESIGN.md` berdasarkan temuan aktual.
5.  Catat keputusan bisnis yang belum tersedia di `OPEN_QUESTIONS.md`.
6.  Jangan mengubah source code, migration, database, package, atau
    konfigurasi aktif.
7.  Laporkan temuan dan tunggu persetujuan.

**Prioritas utama: menjaga fitur registrasi, autentikasi, authorization,
dan portal peserta/admin yang sudah berjalan agar tidak mengalami
regresi.**
