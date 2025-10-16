<?php

namespace App\Http\Controllers\Traits;

trait ApiResponseTrait
{
    /**
     * Success response method
     */
    public function respondSuccess($message = 'Success', $data = null, $code = 200)
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * Error response method
     */
    public function respondError($message = 'Error', $code = 400, $errors = null)
    {
        $response = [
            'status' => 'error',
            'message' => $message,
        ];

        if ($errors) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    /**
     * Validation error response
     */
    public function respondValidationError($errors, $message = 'Validation failed')
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
            'errors' => $errors,
        ], 422);
    }

    /**
     * Unauthorized response
     */
    public function respondUnauthorized($message = 'Unauthorized')
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
        ], 401);
    }

    /**
     * Forbidden response
     */
    public function respondForbidden($message = 'Forbidden')
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
        ], 403);
    }

    /**
     * Not found response
     */
    public function respondNotFound($message = 'Resource not found')
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
        ], 404);
    }
}
