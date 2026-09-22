<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\RegistrationStatus;
use App\Enums\SubmissionStatus;
use App\Models\Registration;
use App\Models\Submission;
use App\Models\SubmissionFile;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubmissionService
{
    /**
     * Initialize or get submission draft for an approved, payment-cleared registration.
     *
     * @param  array<string, mixed>  $data
     */
    public function createSubmission(User $user, int $registrationId, array $data = []): Submission
    {
        /** @var Registration $registration */
        $registration = Registration::with(['competition', 'team.leader', 'payment'])->findOrFail($registrationId);

        // 1. Verify ownership
        $isOwner = $registration->user_id === $user->id;
        $isLeader = $registration->team && $registration->team->leader_id === $user->id;

        if (! $user->isAdmin() && ! $isOwner && ! $isLeader) {
            throw ValidationException::withMessages([
                'registration_id' => ['Anda tidak memiliki akses untuk membuat pengumpulan karya pada pendaftaran ini.'],
            ]);
        }

        // 2. Verify registration status is approved
        if ($registration->status !== RegistrationStatus::Approved) {
            throw ValidationException::withMessages([
                'registration_id' => ['Pendaftaran harus disetujui terlebih dahulu oleh panitia sebelum dapat mengumpulkan karya.'],
            ]);
        }

        // 3. Verify payment is cleared (free competition or approved payment)
        if (! $registration->isPaymentCleared()) {
            throw ValidationException::withMessages([
                'registration_id' => ['Pembayaran biaya pendaftaran harus disetujui terlebih dahulu sebelum dapat mengumpulkan karya.'],
            ]);
        }

        // 4. Verify competition submission period
        $competition = $registration->competition;
        $now = now();

        if ($competition->submission_start && $now->lt($competition->submission_start)) {
            throw ValidationException::withMessages([
                'registration_id' => ['Periode pengumpulan karya untuk cabang kompetisi ini belum dibuka.'],
            ]);
        }

        if ($competition->submission_deadline && $now->gt($competition->submission_deadline)) {
            throw ValidationException::withMessages([
                'registration_id' => ['Batas waktu pengumpulan karya untuk cabang kompetisi ini telah berakhir.'],
            ]);
        }

        // 5. Return existing or create new
        $existing = Submission::where('registration_id', $registration->id)->first();
        if ($existing) {
            return $existing->load(['competition', 'team.leader', 'files', 'registration.user']);
        }

        $defaultTitle = $data['title'] ?? ($registration->team ? 'Karya Tim '.$registration->team->name : 'Karya '.$registration->user->name);

        return DB::transaction(function () use ($registration, $competition, $defaultTitle, $data) {
            $submission = Submission::create([
                'registration_id' => $registration->id,
                'competition_id' => $competition->id,
                'team_id' => $registration->team_id,
                'title' => $defaultTitle,
                'description' => $data['description'] ?? null,
                'status' => SubmissionStatus::Draft,
            ]);

            return $submission->load(['competition', 'team.leader', 'files', 'registration.user']);
        });
    }

    /**
     * Upload a project file to the submission.
     */
    public function uploadFile(User $user, Submission $submission, UploadedFile $file): SubmissionFile
    {
        $this->verifyUserCanModify($user, $submission);

        // 1. Validate file extension
        $ext = strtolower((string) $file->getClientOriginalExtension());
        $forbidden = ['php', 'phtml', 'php5', 'html', 'htm', 'js', 'exe', 'sh', 'bat', 'cmd', 'bin', 'vbs'];
        if (in_array($ext, $forbidden, true)) {
            throw ValidationException::withMessages([
                'file' => ['Format berkas executable/script tidak diizinkan demi alasan keamanan.'],
            ]);
        }

        $allowed = ['pdf', 'zip', 'rar', '7z', 'doc', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'];
        if (! in_array($ext, $allowed, true)) {
            throw ValidationException::withMessages([
                'file' => ['Format berkas tidak didukung. Harap unggah PDF, ZIP, DOCX, PPTX, atau Gambar.'],
            ]);
        }

        // 2. Validate file size (max 20 MB)
        if ($file->getSize() > 20 * 1024 * 1024) {
            throw ValidationException::withMessages([
                'file' => ['Ukuran berkas melebihi batas maksimum 20 MB per file.'],
            ]);
        }

        // 3. Store file in private local disk
        $folder = sprintf('submissions/%d/%d', $submission->registration_id, $submission->id);
        $randomName = sprintf('file_%s_%s.%s', Str::random(16), time(), $ext);
        $storedPath = Storage::disk('local')->putFileAs($folder, $file, $randomName);

        // 4. Record file in database
        return SubmissionFile::create([
            'submission_id' => $submission->id,
            'original_name' => $file->getClientOriginalName(),
            'stored_name' => $randomName,
            'mime_type' => (string) $file->getMimeType(),
            'size' => $file->getSize(),
            'path' => $storedPath,
        ]);
    }

    /**
     * Remove a project file from the submission.
     */
    public function removeFile(User $user, Submission $submission, int $fileId): bool
    {
        $this->verifyUserCanModify($user, $submission);

        /** @var SubmissionFile $file */
        $file = $submission->files()->findOrFail($fileId);

        if ($file->path && Storage::disk('local')->exists($file->path)) {
            Storage::disk('local')->delete($file->path);
        }

        return (bool) $file->delete();
    }

    /**
     * Finalize submission work.
     */
    public function submitSubmission(User $user, Submission $submission): Submission
    {
        $this->verifyUserCanModify($user, $submission);

        // At least one file required
        if ($submission->files()->count() === 0) {
            throw ValidationException::withMessages([
                'submission' => ['Silakan unggah minimal satu berkas karya sebelum melakukan submit pengumpulan karya.'],
            ]);
        }

        $submission->update([
            'status' => SubmissionStatus::Submitted,
            'submitted_at' => now(),
        ]);

        return $submission->fresh(['competition', 'team.leader', 'files', 'registration.user']);
    }

    /**
     * Download authorized submission file.
     */
    public function getSubmissionFile(User $user, Submission $submission, int $fileId): StreamedResponse
    {
        $reg = $submission->registration;
        $isOwner = $reg && $reg->user_id === $user->id;
        $isTeamMember = $submission->team?->members()->where('user_id', $user->id)->exists() ?? false;

        if (! $user->isAdmin() && ! $user->isJudge() && ! $isOwner && ! $isTeamMember) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengunduh berkas karya ini.');
        }

        /** @var SubmissionFile $file */
        $file = $submission->files()->findOrFail($fileId);

        if (empty($file->path) || ! Storage::disk('local')->exists($file->path)) {
            abort(404, 'Berkas fisik tidak ditemukan di penyimpanan server.');
        }

        return Storage::disk('local')->download($file->path, $file->original_name);
    }

    /**
     * Get user submissions.
     *
     * @return Collection<int, Submission>
     */
    public function getUserSubmissions(User $user): Collection
    {
        return Submission::query()
            ->where(function ($query) use ($user) {
                $query->whereHas('registration', fn ($q) => $q->where('user_id', $user->id))
                    ->orWhereHas('team.members', fn ($q) => $q->where('user_id', $user->id));
            })
            ->with(['competition', 'team.leader', 'files', 'registration.user'])
            ->latest('updated_at')
            ->get();
    }

    /**
     * Admin paginated list of submissions with filtering.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getAdminPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Submission::query()->with([
            'competition',
            'team.leader',
            'files',
            'registration.user',
        ]);

        if (! empty($filters['competition_id'])) {
            $query->where('competition_id', $filters['competition_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $term = (string) $filters['search'];
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', "%{$term}%")
                    ->orWhereHas('registration', fn ($rq) => $rq->where('registration_number', 'like', "%{$term}%"))
                    ->orWhereHas('registration.user', fn ($uq) => $uq->where('name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%"))
                    ->orWhereHas('team', fn ($tq) => $tq->where('name', 'like', "%{$term}%"));
            });
        }

        return $query->latest('submitted_at')->paginate($perPage);
    }

    /**
     * Private helper to verify modification permission and deadline locking.
     */
    protected function verifyUserCanModify(User $user, Submission $submission): void
    {
        $reg = $submission->registration;
        $isOwner = $reg && $reg->user_id === $user->id;
        $isLeader = $submission->team && $submission->team->leader_id === $user->id;

        if (! $user->isAdmin() && ! $isOwner && ! $isLeader) {
            throw ValidationException::withMessages([
                'submission' => ['Anda tidak memiliki hak akses untuk mengubah pengumpulan karya ini.'],
            ]);
        }

        if ($submission->isLocked()) {
            throw ValidationException::withMessages([
                'submission' => ['Karya telah terkunci dan tidak dapat diubah lagi.'],
            ]);
        }

        // Enforce deadline
        $competition = $submission->competition;
        if ($competition && $competition->submission_deadline && now()->gt($competition->submission_deadline)) {
            throw ValidationException::withMessages([
                'submission' => ['Batas waktu pengumpulan karya (deadline) untuk kompetisi ini telah berakhir.'],
            ]);
        }
    }
}
