<?php

namespace App\Http\Controllers\Api\Participant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Participant\UpdateProfileRequest;
use App\Http\Requests\Participant\UploadAvatarRequest;
use App\Http\Resources\UserResource;
use App\Models\ParticipantProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('profile');

        return response()->json([
            'success' => true,
            'message' => 'Profil peserta berhasil diambil.',
            'data' => new UserResource($user),
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        DB::transaction(function () use ($user, $validated) {
            if (! empty($validated['name'])) {
                $user->update(['name' => $validated['name']]);
            }

            $profileData = [
                'phone' => $validated['phone'] ?? null,
                'institution' => $validated['institution'] ?? null,
                'education_level' => $validated['education_level'] ?? null,
                'identity_number' => $validated['identity_number'] ?? null,
                'address' => $validated['address'] ?? null,
            ];

            ParticipantProfile::updateOrCreate(
                ['user_id' => $user->id],
                $profileData
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Profil peserta berhasil diperbarui.',
            'data' => new UserResource($user->fresh('profile')),
        ]);
    }

    public function uploadAvatar(UploadAvatarRequest $request): JsonResponse
    {
        $user = $request->user();
        $file = $request->file('avatar');

        $path = $file->store('avatars', 'public');

        $profile = ParticipantProfile::firstOrCreate(['user_id' => $user->id]);

        // Delete old photo if exists
        if ($profile->profile_photo_path && Storage::disk('public')->exists($profile->profile_photo_path)) {
            Storage::disk('public')->delete($profile->profile_photo_path);
        }

        $profile->update(['profile_photo_path' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil diperbarui.',
            'data' => [
                'profile_photo_url' => asset('storage/' . $path),
            ],
        ]);
    }
}
