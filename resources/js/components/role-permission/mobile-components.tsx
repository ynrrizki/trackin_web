import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Role, Permission, UserWithRoles } from '@/types/role-permission';
import {
    ChevronDown,
    ChevronRight,
    User,
    Shield,
    Key,
    MoreVertical,
    Edit,
    Trash2
} from 'lucide-react';

interface MobileRoleCardProps {
    role: Role;
    permissions: Permission[];
    onEdit?: () => void;
    onDelete?: (id: number) => void;
}

export function MobileRoleCard({ role, permissions, onEdit, onDelete }: MobileRoleCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const handleDelete = () => {
        if (confirm(`Apakah Anda yakin ingin menghapus role "${role.name}"?`)) {
            onDelete?.(role.id);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            {role.name}
                        </CardTitle>
                        <div className="text-sm text-gray-600 mt-1">
                            {role.permissions?.length || 0} permissions
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </Collapsible>

                        <Sheet open={showActions} onOpenChange={setShowActions}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-auto">
                                <SheetHeader>
                                    <SheetTitle>Actions for {role.name}</SheetTitle>
                                    <SheetDescription>
                                        Choose an action to perform on this role.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="grid gap-3 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            onEdit?.();
                                            setShowActions(false);
                                        }}
                                        className="justify-start"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Role
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            handleDelete();
                                            setShowActions(false);
                                        }}
                                        className="justify-start text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Role
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </CardHeader>

            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Permissions:</div>
                            <div className="flex flex-wrap gap-1">
                                {role.permissions?.map((permission) => (
                                    <Badge key={permission.id} variant="secondary" className="text-xs">
                                        {permission.name}
                                    </Badge>
                                ))}
                                {(!role.permissions || role.permissions.length === 0) && (
                                    <span className="text-sm text-gray-500">No permissions assigned</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

interface MobileUserCardProps {
    user: UserWithRoles;
    isSelected: boolean;
    onSelect: (selected: boolean) => void;
    onAssignRole?: () => void;
    onAssignPermission?: () => void;
}

export function MobileUserCard({
    user,
    isSelected,
    onSelect,
    onAssignRole,
    onAssignPermission
}: MobileUserCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showActions, setShowActions] = useState(false);

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onSelect}
                    />
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{user.name}</div>
                        <div className="text-sm text-gray-600 truncate">{user.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </Collapsible>

                        <Sheet open={showActions} onOpenChange={setShowActions}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-auto">
                                <SheetHeader>
                                    <SheetTitle>Actions for {user.name}</SheetTitle>
                                    <SheetDescription>
                                        Manage roles and permissions for this user.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="grid gap-3 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            onAssignRole?.();
                                            setShowActions(false);
                                        }}
                                        className="justify-start"
                                    >
                                        <Shield className="h-4 w-4 mr-2" />
                                        Assign Roles
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            onAssignPermission?.();
                                            setShowActions(false);
                                        }}
                                        className="justify-start"
                                    >
                                        <Key className="h-4 w-4 mr-2" />
                                        Direct Permissions
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </CardHeader>

            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleContent>
                    <CardContent className="pt-0 space-y-3">
                        <div>
                            <div className="text-sm font-medium mb-1">Roles:</div>
                            <div className="flex flex-wrap gap-1">
                                {user.roles.map((role) => (
                                    <Badge key={role.id} variant="secondary" className="text-xs">
                                        {role.name}
                                    </Badge>
                                ))}
                                {user.roles.length === 0 && (
                                    <span className="text-sm text-gray-500">No roles assigned</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-medium mb-1">Direct Permissions:</div>
                            <div className="text-sm text-gray-600">
                                {user.direct_permissions?.length || 0} permissions
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

interface ResponsiveLayoutProps {
    children: React.ReactNode;
    isMobile: boolean;
}

export function ResponsiveLayout({ children, isMobile }: ResponsiveLayoutProps) {
    if (isMobile) {
        return (
            <div className="space-y-4 px-4">
                {children}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {children}
        </div>
    );
}

// Hook to detect mobile screen size
export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useState(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    });

    return isMobile;
}
