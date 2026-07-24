<?php

use App\Http\Controllers\AddressBookController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Public authentication endpoint — issues a Sanctum token.
Route::post('/login', [AuthController::class, 'login']);

// Everything below requires a valid Sanctum bearer token.
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('address-books', AddressBookController::class);
});
