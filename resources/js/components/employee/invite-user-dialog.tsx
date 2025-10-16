import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { router } from '@inertiajs/react';
import { Role } from '@/types/role-permission';
import { Employee } from '@/types';
import {
    UserPlus,
    Mail,
    Eye,
    EyeOff,
    Users,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface InviteUserDialogProps {
    employee: Employee;
    roles: Role[];
    onSuccess?: () => void;
}

export function InviteUserDialog({ employee, roles, onSuccess }: InviteUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [formData, setFormData] = useState({
        employee_id: employee.id,
        name: employee.full_name,
        email: employee.email,
        password: '',
        generate_password: true,
        role_ids: [] as number[],
        send_invitation: true,
        custom_message: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        try {
            await router.post('/api/employees/invite-user', formData, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('User invitation berhasil dikirim');
                    setOpen(false);
                    resetForm();
                    onSuccess?.();
                },
                onError: () => {
                    toast.error('Gagal mengirim invitation');
                },
                onFinish: () => setProcessing(false),
            });
        } catch {
            toast.error('Terjadi kesalahan');
            setProcessing(false);
        }
    };

    const resetForm = () => {
        setFormData({
            employee_id: employee.id,
            name: employee.full_name,
            email: employee.email,
            password: '',
            generate_password: true,
            role_ids: [],
            send_invitation: true,
            custom_message: '',
        });
    };

    const handleRoleChange = (roleId: number, checked: boolean) => {
        if (checked) {
            setFormData(prev => ({
                ...prev,
                role_ids: [...prev.role_ids, roleId]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                role_ids: prev.role_ids.filter(id => id !== roleId)
            }));
        }
    };

    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, password }));
    };

    // Auto generate password when component mounts
    useState(() => {
        if (formData.generate_password && !formData.password) {
            generateRandomPassword();
        }
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite User
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Invite Employee as User</DialogTitle>
                    <DialogDescription>
                        Create user account for {employee.full_name} and send login credentials.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Employee Info Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Employee Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Employee Code:</span>
                                        <span className="ml-2">{employee.employee_code}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">Department:</span>
                                        <span className="ml-2">{employee.department?.name || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">Position:</span>
                                        <span className="ml-2">{employee.position?.name || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">Join Date:</span>
                                        <span className="ml-2">
                                            {employee.join_date ? new Date(employee.join_date).toLocaleDateString('id-ID') : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* User Account Details */}
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="generate_password"
                                            checked={formData.generate_password}
                                            onCheckedChange={(checked) => {
                                                const shouldGenerate = checked === true;
                                                setFormData(prev => ({ ...prev, generate_password: shouldGenerate }));
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
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        disabled={formData.generate_password}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                {formData.generate_password && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={generateRandomPassword}
                                        className="w-fit"
                                    >
                                        Generate New Password
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Role Assignment */}
                        <div className="grid gap-2">
                            <Label>Assign Roles</Label>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                                {roles.map((role) => (
                                    <div key={role.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`invite-role-${role.id}`}
                                            checked={formData.role_ids.includes(role.id)}
                                            onCheckedChange={(checked) =>
                                                handleRoleChange(role.id, checked === true)
                                            }
                                        />
                                        <Label
                                            htmlFor={`invite-role-${role.id}`}
                                            className="text-sm font-normal cursor-pointer flex-1"
                                        >
                                            {role.name}
                                            <span className="text-gray-500 ml-1">
                                                ({role.permissions?.length || 0} permissions)
                                            </span>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {formData.role_ids.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {formData.role_ids.map((roleId) => {
                                        const role = roles.find(r => r.id === roleId);
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
                                    checked={formData.send_invitation}
                                    onCheckedChange={(checked) =>
                                        setFormData(prev => ({ ...prev, send_invitation: checked === true }))
                                    }
                                />
                                <Label htmlFor="send_invitation" className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    Send invitation email
                                </Label>
                            </div>

                            {formData.send_invitation && (
                                <div className="grid gap-2">
                                    <Label htmlFor="custom_message">Custom Message (Optional)</Label>
                                    <Textarea
                                        id="custom_message"
                                        placeholder="Add a personal message to the invitation email..."
                                        value={formData.custom_message}
                                        onChange={(e) => setFormData(prev => ({ ...prev, custom_message: e.target.value }))}
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Preview */}
                        {formData.send_invitation && (
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-2">
                                        <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-blue-900">Email Preview</p>
                                            <p className="text-sm text-blue-800">
                                                <strong>To:</strong> {formData.email}
                                            </p>
                                            <p className="text-sm text-blue-800">
                                                <strong>Subject:</strong> Welcome to WMI HRIS - Your Account Details
                                            </p>
                                            <div className="text-sm text-blue-700 mt-2">
                                                {formData.custom_message && (
                                                    <p className="italic mb-2">"{formData.custom_message}"</p>
                                                )}
                                                <p>Login credentials and system access instructions will be included.</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                formData.send_invitation ? 'Sending Invitation...' : 'Creating User...'
                            ) : (
                                formData.send_invitation ? 'Send Invitation' : 'Create User'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface BulkInviteDialogProps {
    employees: Employee[];
    roles: Role[];
    onSuccess?: () => void;
}

export function BulkInviteDialog({ employees, roles, onSuccess }: BulkInviteDialogProps) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [formData, setFormData] = useState({
        employee_ids: employees.map(emp => emp.id),
        role_ids: [] as number[],
        generate_passwords: true,
        send_invitations: true,
        custom_message: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        try {
            await router.post('/api/employees/bulk-invite-users', formData, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Successfully sent invitations to ${employees.length} employees`);
                    setOpen(false);
                    resetForm();
                    onSuccess?.();
                },
                onError: () => {
                    toast.error('Failed to send bulk invitations');
                },
                onFinish: () => setProcessing(false),
            });
        } catch {
            toast.error('Terjadi kesalahan');
            setProcessing(false);
        }
    };

    const resetForm = () => {
        setFormData({
            employee_ids: employees.map(emp => emp.id),
            role_ids: [],
            generate_passwords: true,
            send_invitations: true,
            custom_message: '',
        });
    };

    const handleRoleChange = (roleId: number, checked: boolean) => {
        if (checked) {
            setFormData(prev => ({
                ...prev,
                role_ids: [...prev.role_ids, roleId]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                role_ids: prev.role_ids.filter(id => id !== roleId)
            }));
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Bulk Invite ({employees.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Bulk Invite Employees</DialogTitle>
                    <DialogDescription>
                        Create user accounts for {employees.length} selected employees and send invitations.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Employee List Preview */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Selected Employees</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {employees.slice(0, 5).map((emp) => (
                                        <div key={emp.id} className="flex items-center justify-between text-sm">
                                            <span>{emp.full_name}</span>
                                            <span className="text-gray-500">{emp.email}</span>
                                        </div>
                                    ))}
                                    {employees.length > 5 && (
                                        <p className="text-sm text-gray-500">
                                            ...and {employees.length - 5} more employees
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bulk Settings */}
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Default Roles for All Users</Label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                                    {roles.map((role) => (
                                        <div key={role.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`bulk-role-${role.id}`}
                                                checked={formData.role_ids.includes(role.id)}
                                                onCheckedChange={(checked) =>
                                                    handleRoleChange(role.id, checked === true)
                                                }
                                            />
                                            <Label
                                                htmlFor={`bulk-role-${role.id}`}
                                                className="text-sm font-normal cursor-pointer flex-1"
                                            >
                                                {role.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="generate_passwords"
                                        checked={formData.generate_passwords}
                                        onCheckedChange={(checked) =>
                                            setFormData(prev => ({ ...prev, generate_passwords: checked === true }))
                                        }
                                    />
                                    <Label htmlFor="generate_passwords">Auto-generate secure passwords</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="send_invitations"
                                        checked={formData.send_invitations}
                                        onCheckedChange={(checked) =>
                                            setFormData(prev => ({ ...prev, send_invitations: checked === true }))
                                        }
                                    />
                                    <Label htmlFor="send_invitations">Send invitation emails</Label>
                                </div>
                            </div>

                            {formData.send_invitations && (
                                <div className="grid gap-2">
                                    <Label htmlFor="bulk_custom_message">Custom Message for All Invitations</Label>
                                    <Textarea
                                        id="bulk_custom_message"
                                        placeholder="Add a message that will be included in all invitation emails..."
                                        value={formData.custom_message}
                                        onChange={(e) => setFormData(prev => ({ ...prev, custom_message: e.target.value }))}
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Warning */}
                        <Card className="bg-amber-50 border-amber-200">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                    <div className="text-sm text-amber-800">
                                        <p className="font-medium">Important Notes:</p>
                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                            <li>User accounts will be created for all selected employees</li>
                                            <li>Passwords will be auto-generated and sent via email</li>
                                            <li>Employees must have valid email addresses</li>
                                            <li>This action cannot be undone</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Processing...' : `Create ${employees.length} User Accounts`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
