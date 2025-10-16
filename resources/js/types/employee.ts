// Main employee data based on EmployeeController validation
export type EmployeeFormType = {
    // Step 1: Personal Data - sesuai migration dan controller
    full_name: string | null;
    email: string | null;
    phone: string | null;
    identity_number?: string | null; // KTP or other ID - dari migration
    kk_number?: string | null; // Kartu Keluarga - dari migration
    address: string | null;
    postal_code?: string | null;
    birth_date: string | null;
    religion?: string | null;
    mothermaiden_name?: string | null; // Nama Ibu Kandung - dari migration
    marital_status?: string | null;
    spouse_name?: string | null; // Nama Pasangan - dari migration
    spouse_phone?: string | null; // No. Telepon Pasangan - dari migration
    place_of_birth?: string | null;
    last_education?: string | null; // Pendidikan Terakhir - dari migration
    gender: 'MALE' | 'FEMALE' | null;

    // Personal Data bagian Emergency Contact
    emergency_contact: {
        name: string | null;
        relationship: string | null;
        phone: string | null;
    };

    // Personal Data bagian Body Profile
    height?: string | null;
    weight?: string | null;
    blood_type?: 'A' | 'B' | 'AB' | 'O' | 'UNKNOWN' | '' | null;
    shirt_size?: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'CUSTOM' | 'UNKNOWN' | '' | null;
    shoe_size?: string | null;
    health_notes?: string | null;

    // Step 2: Employment Data - sesuai controller
    employee_code?: string | null; // NIP - mungkin auto generate
    join_date: string | null;
    end_date: string | null;
    position_id: string | null;
    level_id: string | null;
    department_id: string | null;
    employment_status_id: string | null;
    employee_type_id: string | null;
    outsourcing_field_id: string | null;
    approval_line: string | null;

    // Step 3: Payroll Data - sesuai controller
    basic_salary: string | null; // controller menggunakan basic_salary

    // Bank Account (step 3) - sesuai controller
    cash_active: boolean;
    bank: {
        name: string | null;
        account_number: string | null;
        account_name: string | null;
        bank_code?: string | null;
        bank_branch?: string | null;
    };

    // BPJS (step 3) - sesuai controller
    bpjs_kesehatan_active: boolean;
    bpjs_kesehatan_number: string | null;
    bpjs_kesehatan_contribution: string | null;
    bpjs_ketenagakerjaan_active: boolean;
    bpjs_ketenagakerjaan_number: string | null;
    bpjs_ketenagakerjaan_contribution: string | null;

    // Tax Info (step 3) - sesuai controller
    ptkp_code: string | null;
    npwp: string | null;
    is_spouse_working: boolean;
};

// Error type (avoid intersecting object fields with base string map)
export interface EmployeeFormErrorsType {
    // Scalar (string/boolean/date/number) fields errors
    full_name?: string;
    email?: string;
    phone?: string;
    identity_number?: string;
    kk_number?: string;
    address?: string;
    postal_code?: string;
    birth_date?: string;
    religion?: string;
    mothermaiden_name?: string;
    gender?: string;
    marital_status?: string;
    spouse_name?: string;
    spouse_phone?: string;
    place_of_birth?: string;
    last_education?: string;
    height?: string;
    weight?: string;
    blood_type?: string;
    shirt_size?: string;
    shoe_size?: string;
    health_notes?: string;
    employee_code?: string;
    join_date?: string;
    end_date?: string;
    position_id?: string;
    level_id?: string;
    department_id?: string;
    employment_status_id?: string;
    employee_type_id?: string;
    outsourcing_field_id?: string;

    approval_line?: string;
    basic_salary?: string;
    cash_active?: string; // boolean but error message string
    bpjs_kesehatan_active?: string;
    bpjs_kesehatan_number?: string;
    bpjs_kesehatan_contribution?: string;
    bpjs_ketenagakerjaan_active?: string;
    bpjs_ketenagakerjaan_number?: string;
    bpjs_ketenagakerjaan_contribution?: string;
    ptkp_code?: string;
    npwp?: string;
    is_spouse_working?: string;
    // Nested objects
    emergency_contact?: {
        name?: string;
        relationship?: string;
        phone?: string;
    };
    bank?: {
        name?: string;
        account_number?: string;
        account_name?: string;
        bank_code?: string;
        bank_branch?: string;
    };
}

