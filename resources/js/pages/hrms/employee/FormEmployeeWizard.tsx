import { EmploymentDataStep, FormActions, PayrollDataStep, PersonalDataStep, StepNavigator } from '@/components/employee-form';
import employeeService from '@/services/employeeService';
import { EmployeeFormErrorsType, EmployeeFormType } from '@/types/employee';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function FormEmployeeWizard() {
    const formRef = useRef<HTMLFormElement>(null);
    const steps = [
        { title: 'Data Personal', description: 'Informasi pribadi karyawan' },
        { title: 'Kepegawaian', description: 'Data kepegawaian & status kerja' },
        { title: 'Payroll', description: 'Data payroll & pajak' },
    ];

    const [currentStep, setCurrentStep] = useState<number>(0);
    // Local transformed errors (to support nested keys like emergency_contact.name -> errors.emergency_contact.name)
    const [formErrors, setFormErrors] = useState<EmployeeFormErrorsType>({});

    // Use Inertia's useForm like login.tsx
    const { data, setData, processing, errors } = useForm<EmployeeFormType>({
        // Step 1: Personal Data
        full_name: null,
        email: null,
        phone: null,
        identity_number: null,
        kk_number: null,
        address: null,
        postal_code: null,
        birth_date: null,
        religion: null,
        marital_status: null,
        spouse_name: null,
        spouse_phone: null,
        place_of_birth: null,
        last_education: null,
        mothermaiden_name: null,
        gender: null,

        // Body Profile (optional)
        height: null,
        weight: null,
        blood_type: null,
        shirt_size: null,
        shoe_size: null,
        health_notes: null,

        // Emergency Contact
        emergency_contact: {
            name: null,
            relationship: null,
            phone: null,
        },

        // Step 2: Employment Data
        join_date: null,
        end_date: null,
        position_id: null,
        level_id: null,
        department_id: null,
        employment_status_id: null,
        employee_type_id: null,
        outsourcing_field_id: null,
        approval_line: null,

        // Step 3: Payroll Data
        basic_salary: null,
        cash_active: false,
        bank: {
            name: null,
            account_number: null,
            account_name: null,
            bank_code: null,
            bank_branch: null,
        },

        // BPJS
        bpjs_kesehatan_active: false,
        bpjs_kesehatan_number: null,
        bpjs_kesehatan_contribution: null,
        bpjs_ketenagakerjaan_active: false,
        bpjs_ketenagakerjaan_number: null,
        bpjs_ketenagakerjaan_contribution: null,

        // Tax Info
        ptkp_code: null,
        npwp: null,
        is_spouse_working: false,
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

        const loadingId = toast.loading('Menyimpan karyawan...');
        try {
            const res = await employeeService.createEmployee(payload);
            if (res.success) {
                toast.success(res.message || 'Karyawan berhasil disimpan', { id: loadingId });
                // Option: redirect or reset form
                // reset selected step
                setCurrentStep(0);
                // (Optional) reset selected fields if desired
            } else {
                toast.error('Gagal menyimpan karyawan', { id: loadingId });
                if (res.errors) {
                    // Map validation errors similar to Inertia structure
                    const flat: Record<string, string> = {};
                    Object.entries(res.errors).forEach(([field, messages]) => {
                        flat[field] = (messages as string[])[0];
                    });
                    // Simulate inertia errors object so effect transformer runs
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
                />
            </form>
        </div>
    );
}
