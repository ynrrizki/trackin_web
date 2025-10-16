import AppLayout from '@/layouts/app-layout';
// import employeeService from '@/services/employeeService';
import { type BreadcrumbItem } from '@/types';
import type { EmployeeDetail } from '@/types/employee';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
// import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, getInitials, getStatusBadge } from '@/lib/utils';
import employeeService from '@/services/employeeService';
import { Link } from '@inertiajs/react';
import { Briefcase, Building, Calendar, Clock, CreditCard, Edit2, Heart, Mail, MapPin, Phone, Receipt, Shield, User, Users, X } from 'lucide-react';
import { toast } from 'sonner';

interface EmployeeDetailProps {
    employee: EmployeeDetail;
}

// Navigation items for the sidebar
const navigationItems = [
    {
        id: 'personal',
        label: 'Personal Data',
        icon: User,
        description: 'Basic information and personal details',
    },
    {
        id: 'emergency',
        label: 'Emergency Contact',
        icon: Users,
        description: 'Emergency contact information',
    },
    {
        id: 'body',
        label: 'Body Profile',
        icon: Heart,
        description: 'Physical characteristics and health',
    },
    {
        id: 'employment_data',
        label: 'Employment Data',
        icon: Briefcase,
        description: 'Job details and employment status',
    },
    {
        id: 'payroll',
        label: 'Payroll Data',
        icon: Receipt,
        description: 'Salary and compensation details',
    },
    {
        id: 'bpjs',
        label: 'BPJS Information',
        icon: Shield,
        description: 'BPJS and insurance details',
    },
    {
        id: 'tax',
        label: 'Tax Information',
        icon: Building,
        description: 'Tax status and NPWP information',
    },
    {
        id: 'bank',
        label: 'Bank Information',
        icon: CreditCard,
        description: 'Bank account and payment details',
    },
];

// Format date untuk Indonesia
// const formatDate = (dateString: string | null): string => {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleDateString('id-ID', {
//         day: 'numeric',
//         month: 'long',
//         year: 'numeric',
//     });
// };

