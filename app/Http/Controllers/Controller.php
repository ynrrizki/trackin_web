<?php

namespace App\Http\Controllers;

abstract class Controller
{
    protected function respondSuccess($data, bool $isPaginated = false, string $message = "Data retreive successfully")
    {
        if (!$isPaginated)
            $data = ['data' => $data];

        return response()->json([
            "success" => true,
            "message" => $message,
            ...$data,
        ]);
    }

    protected function respondCreated($data, bool $isPaginated = false, string $message = "Data created successfully")
    {
        if (!$isPaginated)
            $data = ["data" => $data];

        return response()->json([
            "success" => true,
            "message" => $message,
            ...$data,
        ], 201);
    }

    protected function respondError404()
    {

        return response()->json([
            "success" => false,
            "message" => "Data not found",
        ], 404);
    }

    protected function respondError500(string $throw = "")
    {
        return response()->json([
            "success" => false,
            "message" => "Internal Server Error",
            "throw" => $throw,
        ], 500);
    }

    protected function respondError(string $message = "An error occurred", int $statusCode = 400)
    {
        return response()->json([
            "success" => false,
            "message" => $message,
        ], $statusCode);
    }
}
