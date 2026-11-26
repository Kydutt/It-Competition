# Changelog

All notable product and technical changes should be recorded here.

## [Unreleased]

### Added
- Initial PRD baseline for IT Competition Management Platform.
- Agent behavior and scope-control rules.
- Architecture, database, API, and development specifications.
- Open product decision register.
- Midtrans Snap backend foundation (Phase 1B & Phase 1B Correction: `config/midtrans.php`, non-destructive `payments` migration, `MidtransService` via Laravel HTTP Client with separate `MIDTRANS_SIGNATURE_SECRET`, strict PD-02 approval guard, `PD-07` toggle, and participant Snap endpoints).
- Midtrans webhook, signature verification, idempotency, out-of-order protection, MySQL concurrency conflict handling, reversal history tracking (`refund`, `partial_refund`, `chargeback`, `partial_chargeback`), and Status API reconciliation (`POST /api/v1/webhooks/midtrans`, `POST /api/v1/participant/payments/{id}/sync`).
- Phase 3 participant payment frontend (`RegistrationPaymentPanel`, `PaymentsPage` at `/participant/payments`, dynamic Snap.js loader using `/api/v1/public/payment-config`, Rupiah formatting, team/leader UI rules, and reversal history display) plus read-only `PaymentResource` & `DashboardController` `latestPayment` eager-loading enhancements.
- Admin Competition Registration Fee management (KB-01/KB-02/KB-03): whole-integer Rupiah validation on create/update (empty create defaults to `0`, rejection of decimals/negatives), change warning on `/admin/competitions`, read-only Competition Detail modal, transactional `lockForUpdate()` locking on competition updates, and complete `competition.create` audit logging.
- Registration fee snapshot & legacy registrant protection: added nullable `registrations.registration_fee_snapshot` & `registrations.fee_locked_at`, `MoneyHelper` exact string/integer Rupiah & minor-unit cents arithmetic (zero float arithmetic), monotonic InnoDB lock ordering (`events -> competitions -> registrations -> payments`), updated `PaymentService` / `RegistrationService::updateStatus()` / `RegistrationResource` / `PaymentResource` / participant UI to use locked snapshots, conservative backfill service (`registrations:backfill-fee-snapshots`), and audited manual confirmation command (`registrations:confirm-fee-snapshot`).

### Changed
- Replaced manual transfer proof option (`bukti_pembayaran`) in participant registration document upload dropdown with Midtrans Snap payment panel (preserving all other document upload options and flows).

### Fixed
- None.

### Removed
- None.

## Changelog rules

- Use concise, user-understandable entries.
- Record breaking API or database changes.
- Record migrations and data-impacting changes.
- Do not record secrets or personal data.
