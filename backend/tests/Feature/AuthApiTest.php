<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_ping_endpoint_returns_successful_response(): void
    {
        $response = $this->getJson('/api/v1/ping');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'API v1 is connected successfully.',
                'data' => [
                    'status' => 'ok',
                    'version' => 'v1',
                ],
            ]);
    }

    public function test_participant_can_register_via_api(): void
    {
        $payload = [
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'terms_accepted' => true,
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'name' => 'Budi Santoso',
                        'email' => 'budi@example.com',
                        'role' => 'participant',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'budi@example.com',
            'role' => 'participant',
            'is_active' => true,
        ]);

        $this->assertAuthenticated();
    }

    public function test_user_can_login_via_sanctum_session(): void
    {
        $user = User::factory()->create([
            'email' => 'peserta@example.com',
            'password' => bcrypt('secret123'),
            'role' => 'participant',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'peserta@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'peserta@example.com',
                        'role' => 'participant',
                    ],
                ],
            ]);

        $this->assertAuthenticatedAs($user);
    }

    public function test_inactive_user_cannot_login(): void
    {
        User::factory()->create([
            'email' => 'nonaktif@example.com',
            'password' => bcrypt('secret123'),
            'role' => 'participant',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'nonaktif@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(403);
        $this->assertGuest();
    }

    public function test_authenticated_user_can_access_me_endpoint(): void
    {
        $user = User::factory()->create([
            'name' => 'Peserta Aktif',
            'email' => 'aktif@example.com',
            'role' => 'participant',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'name' => 'Peserta Aktif',
                        'email' => 'aktif@example.com',
                        'role' => 'participant',
                    ],
                ],
            ]);
    }

    public function test_unauthenticated_request_to_me_returns_401(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logout berhasil. Sesi telah diakhiri.',
            ]);
    }
}
