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

    /**
     * Regression: `when("0")` is falsy in PHP, so a search for the digit zero
     * used to be dropped and the endpoint returned every record instead.
     */
    public function test_searching_for_the_digit_zero_actually_filters(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        AddressBook::factory()->for($user, 'creator')->create([
            'name' => 'Zero Match', 'phone' => '+1 202 555 0000', 'email' => 'zero@example.com',
        ]);
        AddressBook::factory()->for($user, 'creator')->create([
            'name' => 'No Digits Here', 'phone' => '+1 555 111 2222', 'email' => 'nine@example.com',
        ]);

        // Only the first record contains a "0" in name/email/phone. If the
        // filter were skipped, both would come back.
        $this->getJson('/api/address-books?search=0')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.name', 'Zero Match');
    }

    /**
     * Regression: a non-numeric or nonsensical `per_page` used to cast to 0 and
     * clamp up to 1, serving a single record per page.
     */
    public function test_invalid_per_page_falls_back_to_the_default(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        AddressBook::factory()->for($user, 'creator')->count(20)->create();

        foreach (['abc', '0', '-5', ''] as $value) {
            $this->getJson("/api/address-books?per_page={$value}")
                ->assertOk()
                ->assertJsonPath('meta.per_page', 15);
        }

        // Valid values are still honoured, and the upper bound is capped.
        $this->getJson('/api/address-books?per_page=5')->assertJsonPath('meta.per_page', 5);
        $this->getJson('/api/address-books?per_page=99999')->assertJsonPath('meta.per_page', 100);
    }

    /**
     * Regression: `age_min=0` is a falsy value that must still be applied.
     */
    public function test_age_filter_applies_when_the_bound_is_zero(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        AddressBook::factory()->for($user, 'creator')->create(['age' => 10]);
        AddressBook::factory()->for($user, 'creator')->create(['age' => 80]);

        $this->getJson('/api/address-books?age_min=0&age_max=20')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }
}
