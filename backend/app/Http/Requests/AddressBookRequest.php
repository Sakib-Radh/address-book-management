<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddressBookRequest extends FormRequest
{
    /**
     * Allowed values for the `gender` column.
     *
     * @var list<string>
     */
    public const GENDERS = ['male', 'female', 'other'];

    /**
     * Authenticated user create a record.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Strict server-side validation rules.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'regex:/^\+?[0-9\s\-\(\)]{7,20}$/'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'gender' => ['required', Rule::in(self::GENDERS)],
            'age' => ['required', 'integer', 'min:1', 'max:150'],
            'nationality' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * Human-friendly validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.regex' => 'The phone must be 7-20 characters and may contain digits, spaces, +, -, and parentheses.',
            'gender.in' => 'The gender must be one of: '.implode(', ', self::GENDERS).'.',
        ];
    }
}
