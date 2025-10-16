<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\OutsourcingField;
use Inertia\Inertia;
use Illuminate\Http\Request;

class CRMController extends Controller
{
    public function index()
    {
        return Inertia::render('settings/crm/page', [
            'stats' => [
                'outsourcing_fields' => OutsourcingField::count(),
            ]
        ]);
    }

    public function outsourcingFields()
    {
        $outsourcingFields = OutsourcingField::withCount(['projects', 'employees'])
            ->latest()
            ->get();

        return Inertia::render('settings/crm/outsourcing-fields', [
            'outsourcingFields' => $outsourcingFields,
        ]);
    }

    public function storeOutsourcingField(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:outsourcing_fields,code',
            'name' => 'required|string|max:255|unique:outsourcing_fields,name',
            'description' => 'nullable|string',
        ]);

        OutsourcingField::create($validated);

        return back()->with('success', 'Outsourcing field berhasil ditambahkan');
    }

    public function updateOutsourcingField(Request $request, OutsourcingField $outsourcingField)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:outsourcing_fields,code,' . $outsourcingField->id,
            'name' => 'required|string|max:255|unique:outsourcing_fields,name,' . $outsourcingField->id,
            'description' => 'nullable|string',
        ]);

        $outsourcingField->update($validated);

        return back()->with('success', 'Outsourcing field berhasil diperbarui');
    }

    public function destroyOutsourcingField(OutsourcingField $outsourcingField)
    {
        // Check if there are projects or employees using this field
        if ($outsourcingField->projects()->count() > 0 || $outsourcingField->employees()->count() > 0) {
            return back()->with('error', 'Tidak dapat menghapus outsourcing field yang masih digunakan');
        }

        $outsourcingField->delete();

        return back()->with('success', 'Outsourcing field berhasil dihapus');
    }
}
