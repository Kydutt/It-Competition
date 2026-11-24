<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RegistrationDocument;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentDownloadController extends Controller
{
    public function downloadRegistrationDocument(Request $request, RegistrationDocument $document): StreamedResponse
    {
        Gate::authorize('download', $document);

        if (! Storage::exists($document->file_path)) {
            abort(404, 'Berkas fisik dokumen tidak ditemukan di server.');
        }

        return Storage::download(
            $document->file_path,
            $document->original_filename,
            ['Content-Type' => $document->mime_type]
        );
    }

    public function downloadSubmission(Request $request, Submission $submission): StreamedResponse
    {
        Gate::authorize('download', $submission);

        if (! $submission->file_path || ! Storage::exists($submission->file_path)) {
            abort(404, 'Berkas fisik karya tidak ditemukan di server.');
        }

        $filename = basename($submission->file_path);
        return Storage::download($submission->file_path, $filename);
    }
}
