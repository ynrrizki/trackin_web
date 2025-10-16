<?php

namespace App\Http\Controllers\SecurityOps;

use App\Http\Controllers\Controller;
use App\Models\Patroli;
use App\Models\PatroliFile;
use App\Models\ClientProject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;
use Inertia\Inertia;

class PatroliController extends Controller
{
    public function index(Request $request)
    {
        $query = Patroli::with(['employee', 'project', 'checkpoint'])
            ->latest();

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->get('project_id'));
        }
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->get('employee_id'));
        }
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date('date'));
        }

        $patrols = $query->paginate(15)->withQueryString();
        $projects = ClientProject::select('id','name')->orderBy('name')->get();

        return Inertia::render('security-ops/patroli/page', [
            'patrols' => $patrols,
            'projects' => $projects,
            'filters' => $request->only(['project_id','employee_id','date'])
        ]);
    }


    public function show(Patroli $patroli)
    {
        $patroli->load(['employee','project','checkpoint','files']);
        $geofence = null;
        if ($patroli->checkpoint && $patroli->checkpoint->latitude && $patroli->checkpoint->longitude && $patroli->checkpoint->radius_m && $patroli->latitude && $patroli->longitude) {
            $distance = $this->haversine($patroli->checkpoint->latitude, $patroli->checkpoint->longitude, $patroli->latitude, $patroli->longitude);
            $radius = (float) $patroli->checkpoint->radius_m;
            $inside = $distance <= $radius;
            $geofence = [
                'distance_m' => round($distance,2),
                'radius_m' => $radius,
                'inside' => $inside,
                'remaining_m' => $inside ? 0 : max(0, round($distance - $radius,2)),
            ];
        }
        return Inertia::render('security-ops/patroli/show', [
            'patroli' => $patroli,
            'geofence' => $geofence,
        ]);
    }

    public function destroy(Patroli $patroli)
    {
        $patroli->delete();
        return redirect()->route('security-ops.patroli.index')->with('success','Deleted');
    }

    public function complete(Patroli $patroli)
    {
        $patroli->update(['status' => Patroli::STATUS_COMPLETED]);
        return back()->with('success','Patroli completed');
    }

    public function destroyFile(PatroliFile $file)
    {
        Storage::disk('public')->delete($file->file_path);
        $file->delete();
        return back()->with('success','File removed');
    }

    public function downloadZip(Patroli $patroli): StreamedResponse
    {
        $patroli->loadMissing('files');
        abort_if($patroli->files->isEmpty(), 404, 'Tidak ada file untuk diunduh');

        $filename = 'patroli-' . $patroli->id . '-' . now()->format('Ymd_His') . '.zip';
        $tmpPath = storage_path('app/tmp');
        if (! is_dir($tmpPath)) {
            @mkdir($tmpPath, 0775, true);
        }
        $zipFullPath = $tmpPath . DIRECTORY_SEPARATOR . $filename;

        $zip = new ZipArchive();
        if ($zip->open($zipFullPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Gagal membuat arsip zip');
        }

        foreach ($patroli->files as $idx => $file) {
            $diskPath = Storage::disk('public')->path($file->file_path);
            if (!is_file($diskPath)) {
                continue; // skip missing
            }
            $nameInZip = basename($file->file_path);
            // Avoid duplicate names
            if ($zip->locateName($nameInZip) !== false) {
                $dotPos = strrpos($nameInZip, '.');
                if ($dotPos !== false) {
                    $base = substr($nameInZip, 0, $dotPos);
                    $ext = substr($nameInZip, $dotPos + 1);
                    $nameInZip = $base . '_' . ($idx+1) . '.' . $ext;
                } else {
                    $nameInZip = $nameInZip . '_' . ($idx+1);
                }
            }
            $zip->addFile($diskPath, $nameInZip);
        }
        $zip->close();

        return response()->streamDownload(function () use ($zipFullPath) {
            $stream = fopen($zipFullPath, 'rb');
            if ($stream) {
                while (!feof($stream)) {
                    echo fread($stream, 1024 * 64);
                }
                fclose($stream);
            }
            // cleanup after sending
            @unlink($zipFullPath);
        }, $filename, [
            'Content-Type' => 'application/zip'
        ]);
    }

    protected function haversine($lat1, $lon1, $lat2, $lon2): float
    {
        $earth = 6371000; // meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        return $earth * $c;
    }
}
