import { EmploymentDataStep, FormActions, PayrollDataStep, PersonalDataStep, StepNavigator } from '@/components/employee-form';
import employeeService from '@/services/employeeService';
import { EmployeeFormErrorsType, EmployeeFormType } from '@/types/employee';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface FormEmployeeEditWizardProps {
    employee: EmployeeFormType & { id: number };
}

export default function FormEmployeeEditWizard({ employee }: FormEmployeeEditWizardProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const steps = [
        { title: 'Data Personal', description: 'Informasi pribadi karyawan' },
        { title: 'Kepegawaian', description: 'Data kepegawaian & status kerja' },
        { title: 'Payroll', description: 'Data payroll & pajak' },
    ];

    const [currentStep, setCurrentStep] = useState<number>(0);
    // Local transformed errors (to support nested keys like emergency_contact.name -> errors.emergency_contact.name)
    const [formErrors, setFormErrors] = useState<EmployeeFormErrorsType>({});

    // Use Inertia's useForm and pre-fill with employee data
    const { data, setData, processing, errors } = useForm<EmployeeFormType>({
        // Step 1: Personal Data - pre-filled from employee
        full_name: employee.full_name,
        email: employee.email,
        phone: employee.phone,
        identity_number: employee.identity_number,
        kk_number: employee.kk_number,
        address: employee.address,
        postal_code: employee.postal_code,
        birth_date: employee.birth_date,
        religion: employee.religion,
        marital_status: employee.marital_status,
        spouse_name: employee.spouse_name,
        spouse_phone: employee.spouse_phone,
        place_of_birth: employee.place_of_birth,
        last_education: employee.last_education,
        mothermaiden_name: employee.mothermaiden_name,
        gender: employee.gender,

        // Body Profile - pre-filled from employee
        height: employee.height,
        weight: employee.weight,
        blood_type: employee.blood_type,
        shirt_size: employee.shirt_size,
        shoe_size: employee.shoe_size,
        health_notes: employee.health_notes,

        // Emergency Contact - pre-filled from employee
        emergency_contact: employee.emergency_contact,

        // Step 2: Employment Data - pre-filled from employee
        join_date: employee.join_date,
        end_date: employee.end_date,
        position_id: employee.position_id,
        level_id: employee.level_id,
        department_id: employee.department_id,
        employment_status_id: employee.employment_status_id,
        employee_type_id: employee.employee_type_id,
        outsourcing_field_id: employee.outsourcing_field_id,
        approval_line: employee.approval_line,

        // Step 3: Payroll Data - pre-filled from employee
        basic_salary: employee.basic_salary,
        cash_active: employee.cash_active,
        bank: employee.bank,

        // BPJS - pre-filled from employee
        bpjs_kesehatan_active: employee.bpjs_kesehatan_active,
        bpjs_kesehatan_number: employee.bpjs_kesehatan_number,
        bpjs_kesehatan_contribution: employee.bpjs_kesehatan_contribution,
        bpjs_ketenagakerjaan_active: employee.bpjs_ketenagakerjaan_active,
        bpjs_ketenagakerjaan_number: employee.bpjs_ketenagakerjaan_number,
        bpjs_ketenagakerjaan_contribution: employee.bpjs_ketenagakerjaan_contribution,

        // Tax Info - pre-filled from employee
        ptkp_code: employee.ptkp_code,
        npwp: employee.npwp,
        is_spouse_working: employee.is_spouse_working,
    });

    // Transform Inertia errors (flat keys / dot notation) into nested structure expected by step components
    useEffect(() => {
        if (!errors) {
            setFormErrors({});
            return;
        }
        const transformed: EmployeeFormErrorsType = {};
        Object.entries(errors).forEach(([rawKey, rawVal]) => {
            const val = rawVal as string;
            if (rawKey.includes('.')) {
                const [parent, child] = rawKey.split('.') as ['emergency_contact' | 'bank' | string, string];
                if (parent === 'emergency_contact') {
                    if (!transformed.emergency_contact) transformed.emergency_contact = {};
                    (transformed.emergency_contact as Record<string, string>)[child] = val;
                    return;
                }
                if (parent === 'bank') {
                    if (!transformed.bank) transformed.bank = {};
                    (transformed.bank as Record<string, string>)[child] = val;
                    return;
                }
            }
            (transformed as Record<string, string>)[rawKey] = val;
        });
        setFormErrors(transformed);
    }, [errors]);

    const nextStep = () => setCurrentStep((s: number) => Math.min(s + 1, steps.length - 1));
    const prevStep = () => setCurrentStep((s: number) => Math.max(s - 1, 0));

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();

        // Clear previous transformed errors
        setFormErrors({});

        // Create payload clone (remove optional UI-only empty strings if needed)
        const payload = { ...data } as EmployeeFormType;
        if (payload.cash_active) {
            // If cash_active true, blank out bank to satisfy optional logic
            payload.bank = { ...payload.bank, name: '', account_number: '', account_name: '' };
        }

        const loadingId = toast.loading('Menyimpan perubahan...');
        try {
            const res = await employeeService.updateEmployee(employee.id, payload);
            if (res.success) {
                toast.success(res.message || 'Karyawan berhasil diperbarui', { id: loadingId });
                // Redirect to employee detail page
                window.location.href = `/employees/${employee.id}`;
            } else {
                toast.error('Gagal memperbarui karyawan', { id: loadingId });
                if (res.errors) {
                    // Map validation errors similar to Inertia structure
                    const flat: Record<string, string> = {};
                    Object.entries(res.errors).forEach(([field, messages]) => {
                        flat[field] = (messages as string[])[0];
                    });
                    // Directly transform here to reduce delay
                    const transformed: EmployeeFormErrorsType = {};
                    Object.entries(flat).forEach(([rawKey, msg]) => {
                        if (rawKey.includes('.')) {
                            const [parent, child] = rawKey.split('.') as ['emergency_contact' | 'bank' | string, string];
                            if (parent === 'emergency_contact') {
                                if (!transformed.emergency_contact) transformed.emergency_contact = {};
                                (transformed.emergency_contact as Record<string, string>)[child] = msg;
                                return;
                            }
                            if (parent === 'bank') {
                                if (!transformed.bank) transformed.bank = {};
                                (transformed.bank as Record<string, string>)[child] = msg;
                                return;
                            }
                        }
                        (transformed as Record<string, string>)[rawKey] = msg;
                    });
                    setFormErrors(transformed);
                    // Auto navigate to first step containing error
                    const stepOrder: Array<Array<string>> = [
                        [
                            'full_name',
                            'email',
                            'phone',
                            'identity_number',
                            'kk_number',
                            'address',
                            'postal_code',
                            'birth_date',
                            'religion',
                            'marital_status',
                            'spouse_name',
                            'spouse_phone',
                            'place_of_birth',
                            'last_education',
                            'mothermaiden_name',
                            'gender',
                            'height',
                            'weight',
                            'blood_type',
                            'shirt_size',
                            'shoe_size',
                            'health_notes',
                            'emergency_contact.name',
                            'emergency_contact.relationship',
                            'emergency_contact.phone',
                        ],
                        [
                            'join_date',
                            'end_date',
                            'position_id',
                            'level_id',
                            'department_id',
                            'employment_status_id',
                            'employee_type_id',
                            'outsourcing_field_id',
                        ],
                        [
                            'basic_salary',
                            'cash_active',
                            'bank.name',
                            'bank.account_number',
                            'bank.account_name',
                            'bank.bank_code',
                            'bank.bank_branch',
                            'bpjs_kesehatan_active',
                            'bpjs_kesehatan_number',
                            'bpjs_kesehatan_contribution',
                            'bpjs_ketenagakerjaan_active',
                            'bpjs_ketenagakerjaan_number',
                            'bpjs_ketenagakerjaan_contribution',
                            'ptkp_code',
                            'npwp',
                            'is_spouse_working',
                        ],
                    ];
                    const flatKeys = new Set(Object.keys(flat));
                    const firstErrorStep = stepOrder.findIndex((group) => group.some((gk) => flatKeys.has(gk)));
                    if (firstErrorStep >= 0) setCurrentStep(firstErrorStep);
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan';
            toast.error(message, { id: loadingId });
        }
    };

    return (
        <div className="mx-auto w-full max-w-2xl">
            <StepNavigator steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep} />
            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 shadow-lg">
                {currentStep === 0 && <PersonalDataStep form={data} errors={formErrors} setData={setData} />}
                {currentStep === 1 && <EmploymentDataStep form={data} errors={formErrors} setData={setData} />}
                {currentStep === 2 && <PayrollDataStep form={data} errors={formErrors} setData={setData} />}
                <FormActions
                    currentStep={currentStep}
                    totalSteps={steps.length}
                    processing={processing}
                    onPrevStep={prevStep}
                    onNextStep={nextStep}
                    submitText="Perbarui Karyawan"
                />
            </form>
        </div>
    );
}
