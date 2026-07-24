<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Columns match the task spec exactly:
     *   id, name, phone, email, website, gender, age, nationality, created_at, created_by
     * There is deliberately NO `updated_at` column (the spec omits it); the
     * AddressBook model disables it via `const UPDATED_AT = null`.
     */
    public function up(): void
    {
        Schema::create('address_book', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone');
            $table->string('email');
            $table->string('website')->nullable();
            $table->string('gender');
            $table->unsignedTinyInteger('age');
            $table->string('nationality');
            $table->timestamp('created_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('address_book');
    }
};
