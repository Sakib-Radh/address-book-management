<?php

namespace App\Models;

use Database\Factories\AddressBookFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AddressBook extends Model
{

    use HasFactory;

    protected $table = 'address_book';

    const UPDATED_AT = null;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'website',
        'gender',
        'age',
        'nationality',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'age' => 'integer',
            'created_at' => 'datetime',
        ];
    }


    /**
     * The user who created this record.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
