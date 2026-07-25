<?php

namespace App\Http\Controllers;

use App\Http\Requests\AddressBookRequest;
use App\Models\AddressBook;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AddressBookController extends Controller
{
    /**
     * List address book records with search, filtering, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 15), 1), 100);

        $records = AddressBook::query()
            ->when(trim((string) $request->query('search', '')), function ($query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($request->query('gender'), fn ($query, $gender) => $query->where('gender', $gender))
            ->when($request->query('nationality'), fn ($query, $nationality) => $query->where('nationality', 'like', "%{$nationality}%"))
            ->when($request->filled('age_min'), fn ($query) => $query->where('age', '>=', (int) $request->query('age_min')))
            ->when($request->filled('age_max'), fn ($query) => $query->where('age', '<=', (int) $request->query('age_max')))
            ->latest('created_at')
            ->paginate($perPage);

        return ApiResponse::paginated($records, 'Address book entries retrieved.');
    }

    /**
     * Store a newly created record, deriving `created_by` from the authenticated user.
     */
    public function store(AddressBookRequest $request): JsonResponse
    {
        $record = new AddressBook($request->validated());
        $record->created_by = $request->user()->id;
        $record->save();

        return ApiResponse::success($record, 'Address book entry created.', 201);
    }

    /**
     * Display a single record.
     */
    public function show(AddressBook $addressBook): JsonResponse
    {
        return ApiResponse::success($addressBook, 'Address book entry retrieved.');
    }

    /**
     * Update an existing record. `created_by` is never reassigned.
     */
    public function update(AddressBookRequest $request, AddressBook $addressBook): JsonResponse
    {
        Gate::authorize('update', $addressBook);
        $addressBook->fill($request->validated());
        $addressBook->save();

        return ApiResponse::success($addressBook, 'Address book entry updated.');
    }

    /**
     * Remove a record.
     */
    public function destroy(AddressBook $addressBook): JsonResponse
    {
        Gate::authorize('delete', $addressBook);
        $addressBook->delete();

        return ApiResponse::success(null, 'Address book entry deleted.');
    }
}
