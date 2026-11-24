<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleBasedRedirectAndAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_returns_admin_role_and_dashboard_url(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@itcomp.test',
            'password' => bcrypt('Password123#'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@itcomp.test',
            'password' => 'Password123#',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'admin@itcomp.test',
                        'role' => 'admin',
                        'dashboard_url' => '/admin/dashboard',
                    ],
                ],
            ]);

        $this->assertAuthenticatedAs($admin);
    }

    public function test_participant_login_returns_participant_role_and_dashboard_url(): void
    {
        $participant = User::factory()->create([
            'email' => 'peserta@itcomp.test',
            'password' => bcrypt('Password123#'),
            'role' => 'participant',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'peserta@itcomp.test',
            'password' => 'Password123#',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'peserta@itcomp.test',
                        'role' => 'participant',
                        'dashboard_url' => '/participant/dashboard',
                    ],
                ],
            ]);

        $this->assertAuthenticatedAs($participant);
    }

    public function test_auth_me_returns_correct_role_and_dashboard_url_for_each_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $participant = User::factory()->create(['role' => 'participant', 'is_active' => true]);

        // Admin check
        $this->actingAs($admin)
            ->getJson('/api/v1/auth/me')
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'user' => [
                        'role' => 'admin',
                        'dashboard_url' => '/admin/dashboard',
                    ],
                ],
            ]);

        // Participant check
        $this->actingAs($participant)
            ->getJson('/api/v1/auth/me')
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'user' => [
                        'role' => 'participant',
                        'dashboard_url' => '/participant/dashboard',
                    ],
                ],
            ]);
    }

    public function test_participant_is_strictly_forbidden_from_admin_endpoints(): void
    {
        $participant = User::factory()->create(['role' => 'participant', 'is_active' => true]);

        $adminEndpoints = [
            '/api/v1/admin/dashboard',
            '/api/v1/admin/registrations',
            '/api/v1/admin/submissions',
            '/api/v1/admin/events',
            '/api/v1/admin/categories',
            '/api/v1/admin/competitions',
            '/api/v1/admin/schedules',
            '/api/v1/admin/announcements',
            '/api/v1/admin/faqs',
            '/api/v1/admin/activity-logs',
            '/api/v1/admin/settings',
        ];

        foreach ($adminEndpoints as $endpoint) {
            $response = $this->actingAs($participant)->getJson($endpoint);
            $response->assertStatus(403);
        }
    }

    public function test_account_switching_clears_session_and_switches_role_cleanly(): void
    {
        $admin = User::factory()->create(['email' => 'admin@test.com', 'role' => 'admin', 'password' => bcrypt('pass123')]);
        $participant = User::factory()->create(['email' => 'part@test.com', 'role' => 'participant', 'password' => bcrypt('pass123')]);

        // 1. Admin login
        $loginAdmin = $this->postJson('/api/v1/auth/login', ['email' => 'admin@test.com', 'password' => 'pass123']);
        $loginAdmin->assertStatus(200);
        $this->assertAuthenticatedAs($admin);

        // 2. Admin logout
        $logout = $this->postJson('/api/v1/auth/logout');
        $logout->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logout berhasil. Sesi telah diakhiri.',
            ]);
        $this->app['auth']->forgetGuards();

        // 3. Participant login
        $loginPart = $this->postJson('/api/v1/auth/login', ['email' => 'part@test.com', 'password' => 'pass123']);
        $loginPart->assertStatus(200)
            ->assertJson([
                'data' => [
                    'user' => [
                        'role' => 'participant',
                        'dashboard_url' => '/participant/dashboard',
                    ],
                ],
            ]);
        $this->assertAuthenticatedAs($participant);
    }
}
