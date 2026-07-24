<?php

namespace Database\Seeders;

use App\Models\AddressBook;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Creates a single documented admin account and ~50 address book records
     * owned by that admin.
     *
     * Default admin credentials (documented in README.md):
     *   email:    admin@example.com
     *   password: password
     */
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
            ],
        );

        AddressBook::factory()
            ->count(50)
            ->for($admin, 'creator')
            ->create();
    }
}
