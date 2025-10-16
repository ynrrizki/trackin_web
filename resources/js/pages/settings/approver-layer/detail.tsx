import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { BreadcrumbItem } from '@/types';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, router } from '@inertiajs/react';
import { Check, Edit3, GripVertical, Plus, Save, Search, Settings, Trash2, User, UserCheck, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengaturan', href: '/settings' },
    { title: 'Approver Layer', href: '/settings/approver-layer' },
];

// Types
interface ApproverLayer {
    id: string;
    level: number;
    approvable_type_id: number;
    approver_id: number;
    approver_type: string;
    approver_name: string;
    approver_email?: string;
    department?: string;
    employee_id?: string;
    status: 'active' | 'inactive';
    description?: string;
}

interface ApproverOption {
    id: number;
    name: string;
    email?: string;
    department?: string;
    employee_id?: string;
    description?: string;
    type: string;
    category: 'users' | 'employees' | 'roles';
    display: string;
}

interface ApproverLayerDetailProps {
    approvable_type: string;
    approvable_type_id: number;
    display_name: string;
    layers: ApproverLayer[];
    available_approvers: {
        users: ApproverOption[];
        employees: ApproverOption[];
        roles: ApproverOption[];
    };
}

// Sortable Item Component
function SortableApproverLayer({
    layer,
    onEdit,
    onDelete,
    onToggleStatus,
}: {
    layer: ApproverLayer;
    onEdit: (layer: ApproverLayer) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, status: 'active' | 'inactive') => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: layer.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="group relative">
            <Card className={`transition-all duration-200 ${isDragging ? 'shadow-lg' : 'hover:shadow-md'}`}>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        {/* Drag Handle */}
                        <div
                            {...attributes}
                            {...listeners}
                            className="cursor-grab text-muted-foreground transition-colors hover:cursor-grabbing hover:text-foreground"
                        >
                            <GripVertical className="h-5 w-5" />
                        </div>

                        {/* Level Badge */}
                        <Badge variant="outline" className="min-w-16 justify-center">
                            Level {layer.level}
                        </Badge>

                        {/* Approver Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                {layer.approver_type === 'App\\Models\\User' ? (
                                    <User className="h-4 w-4 text-blue-500" />
                                ) : layer.approver_type === 'App\\Models\\Employee' ? (
                                    <UserCheck className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Users className="h-4 w-4 text-purple-500" />
                                )}
                                <div>
                                    <p className="font-medium">{layer.approver_name}</p>
                                    {layer.approver_email && <p className="text-sm text-muted-foreground">{layer.approver_email}</p>}
                                    {layer.employee_id && <p className="text-xs text-muted-foreground">ID: {layer.employee_id}</p>}
                                    {layer.department && <p className="text-xs text-muted-foreground">{layer.department}</p>}
                                </div>
                            </div>
                            {layer.description && <p className="mt-2 text-sm text-muted-foreground">{layer.description}</p>}
                        </div>

                        {/* Status Toggle */}
                        <div className="flex items-center gap-2">
                            <Label htmlFor={`status-${layer.id}`} className="text-sm">
                                {layer.status === 'active' ? 'Aktif' : 'Nonaktif'}
                            </Label>
                            <Switch
                                id={`status-${layer.id}`}
                                checked={layer.status === 'active'}
                                onCheckedChange={(checked) => onToggleStatus(layer.id, checked ? 'active' : 'inactive')}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button variant="ghost" size="sm" onClick={() => onEdit(layer)} className="h-8 w-8 p-0">
                                <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(layer.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Add/Edit Layer Dialog with optimized search
function LayerDialog({
    open,
    onOpenChange,
    layer,
    availableApprovers,
    approvableType,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    layer?: ApproverLayer;
    availableApprovers: ApproverLayerDetailProps['available_approvers'];
    approvableType: string;
    onSave: (data: Partial<ApproverLayer>) => void;
}) {
    const [formData, setFormData] = useState({
        approver_type: layer?.approver_type || 'App\\Models\\User',
        approver_id: layer?.approver_id || 0,
        description: layer?.description || '',
        status: layer?.status || 'active',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [showApproverList, setShowApproverList] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'users' | 'employees' | 'roles'>('users');

    // Flatten all approvers for easy searching
    const allApprovers: ApproverOption[] = useMemo(
        () => [...availableApprovers.users, ...availableApprovers.employees, ...availableApprovers.roles],
        [availableApprovers.users, availableApprovers.employees, availableApprovers.roles],
    );

    // Filter approvers based on search query and selected category
    const filteredApprovers = useMemo(() => {
        const categoryApprovers = availableApprovers[selectedCategory] || [];

        if (!searchQuery.trim()) return categoryApprovers;

        const query = searchQuery.toLowerCase();
        return categoryApprovers.filter(
            (approver) =>
                approver.name.toLowerCase().includes(query) ||
                approver.email?.toLowerCase().includes(query) ||
                approver.employee_id?.toLowerCase().includes(query) ||
                approver.department?.toLowerCase().includes(query),
        );
    }, [availableApprovers, selectedCategory, searchQuery]);

    // Map category to type
    // const getCategoryType = (category: 'users' | 'employees' | 'roles') => {
    //     switch (category) {
    //         case 'users': return 'App\\Models\\User';
    //         case 'employees': return 'App\\Models\\Employee';
    //         case 'roles': return 'Spatie\\Permission\\Models\\Role';
    //         default: return 'App\\Models\\User';
    //     }
    // };

    const selectedApprover = allApprovers.find((approver) => approver.id === formData.approver_id && approver.type === formData.approver_type);

    const getApproverIcon = (category: string) => {
        switch (category) {
            case 'users':
                return <User className="h-4 w-4 text-blue-500" />;
            case 'employees':
                return <UserCheck className="h-4 w-4 text-green-500" />;
            case 'roles':
                return <Users className="h-4 w-4 text-purple-500" />;
            default:
                return <User className="h-4 w-4" />;
        }
    };

    const handleApproverSelect = (approver: ApproverOption) => {
        setFormData((prev) => ({
            ...prev,
            approver_id: approver.id,
            approver_type: approver.type,
        }));
        setShowApproverList(false);
        setSearchQuery('');
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category as 'users' | 'employees' | 'roles');
        setSearchQuery(''); // Reset search when changing category
    };

    const handleSave = () => {
        if (formData.approver_id === 0) return;

        onSave({
            ...formData,
            approver_name: selectedApprover?.name || '',
            approver_email: selectedApprover?.email,
            department: selectedApprover?.department,
            employee_id: selectedApprover?.employee_id,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{layer ? 'Edit Approver Layer' : 'Tambah Approver Layer'}</DialogTitle>
                    <DialogDescription>Atur level persetujuan untuk {approvableType}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Pilih Approver</Label>

                        {/* Selected Approver Display */}
                        {selectedApprover && !showApproverList && (
                            <div className="rounded-md border p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {getApproverIcon(selectedApprover.category)}
                                        <div>
                                            <p className="font-medium">{selectedApprover.name}</p>
                                            {selectedApprover.email && <p className="text-xs text-muted-foreground">{selectedApprover.email}</p>}
                                            {selectedApprover.employee_id && (
                                                <p className="text-xs text-muted-foreground">ID: {selectedApprover.employee_id}</p>
                                            )}
                                            {selectedApprover.department && (
                                                <p className="text-xs text-muted-foreground">{selectedApprover.department}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowApproverList(true)}>
                                        Ganti
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Search and Selection */}
                        {(!selectedApprover || showApproverList) && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nama, email, atau ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>

                                {/* Tabs for approver type selection */}
                                <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="users">Users</TabsTrigger>
                                        <TabsTrigger value="employees">Employees</TabsTrigger>
                                        <TabsTrigger value="roles">Roles</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value={selectedCategory} className="space-y-2">
                                        <div className="max-h-64 overflow-y-auto rounded-md border">
                                            {filteredApprovers.length > 0 ? (
                                                <div className="divide-y">
                                                    {filteredApprovers.map((approver) => (
                                                        <button
                                                            key={`${approver.type}-${approver.id}`}
                                                            type="button"
                                                            onClick={() => handleApproverSelect(approver)}
                                                            className="w-full p-3 text-left transition-colors hover:bg-muted/50"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {getApproverIcon(approver.category)}
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="truncate font-medium">{approver.name}</div>
                                                                    {approver.email && (
                                                                        <div className="truncate text-xs text-muted-foreground">{approver.email}</div>
                                                                    )}
                                                                    {approver.employee_id && (
                                                                        <div className="text-xs text-muted-foreground">
                                                                            ID: {approver.employee_id}
                                                                        </div>
                                                                    )}
                                                                    {approver.department && (
                                                                        <div className="text-xs text-muted-foreground">{approver.department}</div>
                                                                    )}
                                                                </div>
                                                                {selectedApprover?.id === approver.id && selectedApprover?.type === approver.type && (
                                                                    <Check className="h-4 w-4 text-primary" />
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center text-muted-foreground">
                                                    <Search className="mx-auto mb-2 h-8 w-8" />
                                                    <div>No {selectedCategory} found</div>
                                                    {searchQuery && <div className="text-sm">Try adjusting your search terms</div>}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi (Opsional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Deskripsi untuk layer ini..."
                            value={formData.description}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="status"
                            checked={formData.status === 'active'}
                            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
                        />
                        <Label htmlFor="status">Aktif</Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button onClick={handleSave} disabled={formData.approver_id === 0}>
                        <Save className="mr-2 h-4 w-4" />
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ApproverLayerDetail({
    approvable_type,
    approvable_type_id,
    display_name,
    layers: initialLayers = [],
    available_approvers,
}: ApproverLayerDetailProps) {
    const [layers, setLayers] = useState<ApproverLayer[]>(initialLayers);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingLayer, setEditingLayer] = useState<ApproverLayer | undefined>();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setLayers((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update levels based on new order
                const updatedItems = newItems.map((item, index) => ({
                    ...item,
                    level: index + 1,
                }));

                // Save to backend
                saveLayers(updatedItems);

                return updatedItems;
            });
        }
    };

    const handleAddLayer = () => {
        setEditingLayer(undefined);
        setDialogOpen(true);
    };

    const handleEditLayer = (layer: ApproverLayer) => {
        setEditingLayer(layer);
        setDialogOpen(true);
    };

    const handleDeleteLayer = (id: string) => {
        setLayers((prev) => {
            const newLayers = prev.filter((layer) => layer.id !== id);
            // Update levels
            const updatedLayers = newLayers.map((layer, index) => ({
                ...layer,
                level: index + 1,
            }));
            saveLayers(updatedLayers);
            return updatedLayers;
        });
    };

    const handleToggleStatus = (id: string, status: 'active' | 'inactive') => {
        setLayers((prev) => {
            const updatedLayers = prev.map((layer) => (layer.id === id ? { ...layer, status } : layer));
            saveLayers(updatedLayers);
            return updatedLayers;
        });
    };

    const handleSaveLayer = (data: Partial<ApproverLayer>) => {
        if (editingLayer) {
            // Update existing layer
            setLayers((prev) => {
                const updatedLayers = prev.map((layer) => (layer.id === editingLayer.id ? { ...layer, ...data } : layer));
                saveLayers(updatedLayers);
                return updatedLayers;
            });
        } else {
            // Add new layer
            const newLayer: ApproverLayer = {
                id: Date.now().toString(),
                level: layers.length + 1,
                approvable_type_id,
                ...data,
            } as ApproverLayer;

            setLayers((prev) => {
                const updatedLayers = [...prev, newLayer];
                saveLayers(updatedLayers);
                return updatedLayers;
            });
        }
    };

    const saveLayers = (layersToSave: ApproverLayer[]) => {
        // Convert layers to plain objects for form data
        const layersData = layersToSave.map((layer) => ({
            id: layer.id,
            level: layer.level,
            approvable_type_id: approvable_type_id,
            approver_id: layer.approver_id,
            approver_type: layer.approver_type,
            approver_name: layer.approver_name,
            approver_email: layer.approver_email || '',
            department: layer.department || '',
            status: layer.status,
            description: layer.description || '',
        }));

        // Save to backend
        router.patch(
            `/settings/approver-layer/${approvable_type_id}`,
            {
                layers: layersData,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Approver Layer - ${display_name}`} />
            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Approver Layer</h1>
                            <p className="text-muted-foreground">
                                Atur level persetujuan untuk <span className="font-medium">{display_name}</span>
                            </p>
                        </div>

                        <Button onClick={handleAddLayer}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Layer
                        </Button>
                    </div>

                    {layers.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Settings className="mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-lg font-medium text-muted-foreground">Belum ada approver layer</p>
                                <p className="mb-4 text-sm text-muted-foreground">Tambahkan layer untuk mengatur alur persetujuan</p>
                                <Button onClick={handleAddLayer}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Layer Pertama
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-lg bg-muted/30 p-4">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Petunjuk:</strong> Seret dan lepas untuk mengubah urutan level approver. Level 1 akan diproses terlebih
                                    dahulu, kemudian level 2, dan seterusnya.
                                </p>
                            </div>

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={layers} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-3">
                                        {layers.map((layer) => (
                                            <SortableApproverLayer
                                                key={layer.id}
                                                layer={layer}
                                                onEdit={handleEditLayer}
                                                onDelete={handleDeleteLayer}
                                                onToggleStatus={handleToggleStatus}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    <LayerDialog
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        layer={editingLayer}
                        availableApprovers={available_approvers}
                        approvableType={approvable_type}
                        onSave={handleSaveLayer}
                    />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
