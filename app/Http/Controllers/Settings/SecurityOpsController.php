<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SecurityOpsController extends Controller
{
    public function index()
    {
        return inertia('settings/security-ops/page');
    }

    public function incidentCategories()
    {
        // $categories = \App\Models\IncidentCategory::orderBy('name')->get();

        // return Inertia::render('settings/security-ops/incident-categories', [
        //     'categories' => $categories,
        // ]);

        // Get Categories with incident counts
        $categories = \App\Models\IncidentCategory::withCount('incidents')->orderBy('name')->get();
        return Inertia::render('settings/security-ops/incident-categories', [
            'categories' => $categories,
        ]);
    }

    public function storeIncidentCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:191|unique:incident_categories,name',
            'description' => 'nullable|string|max:1000',
        ]);

        $category = \App\Models\IncidentCategory::create([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json([
            'message' => 'Kategori insiden berhasil ditambahkan.',
            'category' => $category,
        ]);
    }

    public function updateIncidentCategory(Request $request, \App\Models\IncidentCategory $category)
    {
        $request->validate([
            'name' => 'required|string|max:191|unique:incident_categories,name,' . $category->id,
            'description' => 'nullable|string|max:1000',
        ]);

        $category->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json([
            'message' => 'Kategori insiden berhasil diperbarui.',
            'category' => $category,
        ]);
    }

    public function destroyIncidentCategory(\App\Models\IncidentCategory $category)
    {
        // Optional: Check if category is used in any incidents before deleting
        if ($category->incidents()->exists()) {
            return response()->json([
                'message' => 'Kategori insiden tidak dapat dihapus karena sedang digunakan oleh insiden.',
            ], 400);
        }

        $category->delete();

        return response()->json([
            'message' => 'Kategori insiden berhasil dihapus.',
        ]);
    }
}
