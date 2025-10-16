<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            if (Auth::attempt($request->only('email', 'password'))) {
                $user = Auth::user();

                // Create token
                $token = $user->createToken('API Token')->plainTextToken;

                // Get user roles and permissions
                $roles = $user->getRoleNames();
                $permissions = $user->getAllPermissions()->pluck('name');

                return $this->respondSuccess([
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'roles' => $roles,
                        'permissions' => $permissions,
                    ],
                    'token' => $token,
                ], false, 'Login successful');
            }

            return $this->respondError('Invalid credentials', 401);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->respondError500('An error occurred during login');
        }
    }

    public function logout(Request $request)
    {
        try {
            // Revoke the token that was used to authenticate the current request
            $request->user()->currentAccessToken()->delete();

            return $this->respondSuccess([], false, 'Logged out successfully');
        } catch (\Exception $e) {
            return $this->respondError500('An error occurred during logout');
        }
    }

    public function user(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->respondError('Unauthorized', 401);
            }

            // Get user roles and permissions
            $roles = $user->getRoleNames();
            $permissions = $user->getAllPermissions()->pluck('name');

            return $this->respondSuccess([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $roles,
                    'permissions' => $permissions,
                ],
            ], false, 'User data retrieved successfully');
        } catch (\Exception $e) {
            return $this->respondError500('An error occurred while retrieving user data');
        }
    }

    public function refreshToken(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->respondError('Unauthorized', 401);
            }

            // Revoke current token
            $request->user()->currentAccessToken()->delete();

            // Create new token
            $token = $user->createToken('API Token')->plainTextToken;

            return $this->respondSuccess([
                'token' => $token,
            ], false, 'Token refreshed successfully');
        } catch (\Exception $e) {
            return $this->respondError500('An error occurred while refreshing token');
        }
    }
}
