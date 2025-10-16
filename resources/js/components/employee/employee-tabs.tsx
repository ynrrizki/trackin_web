import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Employee } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Building, Calendar, Edit, IdCard, Mail, MapPin, Phone, Save, School, User, X } from 'lucide-react';

// Type untuk emergency contact
export interface EmergencyContact {
    name?: string;
    relationship?: string;
    phone?: string;
}

// Type utama untuk personalForm
export interface PersonalForm {
    full_name: string;
    email: string;
    kk_number?: string;
    postal_code?: string;
    mothermaiden_name?: string;
    phone: string;
    identity_number: string;
    birth_date: string;
    place_of_birth: string;
    religion: string;
    marital_status: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOW' | 'WIDOWER';
    spouse_name?: string;
    spouse_phone?: string;
    last_education?: string;
    emergency_contact: EmergencyContact;
    height?: string;
    weight?: string;
    blood_type?: 'A' | 'B' | 'AB' | 'O' | 'UNKNOWN';
    shirt_size?: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'CUSTOM' | 'UNKNOWN';
    shoe_size?: string;
    health_notes?: string;
    address: string;
}

// Type value untuk parameter setPersonalData
export type PersonalFormValue = string | number | boolean | EmergencyContact;

interface EmployeeTabsProps {
    employee: Employee & {
        position: { name: string };
        positionLevel: { name: string };
        department: { name: string };
        employmentStatus: { name: string };
        employeeType: { name: string };
        outsourcingField?: { name: string };
        kk_number?: string | null;
        postal_code?: string | null;
        spouse_name?: string | null;
        spouse_phone?: string | null;
        mothermaiden_name?: string | null;
        gender?: 'MALE' | 'FEMALE' | null;
        emergencyContacts: Array<{
            name: string;
            relationship: string;
            phone: string;
        }>;
        bankAccounts: Array<{
            name: string;
            account_number: string;
            account_name: string;
            bank_code?: string;
            bank_branch?: string;
        }>;
        bpjs: Array<{
            bpjs_type: string;
            participant_number: string;
        }>;
        bodyProfile?: {
            height?: string | null;
            weight?: string | null;
            blood_type?: string | null;
            shirt_size?: string | null;
            shoe_size?: string | null;
            health_notes?: string | null;
        } | null;
        taxStatus?: {
            ptkp_code?: string | null;
            npwp?: string | null;
            is_spouse_working?: boolean | null;
        } | null;
        attendanceData: {
            recent_attendances: Array<{
                date: string;
                time_in: string;
                time_out: string;
                hours_worked: number;
                status: string;
            }>;
            present_days: number;
            attendance_rate: number;
            late_arrivals: number;
        };
        leaveData: {
            recent_requests: Array<{
                leave_type: string;
                start_date: string;
                end_date: string;
                days: number;
                reason: string;
                status: string;
            }>;
            available_days: number;
            used_days: number;
            pending_requests: number;
        };
    };
    editingSection: string | null;
    personalForm: {
        full_name: string | null;
        email: string | null;
        phone: string | null;
        identity_number?: string | null;
        kk_number?: string | null;
        postal_code?: string | null;
        mothermaiden_name?: string | null;
        birth_date?: string | null;
        place_of_birth?: string | null;
        religion?: string | null;
        marital_status: string | null;
        spouse_name?: string | null;
        spouse_phone?: string | null;
        last_education?: string | null;
        address?: string | null;
        emergency_contact?: {
            name?: string;
            relationship?: string;
            phone?: string;
        };
        height?: string;
        weight?: string;
        blood_type?: string;
        shirt_size?: string;
        shoe_size?: string;
        health_notes?: string;
    };
    setPersonalData: (field: keyof PersonalForm, value: PersonalFormValue) => void;
    handleEditPersonal: () => void;
    handleSavePersonal: () => void;
    handleCancelPersonal: () => void;
    formatDate: (date: string) => string;
    getEmploymentTypeBadge: (type: string) => string;
}

