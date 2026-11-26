# Open Product Questions

This file tracks decisions that must be confirmed by the product owner. Agents must not silently invent answers.

| ID | Question | Why it matters | Temporary handling | Status |
|---|---|---|---|---|
| Q-001 | Is registration free, manual bank transfer, or payment gateway? | Determines payment workflow, tables, verification, and UX. | Resolved: Midtrans Snap only (Sandbox during dev), controlled via `event_settings.payment_enabled` (`false` by default). | Resolved |
| Q-002 | Can one participant join multiple teams or competitions? | Affects uniqueness constraints and eligibility. | Enforce only duplicate membership within the same team; do not invent global restrictions. | Open |
| Q-003 | What fields/documents are required for each competition? | Determines dynamic registration form and document requirements. | Keep requirements configurable; do not fabricate mandatory documents. | Open |
| Q-004 | What team invitation mechanism is desired? | Affects membership confirmation and security. | Do not implement email invitations or invite codes yet. | Open |
| Q-005 | Is email verification mandatory? | Affects account activation and registration eligibility. | Implement configurable capability only if needed; do not block workflows without approval. | Open |
| Q-006 | Is there a separate judging/scoring workflow? | Would require judge role, rubric, score, and result modules. | Out of MVP. | Open |
| Q-007 | What are official event dates, logo, organizer details, contacts, and social links? | Required for real public content. | Use clearly labeled placeholders in development only. | Open |
| Q-008 | Are there registration capacity limits per competition? | Affects availability and concurrency handling. | No capacity limit unless configured and approved. | Open |
| Q-009 | Can participants cancel after submitting registration? | Affects status transitions and records. | Draft cancellation only; submitted cancellation requires admin policy. | Open |
| Q-010 | What file formats and maximum sizes are allowed? | Affects upload validation and storage. | Define conservative development defaults in config, clearly documented; confirm before production. | Open |

## Decision log

### Q-001 — Kebijakan Pembayaran & Integrasi Midtrans Snap (PD-01 s.d. PD-08)
- **Question ID:** Q-001
- **Confirmed decision:**
  - **PD-01:** Pembayaran dilakukan setelah peserta mengirimkan pendaftaran (`submitted`) dan sebelum admin memberikan persetujuan (`approved`).
  - **PD-02:** Pendaftaran lomba berbayar (`registration_fee > 0`) wajib berstatus pembayaran `paid` (atau `verified`) sebelum admin dapat melakukan approval. Ketentuan ini tetap berlaku ketat meskipun `event_settings.payment_enabled = false`; kompetisi gratis (`registration_fee = 0`) tetap dapat disetujui tanpa pembayaran.
  - **PD-03:** Menggunakan **Midtrans Snap saja** (Opsi A). Tidak ada fitur upload bukti transfer bank manual; kolom legacy di tabel `payments` tetap dipertahankan secara non-destructive untuk kompatibilitas data historis.
  - **PD-04:** Integrasi backend menggunakan **Laravel HTTP Client** melalui `App\Services\MidtransService` (tanpa package `midtrans/midtrans-php`), menggunakan `Http::fake()` untuk automated testing, serta memisahkan `MIDTRANS_SERVER_KEY` (API auth), `MIDTRANS_SIGNATURE_SECRET` (verifikasi webhook SHA-512), dan `MIDTRANS_CLIENT_KEY` (Snap.js frontend).
  - **PD-05:** Pada pendaftaran tim, **ketua tim** menginisiasi satu transaksi pembayaran untuk satu registrasi tim; anggota tim dapat melihat status pembayaran.
  - **PD-06:** Masa berlaku transaksi adalah **24 jam** atau sampai **`registration_deadline`**, mana yang lebih dahulu.
  - **PD-07:** Aktivasi transaksi pembayaran dikendalikan oleh `event_settings.payment_enabled` (default `false`), yang hanya mengontrol pembuatan transaksi baru dan tampilan tombol pembayaran frontend. Jika `payment_enabled = false`, backend menolak pembuatan transaksi baru, admin tetap tidak boleh menyetujui lomba berbayar yang belum lunas, dan lomba gratis tetap berjalan normal tanpa pembayaran.
  - **PD-08:** Dokumentasi proyek diperbarui sesuai keputusan final (diselaraskan kembali pasca Phase 1B Audit pada 26 November 2026).
- **Date:** 2026-11-25
- **Approved by:** Product Owner
- **Documents and code affected:** `PAYMENT_DESIGN.md`, `PAYMENT_IMPLEMENTATION.md`, `PRD.md`, `DATABASE.md`, `API.md`, `OPEN_QUESTIONS.md`, modul `payments` (Fase 1B–5).

---

When a question is answered, record:
- Question ID.
- Confirmed decision.
- Date.
- Person/role approving.
- Documents and code affected.

Then update `PRD.md`, `DATABASE.md`, `API.md`, and tests as required.
