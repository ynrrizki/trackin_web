// import { EmployeeFormErrorsType, EmployeeFormType } from '@/types/employee';
// import { useState } from 'react';

// export function useEmployeeForm() {
//     const [form, setForm] = useState<EmployeeFormType>({
//         // Step 1: Personal Data - sesuai migration dan controller
//         employee_code: '',
//         full_name: '',
//         email: '',
//         phone: '',
//         identity_number: '', // Tambahan dari migration
//         kk_number: '', // Tambahan dari migration
//         address: '',
//         postal_code: '',
//         birth_date: '',
//         religion: '',
//         mothermaiden_name: '', // Tambahan dari migration
//         marital_status: '',
//         spouse_name: '', // Tambahan dari migration
//         spouse_phone: '', // Tambahan dari migration
//         place_of_birth: '',
//         last_education: '', // Tambahan dari migration
//         gender: null, // Added missing property

//         // Emergency Contact (step 1) - sesuai controller
//         emergency_contact: {
//             name: '',
//             relationship: '',
//             phone: '',
//         },

//         // Body Profile fields (step 1) - untuk kelengkapan data
//         height: '',
//         weight: '',
//         blood_type: '',
//         shirt_size: '',
//         shoe_size: '',
//         health_notes: '',

//         // Step 2: Employment Data - sesuai controller
//         join_date: '',
//         end_date: '',
//         position_id: '',
//         level_id: '',
//         department_id: '',
//         employment_status_id: '',
//         employee_type_id: '',
//         outsourcing_field_id: '',

//         // Step 3: Payroll Data - sesuai controller
//         basic_salary: '',

//         // Bank Account (step 3) - sesuai controller
//         cash_active: false,
//         bank: {
//             name: '',
//             account_number: '',
//             account_name: '',
//             bank_code: '',
//             bank_branch: '',
//         },

//         // BPJS (step 3) - sesuai controller
//         bpjs_kesehatan_active: false,
//         bpjs_kesehatan_number: '',
//         bpjs_kesehatan_contribution: '',
//         bpjs_ketenagakerjaan_active: false,
//         bpjs_ketenagakerjaan_number: '',
//         bpjs_ketenagakerjaan_contribution: '',

//         // Tax Info (step 3) - sesuai controller
//         ptkp_code: '',
//         npwp: '',
//         is_spouse_working: false,

//         // Added missing property
//         approval_line: '', // or appropriate default value
//     });

//     const [errors, setErrors] = useState<EmployeeFormErrorsType>({});
//     const [processing, setProcessing] = useState<boolean>(false);

//     const setData = (field: keyof EmployeeFormType, value: EmployeeFormType[keyof EmployeeFormType]) => {
//         setForm((prev) => ({ ...prev, [field]: value }));
//         // Clear error when user starts typing
//         if (errors[field]) {
//             const clearForm = () => {
//                 setForm({
//                     // Step 1: Personal Data - sesuai migration dan controller
//                     employee_code: '',
//                     full_name: '',
//                     email: '',
//                     phone: '',
//                     identity_number: '', // Tambahan dari migration
//                     kk_number: '', // Tambahan dari migration
//                     address: '',
//                     postal_code: '',
//                     birth_date: '',
//                     religion: '',
//                     marital_status: '',
//                     spouse_name: '', // Tambahan dari migration
//                     spouse_phone: '', // Tambahan dari migration
//                     place_of_birth: '',
//                     last_education: '', // Tambahan dari migration
//                     gender: null, // Added missing property

//                     // Emergency Contact (step 1) - sesuai controller
//                     emergency_contact: {
//                         name: '',
//                         relationship: '',
//                         phone: '',
//                     },

//                     // Body Profile fields (step 1) - untuk kelengkapan data
//                     height: '',
//                     weight: '',
//                     blood_type: '',
//                     shirt_size: '',
//                     shoe_size: '',
//                     health_notes: '',

//                     // Step 2: Employment Data - sesuai controller
//                     join_date: '',
//                     end_date: '',
//                     position_id: '',
//                     level_id: '',
//                     department_id: '',
//                     employment_status_id: '',
//                     employee_type_id: '',
//                     outsourcing_field_id: '',

//                     // Step 3: Payroll Data - sesuai controller
//                     basic_salary: '',

//                     // Bank Account (step 3) - sesuai controller
//                     cash_active: false,
//                     bank: {
//                         name: '',
//                         account_number: '',
//                         account_name: '',
//                         bank_code: '',
//                         bank_branch: '',
//                     },

//                     // BPJS (step 3) - sesuai controller
//                     bpjs_kesehatan_active: false,
//                     bpjs_kesehatan_number: '',
//                     bpjs_kesehatan_contribution: '',
//                     bpjs_ketenagakerjaan_active: false,
//                     bpjs_ketenagakerjaan_number: '',
//                     bpjs_ketenagakerjaan_contribution: '',

//                     // Tax Info (step 3) - sesuai controller
//                     ptkp_code: '',
//                     npwp: '',
//                     is_spouse_working: false,

//                     // Added missing property
//                     approval_line: '', // or appropriate default value
//                 });
//                 setErrors({});
//             };

//             return {
//                 form,
//                 errors,
//                 processing,
//                 setData,
//                 setErrors,
//                 setProcessing,
//                 clearForm,
//             };
//         }
//     };
// }
