<?php

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    public function show()
    {
        $user = Auth::user();

        if (!$user) {
            return $this->respondError('User not authenticated', 401);
        }

        $employee = $user->employee()
            ->with([
                'position',
                'level',
                'department',
                'employmentStatus',
                'employeeType',
                'outsourcingField',
                'shift',
                'bankAccounts',
                'emergencyContacts',
                'bpjs',
                'bodyProfile'
            ])
            ->first();

        if (!$employee) {
            return $this->respondError404();
        }

        return $this->respondSuccess([
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
            'employee' => $employee
        ]);
    }
}
