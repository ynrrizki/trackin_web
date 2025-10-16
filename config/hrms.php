<?php

return [
    // Default HO shift name used when an employee has no explicit shift
    // and no project shift to inherit. Make sure this exists in your seeds.
    'default_ho_shift_name' => env('HRMS_DEFAULT_HO_SHIFT', 'Staff Holding'),

    // Employee code generation settings
    'employee_code_prefix' => env('HRMS_EMPLOYEE_CODE_PREFIX', 'EMP'),
    'employee_code_length' => env('HRMS_EMPLOYEE_CODE_LENGTH', 5),

    // Employee document directory
    'employee_document_directory' => env('HRMS_EMPLOYEE_DOCUMENT_DIRECTORY', 'employee_documents'),
];
