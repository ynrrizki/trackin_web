# Dialog Pattern Guidelines

## Penggunaan Dialog Interaktif

Sebagai pengganti `confirm()`, `alert()`, dan `prompt()` bawaan browser, gunakan dialog shadcn/ui yang interaktif.

### Pattern untuk Delete Confirmation

```tsx
// State management
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [deletingItem, setDeletingItem] = useState<ItemType | null>(null);

// Handler untuk membuka dialog
const handleDelete = (item: ItemType) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
};

// Handler untuk konfirmasi delete
const confirmDelete = () => {
    if (!deletingItem) return;
    
    router.delete(route('item.destroy', deletingItem.id), {
        onSuccess: () => {
            setIsDeleteDialogOpen(false);
            setDeletingItem(null);
        }
    });
};

// Dialog Component
<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
                Apakah Anda yakin ingin menghapus "{deletingItem?.name}"? 
                Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
        </DialogHeader>
        <DialogFooter>
            <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setDeletingItem(null);
                }}
            >
                Batal
            </Button>
            <Button 
                type="button" 
                variant="destructive" 
                onClick={confirmDelete}
            >
                Hapus
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

### Pattern untuk Validation Errors

Sebagai pengganti `alert()` untuk error validation:

```tsx
// State management
const [validationErrors, setValidationErrors] = useState<string[]>([]);

// Validation logic
const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setValidationErrors([]);
    const errors: string[] = [];
    
    if (!data.field1) {
        errors.push('Field 1 is required');
    }
    
    if (errors.length > 0) {
        setValidationErrors(errors);
        return;
    }
    
    // Submit logic...
};

// Error display component
{validationErrors.length > 0 && (
    <Card className="border-destructive bg-destructive/5">
        <CardContent className="pt-6">
            <div className="text-sm text-destructive space-y-1">
                {validationErrors.map((error, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <span className="text-xs">•</span>
                        <span>{error}</span>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
)}
```

### Pattern untuk Success Messages

Gunakan Inertia flash messages atau toast notifications daripada `alert()`:

```tsx
// In controller
return back()->with('success', 'Operation completed successfully');

// In frontend (handled automatically by Inertia)
// Or use toast notifications for better UX
```

## Files Updated

### ✅ Completed
1. `resources/js/pages/settings/crm/outsourcing-fields.tsx` - Delete confirmation dialog
2. `resources/js/pages/settings/hrms/shifts.tsx` - Delete confirmation dialog  
3. `resources/js/pages/settings/hrms/assign-shifts.tsx` - Validation error display

### Pattern Consistency
- All delete operations now use interactive dialogs
- All validation errors use card-based error display
- Consistent button styling (outline + destructive)
- Proper state management for dialog open/close
- Success handling with state cleanup
