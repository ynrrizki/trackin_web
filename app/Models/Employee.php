<?php

namespace App\Models;

use App\HasApprovable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class Employee extends Model
{
    use HasFactory, SoftDeletes, HasApprovable;
    protected $fillable = [
        'user_id',
        'employee_code', // nip
        'full_name',
        'email',
        'phone',
        'identity_number', // KTP or other ID
        'kk_number', // Kartu Keluarga
        'address',
        'postal_code',
        'birth_date',
        'religion',
        'gender',
        'mothermaiden_name', // new field
        'marital_status',
        'spouse_name',
        'spouse_phone',
        'place_of_birth',
        'last_education',
        'join_date',
        'position_id',
        'level_id',
        'department_id',
        'employment_status_id',
        'approval_line',
        'shift_id', // tidak dipakai di form create
        'end_date',
        'employee_type_id',
        'outsourcing_field_id',
        'basic_salary', // dari migration
        'photo_url',
        'status', // active, inactive, on_leave, resigned, and terminated
        'resignation_reason',
        'resignation_date',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'join_date' => 'date',
        'end_date' => 'date',
        'resignation_date' => 'date',
    ];

    const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
        self::STATUS_ON_LEAVE,
        self::STATUS_RESIGNED,
        self::STATUS_TERMINATED,
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_ON_LEAVE = 'on_leave';
    const STATUS_RESIGNED = 'resigned';
    const STATUS_TERMINATED = 'terminated';

    const MARITAL_STATUSES = [
        self::MARITAL_SINGLE,
        self::MARITAL_MARRIED,
        self::MARITAL_WIDOW,
        self::MARITAL_WIDOWER,
    ];

    const MARITAL_SINGLE = 'SINGLE';
    const MARITAL_MARRIED = 'MARRIED';
    const MARITAL_WIDOW = 'WIDOW';
    const MARITAL_WIDOWER = 'WIDOWER';

    public function getJoinDateAttribute($value)
    {
        return $value ? date('Y-m-d', strtotime($value)) : null;
    }

    public function getBirthDateAttribute($value)
    {
        return $value ? date('Y-m-d', strtotime($value)) : null;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function level()
    {
        return $this->belongsTo(PositionLevel::class, 'level_id');
    }

    public function positionLevel()
    {
        return $this->belongsTo(PositionLevel::class, 'level_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function employmentStatus()
    {
        return $this->belongsTo(EmploymentStatus::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    /**
     * Resolve the effective shift for the employee with inheritance:
     * 1) Employee custom shift (shift_id)
     * 2) Any assigned project's shift via shift_projects relationship
     * 3) Default HO shift configured in config('hrms.default_ho_shift_name')
     */
    public function effectiveShift(): ?Shift
    {
        // 1) Employee specific shift
        if ($this->relationLoaded('shift')) {
            if ($this->shift)
                return $this->shift;
        } else if (!empty($this->shift_id)) {
            $shift = Shift::find($this->shift_id);
            if ($shift)
                return $shift;
        }

        // 2) Inherit from any assigned project that has a shift
        try {
            $project = $this->assignedProjects()->with('shifts')->first();
            if ($project && $project->shifts && $project->shifts->count() > 0) {
                return $project->shifts->first();
            }
        } catch (\Throwable $e) {
            // ignore
        }

        // 3) Fallback to default HO shift by name
        $defaultName = config('hrms.default_ho_shift_name', 'Staff Holding');
        return Shift::where('name', $defaultName)->first();
    }

    public function employeeType()
    {
        return $this->belongsTo(EmployeeType::class);
    }

    public function outsourcingField()
    {
        return $this->belongsTo(OutsourcingField::class);
    }

    public function outsourceField()
    {
        return $this->belongsTo(OutsourcingField::class, 'outsourcing_field_id');
    }

    public function histories()
    {
        return $this->hasMany(EmployeeHistory::class);
    }

    public function bodyProfile()
    {
        return $this->hasOne(EmployeeBodyProfile::class);
    }


    public function taxStatus()
    {
        return $this->hasOne(EmployeeTaxStatus::class);
    }

    public function emergencyContacts()
    {
        return $this->hasMany(EmployeeEmergencyContact::class);
    }

    public function salaries()
    {
        return $this->hasMany(EmployeeSalary::class);
    }

    public function bpjs()
    {
        return $this->hasMany(EmployeeBpjs::class);
    }

    public function payslips()
    {
        return $this->hasMany(Payslip::class);
    }

    public function bankAccounts()
    {
        return $this->hasMany(EmployeeBankAccount::class);
    }

    public function projects()
    {
        return $this->hasMany(EmployeeProject::class);
    }

    public function assignedProjects()
    {
        return $this->belongsToMany(ClientProject::class, 'employee_projects', 'employee_id', 'project_id');
    }

    public function documents()
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeInactive($query)
    {
        return $query->where('status', self::STATUS_INACTIVE);
    }

    public function scopeOnLeave($query)
    {
        return $query->where('status', self::STATUS_ON_LEAVE);
    }

    public function scopeResigned($query)
    {
        return $query->where('status', self::STATUS_RESIGNED);
    }

    public function scopeIsOutsource($query): mixed
    {
        return $query->whereHas('outsourcingField');
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('full_name', 'like', "%{$search}%")
                ->orWhere('employee_code', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%");
        });
    }

    public function setFullNameAttribute($value)
    {
        $name = trim($value);
        $this->attributes['full_name'] = $name;

        // Kalau model sudah ada di DB, update User-nya langsung
        if ($this->exists && $this->user) {
            $this->user->update(['name' => $name]);
        }
    }

    public function setEmailAttribute($value)
    {
        $email = trim($value);
        $this->attributes['email'] = $email;

        if ($this->exists && $this->user) {
            $this->user->update(['email' => $email]);
        }
    }

    public static function generateUniqueCode(string $prefix = 'EMP', int $pad = 3): string
    {
        $attempts = 0;
        do {
            // Format konsisten: EMP-001, EMP-002, ...
            $num = random_int(1, 9999);
            $code = sprintf('%s-%s', $prefix, str_pad((string) $num, $pad, '0', STR_PAD_LEFT));

            $exists = self::where('employee_code', $code)->exists();

            // Extra guard: bila index unik bentrok saat create(), kita retry di luar loop
            if (!$exists) {
                return $code;
            }
        } while (++$attempts < 20);

        throw new \RuntimeException('Failed generating unique employee code after many attempts.');
    }

    protected static function booted(): void
    {
        parent::booted();

        // Saat menyimpan (create/update) — sebelum commit
        static::saving(function (Employee $employee) {
            // Jika belum terhubung ke user, coba hubungkan/buat
            if (empty($employee->user_id)) {
                // Cari user yang sudah ada berdasarkan email employee
                $existing = null;
                if (!empty($employee->email)) {
                    $existing = User::where('email', $employee->email)->first();
                }

                if ($existing) {
                    // Pakai user yang sudah ada
                    $employee->user_id = $existing->id;
                } else {
                    // Belum ada user → buat user baru
                    $password = "password";
                    $user = User::create([
                        'name' => $employee->full_name ?? ($employee->employee_code ?? 'Employee'),
                        'email' => $employee->email ?: Str::uuid() . '@no-email.local',
                        'password' => Hash::make($password),
                        // Tambahkan field lain yang diperlukan di User (mis. username) jika ada
                    ]);

                    // (Opsional) assign role default karyawan
                    if (method_exists($user, 'assignRole')) {
                        try {
                            $user->assignRole('employee');
                        } catch (\Throwable $e) {
                            /* silent */
                        }
                    }

                    $employee->user_id = $user->id; // set FK sebelum insert/update
                }
            }
            // NOTE:
            // - Di tahap "saving" aman set user_id tanpa memicu loop save.
            // - Email sinkron ke User akan di-handle di hook "saved" di bawah.
        });

        // Setelah tersimpan (sudah punya ID), sinkronkan atribut User
        static::saved(function (Employee $employee) {
            if (!$employee->relationLoaded('user')) {
                $employee->load('user');
            }
            $user = $employee->user;
            if (!$user) {
                return;
            }

            $dirty = [];

            // Sinkronkan name
            if ($employee->wasChanged('full_name') && $employee->full_name && $user->name !== $employee->full_name) {
                $dirty['name'] = $employee->full_name;
            }

            // Sinkronkan email (kalau ada & berbeda)
            // Catatan: Anda sudah punya mutator setEmailAttribute yang update User jika relasi ada.
            // Baris di bawah hanya sebagai jaring pengaman.
            if (!empty($employee->email) && $user->email !== $employee->email) {
                $dirty['email'] = $employee->email;
            }

            if (!empty($dirty)) {
                $user->forceFill($dirty)->saveQuietly();
            }
        });
    }
}
