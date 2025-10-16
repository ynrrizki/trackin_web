import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Permission, Role } from '@/types/role-permission';
import { AlertCircle, CheckCircle, Download, FileText, Upload, Zap } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface ExportImportProps {
    roles: Role[];
    permissions: Permission[];
    onRefresh: () => void;
}

export function ExportImportTools({ roles, permissions, onRefresh }: ExportImportProps) {
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);

    const exportData = () => {
        const exportData = {
            roles: roles.map((role) => ({
                name: role.name,
                permissions: role.permissions?.map((p) => p.name) || [],
            })),
            permissions: permissions.map((p) => ({ name: p.name })),
            exported_at: new Date().toISOString(),
            version: '1.0',
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json',
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `role-permissions-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Data exported successfully');
        setShowExportDialog(false);
    };

    const [importing, setImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) {
            toast.error('Please select a file to import');
            return;
        }

        setImporting(true);
        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const response = await axios.post('/api/role-permission/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.data.success) {
                toast.success('Data imported successfully');
                setShowImportDialog(false);
                setImportFile(null);
                onRefresh();
            } else {
                toast.error(response.data.message || 'Failed to import data');
            }
        } catch (error) {
            console.error('Import error:', error);
            let errorMessage = 'Failed to import data';

            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || errorMessage;
            }

            toast.error(errorMessage);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Export Roles & Permissions</DialogTitle>
                        <DialogDescription>Download current roles and permissions configuration as JSON file.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <div className="font-medium">Roles</div>
                                <div className="text-gray-600">{roles.length} roles</div>
                            </div>
                            <div className="space-y-1">
                                <div className="font-medium">Permissions</div>
                                <div className="text-gray-600">{permissions.length} permissions</div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={exportData}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Import Roles & Permissions</DialogTitle>
                        <DialogDescription>Upload a JSON file to import roles and permissions configuration.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleImport}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="import-file">Select JSON File</Label>
                                <Input
                                    id="import-file"
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        setImportFile(file || null);
                                    }}
                                />
                            </div>
                            <div className="text-sm text-gray-600">
                                <AlertCircle className="mr-1 inline h-4 w-4" />
                                This will merge with existing data. Duplicate names will be skipped.
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setShowImportDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={importing || !importFile}>
                                {importing ? 'Importing...' : 'Import'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface QuickSetupProps {
    onSetupComplete: () => void;
}

export function QuickSetup({ onSetupComplete }: QuickSetupProps) {
    const [showSetupDialog, setShowSetupDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const [setupData, setSetupData] = useState({
        template: '',
        customRoles: [] as { name: string; permissions: string[] }[],
    });

    const templates = [
        {
            id: 'basic-hrms',
            name: 'Basic HRMS',
            description: 'Essential roles for HR management',
            roles: [
                { name: 'HR Manager', permissions: ['employee.view', 'employee.create', 'employee.edit', 'attendance.view'] },
                { name: 'HR Staff', permissions: ['employee.view', 'attendance.view'] },
                { name: 'Employee', permissions: ['profile.view', 'attendance.view'] },
            ],
        },
        {
            id: 'complete-hrms',
            name: 'Complete HRMS',
            description: 'Full HR management system roles',
            roles: [
                { name: 'Super Admin', permissions: ['*'] },
                { name: 'HR Manager', permissions: ['employee.*', 'attendance.*', 'leave.*', 'payroll.view'] },
                { name: 'HR Staff', permissions: ['employee.view', 'employee.create', 'attendance.*'] },
                { name: 'Manager', permissions: ['employee.view', 'attendance.view', 'leave.approve'] },
                { name: 'Payroll Staff', permissions: ['payroll.*', 'employee.view'] },
                { name: 'Employee', permissions: ['profile.view', 'attendance.view', 'leave.create'] },
            ],
        },
        {
            id: 'custom',
            name: 'Custom Setup',
            description: 'Create your own role configuration',
            roles: [],
        },
    ];

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTemplate) {
            toast.error('Please select a template');
            return;
        }

        setProcessing(true);

        try {
            const requestData = {
                template: selectedTemplate,
                customRoles: setupData.customRoles,
            };

            const response = await axios.post('/api/roles/quick-setup', requestData, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.data.success) {
                toast.success('Quick setup completed successfully');
                setShowSetupDialog(false);
                setSelectedTemplate('');
                setSetupData({ template: '', customRoles: [] });
                onSetupComplete();
            } else {
                toast.error(response.data.message || 'Failed to complete setup');
            }
        } catch (error) {
            console.error('Setup error:', error);
            let errorMessage = 'Failed to complete setup';

            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || errorMessage;
            }

            toast.error(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Zap className="mr-2 h-4 w-4" />
                    Quick Setup
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Quick Role Setup</DialogTitle>
                    <DialogDescription>Choose a template to quickly set up common role configurations.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSetup}>
                    <div className="space-y-6">
                        <div className="grid gap-4">
                            {templates.map((template) => (
                                <Card
                                    key={template.id}
                                    className={`cursor-pointer transition-colors ${selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''}`}
                                    onClick={() => {
                                        setSelectedTemplate(template.id);
                                        setSetupData(prev => ({ ...prev, template: template.id }));
                                    }}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{template.name}</CardTitle>
                                            {selectedTemplate === template.id && <CheckCircle className="h-5 w-5 text-blue-500" />}
                                        </div>
                                        <p className="text-sm text-gray-600">{template.description}</p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-1">
                                            {template.roles.slice(0, 4).map((role, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    {role.name}
                                                </Badge>
                                            ))}
                                            {template.roles.length > 4 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{template.roles.length - 4} more
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {selectedTemplate === 'custom' && (
                            <div className="space-y-4">
                                <Label>Custom Roles Configuration</Label>
                                <Textarea
                                    placeholder="Enter your custom roles configuration as JSON..."
                                    className="min-h-32"
                                    onChange={(e) => {
                                        try {
                                            const customRoles = JSON.parse(e.target.value);
                                            setSetupData(prev => ({ ...prev, customRoles }));
                                        } catch {
                                            // Invalid JSON, ignore
                                        }
                                    }}
                                />
                                <div className="text-sm text-gray-600">
                                    <FileText className="mr-1 inline h-4 w-4" />
                                    Format: {`[{"name": "Role Name", "permissions": ["permission1", "permission2"]}]`}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => setShowSetupDialog(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || !selectedTemplate}>
                            {processing ? 'Setting up...' : 'Setup Roles'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