export interface EmployeeFormStepProps {
    form: EmployeeFormType;
    errors: EmployeeFormErrorsType;
    setData: (field: keyof EmployeeFormType, value: EmployeeFormType[keyof EmployeeFormType]) => void;
}

export type EmployeeDetail = {
    id: number;
    user_id: number;
    employee_code: string | null;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    identity_number: string | null;
    kk_number: string | null;
    address: string | null;
    postal_code: string | null;
    birth_date: string | null;
    religion: string | null;
    gender: 'MALE' | 'FEMALE' | null;
    marital_status: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | null;
    mothermaiden_name: string | null;
    spouse_name: string | null;
    spouse_phone: string | null;
    place_of_birth: string | null;
    last_education: string | null;
    join_date: string | null;
    end_date: string | null;
    // new
    approval_line: string | null;
    basic_salary: string | null;
    status: string | null;
    photo_url: string | null;
    employment_status: { id: number; name: string } | null;
    // end new
    position?: { id: number; name: string } | null;
    position_level?: { id: number; name: string } | null;
    employee_type?: { id: number; name: string } | null;
    outsourcing_field?: { id: number; name: string } | null;
    emergency_contacts: {
        name: string | null;
        relationship: string | null;
        phone: string | null;
    }[];
    bank_accounts: {
        name: string | null;
        account_number: string | null;
        account_name: string | null;
        bank_code: string | null;
        bank_branch: string | null;
    }[];
    bpjs: {
        bpjs_type: 'KS' | 'TK';
        participant_number: string | null;
        contribution_type: 'BY-COMPANY' | 'BY-EMPLOYEE' | 'DEFAULT';
    };
    tax_status: {
        ptkp_code: 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' | 'K/1' | 'K/2' | 'K3'; // used
        is_spouse_working: boolean; // used
        npwp: string | null; // used
        // tax_method: 'GROSS' | 'GROSS-UP' | 'NET' | null;
        // tax_salary: 'TAXABLE' | 'NON-TAXABLE' | null;
        // tax_status:
        //     | 'Pegawai Tetap'
        //     | 'Pegawai Tidak Tetap'
        //     | 'Bukan Pegawai yang Bersifat Berkesinambungan'
        //     | 'Bukan Pegawai yang tidak Bersifat Berkesinambungan'
        //     | 'Ekspatriat'
        //     | 'Ekspatriat Dalam Negeri'
        //     | 'Tenaga Ahli yang Bersifat Berkesinambungan'
        //     | 'Tenaga Ahli yang Tidak Bersifat Berkesinambungan'
        //     | 'Dewan Komisaris'
        //     | 'Tenaga Ahli yang Bersifat Berkesinambungan >1 PK'
        //     | 'Tenaga Kerja Lepas'
        //     | 'Bukan Pegawai yang Bersifat Berkesinambungan >1 PK'
        //     | null;
        // jht: 'NOT-PAID' | 'PAID-BY-COMPANY' | 'PAID-BY-EMPLOYEE' | 'DEFAULT' | null;
        // jp: 'NOT-PAID' | 'PAID-BY-COMPANY' | 'PAID-BY-EMPLOYEE' | 'DEFAULT' | null;
    } | null;
    recent_attendances: {
        id: number;
        date: string;
        time_in: string | null;
        time_out: string | null;
        latlot_in: string | null;
        latlot_out: string | null;
        is_fake_map_detected: boolean;
    }[];
    body_profile: {
        height: string | null;
        weight: string | null;
        blood_type: 'A' | 'B' | 'AB' | 'O' | 'UNKNOWN' | '' | null;
        shirt_size: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'CUSTOM' | 'UNKNOWN' | '' | null;
        shoe_size: string | null;
        health_notes: string | null;
    };
    department: {
        id: number;
        name: string;
    } | null;
};

// Attendance specific types
export type AttendanceRecord = {
    id: number;
    date: string;
    time_in: string | null;
    time_out: string | null;
    latlot_in: string | null;
    latlot_out: string | null;
    is_fake_map_detected: boolean;
};
