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
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $requestedPerPage = $request->query('per_page');
        $perPage = is_numeric($requestedPerPage) && (int) $requestedPerPage >= 1
            ? min((int) $requestedPerPage, 100)
            : 15;

        $search = trim((string) $request->query('search', ''));
        $gender = trim((string) $request->query('gender', ''));
        $nationality = trim((string) $request->query('nationality', ''));

        $records = AddressBook::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($gender !== '', fn ($query) => $query->where('gender', $gender))
            ->when($nationality !== '', fn ($query) => $query->where('nationality', 'like', "%{$nationality}%"))
            ->when(is_numeric($request->query('age_min')), fn ($query) => $query->where('age', '>=', (int) $request->query('age_min')))
            ->when(is_numeric($request->query('age_max')), fn ($query) => $query->where('age', '<=', (int) $request->query('age_max')))
            ->latest('created_at')
            ->paginate($perPage);

        return ApiResponse::paginated($records, 'Address book entries retrieved.');
    }

    /**
     * Store a newly created record, deriving `created_by` from the authenticated user.
     *
     * @param AddressBookRequest $request
     * @return JsonResponse
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
     *
     * @param AddressBook $addressBook
     * @return JsonResponse
     */
    public function show(AddressBook $addressBook): JsonResponse
    {
        return ApiResponse::success($addressBook, 'Address book entry retrieved.');
    }

    /**
     * Update an existing record. `created_by` is never reassigned.
     *
     * @param AddressBookRequest $request
     * @param AddressBook $addressBook
     * @return JsonResponse
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
     *
     * @param AddressBook $addressBook
     * @return JsonResponse
     */
    public function destroy(AddressBook $addressBook): JsonResponse
    {
        Gate::authorize('delete', $addressBook);
        $addressBook->delete();

        return ApiResponse::success(null, 'Address book entry deleted.');
    }
}
