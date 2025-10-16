<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class BulkEmployeeTemplateExport implements FromArray, WithHeadings, WithColumnWidths, WithStyles, WithEvents, ShouldAutoSize
{
    /**
     * Return the array data for the template (empty rows for users to fill)
     *
     * @return array
     */
    public function array(): array
    {
        // Return a few empty rows as examples
        return [
            [],
            [],
            [],
            [],
            []
        ];
    }

    /**
     * Define the column headings
     *
     * @return array
     */
    public function headings(): array
    {
        return [
            // Personal Data (Step 1)
            'full_name',                        // A - Required
            'email',                           // B - Required
            'phone',                           // C - Required
            'identity_number',                 // D - Optional
            'kk_number',                       // E - Optional
            'address',                         // F - Required
            'postal_code',                     // G - Optional
            'birth_date',                      // H - Required (YYYY-MM-DD)
            'place_of_birth',                  // I - Optional
            'religion',                        // J - Required (Islam,Katolik,Kristen,Buddha,Hindu,Confucius,Others)
            'gender',                          // K - Required (MALE,FEMALE)
            'marital_status',                  // L - Optional (SINGLE,MARRIED,WIDOW,WIDOWER)
            'spouse_name',                     // M - Optional
            'spouse_phone',                    // N - Optional
            'last_education',                  // O - Optional
            'mothermaiden_name',               // P - Optional

            // Body Profile (Optional)
            'height',                          // Q - Optional
            'weight',                          // R - Optional
            'blood_type',                      // S - Optional (A,B,AB,O,A+,A-,B+,B-,AB+,AB-,O+,O-,UNKNOWN)
            'shirt_size',                      // T - Optional (S,M,L,XL,XXL,XXXL,CUSTOM,UNKNOWN)
            'shoe_size',                       // U - Optional
            'health_notes',                    // V - Optional

            // Emergency Contact (Required)
            'emergency_contact_name',          // W - Required
            'emergency_contact_relationship',  // X - Required
            'emergency_contact_phone',         // Y - Required

            // Employment Data (Step 2)
            'employee_code',                   // Z - Optional (auto-generated if empty)
            'join_date',                       // AA - Required (YYYY-MM-DD)
            'end_date',                        // AB - Optional (YYYY-MM-DD)
            'position_id',                     // AC - Required (get from Master Data)
            'level_id',                        // AD - Required (get from Master Data)
            'department_id',                   // AE - Required for Internal (get from Master Data)
            'employment_status_id',            // AF - Required (get from Master Data)
            'employee_type_id',                // AG - Required (get from Master Data)
            'outsourcing_field_id',            // AH - Required for Outsourcing (get from Master Data)
            'approval_line',                   // AI - Optional

            // Payroll Data (Step 3)
            'basic_salary',                    // AJ - Required (numeric)
            'cash_active',                     // AK - Optional (true/false)

            // Bank Information
            'bank_name',                       // AL - Required if cash_active=false
            'bank_account_number',             // AM - Required if cash_active=false
            'bank_account_name',               // AN - Required if cash_active=false
            'bank_code',                       // AO - Optional
            'bank_branch',                     // AP - Optional

            // BPJS Information
            'bpjs_kesehatan_active',           // AQ - Optional (true/false)
            'bpjs_kesehatan_number',           // AR - Optional
            'bpjs_kesehatan_contribution',     // AS - Optional (BY-COMPANY,BY-EMPLOYEE,DEFAULT)
            'bpjs_ketenagakerjaan_active',     // AT - Optional (true/false)
            'bpjs_ketenagakerjaan_number',     // AU - Optional
            'bpjs_ketenagakerjaan_contribution', // AV - Optional (BY-COMPANY,BY-EMPLOYEE,DEFAULT)

            // Tax Information
            'ptkp_code',                       // AW - Required
            'npwp',                            // AX - Optional
            'is_spouse_working',               // AY - Optional (true/false)
        ];
    }

    /**
     * Define column widths
     *
     * @return array
     */
    public function columnWidths(): array
    {
        return [
            'A' => 20, // full_name
            'B' => 25, // email
            'C' => 15, // phone
            'D' => 20, // identity_number
            'E' => 20, // kk_number
            'F' => 30, // address
            'G' => 12, // postal_code
            'H' => 15, // birth_date
            'I' => 20, // place_of_birth
            'J' => 15, // religion
            'K' => 10, // gender
            'L' => 15, // marital_status
            'M' => 20, // spouse_name
            'N' => 15, // spouse_phone
            'O' => 20, // last_education
            'P' => 20, // mothermaiden_name
            'Q' => 10, // height
            'R' => 10, // weight
            'S' => 12, // blood_type
            'T' => 12, // shirt_size
            'U' => 12, // shoe_size
            'V' => 25, // health_notes
            'W' => 20, // emergency_contact_name
            'X' => 15, // emergency_contact_relationship
            'Y' => 15, // emergency_contact_phone
            'Z' => 15, // employee_code
            'AA' => 15, // join_date
            'AB' => 15, // end_date
            'AC' => 15, // position_id
            'AD' => 15, // level_id
            'AE' => 15, // department_id
            'AF' => 20, // employment_status_id
            'AG' => 15, // employee_type_id
            'AH' => 20, // outsourcing_field_id
            'AI' => 20, // approval_line
            'AJ' => 15, // basic_salary
            'AK' => 12, // cash_active
            'AL' => 20, // bank_name
            'AM' => 20, // bank_account_number
            'AN' => 20, // bank_account_name
            'AO' => 12, // bank_code
            'AP' => 20, // bank_branch
            'AQ' => 15, // bpjs_kesehatan_active
            'AR' => 20, // bpjs_kesehatan_number
            'AS' => 20, // bpjs_kesehatan_contribution
            'AT' => 20, // bpjs_ketenagakerjaan_active
            'AU' => 25, // bpjs_ketenagakerjaan_number
            'AV' => 25, // bpjs_ketenagakerjaan_contribution
            'AW' => 15, // ptkp_code
            'AX' => 20, // npwp
            'AY' => 15, // is_spouse_working
        ];
    }

    /**
     * Apply styles to the worksheet
     *
     * @param Worksheet $sheet
     * @return array
     */
    public function styles(Worksheet $sheet)
    {
        return [
            // Style for header row
            1 => [
                'font' => [
                    'bold' => true,
                    'size' => 12,
                    'color' => ['rgb' => 'FFFFFF']
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => ['rgb' => '4472C4']
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
            ],
        ];
    }

    /**
     * Register events to add comments and additional formatting
     *
     * @return array
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Add comments to header cells with field descriptions
                $this->addHeaderComments($sheet);

                // Freeze the header row
                $sheet->freezePane('A2');

                // Add data validation for specific columns
                $this->addDataValidation($sheet);

                // Auto filter
                $sheet->setAutoFilter('A1:AY1');

                // Set row height for header
                $sheet->getRowDimension(1)->setRowHeight(40);

            },
        ];
    }

    /**
     * Add comments to header cells explaining field requirements
     *
     * @param Worksheet $sheet
     */
    private function addHeaderComments(Worksheet $sheet)
    {
        $comments = [
            'A1' => "PERSONAL DATA - REQUIRED\nFull Name (minimum 3 characters)\nExample: John Doe",
            'B1' => "PERSONAL DATA - REQUIRED\nValid email address (must be unique)\nExample: john.doe@company.com",
            'C1' => "PERSONAL DATA - REQUIRED\nPhone number (max 30 characters)\nExample: +62812345678",
            'D1' => "PERSONAL DATA - OPTIONAL\nIdentity number (KTP)\nExample: 3171234567890001",
            'E1' => "PERSONAL DATA - OPTIONAL\nFamily card number (KK)\nExample: 3171234567890001",
            'F1' => "PERSONAL DATA - REQUIRED\nFull address\nExample: Jl. Sudirman No. 123, Jakarta",
            'G1' => "PERSONAL DATA - OPTIONAL\nPostal code\nExample: 12190",
            'H1' => "PERSONAL DATA - REQUIRED\nBirth date (YYYY-MM-DD format)\nExample: 1990-01-15",
            'I1' => "PERSONAL DATA - OPTIONAL\nPlace of birth\nExample: Jakarta",
            'J1' => "PERSONAL DATA - REQUIRED\nReligion (Islam,Katolik,Kristen,Buddha,Hindu,Confucius,Others)\nExample: Islam",
            'K1' => "PERSONAL DATA - REQUIRED\nGender (MALE or FEMALE)\nExample: MALE",
            'L1' => "PERSONAL DATA - OPTIONAL\nMarital status (SINGLE,MARRIED,WIDOW,WIDOWER)\nExample: SINGLE",
            'M1' => "PERSONAL DATA - OPTIONAL\nSpouse name (if married)\nExample: Jane Doe",
            'N1' => "PERSONAL DATA - OPTIONAL\nSpouse phone (if married)\nExample: +62823456789",
            'O1' => "PERSONAL DATA - OPTIONAL\nLast education\nExample: S1 Teknik Informatika",
            'P1' => "PERSONAL DATA - OPTIONAL\nMother's maiden name\nExample: Smith",

            'Q1' => "BODY PROFILE - OPTIONAL\nHeight in cm\nExample: 170",
            'R1' => "BODY PROFILE - OPTIONAL\nWeight in kg\nExample: 70",
            'S1' => "BODY PROFILE - OPTIONAL\nBlood type (A,B,AB,O,A+,A-,B+,B-,AB+,AB-,O+,O-,UNKNOWN)\nExample: A+",
            'T1' => "BODY PROFILE - OPTIONAL\nShirt size (S,M,L,XL,XXL,XXXL,CUSTOM,UNKNOWN)\nExample: L",
            'U1' => "BODY PROFILE - OPTIONAL\nShoe size\nExample: 42",
            'V1' => "BODY PROFILE - OPTIONAL\nHealth notes\nExample: No allergies",

            'W1' => "EMERGENCY CONTACT - REQUIRED\nEmergency contact name\nExample: Jane Smith",
            'X1' => "EMERGENCY CONTACT - REQUIRED\nRelationship to employee\nExample: Mother",
            'Y1' => "EMERGENCY CONTACT - REQUIRED\nEmergency contact phone\nExample: +62834567890",

            'Z1' => "EMPLOYMENT DATA - OPTIONAL\nEmployee code (auto-generated if empty)\nExample: EMP001",
            'AA1' => "EMPLOYMENT DATA - REQUIRED\nJoin date (YYYY-MM-DD format)\nExample: 2024-01-15",
            'AB1' => "EMPLOYMENT DATA - OPTIONAL\nEnd date (YYYY-MM-DD format)\nExample: 2025-01-15",
            'AC1' => "EMPLOYMENT DATA - REQUIRED\nPosition ID (get from Master Data)\nRefer to Master Data API for valid IDs",
            'AD1' => "EMPLOYMENT DATA - REQUIRED\nPosition level ID (get from Master Data)\nRefer to Master Data API for valid IDs",
            'AE1' => "EMPLOYMENT DATA - REQUIRED FOR INTERNAL\nDepartment ID (get from Master Data)\nRequired only for Internal employee types",
            'AF1' => "EMPLOYMENT DATA - REQUIRED\nEmployment status ID (get from Master Data)\nRefer to Master Data API for valid IDs",
            'AG1' => "EMPLOYMENT DATA - REQUIRED\nEmployee type ID (get from Master Data)\nRefer to Master Data API for valid IDs",
            'AH1' => "EMPLOYMENT DATA - REQUIRED FOR OUTSOURCING\nOutsourcing field ID (get from Master Data)\nRequired only for Outsourcing employee types",
            'AI1' => "EMPLOYMENT DATA - OPTIONAL\nApproval line\nExample: Manager > Director",

            'AJ1' => "PAYROLL DATA - REQUIRED\nBasic salary (numeric, minimum 0)\nExample: 5000000",
            'AK1' => "PAYROLL DATA - OPTIONAL\nCash payment active (true/false)\nExample: false",

            'AL1' => "BANK INFO - REQUIRED IF CASH_ACTIVE=FALSE\nBank name\nExample: Bank BCA",
            'AM1' => "BANK INFO - REQUIRED IF CASH_ACTIVE=FALSE\nBank account number\nExample: 1234567890",
            'AN1' => "BANK INFO - REQUIRED IF CASH_ACTIVE=FALSE\nAccount holder name\nExample: John Doe",
            'AO1' => "BANK INFO - OPTIONAL\nBank code\nExample: 014",
            'AP1' => "BANK INFO - OPTIONAL\nBank branch\nExample: Jakarta Pusat",

            'AQ1' => "BPJS INFO - OPTIONAL\nBPJS Kesehatan active (true/false)\nExample: true",
            'AR1' => "BPJS INFO - OPTIONAL\nBPJS Kesehatan number\nExample: 0001234567890",
            'AS1' => "BPJS INFO - OPTIONAL\nBPJS Kesehatan contribution (BY-COMPANY,BY-EMPLOYEE,DEFAULT)\nExample: BY-COMPANY",
            'AT1' => "BPJS INFO - OPTIONAL\nBPJS Ketenagakerjaan active (true/false)\nExample: true",
            'AU1' => "BPJS INFO - OPTIONAL\nBPJS Ketenagakerjaan number\nExample: 0001234567890",
            'AV1' => "BPJS INFO - OPTIONAL\nBPJS Ketenagakerjaan contribution (BY-COMPANY,BY-EMPLOYEE,DEFAULT)\nExample: BY-COMPANY",

            'AW1' => "TAX INFO - REQUIRED\nPTKP code\nExample: TK/0",
            'AX1' => "TAX INFO - OPTIONAL\nNPWP number\nExample: 12.345.678.9-012.000",
            'AY1' => "TAX INFO - OPTIONAL\nSpouse working status (true/false)\nExample: false",
        ];

        foreach ($comments as $cell => $comment) {
            $sheet->getComment($cell)->getText()->createTextRun($comment);
            $sheet->getComment($cell)->setWidth('400px');
            $sheet->getComment($cell)->setHeight('150px');
        }
    }

    /**
     * Add data validation for specific columns
     *
     * @param Worksheet $sheet
     */
    private function addDataValidation(Worksheet $sheet)
    {
        // Gender validation (MALE/FEMALE)
        $genderValidation = $sheet->getCell('K2')->getDataValidation();
        $genderValidation->setType(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST);
        $genderValidation->setErrorStyle(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP);
        $genderValidation->setAllowBlank(false);
        $genderValidation->setShowInputMessage(true);
        $genderValidation->setShowErrorMessage(true);
        $genderValidation->setErrorTitle('Invalid Gender');
        $genderValidation->setError('Please select MALE or FEMALE');
        $genderValidation->setPromptTitle('Gender');
        $genderValidation->setPrompt('Select employee gender');
        $genderValidation->setFormula1('"MALE,FEMALE"');

        // Religion validation
        $religionValidation = $sheet->getCell('J2')->getDataValidation();
        $religionValidation->setType(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST);
        $religionValidation->setErrorStyle(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP);
        $religionValidation->setAllowBlank(true);
        $religionValidation->setShowInputMessage(true);
        $religionValidation->setShowErrorMessage(true);
        $religionValidation->setErrorTitle('Invalid Religion');
        $religionValidation->setError('Please select from the list');
        $religionValidation->setPromptTitle('Religion');
        $religionValidation->setPrompt('Select employee religion');
        $religionValidation->setFormula1('"Islam,Katolik,Kristen,Buddha,Hindu,Confucius,Others"');

        // Marital Status validation
        $maritalValidation = $sheet->getCell('L2')->getDataValidation();
        $maritalValidation->setType(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST);
        $maritalValidation->setErrorStyle(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP);
        $maritalValidation->setAllowBlank(true);
        $maritalValidation->setShowInputMessage(true);
        $maritalValidation->setShowErrorMessage(true);
        $maritalValidation->setErrorTitle('Invalid Marital Status');
        $maritalValidation->setError('Please select from the list');
        $maritalValidation->setPromptTitle('Marital Status');
        $maritalValidation->setPrompt('Select marital status');
        $maritalValidation->setFormula1('"SINGLE,MARRIED,WIDOW,WIDOWER"');

        // Blood Type validation
        $bloodValidation = $sheet->getCell('S2')->getDataValidation();
        $bloodValidation->setType(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST);
        $bloodValidation->setErrorStyle(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP);
        $bloodValidation->setAllowBlank(true);
        $bloodValidation->setShowInputMessage(true);
        $bloodValidation->setShowErrorMessage(true);
        $bloodValidation->setErrorTitle('Invalid Blood Type');
        $bloodValidation->setError('Please select from the list');
        $bloodValidation->setPromptTitle('Blood Type');
        $bloodValidation->setPrompt('Select blood type');
        $bloodValidation->setFormula1('"A,B,AB,O,A+,A-,B+,B-,AB+,AB-,O+,O-,UNKNOWN"');

        // Boolean fields validation (true/false)
        $booleanFields = ['AK', 'AQ', 'AT', 'AY']; // cash_active, bpjs fields, is_spouse_working
        foreach ($booleanFields as $column) {
            $validation = $sheet->getCell($column . '2')->getDataValidation();
            $validation->setType(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST);
            $validation->setErrorStyle(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP);
            $validation->setAllowBlank(true);
            $validation->setShowInputMessage(true);
            $validation->setShowErrorMessage(true);
            $validation->setErrorTitle('Invalid Value');
            $validation->setError('Please enter true or false');
            $validation->setPromptTitle('Boolean Value');
            $validation->setPrompt('Enter true or false');
            $validation->setFormula1('"TRUE;FALSE"');
        }
    }
}
