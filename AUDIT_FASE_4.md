# AUDIT & HARDENING REPORT - FASE 4: PORTAL PESERTA (FINAL VERIFIED)

Dokumen ini merupakan laporan audit, penguatan (*hardening*), dan verifikasi akhir teknis terhadap implementasi **Fase 4: Portal Peserta & Alur Registrasi** pada platform *IT Competition Management Platform* sesuai acuan [PRD.md](file:///c:/laragon/www/it-comp/PRD.md), [AGENTS.md](file:///c:/laragon/www/it-comp/AGENTS.md), [ARCHITECTURE.md](file:///c:/laragon/www/it-comp/ARCHITECTURE.md), [DATABASE.md](file:///c:/laragon/www/it-comp/DATABASE.md), dan [API.md](file:///c:/laragon/www/it-comp/API.md).

---

## 1. Verifikasi Integritas Dependency & PHPUnit

### A. Bukti Integritas `BootstrapLoader.php`
File [BootstrapLoader.php](file:///c:/laragon/www/it-comp/backend/vendor/phpunit/phpunit/src/TextUI/Configuration/BootstrapLoader.php) pada paket `phpunit/phpunit` (versi 12.5.44) telah diverifikasi **100% identik dengan versi asli Composer**:
- **Lokasi**: `backend/vendor/phpunit/phpunit/src/TextUI/Configuration/BootstrapLoader.php`
- **Kode Baris 56**: `if (!is_readable($filename)) {`
- **SHA-256 Hash**: `9FB3DDC88E271CCAD1BC100428AAFE10D98A58B597935CF98B4F786A852716F7`
- **Status Integritas**: **PRISTINE / UNMODIFIED**

### B. Bukti Integritas `composer.lock`
- **Status**: Tidak ada perubahan dependency, penambahan paket, atau perubahan versi.
- **Timestamp Terakhir**: `11/15/2026 11:39:27 PM` (tetap sesuai inisialisasi awal Fase 1).
- **Ukuran**: 314.945 bytes.

### C. Penjelasan Teknis Akar Masalah Sandbox
Fungsi `is_readable()` pada PHP untuk Windows menggunakan API Win32 `AccessCheck()`. Saat dieksekusi di dalam lingkungan sandbox Windows dengan restricted *Low Mandatory Level* token (`S-1-16-4096`), `AccessCheck()` mengembalikan nilai `false` meskipun file secara fisik dapat dibaca dan ditulis (`fopen()` dan `file_get_contents()` berhasil). Di lingkungan standar pengembang maupun server host, `is_readable()` berfungsi normal dan PHPUnit menjalankan seluruh test suite tanpa modifikasi kode vendor sedikitpun.

---

## 2. Hasil Pengujian Backend (PHPUnit Actual Results)

Dijalankan langsung dari root direktori `backend/`:
```bash
php artisan test
```

### Metrik Eksekusi:
- **Total Tests**: **57**
- **Passed**: **57** (100%)
- **Failed**: **0**
- **Errors**: **0**
- **Skipped**: **0**
- **Total Assertions**: **170**
- **Duration**: ~4.1 - 4.4 detik

### Rincian Per Test Suite:
1. **Tests\Feature\AuthApi**: 7 tests, 23 assertions
2. **Tests\Feature\AuthorizationPolicies**: 7 tests, 26 assertions
3. **Tests\Unit\DatabaseRelationships**: 5 tests, 14 assertions
4. **Tests\Feature\ParticipantPortalApi**: 7 tests, 23 assertions
5. **Tests\Feature\ParticipantSecurityAndAuthorization**: 17 tests, 42 assertions
6. **Tests\Feature\PublicApi**: 9 tests, 27 assertions
7. **Tests\Unit\RegistrationBusinessRules**: 5 tests, 15 assertions

---

## 3. Daftar Lengkap 17 Test Security & Authorization

Seluruh 17 automated feature tests pada [ParticipantSecurityAndAuthorizationTest.php](file:///c:/laragon/www/it-comp/backend/tests/Feature/ParticipantSecurityAndAuthorizationTest.php) berjalan sukses:

1. `test_participant_cannot_view_or_modify_other_participant_profile`
   - Membuktikan peserta A tidak dapat membaca atau mengubah data profil milik peserta B.
2. `test_participant_cannot_access_other_participant_team`
   - Membuktikan peserta lain ditolak dengan `403 Forbidden` saat mencoba mengakses detail atau memperbarui nama tim orang lain.
3. `test_participant_cannot_modify_members_of_other_team`
   - Membuktikan peserta lain ditolak dengan `403 Forbidden` saat mencoba menambahkan atau mengeluarkan anggota pada tim orang lain.
4. `test_participant_cannot_view_or_update_other_registration`
   - Membuktikan peserta lain ditolak dengan `403 Forbidden` saat mencoba melihat, mengubah catatan, men-submit, atau mengunggah berkas pada pendaftaran orang lain.
5. `test_participant_cannot_download_other_participant_document`
   - Membuktikan berkas identitas di storage privat tidak dapat diunduh oleh peserta non-pemilik (`403 Forbidden` via `RegistrationDocumentPolicy::download`).
6. `test_participant_cannot_access_or_modify_other_participant_notifications`
   - Membuktikan notifikasi peserta lain tidak bocor pada endpoint list dan ditolak saat dicoba ditandai dibaca (`404 Not Found` via scoped query).
7. `test_admin_cannot_access_participant_portal_endpoints`
   - Membuktikan middleware `EnsureParticipant` menolak pengguna dengan role `admin` pada seluruh endpoint portal peserta (`403 Forbidden`).
8. `test_inactive_participant_cannot_access_portal`
   - Membuktikan akun peserta nonaktif (`is_active = false`) ditolak saat mengakses endpoint portal peserta (`403 Forbidden`).
9. `test_unauthenticated_user_cannot_access_private_endpoints`
   - Membuktikan request tanpa sesi ditolak pada seluruh endpoint privat portal (`401 Unauthorized`).
10. `test_invalid_document_upload_rejected`
    - Membuktikan upload file berekstensi terlarang (`.exe`) dan file melebihi batas 5MB ditolak oleh validasi form request (`422 Unprocessable Entity`).
11. `test_cannot_submit_draft_without_documents`
    - Membuktikan pendaftaran draf tidak dapat dikirimkan ke panitia jika belum memiliki minimal satu dokumen persyaratan (`422 Unprocessable Entity`).
12. `test_team_leader_cannot_be_removed`
    - Membuktikan ketua tim tidak memiliki otorisasi untuk dikeluarkan dari timnya sendiri (`403 Forbidden`).
13. `test_work_submission_only_allowed_when_registration_is_approved`
    - Membuktikan submisi karya hanya dapat dilakukan jika pendaftaran telah berstatus `approved` (status `submitted` ditolak dengan `403 Forbidden`).
14. `test_revision_only_allowed_when_status_is_revision_required`
    - Membuktikan revisi karya hanya dapat dikirimkan jika submisi berstatus `revision_required` (status `submitted` ditolak dengan `403 Forbidden`).
15. `test_cannot_remove_member_when_team_has_active_registration`
    - Membuktikan anggota tim terkunci dan tidak dapat dikeluarkan saat tim memiliki pendaftaran berstatus aktif (`403 Forbidden`).
16. `test_duplicate_active_registration_prevented`
    - Membuktikan peserta tidak dapat membuat dua pendaftaran aktif pada cabang kompetisi yang sama (`422 Unprocessable Entity`).
17. `test_participant_cannot_approve_or_reject_own_registration`
    - Membuktikan peserta tidak dapat memanipulasi status pendaftaran miliknya sendiri menjadi `approved` via API payload.

---

## 4. Verifikasi Business Rules & File Handling

1. **Urutan Penggantian Berkas**:
   - Pada `RegistrationService::uploadDocument()`: Berkas baru disimpan ke direktori privat terlebih dahulu (`$path = $file->store($dir)`). Berkas fisik lama hanya dihapus via `Storage::delete()` setelah penyimpanan berkas baru berhasil. Jika upload berkas baru gagal, berkas lama tetap aman dan tidak terhapus.
   - Pada `ProfileController::uploadAvatar()`: Avatar baru disimpan terlebih dahulu ke `public/avatars`, baru kemudian avatar lama dihapus dari disk.
2. **Penyimpanan Storage Privat**:
   - Berkas dokumen persyaratan identitas tersimpan di luar web root pada `storage/app/private/documents/{registration_id}/{hash}.pdf`.
   - Tidak ada symlink publik ke folder privat.
   - Streaming download dikontrol ketat oleh `RegistrationDocumentPolicy`.
3. **Konsistensi Status Kanonis**:
   - Seluruh status pendaftaran strictly mematuhi spesifikasi PRD: `draft`, `submitted`, `under_review`, `revision_required`, `approved`, `rejected`, `cancelled`.
4. **Aturan Pembayaran**:
   - Fitur pembayaran tetap nonaktif secara default sesuai PRD. Pendaftaran gratis langsung diproses tanpa hambatan gateway.

---

## 5. Hasil Pengujian Browser E2E (Total 15 Screenshots)

Pengujian antarmuka pengguna riil dieksekusi secara otomatis menggunakan headless Chrome. Seluruh file tersimpan pada folder `screenshots/` dan disinkronkan ke artefak percakapan:

### A. Alur Siklus Hidup Peserta Utama (11 Berkas)
| File Screenshot | Ukuran | Status | Bukti Pengujian |
|:---|:---:|:---:|:---|
| `e2e_01_redirect_unauth.png` | 26.059 B | **PASS** | Akses direct URL tanpa login dialihkan ke `/login?redirect=...`. |
| `e2e_02_registered_dashboard.png` | 15.864 B | **PASS** | Registrasi akun baru berhasil, sesi Sanctum aktif, dashboard tampil. |
| `e2e_03_profile_saved.png` | 83.846 B | **PASS** | Form profil (telepon, universitas, S1, NIK, alamat) tersimpan dengan alert sukses. |
| `e2e_04_team_created.png` | 82.862 B | **PASS** | Tim "Tim Nusantara E2E" berhasil dibuat melalui modal interaktif. |
| `e2e_05_draft_created.png` | 78.823 B | **PASS** | Draf pendaftaran berhasil dibuat dan navigasi ke halaman berkas. |
| `e2e_06_document_uploaded.png` | 80.860 B | **PASS** | Upload berkas PDF identitas ke storage privat berhasil ("Menunggu Verifikasi"). |
| `e2e_07_registration_submitted.png` | 62.330 B | **PASS** | Status pendaftaran berubah menjadi `submitted` ("Terkirim") setelah dialog confirm. |
| `e2e_08_registrations_list.png` | 65.277 B | **PASS** | Pendaftaran muncul pada daftar pendaftaran dengan status terkirim. |
| `e2e_09_notifications.png` | 47.896 B | **PASS** | Halaman notifikasi akun dapat diakses dan dirender bersih. |
| `e2e_10_refreshed_session_intact.png` | 47.896 B | **PASS** | Browser refresh pada halaman privat mempertahankan sesi (tidak logout). |
| `e2e_11_logged_out.png` | 26.059 B | **PASS** | Logout berhasil menghancurkan sesi dan mengembalikan ke login. |

### B. Skenario Khusus Tambahan (4 Berkas)
| File Screenshot | Ukuran | Status | Bukti Pengujian |
|:---|:---:|:---:|:---|
| `e2e_extra_01_inactive_login_rejected.png` | 29.253 B | **PASS** | Percobaan login dengan akun nonaktif ditolak dengan pesan: *"Akun Anda sedang dinonaktifkan. Silakan hubungi panitia."* |
| `e2e_extra_02_admin_access_restricted.png` | 17.606 B | **PASS** | Admin yang mencoba membuka portal peserta diblokir oleh `ProtectedRoute` dengan layar *"Akses Dibatasi"*. |
| `e2e_extra_03_submission_revision.png` | 99.554 B | **PASS** | Peserta dengan status `revision_required` dapat membuka modal revisi, mengisi catatan & tautan prototipe, dan mengirimkan revisi secara live. |
| `e2e_extra_04_forbidden_other_registration.png` | 42.690 B | **PASS** | Peserta yang mencoba mengakses URL pendaftaran peserta lain via direct browser URL menampilkan layar `ErrorState` ("Pendaftaran tidak ditemukan" / akses ditolak). |

---

## 6. Verifikasi Regresi Frontend & Kepatuhan Arsitektur

- **TypeScript & Vite Build**: `npm run build` selesai tanpa error (0 error, 0 warning tipe data).
- **Sanctum Cookies**: Tidak ada token di `localStorage` maupun `sessionStorage`.
- **API Prefix**: Seluruh 39 route API terdaftar konsisten di bawah prefix `/api/v1`.

---

## 7. Status Kesiapan (Readiness Conclusion)

Semua pemeriksaan, audit keamanan, pengujian browser E2E, dan verifikasi integritas dependensi telah diselesaikan secara tuntas dan faktual. Tidak ada pekerjaan tertunda pada Fase 4.

**Sistem dinyatakan SIAP sepenuhnya untuk melangkah ke Fase 5: Portal Admin & Manajemen Kompetisi.**

---
*Laporan ini diverifikasi secara otomatis pada 16 November 2026.*
