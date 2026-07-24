<?php

namespace Tests\Feature;

use App\Models\AddressBook;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AddressBookTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A valid payload the store/update endpoints will accept.
     *
     * @return array<string, mixed>
     */
    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Jane Doe',
            'phone' => '+1 202 555 0175',
            'email' => 'jane@example.com',
            'website' => 'https://jane.example.com',
            'gender' => 'female',
            'age' => 30,
            'nationality' => 'United States',
        ], $overrides);
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/address-books')->assertUnauthorized();
        $this->postJson('/api/address-books', $this->validPayload())->assertUnauthorized();
    }

    public function test_an_authenticated_user_can_create_a_record(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/address-books', $this->validPayload());

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Jane Doe')
            ->assertJsonPath('data.email', 'jane@example.com');

        $this->assertDatabaseHas('address_book', ['email' => 'jane@example.com']);
    }

    public function test_creating_a_record_fails_validation_with_bad_input(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/address-books', $this->validPayload([
            'email' => 'not-an-email',
            'gender' => 'unknown',
            'age' => 0,
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'gender', 'age']);
    }

    public function test_created_by_is_derived_from_auth_and_cannot_be_spoofed(): void
    {
        $actor = User::factory()->create();
        $victim = User::factory()->create();

        Sanctum::actingAs($actor);

        // Client attempts to set created_by to a different user — must be ignored.
        $this->postJson('/api/address-books', $this->validPayload([
            'created_by' => $victim->id,
        ]))->assertCreated();

        $this->assertDatabaseHas('address_book', [
            'email' => 'jane@example.com',
            'created_by' => $actor->id,
        ]);
        $this->assertDatabaseMissing('address_book', [
            'email' => 'jane@example.com',
            'created_by' => $victim->id,
        ]);
    }

    public function test_index_supports_search_and_filtering(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        AddressBook::factory()->for($user, 'creator')->create([
            'name' => 'Alice Smith', 'gender' => 'female', 'age' => 25, 'nationality' => 'Canada',
        ]);
        AddressBook::factory()->for($user, 'creator')->create([
            'name' => 'Bob Jones', 'gender' => 'male', 'age' => 60, 'nationality' => 'Brazil',
        ]);

        // Search by name.
        $this->getJson('/api/address-books?search=Alice')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.name', 'Alice Smith');

        // Filter by gender + age range excludes Bob.
        $this->getJson('/api/address-books?gender=female&age_min=20&age_max=40')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_a_record_can_be_updated_and_deleted(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $record = AddressBook::factory()->for($user, 'creator')->create();

        $this->putJson("/api/address-books/{$record->id}", $this->validPayload([
            'name' => 'Updated Name',
        ]))->assertOk()->assertJsonPath('data.name', 'Updated Name');

        $this->deleteJson("/api/address-books/{$record->id}")
            ->assertOk()
            ->assertJsonPath('status', true);

        $this->assertDatabaseMissing('address_book', ['id' => $record->id]);
    }
}
