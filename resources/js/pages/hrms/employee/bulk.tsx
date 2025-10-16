import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { copyToClipboard } from '@/lib/utils';
import bulkEmployeeService, { type BulkImportResult, type MasterData, type MasterDataItem } from '@/services/bulkEmployeeService';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CheckCircle, Copy, Database, Download, FileSpreadsheet, Upload, Users } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';

interface ProcessedDataItem {
    row: number;
    employee_id?: number;
    name?: string;
    status: 'success' | 'error';
}

interface ErrorItem {
    row: number;
    error: string;
    data: Record<string, string | number | boolean>;
}

const breadcrumbs = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Karyawan',
        href: route('hrms.employees.index'),
    },
    {
        title: 'Bulk Import Karyawan',
        href: route('hrms.employees.bulk'),
    },
];

export default function BulkEmployeePage() {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
    const [showMasterData, setShowMasterData] = useState(false);
    const [masterData, setMasterData] = useState<MasterData | null>(null);
    const [loadingMasterData, setLoadingMasterData] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Download template function
    const handleDownloadTemplate = async () => {
        try {
            const blob = await bulkEmployeeService.downloadTemplate();
            const filename = 'bulk_employee_template_' + new Date().toISOString().slice(0, 10) + '.xlsx';
            bulkEmployeeService.downloadBlob(blob, filename);
            toast.success('Template downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download template');
        }
    };

    // Load master data for reference
    const handleLoadMasterData = async () => {
        setLoadingMasterData(true);
        try {
            const data = await bulkEmployeeService.getMasterData();
            setMasterData(data);
            setShowMasterData(true);
            toast.success('Master data loaded successfully');
        } catch (error) {
            console.error('Master data error:', error);
            toast.error('Failed to load master data');
        } finally {
            setLoadingMasterData(false);
        }
    };

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            const validation = bulkEmployeeService.validateFile(selectedFile);
            if (!validation.valid) {
                toast.error(validation.error!);
                return;
            }

            setFile(selectedFile);
            setImportResult(null); // Clear previous results
        }
    };

    // Handle file upload and import
    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file first');
            return;
        }

        setImporting(true);

        try {
            const result = await bulkEmployeeService.bulkImport(file);

            setImportResult(result.data);

            if (result.data.error_count === 0) {
                toast.success(`Successfully imported ${result.data.success_count} employees!`);
            } else {
                toast.warning(
                    `Import completed with ${result.data.error_count} errors. ${result.data.success_count} employees imported successfully.`,
                );
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to import employees');
        } finally {
            setImporting(false);
        }
    };

    // Clear file selection
    const handleClearFile = () => {
        setFile(null);
        setImportResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Get status color for results
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'bg-green-100 text-green-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bulk Import Karyawan" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('hrms.employees.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Bulk Import Karyawan</h1>
                            <p className="text-muted-foreground">Import multiple employees using Excel template</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left side - Import process */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Step 1: Download Template */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-5 w-5" />
                                    Step 1: Download Template
                                </CardTitle>
                                <CardDescription>Download the Excel template with pre-configured headers and validation rules</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-4">
                                    <Button onClick={handleDownloadTemplate} className="flex items-center gap-2">
                                        <Download className="h-4 w-4" />
                                        Download Template
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleLoadMasterData}
                                        disabled={loadingMasterData}
                                        className="flex items-center gap-2"
                                    >
                                        <Database className="h-4 w-4" />
                                        {loadingMasterData ? 'Loading...' : 'View Master Data'}
                                    </Button>
                                </div>

                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Important:</strong> The template includes detailed comments and validation rules. Make sure to fill
                                        all required fields and use the correct data formats as specified in the comments.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>

                        {/* Step 2: Upload File */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5" />
                                    Step 2: Upload Filled Template
                                </CardTitle>
                                <CardDescription>Upload your completed Excel file to import employee data</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="file-upload">Select Excel File</Label>
                                        <Input
                                            ref={fileInputRef}
                                            id="file-upload"
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileChange}
                                            className="mt-1"
                                        />
                                    </div>

                                    {file && (
                                        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                                            <div className="flex items-center gap-2">
                                                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                                <span className="text-sm font-medium">{file.name}</span>
                                                <Badge variant="secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={handleClearFile}>
                                                Remove
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button onClick={handleUpload} disabled={!file || importing} className="flex items-center gap-2">
                                            <Upload className="h-4 w-4" />
                                            {importing ? 'Importing...' : 'Start Import'}
                                        </Button>

                                        {file && (
                                            <Button variant="outline" onClick={handleClearFile}>
                                                Clear
                                            </Button>
                                        )}
                                    </div>

                                    {importing && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                                                <span className="text-sm">Processing file...</span>
                                            </div>
                                            <Progress value={undefined} />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Import Results */}
                        {importResult && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {importResult.error_count === 0 ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                        )}
                                        Import Results
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Summary */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="rounded-lg bg-green-50 p-3 text-center">
                                            <div className="text-2xl font-bold text-green-600">{importResult.success_count}</div>
                                            <div className="text-sm text-green-600">Successful</div>
                                        </div>
                                        <div className="rounded-lg bg-red-50 p-3 text-center">
                                            <div className="text-2xl font-bold text-red-600">{importResult.error_count}</div>
                                            <div className="text-sm text-red-600">Failed</div>
                                        </div>
                                        <div className="rounded-lg bg-blue-50 p-3 text-center">
                                            <div className="text-2xl font-bold text-blue-600">{importResult.total_processed}</div>
                                            <div className="text-sm text-blue-600">Total</div>
                                        </div>
                                    </div>

                                    {/* Detailed Results */}
                                    {importResult.processed_data.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="font-medium">Processed Records</h4>
                                            <div className="max-h-64 overflow-y-auto rounded-lg border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Row</TableHead>
                                                            <TableHead>Name</TableHead>
                                                            <TableHead>Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {importResult.processed_data.map((item: ProcessedDataItem, index: number) => (
                                                            <TableRow key={index}>
                                                                <TableCell>{item.row}</TableCell>
                                                                <TableCell>{item.name || 'N/A'}</TableCell>
                                                                <TableCell>
                                                                    <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error Details */}
                                    {importResult.errors && importResult.errors.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-red-600">Error Details</h4>
                                            <div className="max-h-64 overflow-y-auto rounded-lg border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Row</TableHead>
                                                            <TableHead>Error</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {importResult.errors.map((error: ErrorItem, index: number) => (
                                                            <TableRow key={index}>
                                                                <TableCell>{error.row}</TableCell>
                                                                <TableCell className="text-sm text-red-600">{error.error}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right side - Instructions and Master Data */}
                    <div className="space-y-6">
                        {/* Instructions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Instructions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="space-y-2">
                                    <h4 className="font-medium">Before You Start:</h4>
                                    <ul className="ml-4 space-y-1 text-muted-foreground">
                                        <li>• Download the Excel template</li>
                                        <li>• Review the master data for valid IDs</li>
                                        <li>• Fill all required fields</li>
                                        <li>• Follow the data format specified in comments</li>
                                    </ul>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <h4 className="font-medium">Important Notes:</h4>
                                    <ul className="ml-4 space-y-1 text-muted-foreground">
                                        <li>• Email addresses must be unique</li>
                                        <li>• Dates should be in YYYY-MM-DD format</li>
                                        <li>• For Internal employees, department_id is required</li>
                                        <li>• For Outsourcing employees, outsourcing_field_id is required</li>
                                        <li>• If cash_active is false, bank details are required</li>
                                    </ul>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <h4 className="font-medium">File Requirements:</h4>
                                    <ul className="ml-4 space-y-1 text-muted-foreground">
                                        <li>• Excel format (.xlsx or .xls)</li>
                                        <li>• Maximum file size: 10MB</li>
                                        <li>• Keep the header row intact</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Master Data Reference */}
                    {showMasterData && masterData && (
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    Master Data Reference
                                </CardTitle>
                                <CardDescription>Use these IDs in your Excel file</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-6 space-y-4 sm:grid-cols-2">
                                {Object.entries(masterData).map(([key, items]) => (
                                    <div key={key} className="space-y-2">
                                        <h4 className="text-sm font-bold capitalize">{key.replace(/_/g, ' ')}</h4>
                                        <Separator />
                                        <div className="max-h-32 overflow-y-auto text-xs">
                                            {items.map((item: MasterDataItem) => (
                                                <div key={item.id} className="flex justify-between py-1">
                                                    <span className="truncate">{item.name}</span>
                                                    <div className="ml-2 space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={async () => copyToClipboard(item.id.toString())}
                                                        >
                                                            <Copy />
                                                        </Button>
                                                        <Badge variant="outline" className="text-xs">
                                                            {item.id}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
