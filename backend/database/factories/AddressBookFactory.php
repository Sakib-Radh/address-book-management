<?php

namespace Database\Factories;

use App\Models\AddressBook;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AddressBook>
 */
class AddressBookFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<AddressBook>
     */
    protected $model = AddressBook::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'phone' => fake()->numerify('+8801#########'),
            'email' => fake()->unique()->safeEmail(),
            'website' => fake()->optional(0.7)->url(),
            'gender' => fake()->randomElement(['male', 'female', 'other']),
            'age' => fake()->numberBetween(18, 90),
            'nationality' => fake()->country(),
            'created_by' => User::factory(),
        ];
    }
}
