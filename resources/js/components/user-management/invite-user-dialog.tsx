import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Employee } from '@/types';
import { EmployeeSelect } from '@/components/employee/employee-select';
import { generatePassword } from '@/utils/password-generator';
import { useUserInvitation, invitationUtils } from '@/services/user-invitation';
import { Eye, EyeOff, Mail, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Role } from '@/types/role-permission';

export interface InviteUserDialogProps {
    roles: Role[];
    onSuccess?: () => void;
}

export function InviteUserDialog({ roles, onSuccess }: InviteUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<'regular' | 'employee' | 'bulk-employee'>('regular');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

    // Use the invitation service
    const { inviteRegularUser, inviteEmployeeAsUser, bulkInviteEmployees } = useUserInvitation();

    const [regularUserData, setRegularUserData] = useState({
        name: '',
        email: '',
        password: '',
        generate_password: true,
        role_ids: [] as number[],
        send_invitation: true,
        custom_message: '',
    });

    const [employeeUserData, setEmployeeUserData] = useState({
        employee_id: 0,
        role_ids: [] as number[],
        send_invitation: true,
        custom_message: '',
    });

    const [bulkEmployeeData, setBulkEmployeeData] = useState({
        employee_ids: [] as number[],
        role_ids: [] as number[],
        send_invitation: true,
        custom_message: '',
    });

    const generateRandomPassword = () => {
        const password = generatePassword({ length: 12 });
        setRegularUserData((prev) => ({ ...prev, password }));
    };

    // Auto generate password when generate_password changes to true
    useEffect(() => {
        if (regularUserData.generate_password && !regularUserData.password) {
            generateRandomPassword();
        }
    }, [regularUserData.generate_password, regularUserData.password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        try {
            if (activeTab === 'regular') {
                await inviteRegularUser(regularUserData);
                toast.success(invitationUtils.getSuccessMessage('regular'));
                setOpen(false);
                resetForm();
                onSuccess?.();
            } else if (activeTab === 'employee') {
                if (!selectedEmployee) {
                    toast.error('Please select an employee');
                    setProcessing(false);
                    return;
                }

                const invitationData = {
                    ...employeeUserData,
                    employee_id: selectedEmployee.id,
                    name: selectedEmployee.full_name,
                    email: selectedEmployee.email,
                    generate_password: true,
                };

                await inviteEmployeeAsUser(invitationData);
                toast.success(invitationUtils.getSuccessMessage('employee'));
                setOpen(false);
                resetForm();
                onSuccess?.();
            } else if (activeTab === 'bulk-employee') {
                if (selectedEmployees.length === 0) {
                    toast.error('Please select at least one employee');
                    setProcessing(false);
                    return;
                }

                const bulkData = {
                    ...bulkEmployeeData,
                    employee_ids: selectedEmployees.map(emp => emp.id),
                    employees: selectedEmployees.map(emp => ({
                        id: emp.id,
                        name: emp.full_name,
                        email: emp.email,
                    })),
                    generate_password: true,
                };

                await bulkInviteEmployees(bulkData);
                toast.success(invitationUtils.getSuccessMessage('bulk', selectedEmployees.length));
                setOpen(false);
                resetForm();
                onSuccess?.();
            }
        } catch (error) {
            console.error('Error inviting user(s):', error);
            if (error instanceof Error) {
                toast.error('Failed to invite user(s): ' + error.message);
            } else {
                toast.error('Terjadi kesalahan');
            }
        } finally {
            setProcessing(false);
        }
    };

    const resetForm = () => {
        setRegularUserData({
            name: '',
            email: '',
            password: '',
            generate_password: true,
            role_ids: [],
            send_invitation: true,
            custom_message: '',
        });
        setEmployeeUserData({
            employee_id: 0,
            role_ids: [],
            send_invitation: true,
            custom_message: '',
        });
        setBulkEmployeeData({
            employee_ids: [],
            role_ids: [],
            send_invitation: true,
            custom_message: '',
        });
        setSelectedEmployee(null);
        setSelectedEmployees([]);
        setActiveTab('regular');
    };

    const handleRoleChange = (roleId: number, checked: boolean) => {
        if (activeTab === 'regular') {
            if (checked) {
                setRegularUserData((prev) => ({
                    ...prev,
                    role_ids: [...prev.role_ids, roleId],
                }));
            } else {
                setRegularUserData((prev) => ({
                    ...prev,
                    role_ids: prev.role_ids.filter((id) => id !== roleId),
                }));
            }
        } else if (activeTab === 'employee') {
            if (checked) {
                setEmployeeUserData((prev) => ({
                    ...prev,
                    role_ids: [...prev.role_ids, roleId],
                }));
            } else {
                setEmployeeUserData((prev) => ({
                    ...prev,
                    role_ids: prev.role_ids.filter((id) => id !== roleId),
                }));
            }
        } else if (activeTab === 'bulk-employee') {
            if (checked) {
                setBulkEmployeeData((prev) => ({
                    ...prev,
                    role_ids: [...prev.role_ids, roleId],
                }));
            } else {
                setBulkEmployeeData((prev) => ({
                    ...prev,
                    role_ids: prev.role_ids.filter((id) => id !== roleId),
                }));
            }
        }
    };

    const currentRoleIds = activeTab === 'regular'
        ? regularUserData.role_ids
        : activeTab === 'employee'
            ? employeeUserData.role_ids
            : bulkEmployeeData.role_ids;

    const currentSendInvitation = activeTab === 'regular'
        ? regularUserData.send_invitation
        : activeTab === 'employee'
            ? employeeUserData.send_invitation
            : bulkEmployeeData.send_invitation;

    const currentCustomMessage = activeTab === 'regular'
        ? regularUserData.custom_message
        : activeTab === 'employee'
            ? employeeUserData.custom_message
            : bulkEmployeeData.custom_message;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite User
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Invite New User</DialogTitle>
                    <DialogDescription>Create a new user account or invite an existing employee to join the system.</DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'regular' | 'employee' | 'bulk-employee')}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="regular">Regular User</TabsTrigger>
                        <TabsTrigger value="employee">From Employee</TabsTrigger>
                        <TabsTrigger value="bulk-employee">
                            <Users className="h-4 w-4 mr-1" />
                            Bulk Invite
                        </TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <TabsContent value="regular" className="space-y-4">
                                {/* Regular User Form */}
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="regular-name">Full Name</Label>
                                        <Input
                                            id="regular-name"
                                            value={regularUserData.name}
                                            onChange={(e) => setRegularUserData((prev) => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="regular-email">Email</Label>
                                        <Input
                                            id="regular-email"
                                            type="email"
                                            value={regularUserData.email}
                                            onChange={(e) => setRegularUserData((prev) => ({ ...prev, email: e.target.value }))}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="regular-password">Password</Label>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="generate_password"
                                                    checked={regularUserData.generate_password}
                                                    onCheckedChange={(checked) => {
                                                        const shouldGenerate = checked === true;
                                                        setRegularUserData((prev) => ({ ...prev, generate_password: shouldGenerate }));
                                                        if (shouldGenerate) {
                                                            generateRandomPassword();
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor="generate_password" className="text-sm">
                                                    Auto generate
                                                </Label>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="regular-password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={regularUserData.password}
                                                onChange={(e) => setRegularUserData((prev) => ({ ...prev, password: e.target.value }))}
                                                disabled={regularUserData.generate_password}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        {regularUserData.generate_password && (
                                            <Button type="button" variant="outline" size="sm" onClick={generateRandomPassword} className="w-fit">
                                                Generate New Password
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="employee" className="space-y-4">
                                {/* Employee Selection */}
                                <div className="grid gap-2">
                                    <Label>Select Employee</Label>
                                    <EmployeeSelect onEmployeeSelect={setSelectedEmployee} selectedEmployee={selectedEmployee} />
                                </div>
                            </TabsContent>

                            <TabsContent value="bulk-employee" className="space-y-4">
                                {/* Bulk Employee Selection */}
                                <div className="grid gap-2">
                                    <Label>Select Multiple Employees</Label>
                                    <EmployeeSelect
                                        onEmployeeSelect={() => {}} // Not used in multiple mode
                                        selectedEmployee={null}
                                        multiple={true}
                                        selectedEmployees={selectedEmployees}
                                        onEmployeesSelect={setSelectedEmployees}
                                    />
                                </div>
                            </TabsContent>

                            {/* Common Role Assignment */}
                            <div className="grid gap-2">
                                <Label>Assign Roles</Label>
                                <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
                                    {roles.map((role) => (
                                        <div key={role.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`role-${role.id}`}
                                                checked={currentRoleIds.includes(role.id)}
                                                onCheckedChange={(checked) => handleRoleChange(role.id, checked === true)}
                                            />
                                            <Label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer text-sm font-normal">
                                                {role.name}
                                                <span className="ml-1 text-gray-500">({role.permissions?.length || 0} permissions)</span>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {currentRoleIds.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {currentRoleIds.map((roleId) => {
                                            const role = roles.find((r) => r.id === roleId);
                                            return (
                                                <Badge key={roleId} variant="secondary" className="text-xs">
                                                    {role?.name}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Invitation Settings */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="send_invitation"
                                        checked={currentSendInvitation}
                                        onCheckedChange={(checked) => {
                                            const shouldSend = checked === true;
                                            if (activeTab === 'regular') {
                                                setRegularUserData((prev) => ({ ...prev, send_invitation: shouldSend }));
                                            } else if (activeTab === 'employee') {
                                                setEmployeeUserData((prev) => ({ ...prev, send_invitation: shouldSend }));
                                            } else if (activeTab === 'bulk-employee') {
                                                setBulkEmployeeData((prev) => ({ ...prev, send_invitation: shouldSend }));
                                            }
                                        }}
                                    />
                                    <Label htmlFor="send_invitation" className="flex items-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        Send invitation email
                                    </Label>
                                </div>

                                {currentSendInvitation && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="custom_message">Custom Message (Optional)</Label>
                                        <Textarea
                                            id="custom_message"
                                            placeholder="Add a personal message to the invitation email..."
                                            value={currentCustomMessage}
                                            onChange={(e) => {
                                                const message = e.target.value;
                                                if (activeTab === 'regular') {
                                                    setRegularUserData((prev) => ({ ...prev, custom_message: message }));
                                                } else if (activeTab === 'employee') {
                                                    setEmployeeUserData((prev) => ({ ...prev, custom_message: message }));
                                                } else if (activeTab === 'bulk-employee') {
                                                    setBulkEmployeeData((prev) => ({ ...prev, custom_message: message }));
                                                }
                                            }}
                                            rows={3}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing
                                    ? currentSendInvitation
                                        ? 'Sending Invitation...'
                                        : 'Creating User...'
                                    : currentSendInvitation
                                      ? 'Send Invitation'
                                      : 'Create User'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