export default function EmployeeDetail({ employee }: EmployeeDetailProps) {
    // Local copy agar bisa di-refresh dari API setelah update
    const [employeeData, setEmployeeData] = useState<EmployeeDetailProps['employee']>(employee);
    const [activeSection, setActiveSection] = useState('personal');
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'attendance'
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data for different sections
    const [personalFormData, setPersonalFormData] = useState({
        full_name: employeeData.full_name || '',
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        identity_number: employeeData.identity_number || '',
        kk_number: employeeData.kk_number || '',
        address: employeeData.address || '',
        postal_code: employeeData.postal_code || '',
        birth_date: employeeData.birth_date || '',
        place_of_birth: employeeData.place_of_birth || '',
        gender: employeeData.gender || '',
        religion: employeeData.religion || '',
        marital_status: employeeData.marital_status || '',
        last_education: employeeData.last_education || '',
        spouse_name: employeeData.spouse_name || '',
        spouse_phone: employeeData.spouse_phone || '',
        mothermaiden_name: employeeData.mothermaiden_name || '',
    });

    const [emergencyFormData, setEmergencyFormData] = useState({
        name: employeeData.emergency_contacts?.[0]?.name || '',
        relationship: employeeData.emergency_contacts?.[0]?.relationship || '',
        phone: employeeData.emergency_contacts?.[0]?.phone || '',
        // email: employeeData.emergency_contacts?.[0]?.email || '',
        // address: employeeData.emergency_contacts?.[0]?.address || '',
    });

    const [employmentFormData, setEmploymentFormData] = useState({
        employee_code: employeeData.employee_code || '',
        join_date: employeeData.join_date || '',
        end_date: employeeData.end_date || '',
        position_id: employeeData.position?.id?.toString() || '',
        level_id: employeeData.position_level?.id?.toString() || '',
        department_id: employeeData.department?.id?.toString() || '',
        employment_status_id: employeeData.employment_status?.id?.toString() || '',
        employee_type_id: employeeData.employee_type?.id?.toString() || '',
        outsourcing_field_id: employeeData.outsourcing_field?.id?.toString() || '',
        approval_line: employeeData.approval_line || '',
        basic_salary: employeeData.basic_salary || '',
    });

    const [bankFormData, setBankFormData] = useState({
        cash_active: !employeeData.bank_accounts?.[0], // Active if no bank account exists
        name: employeeData.bank_accounts?.[0]?.name || '',
        account_number: employeeData.bank_accounts?.[0]?.account_number || '',
        account_name: employeeData.bank_accounts?.[0]?.account_name || '',
        bank_code: employeeData.bank_accounts?.[0]?.bank_code || '',
        bank_branch: employeeData.bank_accounts?.[0]?.bank_branch || '',
    });

    type BodyProfileForm = {
        height: string;
        weight: string;
        blood_type: string;
        shirt_size: string;
        shoe_size: string;
        health_notes: string;
    };

    const [bodyProfileFormData, setBodyProfileFormData] = useState<BodyProfileForm>({
        height: employeeData?.body_profile && employeeData.body_profile.height != null ? String(employeeData.body_profile.height) : '',
        weight: employeeData?.body_profile && employeeData.body_profile.weight != null ? String(employeeData.body_profile.weight) : '',
        blood_type: employeeData?.body_profile && employeeData.body_profile.blood_type != null ? String(employeeData.body_profile.blood_type) : '',
        shirt_size: employeeData?.body_profile && employeeData.body_profile.shirt_size != null ? String(employeeData.body_profile.shirt_size) : '',
        shoe_size: employeeData?.body_profile && employeeData.body_profile.shoe_size != null ? String(employeeData.body_profile.shoe_size) : '',
        health_notes:
            employeeData?.body_profile && employeeData.body_profile.health_notes != null ? String(employeeData.body_profile.health_notes) : '',
    });

    // Helper function to get BPJS data safely from array
    const getBpjsData = (bpjsType: 'KS' | 'TK') => {
        if (!employeeData?.bpjs) return { active: false, number: '', contribution: 'BY-COMPANY' };

        // Handle if bpjs is an array (from database)
        if (Array.isArray(employeeData.bpjs)) {
            const found = employeeData.bpjs.find(
                (b: { bpjs_type: string; participant_number: string | null; contribution_type: string }) => b.bpjs_type === bpjsType,
            );
            return {
                active: !!found,
                number: found?.participant_number || '',
                contribution: found?.contribution_type || 'BY-COMPANY',
            };
        }

        return { active: false, number: '', contribution: 'BY-COMPANY' };
    };

    const bpjsKsData = getBpjsData('KS');
    const bpjsTkData = getBpjsData('TK');

    const [bpjsFormData, setBpjsFormData] = useState({
        bpjs_kesehatan_active: bpjsKsData.active,
        bpjs_kesehatan_number: bpjsKsData.number,
        bpjs_kesehatan_contribution: bpjsKsData.contribution,
        bpjs_ketenagakerjaan_active: bpjsTkData.active,
        bpjs_ketenagakerjaan_number: bpjsTkData.number,
        bpjs_ketenagakerjaan_contribution: bpjsTkData.contribution,
    });

    const [taxFormData, setTaxFormData] = useState({
        ptkp_code: employeeData?.tax_status?.ptkp_code || '',
        npwp: employeeData?.tax_status?.npwp || '',
        is_spouse_working: employeeData?.tax_status?.is_spouse_working || false,
    });

    // Master data interface and state for employment form
    interface MasterData {
        positions: Array<{ id: number; name: string }>;
        position_levels: Array<{ id: number; name: string }>;
        departments: Array<{ id: number; name: string }>;
        employment_statuses: Array<{ id: number; name: string }>;
        employee_types: Array<{ id: number; name: string }>;
        outsourcing_fields: Array<{ id: number; name: string }>;
    }

    const [masterData, setMasterData] = useState<MasterData | null>(null);
    const [loadingStates, setLoadingStates] = useState({
        positions: true,
        position_levels: true,
        departments: true,
        employment_statuses: true,
        employee_types: true,
        outsourcing_fields: true,
    });
    const [masterDataError, setMasterDataError] = useState<string | null>(null);

    // Fetch master data when component mounts
    useEffect(() => {
        fetch('/api/master-data/employee-form')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch master data');
                }
                return response.json();
            })
            .then((data) => {
                const responseData = data.success ? data.data : data;
                setMasterData(responseData);
                setLoadingStates({
                    positions: false,
                    position_levels: false,
                    departments: false,
                    employment_statuses: false,
                    employee_types: false,
                    outsourcing_fields: false,
                });
            })
            .catch((err) => {
                setMasterDataError(err.message);
                setLoadingStates({
                    positions: false,
                    position_levels: false,
                    departments: false,
                    employment_statuses: false,
                    employee_types: false,
                    outsourcing_fields: false,
                });
            });
    }, []);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Karyawan',
            href: '/hrms/employees',
        },
        {
            title: employee.full_name || 'Employee',
            href: `/hrms/employees/${employee.id}`,
        },
    ];

    // Handle section editing
    const handleEditSection = (section: string) => {
        setEditingSection(section);
    };

    const handleCancelEdit = () => {
        setEditingSection(null);
    };

    const handleSaveSection = async (section: string, data: Record<string, string | boolean>) => {
        setIsSubmitting(true);
        try {
            // Convert boolean values to strings for API compatibility
            const formDataToSend = Object.entries(data).reduce(
                (acc, [key, value]) => {
                    acc[key] = typeof value === 'boolean' ? String(value) : value;
                    return acc;
                },
                {} as Record<string, string>,
            );

            // For employment_data section, clean the data based on employee type
            if (section === 'employment_data') {
                const employeeTypeId = formDataToSend.employee_type_id;
                const selectedEmployeeType = masterData?.employee_types?.find((type) => type.id.toString() === employeeTypeId);
                const isOutsourcing =
                    selectedEmployeeType?.name?.toLowerCase().includes('outsourcing') ||
                    selectedEmployeeType?.name?.toLowerCase().includes('kontrak') ||
                    selectedEmployeeType?.name?.toLowerCase().includes('external');

                if (isOutsourcing) {
                    // For outsourcing: remove internal fields
                    delete formDataToSend.position_id;
                    delete formDataToSend.department_id;
                } else {
                    // For internal: remove outsourcing fields
                    delete formDataToSend.outsourcing_field_id;
                }

                // Remove empty string values to let backend handle nulls properly
                Object.keys(formDataToSend).forEach((key) => {
                    if (formDataToSend[key] === '') {
                        // For basic_salary, convert empty string to '0' instead of empty
                        if (key === 'basic_salary') {
                            formDataToSend[key] = '0';
                        } else {
                            formDataToSend[key] = '';
                        }
                    }
                });
            }

            const result = await employeeService.updateEmployeeSection(employeeData.id, section, formDataToSend);
            if (result.success) {
                toast.success('Data berhasil diperbarui');
                // Update local state with new data
                setEmployeeData((prev) => ({ ...prev, ...data }));
                setEditingSection(null);
            } else {
                toast.error('Gagal memperbarui data');
            }
        } catch {
            toast.error('Terjadi kesalahan saat menyimpan');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render different sections based on activeSection
    const renderContent = () => {
        switch (activeSection) {
            case 'personal':
                return renderPersonalData();
            case 'emergency':
                return renderEmergencyContact();
            case 'body':
                return renderBodyProfile();
            case 'employment_data':
                return renderEmploymentData();
            case 'payroll':
                return renderPayrollData();
            case 'bpjs':
                return renderBpjsInformation();
            case 'tax':
                return renderTaxInformation();
            case 'bank':
                return renderBankInformation();
            default:
                return renderPersonalData();
        }
    };

    const renderPersonalData = () => {
        const isEditing = editingSection === 'personal';

        const handleSave = () => {
            handleSaveSection('personal', personalFormData);
        };

        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Personal Data</CardTitle>
                        <CardDescription>Basic information and personal details</CardDescription>
                    </div>
                    {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => handleEditSection('personal')}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    ) : (
                        <div className="flex space-x-2">
                            <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                                Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                            {isEditing ? (
                                <Input
                                    value={personalFormData.full_name}
                                    onChange={(e) => setPersonalFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                                />
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span>{employeeData.full_name || 'N/A'}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Email</Label>
                            {isEditing ? (
                                <Input
                                    type="email"
                                    value={personalFormData.email}
                                    onChange={(e) => setPersonalFormData((prev) => ({ ...prev, email: e.target.value }))}
                                />
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-blue-600">{employeeData.email || 'N/A'}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Phone</Label>
                            {isEditing ? (
                                <Input
                                    value={personalFormData.phone}
                                    onChange={(e) => {
                                        // Only allow numbers, +, and format for phone
                                        const value = e.target.value.replace(/[^\d+\-\s()]/g, '');
                                        setPersonalFormData((prev) => ({ ...prev, phone: value }));
                                    }}
                                    placeholder="+62 xxx-xxxx-xxxx"
                                />
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>{employeeData.phone || 'N/A'}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Identity Number (KTP)</Label>
                            {isEditing ? (
                                <Input
                                    value={personalFormData.identity_number}
                                    onChange={(e) => {
                                        // Only allow numbers and limit to 16 digits
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                                        setPersonalFormData((prev) => ({ ...prev, identity_number: value }));
                                    }}
                                    placeholder="16-digit national ID number"
                                    maxLength={16}
                                />
                            ) : (
                                <span className="block">{employeeData.identity_number || 'N/A'}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Family Card Number (KK)</Label>
                            {isEditing ? (
                                <Input
                                    value={personalFormData.kk_number}
                                    onChange={(e) => {
                                        // Only allow numbers and limit to 16 digits
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                                        setPersonalFormData((prev) => ({ ...prev, kk_number: value }));
                                    }}
                                    placeholder="16-digit family card number"
                                    maxLength={16}
                                />
                            ) : (
                                <span className="block">{employeeData.kk_number || 'N/A'}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Birth Date</Label>
                            {isEditing ? (
                                <Input
                                    type="date"
                                    value={personalFormData.birth_date}
                                    onChange={(e) => setPersonalFormData((prev) => ({ ...prev, birth_date: e.target.value }))}
                                />
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>{formatDate(employeeData.birth_date)}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Place of Birth</Label>
                            {isEditing ? (
                                <Input
                                    value={personalFormData.place_of_birth}
                                    onChange={(e) => setPersonalFormData((prev) => ({ ...prev, place_of_birth: e.target.value }))}
                                />
                            ) : (
                                <span className="block">{employeeData.place_of_birth || 'N/A'}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Gender</Label>
                            {isEditing ? (
                                <Select
                                    value={personalFormData.gender}
                                    onValueChange={(value) => setPersonalFormData((prev) => ({ ...prev, gender: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MALE">Male</SelectItem>
                                        <SelectItem value="FEMALE">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="block">
                                    {employeeData.gender === 'MALE' ? 'Male' : employeeData.gender === 'FEMALE' ? 'Female' : 'N/A'}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Religion</Label>
                            {isEditing ? (
                                <Select
                                    value={personalFormData.religion}
                                    onValueChange={(value) => setPersonalFormData((prev) => ({ ...prev, religion: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select religion" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Islam">Islam</SelectItem>
                                        <SelectItem value="Katolik">Catholic</SelectItem>
                                        <SelectItem value="Kristen">Christian</SelectItem>
                                        <SelectItem value="Buddha">Buddhism</SelectItem>
                                        <SelectItem value="Hindu">Hindu</SelectItem>
                                        <SelectItem value="Confucius">Confucius</SelectItem>
                                        <SelectItem value="Others">Others</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="block">{employeeData.religion || 'N/A'}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Marital Status</Label>
                            {isEditing ? (
                                <Select
                                    value={personalFormData.marital_status}
                                    onValueChange={(value) => setPersonalFormData((prev) => ({ ...prev, marital_status: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select marital status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SINGLE">Single</SelectItem>
                                        <SelectItem value="MARRIED">Married</SelectItem>
                                        <SelectItem value="DIVORCED">Divorced</SelectItem>
                                        <SelectItem value="WIDOWED">Widowed</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="block">
                                    {employeeData.marital_status === 'MARRIED'
                                        ? 'Married'
                                        : employeeData.marital_status === 'SINGLE'
                                          ? 'Single'
                                          : employeeData.marital_status === 'DIVORCED'
                                            ? 'Divorced'
                                            : employeeData.marital_status === 'WIDOWED'
                                              ? 'Widowed'
                                              : 'N/A'}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Last Education</Label>
                            {isEditing ? (
                                <Select
                                    value={personalFormData.last_education}
                                    onValueChange={(value) => setPersonalFormData((prev) => ({ ...prev, last_education: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select education level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SD">SD (Elementary School)</SelectItem>
                                        <SelectItem value="SMP">SMP (Junior High School)</SelectItem>
                                        <SelectItem value="SMA">SMA (Senior High School)</SelectItem>
                                        <SelectItem value="SMK">SMK (Vocational High School)</SelectItem>
                                        <SelectItem value="D1">D1 (Diploma 1)</SelectItem>
                                        <SelectItem value="D2">D2 (Diploma 2)</SelectItem>
                                        <SelectItem value="D3">D3 (Diploma 3)</SelectItem>
                                        <SelectItem value="D4">D4 (Diploma 4)</SelectItem>
                                        <SelectItem value="S1">S1 (Bachelor's Degree)</SelectItem>
                                        <SelectItem value="S2">S2 (Master's Degree)</SelectItem>
                                        <SelectItem value="S3">S3 (Doctoral Degree)</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="block">{employeeData.last_education || 'N/A'}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Mother's Maiden Name</Label>
                            {isEditing ? (
                                <Input
                                    value={personalFormData.mothermaiden_name}
                                    onChange={(e) => setPersonalFormData((prev) => ({ ...prev, mothermaiden_name: e.target.value }))}
                                    placeholder="Mother's full maiden name"
                                />
                            ) : (
                                <span className="block">N/A</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-500">Address</Label>
                        {isEditing ? (
                            <Textarea
                                value={personalFormData.address}
                                onChange={(e) => setPersonalFormData((prev) => ({ ...prev, address: e.target.value }))}
                                rows={3}
                            />
                        ) : (
                            <div className="flex items-start space-x-2">
                                <MapPin className="mt-1 h-4 w-4 text-gray-400" />
                                <span>{employeeData.address || 'N/A'}</span>
                            </div>
                        )}
                    </div>

                    {/* Spouse Information */}
                    {(employeeData.marital_status === 'MARRIED' || personalFormData.marital_status === 'MARRIED') && (
                        <div className="border-t pt-6">
                            <h4 className="mb-4 font-medium">Spouse Information</h4>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">Spouse Name</Label>
                                    {isEditing ? (
                                        <Input
                                            value={personalFormData.spouse_name}
                                            onChange={(e) => setPersonalFormData((prev) => ({ ...prev, spouse_name: e.target.value }))}
                                        />
                                    ) : (
                                        <span>{employeeData.spouse_name || 'N/A'}</span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">Spouse Phone</Label>
                                    {isEditing ? (
                                        <Input
                                            value={personalFormData.spouse_phone}
                                            onChange={(e) => setPersonalFormData((prev) => ({ ...prev, spouse_phone: e.target.value }))}
                                        />
                                    ) : (
                                        <span>{employeeData.spouse_phone || 'N/A'}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderBankInformation = () => {
        const isEditing = editingSection === 'bank_information';

        const handleSave = () => {
            // Convert boolean to string for API and clear bank fields if cash is active
            const dataToSave = {
                ...bankFormData,
                cash_active: bankFormData.cash_active.toString(),
                // Clear bank fields if cash payment is selected
                ...(bankFormData.cash_active && {
                    name: '',
                    account_number: '',
                    account_name: '',
                    bank_code: '',
                    bank_branch: '',
                }),
            };
            handleSaveSection('bank_information', dataToSave);
        };

        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Bank Information</CardTitle>
                        <CardDescription>Bank account details for payroll</CardDescription>
                    </div>
                    {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => handleEditSection('bank_information')}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    ) : (
                        <div className="flex space-x-2">
                            <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                                Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Payment Method Selection */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Payment Method</Label>
                            {isEditing ? (
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="bank_transfer"
                                            name="payment_method"
                                            checked={!bankFormData.cash_active}
                                            onChange={() => setBankFormData((prev) => ({ ...prev, cash_active: false }))}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor="bank_transfer" className="text-sm">
                                            Bank Transfer
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="cash_payment"
                                            name="payment_method"
                                            checked={bankFormData.cash_active}
                                            onChange={() => setBankFormData((prev) => ({ ...prev, cash_active: true }))}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor="cash_payment" className="text-sm">
                                            Cash Payment
                                        </Label>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <CreditCard className={`h-4 w-4 ${bankFormData.cash_active ? 'text-gray-400' : 'text-blue-500'}`} />
                                    <span className="font-medium">{bankFormData.cash_active ? 'Cash Payment' : 'Bank Transfer'}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bank Details - Only show when not cash payment */}
                    {(!bankFormData.cash_active || isEditing) && (
                        <div className={`space-y-4 ${bankFormData.cash_active && isEditing ? 'opacity-50' : ''}`}>
                            <div className="flex items-center space-x-2">
                                <CreditCard className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium">
                                    {bankFormData.cash_active ? 'Bank Details (Disabled - Cash Payment Selected)' : 'Bank Account Details'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">Bank Name</Label>
                                    {isEditing ? (
                                        <Input
                                            value={bankFormData.name}
                                            onChange={(e) => setBankFormData((prev) => ({ ...prev, name: e.target.value }))}
                                            disabled={bankFormData.cash_active}
                                            placeholder="Enter bank name"
                                        />
                                    ) : (
                                        <span className="block">{bankFormData.name || 'N/A'}</span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">Bank Code</Label>
                                    {isEditing ? (
                                        <Input
                                            value={bankFormData.bank_code}
                                            onChange={(e) => setBankFormData((prev) => ({ ...prev, bank_code: e.target.value }))}
                                            disabled={bankFormData.cash_active}
                                            placeholder="Enter bank code"
                                        />
                                    ) : (
                                        <span className="block">{bankFormData.bank_code || 'N/A'}</span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">Account Number</Label>
                                    {isEditing ? (
                                        <Input
                                            value={bankFormData.account_number}
                                            onChange={(e) => {
                                                // Allow only numbers for bank account
                                                const value = e.target.value.replace(/\D/g, '');
                                                setBankFormData((prev) => ({ ...prev, account_number: value }));
                                            }}
                                            disabled={bankFormData.cash_active}
                                            placeholder="Enter bank account number"
                                        />
                                    ) : (
                                        <span className="block">{bankFormData.account_number || 'N/A'}</span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">Account Name</Label>
                                    {isEditing ? (
                                        <Input
                                            value={bankFormData.account_name}
                                            onChange={(e) => setBankFormData((prev) => ({ ...prev, account_name: e.target.value }))}
                                            disabled={bankFormData.cash_active}
                                            placeholder="Enter account holder name"
                                        />
                                    ) : (
                                        <span className="block">{bankFormData.account_name || 'N/A'}</span>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-sm font-medium text-gray-500">Bank Branch</Label>
                                    {isEditing ? (
                                        <Input
                                            value={bankFormData.bank_branch}
                                            onChange={(e) => setBankFormData((prev) => ({ ...prev, bank_branch: e.target.value }))}
                                            disabled={bankFormData.cash_active}
                                            placeholder="Enter bank branch"
                                        />
                                    ) : (
                                        <span className="block">{bankFormData.bank_branch || 'N/A'}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cash payment note */}
                    {bankFormData.cash_active && !isEditing && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-yellow-600">💰 Cash Payment Enabled</span>
                            </div>
                            <p className="mt-1 text-sm text-yellow-700">
                                This employee receives salary payments in cash. No bank account details are required.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderEmergencyContact = () => {
        const isEditing = editingSection === 'emergency_contact';

        const handleSave = () => {
            handleSaveSection('emergency_contact', emergencyFormData);
        };

        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Emergency Contact</CardTitle>
                        <CardDescription>Emergency contact information</CardDescription>
                    </div>
                    {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => handleEditSection('emergency_contact')}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    ) : (
                        <div className="flex space-x-2">
                            <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                                Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Contact Name</Label>
                            {isEditing ? (
                                <Input
                                    value={emergencyFormData.name}
                                    onChange={(e) => setEmergencyFormData((prev) => ({ ...prev, name: e.target.value }))}
                                />
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span>{emergencyFormData.name || 'N/A'}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Relationship</Label>
                            {isEditing ? (
                                <Input
                                    value={emergencyFormData.relationship}
                                    onChange={(e) => setEmergencyFormData((prev) => ({ ...prev, relationship: e.target.value }))}
                                />
                            ) : (
                                <span className="block">{emergencyFormData.relationship || 'N/A'}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Phone</Label>
                            {isEditing ? (
                                <Input
                                    value={emergencyFormData.phone}
                                    onChange={(e) => {
                                        // Only allow numbers, +, and format for phone
                                        const value = e.target.value.replace(/[^\d+\-\s()]/g, '');
                                        setEmergencyFormData((prev) => ({ ...prev, phone: value }));
                                    }}
                                    placeholder="+62 xxx-xxxx-xxxx"
                                />
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>{emergencyFormData.phone || 'N/A'}</span>
                                </div>
                            )}
                        </div>

                        {/* <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Email</Label>
                            {isEditing ? (
                                <Input
                                    type="email"
                                    value={emergencyFormData.email}
                                    onChange={(e) => setEmergencyFormData(prev => ({ ...prev, email: e.target.value }))}
                                />
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-blue-600">N/A</span>
                                </div>
                            )}
                        </div> */}
                    </div>

                    {/* <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-500">Address</Label>
                        {isEditing ? (
                            <Textarea
                                value={employeeData.address}
                                onChange={(e) => setEmergencyFormData(prev => ({ ...prev, address: e.target.value }))}
                                rows={3}
                            />
                        ) : (
                            <div className="flex items-start space-x-2">
                                <MapPin className="mt-1 h-4 w-4 text-gray-400" />
                                <span>N/A</span>
                            </div>
                        )}
                    </div> */}
                </CardContent>
            </Card>
        );
    };

    const renderEmploymentData = () => {
        const isEditing = editingSection === 'employment_data';

        const handleSave = () => {
            handleSaveSection('employment_data', employmentFormData);
        };

        // Component untuk Select dengan loading state
        const LoadingSelect = ({
            loading,
            placeholder,
            loadingText,
            value,
            onValueChange,
            items,
            disabled,
        }: {
            loading: boolean;
            placeholder: string;
            loadingText: string;
            value: string;
            onValueChange: (value: string) => void;
            items: Array<{ id: number; name: string }>;
            disabled?: boolean;
        }) => (
            <Select value={value} onValueChange={onValueChange} disabled={loading || disabled || !isEditing}>
                <SelectTrigger className={loading ? 'animate-pulse' : ''}>
                    <SelectValue placeholder={loading ? loadingText : placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {loading ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : items.length > 0 ? (
                        items.map((item) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                                {item.name}
                            </SelectItem>
                        ))
                    ) : (
                        <div className="p-2 text-center text-sm text-muted-foreground">No data available</div>
                    )}
                </SelectContent>
            </Select>
        );

        // Check if selected employee type is outsourcing
        const selectedEmployeeType = masterData?.employee_types?.find((type) => type.id.toString() === employmentFormData.employee_type_id);
        const isOutsourcing =
            selectedEmployeeType?.name?.toLowerCase().includes('outsourcing') ||
            selectedEmployeeType?.name?.toLowerCase().includes('kontrak') ||
            selectedEmployeeType?.name?.toLowerCase().includes('external');

        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Employment Data</CardTitle>
                        <CardDescription>Job position, department, and employment details</CardDescription>
                    </div>
                    {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => handleEditSection('employment_data')}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    ) : (
                        <div className="flex space-x-2">
                            <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                                Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Error banner jika ada error loading master data */}
                    {masterDataError && isEditing && (
                        <div className="mb-4 rounded-md bg-destructive/15 p-3">
                            <div className="text-sm text-destructive">Error loading master data: {masterDataError}</div>
                            <div className="mt-1 text-xs text-muted-foreground">Some dropdown options may not be available</div>
                        </div>
                    )}

                    {/* Section 1: Basic Employment Information */}
                    <div className="space-y-4">
                        {isEditing && (
                            <div className="border-b pb-2">
                                <h3 className="text-lg font-medium">Basic Employment Information</h3>
                                <p className="text-sm text-muted-foreground">Employee code and important dates</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-500">Employee Code (NIP)</Label>
                                {isEditing ? (
                                    <Input
                                        value={employmentFormData.employee_code}
                                        onChange={(e) => setEmploymentFormData((prev) => ({ ...prev, employee_code: e.target.value }))}
                                        placeholder="Enter employee code"
                                    />
                                ) : (
                                    <span className="block">{employmentFormData.employee_code || 'N/A'}</span>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-500">Join Date</Label>
                                {isEditing ? (
                                    <Input
                                        type="date"
                                        value={employmentFormData.join_date}
                                        onChange={(e) => setEmploymentFormData((prev) => ({ ...prev, join_date: e.target.value }))}
                                    />
                                ) : (
                                    <span className="block">
                                        {employmentFormData.join_date ? new Date(employmentFormData.join_date).toLocaleDateString('id-ID') : 'N/A'}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-500">End Date</Label>
                                {isEditing ? (
                                    <Input
                                        type="date"
                                        value={employmentFormData.end_date}
                                        onChange={(e) => setEmploymentFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                                    />
                                ) : (
                                    <span className="block">
                                        {employmentFormData.end_date ? new Date(employmentFormData.end_date).toLocaleDateString('id-ID') : 'N/A'}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-500">Basic Salary</Label>
                                {isEditing ? (
                                    <Input
                                        value={employmentFormData.basic_salary}
                                        onChange={(e) => {
                                            // Allow only numbers for salary
                                            const value = e.target.value.replace(/\D/g, '');
                                            setEmploymentFormData((prev) => ({ ...prev, basic_salary: value }));
                                        }}
                                        placeholder="Enter basic salary"
                                    />
                                ) : (
                                    <span className="block">
                                        {employmentFormData.basic_salary
                                            ? `Rp ${Number(employmentFormData.basic_salary).toLocaleString('id-ID')}`
                                            : 'N/A'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Employee Category */}
                    <div className="space-y-4">
                        {isEditing && (
                            <div className="border-b pb-2">
                                <h3 className="text-lg font-medium">Employee Category</h3>
                                <p className="text-sm text-muted-foreground">Employee type and employment status</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-500">Employee Type</Label>
                                {isEditing ? (
                                    <LoadingSelect
                                        loading={loadingStates.employee_types}
                                        placeholder="Select Employee Type"
                                        loadingText="Loading types..."
                                        value={employmentFormData.employee_type_id || ''}
                                        onValueChange={(val) => {
                                            setEmploymentFormData((prev) => ({
                                                ...prev,
                                                employee_type_id: val,
                                                // Clear conflicting fields
                                                ...(masterData?.employee_types
                                                    ?.find((type) => type.id.toString() === val)
                                                    ?.name?.toLowerCase()
                                                    .includes('outsourcing')
                                                    ? { position_id: '', department_id: '' }
                                                    : { outsourcing_field_id: '' }),
                                            }));
                                        }}
                                        items={masterData?.employee_types || []}
                                    />
                                ) : (
                                    <span className="block">{employeeData.employee_type?.name || 'N/A'}</span>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-500">Employment Status</Label>
                                {isEditing ? (
                                    <LoadingSelect
                                        loading={loadingStates.employment_statuses}
                                        placeholder="Select Employment Status"
                                        loadingText="Loading statuses..."
                                        value={employmentFormData.employment_status_id || ''}
                                        onValueChange={(val) => setEmploymentFormData((prev) => ({ ...prev, employment_status_id: val }))}
                                        items={masterData?.employment_statuses || []}
                                    />
                                ) : (
                                    <span className="block">{employeeData.employment_status?.name || 'N/A'}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Position & Department Information */}
                    <div className="space-y-4">
                        {isEditing && employmentFormData.employee_type_id && (
                            <div className="border-b pb-2">
                                <h3 className="text-lg font-medium">
                                    {isOutsourcing ? 'Outsourcing Information' : 'Position & Department Information'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {isOutsourcing ? 'Outsourcing field and position level' : 'Position, level, and department details'}
                                </p>
                                {/* Badge indicator */}
                                <div className="mt-2">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            isOutsourcing ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                                        }`}
                                    >
                                        {isOutsourcing ? '🏢 Outsourcing' : '🏛️ Internal'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Position Level - shown for all types */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-500">Position Level</Label>
                                {isEditing ? (
                                    <LoadingSelect
                                        loading={loadingStates.position_levels}
                                        placeholder="Select Position Level"
                                        loadingText="Loading levels..."
                                        value={employmentFormData.level_id || ''}
                                        onValueChange={(val) => setEmploymentFormData((prev) => ({ ...prev, level_id: val }))}
                                        items={masterData?.position_levels || []}
                                    />
                                ) : (
                                    <span className="block">{employeeData.position_level?.name || 'N/A'}</span>
                                )}
                            </div>

                            {!isOutsourcing ? (
                                <>
                                    {/* Internal Employee - Position */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-500">Position</Label>
                                        {isEditing ? (
                                            <LoadingSelect
                                                loading={loadingStates.positions}
                                                placeholder="Select Position"
                                                loadingText="Loading positions..."
                                                value={employmentFormData.position_id || ''}
                                                onValueChange={(val) => setEmploymentFormData((prev) => ({ ...prev, position_id: val }))}
                                                items={masterData?.positions || []}
                                            />
                                        ) : (
                                            <span className="block">{employeeData.position?.name || 'N/A'}</span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Outsourcing Employee - Outsourcing Field */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-500">Outsourcing Field</Label>
                                        {isEditing ? (
                                            <LoadingSelect
                                                loading={loadingStates.outsourcing_fields}
                                                placeholder="Select Outsourcing Field"
                                                loadingText="Loading fields..."
                                                value={employmentFormData.outsourcing_field_id || ''}
                                                onValueChange={(val) => setEmploymentFormData((prev) => ({ ...prev, outsourcing_field_id: val }))}
                                                items={masterData?.outsourcing_fields || []}
                                            />
                                        ) : (
                                            <span className="block">{employeeData.outsourcing_field?.name || 'N/A'}</span>
                                        )}
                                    </div>
                                </>
                            )}

                            {!isOutsourcing && (
                                /* Internal Employee - Department */
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">Department</Label>
                                    {isEditing ? (
                                        <LoadingSelect
                                            loading={loadingStates.departments}
                                            placeholder="Select Department"
                                            loadingText="Loading departments..."
                                            value={employmentFormData.department_id || ''}
                                            onValueChange={(val) => setEmploymentFormData((prev) => ({ ...prev, department_id: val }))}
                                            items={masterData?.departments || []}
                                        />
                                    ) : (
                                        <span className="block">{employeeData.department?.name || 'N/A'}</span>
                                    )}
                                </div>
                            )}

                            {/* Approval Line */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-500">Approval Line</Label>
                                {isEditing ? (
                                    <Input
                                        value={employmentFormData.approval_line}
                                        onChange={(e) => setEmploymentFormData((prev) => ({ ...prev, approval_line: e.target.value }))}
                                        placeholder="Enter approval line"
                                    />
                                ) : (
                                    <span className="block">{employmentFormData.approval_line || 'N/A'}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderBodyProfile = () => {
        const isEditing = editingSection === 'body_profile';

        const handleSave = () => {
            handleSaveSection('body_profile', bodyProfileFormData);
        };

        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Body Profile</CardTitle>
                        <CardDescription>Physical characteristics and medical information</CardDescription>
                    </div>
                    {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => handleEditSection('body_profile')}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    ) : (
                        <div className="flex space-x-2">
                            <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                                Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Height (cm)</Label>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    value={bodyProfileFormData.height}
                                    onChange={(e) => setBodyProfileFormData((prev) => ({ ...prev, height: e.target.value }))}
                                />
                            ) : (
                                <span className="block">{employeeData.body_profile ? `${employeeData.body_profile.height} cm` : 'N/A'}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Weight (kg)</Label>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    value={bodyProfileFormData.weight}
                                    onChange={(e) => setBodyProfileFormData((prev) => ({ ...prev, weight: e.target.value }))}
                                />
                            ) : (
                                <span className="block">{employeeData.body_profile ? `${employeeData.body_profile.weight} kg` : 'N/A'}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Blood Type</Label>
                            {isEditing ? (
                                <Select
                                    value={bodyProfileFormData.blood_type}
                                    onValueChange={(value) => setBodyProfileFormData((prev) => ({ ...prev, blood_type: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select blood type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A">A</SelectItem>
                                        <SelectItem value="B">B</SelectItem>
                                        <SelectItem value="AB">AB</SelectItem>
                                        <SelectItem value="O">O</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="block">{employeeData.body_profile ? employeeData.body_profile.blood_type : 'N/A'}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Shirt Size</Label>
                            {isEditing ? (
                                <Select
                                    value={bodyProfileFormData.shirt_size}
                                    onValueChange={(value) => setBodyProfileFormData((prev) => ({ ...prev, shirt_size: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select shirt size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="S">S (Small)</SelectItem>
                                        <SelectItem value="M">M (Medium)</SelectItem>
                                        <SelectItem value="L">L (Large)</SelectItem>
                                        <SelectItem value="XL">XL (Extra Large)</SelectItem>
                                        <SelectItem value="XXL">XXL (Double Extra Large)</SelectItem>
                                        <SelectItem value="XXXL">XXXL (Triple Extra Large)</SelectItem>
                                        <SelectItem value="CUSTOM">Custom</SelectItem>
                                        <SelectItem value="UNKNOWN">Unknown</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="block">{employeeData.body_profile ? employeeData.body_profile.shirt_size : 'N/A'}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">Shoe Size</Label>
                            {isEditing ? (
                                <Input
                                    value={bodyProfileFormData.shoe_size}
                                    onChange={(e) => setBodyProfileFormData((prev) => ({ ...prev, shoe_size: e.target.value }))}
                                    placeholder="e.g., 42, 7.5"
                                />
                            ) : (
                                <span className="block">{employeeData.body_profile ? employeeData.body_profile.shoe_size : 'N/A'}</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-500">Health Notes</Label>
                        {isEditing ? (
                            <Textarea
                                value={bodyProfileFormData.health_notes}
                                onChange={(e) => setBodyProfileFormData((prev) => ({ ...prev, health_notes: e.target.value }))}
                                rows={3}
                                placeholder="Medical conditions, allergies, or other health-related notes"
                            />
                        ) : (
                            <span className="block whitespace-pre-wrap">{employeeData.body_profile?.health_notes || 'N/A'}</span>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderPayrollData = () => (
        <Card>
            <CardHeader>
                <CardTitle>Payroll Data</CardTitle>
                <CardDescription>Salary and compensation information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Basic Salary</label>
                        <div className="flex items-center space-x-2">
                            <Receipt className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold text-green-600">
                                {employeeData.basic_salary ? `Rp ${Number(employeeData.basic_salary).toLocaleString('id-ID')}` : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <div className="text-center text-gray-500">Additional payroll information will be displayed here</div>
                </div>
            </CardContent>
        </Card>
    );

    const renderBpjsInformation = () => {
        const isEditing = editingSection === 'bpjs_information';

        const handleSave = () => {
            handleSaveSection('bpjs_information', bpjsFormData);
        };

        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>BPJS Information</CardTitle>
                        <CardDescription>BPJS and insurance details</CardDescription>
                    </div>
                    {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => handleEditSection('bpjs_information')}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    ) : (
                        <div className="flex space-x-2">
                            <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                                Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* BPJS Kesehatan */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            {isEditing ? (
                                <>
                                    <input
                                        type="checkbox"
                                        id="bpjs_kesehatan_active"
                                        checked={bpjsFormData.bpjs_kesehatan_active}
                                        onChange={(e) => setBpjsFormData((prev) => ({ ...prev, bpjs_kesehatan_active: e.target.checked }))}
                                        className="h-4 w-4"
                                    />
                                    <Label htmlFor="bpjs_kesehatan_active">BPJS Kesehatan Active</Label>
                                </>
                            ) : (
                                <>
                                    <Shield className={`h-4 w-4 ${bpjsFormData.bpjs_kesehatan_active ? 'text-green-500' : 'text-gray-400'}`} />
                                    <span className="font-medium">
                                        BPJS Kesehatan:{' '}
                                        <span className={bpjsFormData.bpjs_kesehatan_active ? 'text-green-600' : 'text-gray-600'}>
                                            {bpjsFormData.bpjs_kesehatan_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </span>
                                </>
                            )}
                        </div>

                        {isEditing && bpjsFormData.bpjs_kesehatan_active && (
                            <div className="ml-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">BPJS Kesehatan Number</Label>
                                    <Input
                                        value={bpjsFormData.bpjs_kesehatan_number}
                                        onChange={(e) => {
                                            // Allow only numbers for BPJS number
                                            const value = e.target.value.replace(/\D/g, '');
                                            setBpjsFormData((prev) => ({ ...prev, bpjs_kesehatan_number: value }));
                                        }}
                                        placeholder="Enter BPJS Kesehatan number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">Contribution</Label>
                                    <Select
                                        value={bpjsFormData.bpjs_kesehatan_contribution}
                                        onValueChange={(value) => setBpjsFormData((prev) => ({ ...prev, bpjs_kesehatan_contribution: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select contribution" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BY-COMPANY">Company</SelectItem>
                                            <SelectItem value="BY-EMPLOYEE">Employee</SelectItem>
                                            <SelectItem value="DEFAULT">Shared</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {!isEditing && bpjsFormData.bpjs_kesehatan_active && (
                            <div className="ml-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">BPJS Kesehatan Number</Label>
                                    <span className="block">{bpjsFormData.bpjs_kesehatan_number || 'N/A'}</span>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">Contribution</Label>
                                    <span className="block">
                                        {bpjsFormData.bpjs_kesehatan_contribution === 'BY-COMPANY'
                                            ? 'Company'
                                            : bpjsFormData.bpjs_kesehatan_contribution === 'BY-EMPLOYEE'
                                              ? 'Employee'
                                              : bpjsFormData.bpjs_kesehatan_contribution === 'DEFAULT'
                                                ? 'Shared'
                                                : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* BPJS Ketenagakerjaan */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            {isEditing ? (
                                <>
                                    <input
                                        type="checkbox"
                                        id="bpjs_ketenagakerjaan_active"
                                        checked={bpjsFormData.bpjs_ketenagakerjaan_active}
                                        onChange={(e) => setBpjsFormData((prev) => ({ ...prev, bpjs_ketenagakerjaan_active: e.target.checked }))}
                                        className="h-4 w-4"
                                    />
                                    <Label htmlFor="bpjs_ketenagakerjaan_active">BPJS Ketenagakerjaan Active</Label>
                                </>
                            ) : (
                                <>
                                    <Shield className={`h-4 w-4 ${bpjsFormData.bpjs_ketenagakerjaan_active ? 'text-green-500' : 'text-gray-400'}`} />
                                    <span className="font-medium">
                                        BPJS Ketenagakerjaan:{' '}
                                        <span className={bpjsFormData.bpjs_ketenagakerjaan_active ? 'text-green-600' : 'text-gray-600'}>
                                            {bpjsFormData.bpjs_ketenagakerjaan_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </span>
                                </>
                            )}
                        </div>

                        {isEditing && bpjsFormData.bpjs_ketenagakerjaan_active && (
                            <div className="ml-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">BPJS Ketenagakerjaan Number</Label>
                                    <Input
                                        value={bpjsFormData.bpjs_ketenagakerjaan_number}
                                        onChange={(e) => {
                                            // Allow only numbers for BPJS number
                                            const value = e.target.value.replace(/\D/g, '');
                                            setBpjsFormData((prev) => ({ ...prev, bpjs_ketenagakerjaan_number: value }));
                                        }}
                                        placeholder="Enter BPJS Ketenagakerjaan number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">Contribution</Label>
                                    <Select
                                        value={bpjsFormData.bpjs_ketenagakerjaan_contribution}
                                        onValueChange={(value) => setBpjsFormData((prev) => ({ ...prev, bpjs_ketenagakerjaan_contribution: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select contribution" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BY-COMPANY">Company</SelectItem>
                                            <SelectItem value="BY-EMPLOYEE">Employee</SelectItem>
                                            <SelectItem value="DEFAULT">Shared</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {!isEditing && bpjsFormData.bpjs_ketenagakerjaan_active && (
                            <div className="ml-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">BPJS Ketenagakerjaan Number</Label>
                                    <span className="block">{bpjsFormData.bpjs_ketenagakerjaan_number || 'N/A'}</span>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">Contribution</Label>
                                    <span className="block">
                                        {bpjsFormData.bpjs_ketenagakerjaan_contribution === 'BY-COMPANY'
                                            ? 'Company'
                                            : bpjsFormData.bpjs_ketenagakerjaan_contribution === 'BY-EMPLOYEE'
                                              ? 'Employee'
                                              : bpjsFormData.bpjs_ketenagakerjaan_contribution === 'DEFAULT'
                                                ? 'Shared'
                                                : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderTaxInformation = () => {
        const isEditing = editingSection === 'tax_information';

        const handleSave = () => {
            // Convert boolean to string for API
            const dataToSave = {
                ...taxFormData,
                is_spouse_working: taxFormData.is_spouse_working.toString(),
            };
            handleSaveSection('tax_information', dataToSave);
        };

        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Tax Information</CardTitle>
                        <CardDescription>Tax status and NPWP details</CardDescription>
                    </div>
                    {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => handleEditSection('tax_information')}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    ) : (
                        <div className="flex space-x-2">
                            <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                                Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">PTKP Code</Label>
                            {isEditing ? (
                                <Select
                                    value={taxFormData.ptkp_code}
                                    onValueChange={(value) => setTaxFormData((prev) => ({ ...prev, ptkp_code: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select PTKP code" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TK/0">TK/0 - Single, no dependents</SelectItem>
                                        <SelectItem value="TK/1">TK/1 - Single, 1 dependent</SelectItem>
                                        <SelectItem value="TK/2">TK/2 - Single, 2 dependents</SelectItem>
                                        <SelectItem value="TK/3">TK/3 - Single, 3 dependents</SelectItem>
                                        <SelectItem value="K/1">K/1 - Married, 1 dependent</SelectItem>
                                        <SelectItem value="K/2">K/2 - Married, 2 dependents</SelectItem>
                                        <SelectItem value="K3">K3 - Married, 3 dependents</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="block">{taxFormData.ptkp_code || 'N/A'}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">NPWP Number</Label>
                            {isEditing ? (
                                <Input
                                    value={taxFormData.npwp}
                                    onChange={(e) => {
                                        // Allow free text input for NPWP number
                                        setTaxFormData((prev) => ({ ...prev, npwp: e.target.value }));
                                    }}
                                    placeholder="Enter NPWP number"
                                    maxLength={50}
                                />
                            ) : (
                                <span className="block">{taxFormData.npwp || 'N/A'}</span>
                            )}
                        </div>
                    </div>

                    {/* Spouse Working - only show if married */}
                    {(personalFormData.marital_status === 'MARRIED' || employeeData.marital_status === 'MARRIED') && (
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                {isEditing ? (
                                    <>
                                        <input
                                            type="checkbox"
                                            id="is_spouse_working"
                                            checked={taxFormData.is_spouse_working}
                                            onChange={(e) => setTaxFormData((prev) => ({ ...prev, is_spouse_working: e.target.checked }))}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor="is_spouse_working">Spouse is Working</Label>
                                    </>
                                ) : (
                                    <>
                                        <Building className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">
                                            Spouse Working Status:{' '}
                                            <span className={taxFormData.is_spouse_working ? 'text-green-600' : 'text-gray-600'}>
                                                {taxFormData.is_spouse_working ? 'Working' : 'Not Working'}
                                            </span>
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    // Helper function to format time
    const formatTime = (timeString: string | null): string => {
        if (!timeString) return 'N/A';

        // Parse the time string (assuming format like "HH:mm:ss" or "HH:mm")
        try {
            const time = new Date(`1970-01-01T${timeString}`);
            return time.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });
        } catch {
            return timeString;
        }
    };

    // Helper function to get attendance status
    const getAttendanceStatus = (attendance: EmployeeDetail['recent_attendances'][0]) => {
        if (!attendance.time_in) return { label: 'Absent', variant: 'bg-red-100 text-red-800' };
        if (!attendance.time_out) return { label: 'Checked In', variant: 'bg-yellow-100 text-yellow-800' };
        return { label: 'Present', variant: 'bg-green-100 text-green-800' };
    };

    // Render recent attendance component
    const renderRecentAttendance = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Recent Attendance (Last 7 Days)</span>
                </CardTitle>
                <CardDescription>Employee attendance records for the past week</CardDescription>
            </CardHeader>
            <CardContent>
                {employeeData.recent_attendances && employeeData.recent_attendances.length > 0 ? (
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Check In</TableHead>
                                    <TableHead>Check Out</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Location Issues</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employeeData.recent_attendances.map((attendance) => {
                                    const status = getAttendanceStatus(attendance);
                                    return (
                                        <TableRow key={attendance.id}>
                                            <TableCell className="font-medium">{formatDate(attendance.date)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="h-4 w-4 text-green-600" />
                                                    <span>{formatTime(attendance.time_in)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="h-4 w-4 text-red-600" />
                                                    <span>{formatTime(attendance.time_out)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {attendance.is_fake_map_detected && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        ⚠️ Detected
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="py-8 text-center text-gray-500">
                        <Clock className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                        <p>No attendance records found for the last 7 days</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Karyawan - ${employee.full_name}`} />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6"
            >
                {/* Employee Header */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={employeeData.photo_url || ''} alt={employeeData.full_name || ''} />
                                <AvatarFallback className="text-lg">{getInitials(employeeData.full_name || 'U')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-2xl font-bold">{employeeData.full_name}</h1>
                                        <p className="mb-2 text-muted-foreground">{employeeData.position?.name || 'N/A'} • Engineering</p>
                                        <Badge className={getStatusBadge(employeeData.status || 'active')}>{employeeData.status || 'Active'}</Badge>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Link href={`/hrms/employees/${employeeData.id}/transfers`}>
                                            <Button variant="outline">
                                                <Users className="mr-2 h-4 w-4" />
                                                Transfer
                                            </Button>
                                        </Link>

                                        {/* <Link href={`/employees/${employeeData.id}/edit`}>
                                            <Button>
                                                <Edit2 className="mr-2 h-4 w-4" />
                                                Edit Profile
                                            </Button>
                                        </Link> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex space-x-2 border-b">
                    <Button
                        variant="ghost"
                        className={`${activeTab === 'profile' ? 'border-t-2 border-primary' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </Button>
                    <Button
                        variant="ghost"
                        className={`${activeTab === 'attendance' ? 'border-t-2 border-primary' : ''}`}
                        onClick={() => setActiveTab('attendance')}
                    >
                        <Calendar className="mr-2 h-4 w-4" />
                        Recent Attendance
                    </Button>
                </div>

                {/* Main Content */}
                {activeTab === 'profile' ? (
                    <div className="grid grid-cols-12 gap-6">
                        {/* Sidebar Navigation */}
                        <div className="col-span-3">
                            <Card>
                                <CardContent className="p-0">
                                    <nav className="space-y-1">
                                        {navigationItems.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setActiveSection(item.id)}
                                                    className={`flex w-full items-center px-4 py-3 text-left text-sm transition-colors hover:bg-accent ${
                                                        activeSection === item.id ? 'border-r-2 border-primary bg-accent font-medium' : ''
                                                    }`}
                                                >
                                                    <Icon className="mr-3 h-4 w-4 text-gray-500" />
                                                    {item.label}
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Content Area */}
                        <div className="col-span-9">{renderContent()}</div>
                    </div>
                ) : (
                    <div className="mt-6">{renderRecentAttendance()}</div>
                )}
            </motion.div>
        </AppLayout>
    );
}