export function EmployeeTabs({
    employee,
    editingSection,
    personalForm,
    setPersonalData,
    handleEditPersonal,
    handleSavePersonal,
    handleCancelPersonal,
    formatDate,
    getEmploymentTypeBadge,
}: EmployeeTabsProps) {
    return (
        <div>
            <Tabs defaultValue="attendance" className="w-full">
                <TabsList className="mb-6 flex w-full gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] sm:[scrollbar-width:auto]">
                    <TabsTrigger value="attendance" className="flex items-center gap-2 text-xs sm:text-sm">
                        <Calendar className="hidden h-4 w-4 sm:block" />
                        <span>Attendance</span>
                    </TabsTrigger>
                    <TabsTrigger value="personal" className="flex items-center gap-2 text-xs sm:text-sm">
                        <User className="hidden h-4 w-4 sm:block" />
                        <span>Personal</span>
                    </TabsTrigger>
                    <TabsTrigger value="employment" className="flex items-center gap-2 text-xs sm:text-sm">
                        <Briefcase className="hidden h-4 w-4 sm:block" />
                        <span>Employment</span>
                    </TabsTrigger>
                </TabsList>

                {/* Attendance Tab */}
                <TabsContent value="attendance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Attendance</CardTitle>
                            <CardDescription>Daily attendance records and time tracking</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {employee.attendanceData.recent_attendances && employee.attendanceData.recent_attendances.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Time In</TableHead>
                                                <TableHead>Time Out</TableHead>
                                                <TableHead>Hours</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {employee.attendanceData.recent_attendances.map((attendance, index: number) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{formatDate(attendance.date)}</TableCell>
                                                    <TableCell className="text-green-600">{attendance.time_in || '-'}</TableCell>
                                                    <TableCell className="text-destructive">{attendance.time_out || '-'}</TableCell>
                                                    <TableCell>{attendance.hours_worked.toFixed(1)}h</TableCell>
                                                    <TableCell>
                                                        <Badge variant={attendance.status === 'Present' ? 'default' : 'secondary'}>
                                                            {attendance.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                    <p className="mb-2 text-lg font-medium">No Attendance Records</p>
                                    <p className="text-sm">Attendance records will appear here once available.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Personal Tab */}
                <TabsContent value="personal">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Employee personal and contact details</CardDescription>
                                </div>
                                {editingSection !== 'personal' && (
                                    <Button onClick={handleEditPersonal} variant="outline" size="sm">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <AnimatePresence mode="wait">
                                {editingSection === 'personal' ? (
                                    <motion.div
                                        key="edit-personal"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        // className="space-y-6"
                                    >
                                        <div className="mb-4 flex items-center gap-2">
                                            <Button onClick={handleSavePersonal} size="sm">
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </Button>
                                            <Button onClick={handleCancelPersonal} size="sm" variant="outline">
                                                <X className="mr-2 h-4 w-4" />
                                                Cancel
                                            </Button>
                                        </div>

                                        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <div className="space-y-4 *:flex *:flex-col *:gap-2">
                                                <div>
                                                    <Label htmlFor="full_name">Full Name</Label>
                                                    <Input
                                                        id="full_name"
                                                        value={personalForm.full_name || ''}
                                                        onChange={(e) => setPersonalData('full_name', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={personalForm.email || ''}
                                                        onChange={(e) => setPersonalData('email', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="kk_number">KK Number</Label>
                                                    <Input
                                                        id="kk_number"
                                                        value={personalForm.kk_number || ''}
                                                        onChange={(e) => setPersonalData('kk_number', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="postal_code">Postal Code</Label>
                                                    <Input
                                                        id="postal_code"
                                                        value={personalForm.postal_code || ''}
                                                        onChange={(e) => setPersonalData('postal_code', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="mothermaiden_name">Mother's Maiden Name</Label>
                                                    <Input
                                                        id="mothermaiden_name"
                                                        value={personalForm.mothermaiden_name || ''}
                                                        onChange={(e) => setPersonalData('mothermaiden_name', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="phone">Phone</Label>
                                                    <Input
                                                        id="phone"
                                                        value={personalForm.phone || ''}
                                                        onChange={(e) => setPersonalData('phone', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="identity_number">Identity Number</Label>
                                                    <Input
                                                        id="identity_number"
                                                        value={personalForm.identity_number || ''}
                                                        onChange={(e) => setPersonalData('identity_number', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4 *:flex *:flex-col *:gap-2">
                                                <div>
                                                    <Label htmlFor="birth_date">Birth Date</Label>
                                                    <Input
                                                        id="birth_date"
                                                        type="date"
                                                        value={personalForm.birth_date || ''}
                                                        onChange={(e) => setPersonalData('birth_date', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="place_of_birth">Place of Birth</Label>
                                                    <Input
                                                        id="place_of_birth"
                                                        value={personalForm.place_of_birth || ''}
                                                        onChange={(e) => setPersonalData('place_of_birth', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="religion">Religion</Label>
                                                    <Select
                                                        value={personalForm.religion || ''}
                                                        onValueChange={(value) => setPersonalData('religion', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Religion" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Islam">Islam</SelectItem>
                                                            <SelectItem value="Kristen">Kristen</SelectItem>
                                                            <SelectItem value="Katolik">Katolik</SelectItem>
                                                            <SelectItem value="Hindu">Hindu</SelectItem>
                                                            <SelectItem value="Buddha">Buddha</SelectItem>
                                                            <SelectItem value="Confucius">Konghuchu</SelectItem>
                                                            <SelectItem value="Other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="marital_status">Marital Status</Label>
                                                    <Select
                                                        value={personalForm.marital_status || ''}
                                                        onValueChange={(value) => setPersonalData('marital_status', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="SINGLE">Single</SelectItem>
                                                            <SelectItem value="MARRIED">Married</SelectItem>
                                                            <SelectItem value="DIVORCED">Divorced</SelectItem>
                                                            <SelectItem value="WIDOW">Widow</SelectItem>
                                                            <SelectItem value="WIDOWER">Widower</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="spouse_name">Spouse Name</Label>
                                                    <Input
                                                        id="spouse_name"
                                                        value={personalForm.spouse_name || ''}
                                                        onChange={(e) => setPersonalData('spouse_name', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="spouse_phone">Spouse Phone</Label>
                                                    <Input
                                                        id="spouse_phone"
                                                        value={personalForm.spouse_phone || ''}
                                                        onChange={(e) => setPersonalData('spouse_phone', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="last_education">Last Education</Label>
                                                    <Input
                                                        id="last_education"
                                                        value={personalForm.last_education || ''}
                                                        onChange={(e) => setPersonalData('last_education', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <div className="space-y-4 *:flex *:flex-col *:gap-2">
                                                <h4 className="font-semibold">Emergency Contact</h4>
                                                <Separator />
                                                <div>
                                                    <Label htmlFor="emergency_contact_name">Name</Label>
                                                    <Input
                                                        id="emergency_contact_name"
                                                        value={personalForm.emergency_contact?.name || ''}
                                                        onChange={(e) =>
                                                            setPersonalData('emergency_contact', {
                                                                ...personalForm.emergency_contact,
                                                                name: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                                                    <Input
                                                        id="emergency_contact_relationship"
                                                        value={personalForm.emergency_contact?.relationship || ''}
                                                        onChange={(e) =>
                                                            setPersonalData('emergency_contact', {
                                                                ...personalForm.emergency_contact,
                                                                relationship: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="emergency_contact_phone">Phone</Label>
                                                    <Input
                                                        id="emergency_contact_phone"
                                                        value={personalForm.emergency_contact?.phone || ''}
                                                        onChange={(e) =>
                                                            setPersonalData('emergency_contact', {
                                                                ...personalForm.emergency_contact,
                                                                phone: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4 *:flex *:flex-col *:gap-2">
                                                <h4 className="font-semibold">Body Profile</h4>
                                                <Separator />
                                                <div>
                                                    <Label htmlFor="height">Height (cm)</Label>
                                                    <Input
                                                        id="height"
                                                        value={personalForm.height || ''}
                                                        onChange={(e) => setPersonalData('height', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="weight">Weight (kg)</Label>
                                                    <Input
                                                        id="weight"
                                                        value={personalForm.weight || ''}
                                                        onChange={(e) => setPersonalData('weight', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="blood_type">Blood Type</Label>
                                                    <Select
                                                        value={personalForm.blood_type || ''}
                                                        onValueChange={(value) => setPersonalData('blood_type', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Blood Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="A">A</SelectItem>
                                                            <SelectItem value="B">B</SelectItem>
                                                            <SelectItem value="AB">AB</SelectItem>
                                                            <SelectItem value="O">O</SelectItem>
                                                            <SelectItem value="UNKNOWN">Unknown</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="shirt_size">Shirt Size</Label>
                                                    <Select
                                                        value={personalForm.shirt_size || ''}
                                                        onValueChange={(value) => setPersonalData('shirt_size', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Shirt Size" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="S">S</SelectItem>
                                                            <SelectItem value="M">M</SelectItem>
                                                            <SelectItem value="L">L</SelectItem>
                                                            <SelectItem value="XL">XL</SelectItem>
                                                            <SelectItem value="XXL">XXL</SelectItem>
                                                            <SelectItem value="XXXL">XXXL</SelectItem>
                                                            <SelectItem value="CUSTOM">Custom</SelectItem>
                                                            <SelectItem value="UNKNOWN">Unknown</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="shoe_size">Shoe Size</Label>
                                                    <Input
                                                        id="shoe_size"
                                                        value={personalForm.shoe_size || ''}
                                                        onChange={(e) => setPersonalData('shoe_size', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="health_notes">Health Notes</Label>
                                                    <Textarea
                                                        id="health_notes"
                                                        value={personalForm.health_notes || ''}
                                                        onChange={(e) => setPersonalData('health_notes', e.target.value)}
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="address">Address</Label>
                                            <Textarea
                                                id="address"
                                                value={personalForm.address || ''}
                                                onChange={(e) => setPersonalData('address', e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="view-personal"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2"
                                    >
                                        {/* Kontak & Identitas */}
                                        <div className="space-y-4">
                                            <div>
                                                <h2 className="text-2xl font-bold">Kontak</h2>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Email</p>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <p className="font-medium">{employee.email}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Phone</p>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <p className="font-medium">{employee.phone || '-'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Identity Number</p>
                                                <div className="flex items-center gap-2">
                                                    <IdCard className="h-4 w-4 text-muted-foreground" />
                                                    <p className="font-medium">{employee.identity_number || '-'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">KK Number</p>
                                                <p className="font-medium">{employee.kk_number || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Postal Code</p>
                                                <p className="font-medium">{employee.postal_code || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Mother's Maiden Name</p>
                                                <p className="font-medium">{employee.mothermaiden_name || '-'}</p>
                                            </div>
                                        </div>

                                        {/* Data Pribadi */}
                                        <div className="space-y-4">
                                            <div>
                                                <h2 className="text-2xl font-bold">Pribadi</h2>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Birth Date</p>
                                                <p className="font-medium">{employee.birth_date ? formatDate(employee.birth_date) : '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Place of Birth</p>
                                                <p className="font-medium">{employee.place_of_birth || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Religion</p>
                                                <p className="font-medium">{employee.religion || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Marital Status</p>
                                                <p className="font-medium">{employee.marital_status || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Spouse Name</p>
                                                <p className="font-medium">{employee.spouse_name || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Spouse Phone</p>
                                                <p className="font-medium">{employee.spouse_phone || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Education</p>
                                                <div className="flex items-center gap-2">
                                                    <School className="h-4 w-4 text-muted-foreground" />
                                                    <p className="font-medium">{employee.last_education || '-'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Address</p>
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                                                    <p className="font-medium">{employee.address || '-'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Emergency Contact & Body Profile */}
                                        <div className="space-y-4">
                                            <div>
                                                <h2 className="text-2xl font-bold">Emergency & Body</h2>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Emergency Contact Name</p>
                                                <p className="font-medium">{employee.emergencyContacts?.[0]?.name || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Emergency Contact Relationship</p>
                                                <p className="font-medium">{employee.emergencyContacts?.[0]?.relationship || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Emergency Contact Phone</p>
                                                <p className="font-medium">{employee.emergencyContacts?.[0]?.phone || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Height (cm)</p>
                                                <p className="font-medium">{employee.bodyProfile?.height || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Weight (kg)</p>
                                                <p className="font-medium">{employee.bodyProfile?.weight || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Blood Type</p>
                                                <p className="font-medium">{employee.bodyProfile?.blood_type || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Shirt Size</p>
                                                <p className="font-medium">{employee.bodyProfile?.shirt_size || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Shoe Size</p>
                                                <p className="font-medium">{employee.bodyProfile?.shoe_size || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Health Notes</p>
                                                <p className="font-medium">{employee.bodyProfile?.health_notes || '-'}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Employment Tab */}
                <TabsContent value="employment">
                    <Card>
                        <CardHeader>
                            <CardTitle>Employment Information</CardTitle>
                            <CardDescription>Job details and employment history</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-4">
                                    <div>
                                        <p className="mb-1 text-sm font-medium text-muted-foreground">Position</p>
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                                            <p className="font-medium">{employee.position?.name || '-'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-sm font-medium text-muted-foreground">Department</p>
                                        <div className="flex items-center gap-2">
                                            <Building className="h-4 w-4 text-muted-foreground" />
                                            <p className="font-medium">{employee.department?.name || '-'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-sm font-medium text-muted-foreground">Level</p>
                                        <p className="font-medium">{employee.positionLevel?.name || '-'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="mb-1 text-sm font-medium text-muted-foreground">Employment Status</p>
                                        <p className="font-medium">{employee.employmentStatus?.name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-sm font-medium text-muted-foreground">Employee Type</p>
                                        <Badge className={`border ${getEmploymentTypeBadge(employee.employeeType?.name || '')}`}>
                                            {employee.employeeType?.name || '-'}
                                        </Badge>
                                    </div>
                                    {employee.outsourcingField && (
                                        <div>
                                            <p className="mb-1 text-sm font-medium text-muted-foreground">Outsourcing Field</p>
                                            <p className="font-medium">{employee.outsourcingField.name}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="mb-1 text-sm font-medium text-muted-foreground">Join Date</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <p className="font-medium">{employee.join_date ? formatDate(employee.join_date) : '-'}</p>
                                        </div>
                                    </div>
                                    {employee.end_date && (
                                        <div>
                                            <p className="mb-1 text-sm font-medium text-muted-foreground">End Date</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <p className="font-medium">{formatDate(employee.end_date)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Leave & Documents tabs removed as requested */}
            </Tabs>
        </div>
    );
}
