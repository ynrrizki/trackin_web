<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientProject;
use App\Models\OutsourcingField;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = ClientProject::query()->with(['client', 'outsourceField']);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }
        if ($clientId = $request->get('client_id')) {
            $query->where('client_id', $clientId);
        }
        if ($fieldId = $request->get('outsourcing_field_id')) {
            $query->where('outsourcing_field_id', $fieldId);
        }

        $projects = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('crm/client-project/page', [
            'data' => $projects,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'client_id' => $clientId,
                'outsourcing_field_id' => $fieldId,
            ],
            'masters' => [
                'clients' => Client::select('id', 'name')->get(),
                'outsourcing_fields' => OutsourcingField::select('id', 'name')->get(),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('crm/client-project/form-create', [
            'masters' => [
                'clients' => Client::select('id', 'name')->get(),
                'outsourcing_fields' => OutsourcingField::select('id', 'name')->get(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'outsourcing_field_id' => 'nullable|exists:outsourcing_fields,id',
            'code' => 'required|string|max:50|unique:client_projects,code',
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'latitude' => 'nullable|string',
            'longitude' => 'nullable|string',
            'required_agents' => 'required|integer|min:1',
            'status' => 'required|in:tender,won,lost,cancelled',
            'contract_start' => 'nullable|date',
            'contract_end' => 'nullable|date|after_or_equal:contract_start',
            'hourly_rate' => 'nullable|numeric|min:0',
            'monthly_rate' => 'nullable|numeric|min:0',
            'special_requirements' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        ClientProject::create($validated);
        return redirect()->route('crm.client-projects.index')->with('success', 'Project created');
    }

    public function edit(ClientProject $clientProject)
    {
        return Inertia::render('crm/client-project/form-edit', [
            'project' => $clientProject->load('client'),
            'masters' => [
                'clients' => Client::select('id', 'name')->get(),
                'outsourcing_fields' => OutsourcingField::select('id', 'name')->get(),
            ],
        ]);
    }

    public function update(Request $request, ClientProject $clientProject)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'outsourcing_field_id' => 'nullable|exists:outsourcing_fields,id',
            'code' => 'required|string|max:50|unique:client_projects,code,' . $clientProject->id,
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'latitude' => 'nullable|string',
            'longitude' => 'nullable|string',
            'required_agents' => 'required|integer|min:1',
            'status' => 'required|in:tender,won,lost,cancelled',
            'contract_start' => 'nullable|date',
            'contract_end' => 'nullable|date|after_or_equal:contract_start',
            'hourly_rate' => 'nullable|numeric|min:0',
            'monthly_rate' => 'nullable|numeric|min:0',
            'special_requirements' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $clientProject->update($validated);
        return redirect()->route('crm.client-projects.index')->with('success', 'Project updated');
    }

    public function destroy(ClientProject $clientProject)
    {
        $clientProject->delete();
        return back()->with('success', 'Project deleted');
    }
}
