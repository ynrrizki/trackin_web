import { DataTable, type DataTableColumn } from '@/components/data-table';
import { PaginationLinks } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, MapPin, Settings, Users, Filter, UserCheck } from 'lucide-react';
import { useState, useCallback } from 'react';

interface Project {
    id: number;
    name: string;
    latitude?: number;
    longitude?: number;
    required_agents?: number;
    current_agents_count?: number;
    checkpoints_count?: number;
    status?: 'active' | 'inactive' | 'draft';
    created_at?: string;
    description?: string;
}

interface Props {
    projects: { data: Project[]; links: { url: string | null; label: string; active: boolean }[] };
    filters: {
        search?: string;
        coordinates?: string;
        sort_by?: string;
        sort_order?: string;
    };
}



export default function PatroliProjects({ projects, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [coordinatesFilter, setCoordinatesFilter] = useState<string>(filters.coordinates || 'all');
    const [sortBy, setSortBy] = useState<string>(filters.sort_by || 'name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((filters.sort_order as 'asc' | 'desc') || 'asc');

    // Function to update filters and reload data
    const updateFilters = (newFilters: { [key: string]: string }) => {
        const params = new URLSearchParams();

        // Add search filter
        if (newFilters.search && newFilters.search.trim() !== '') {
            params.set('search', newFilters.search);
        }

        // Add coordinates filter
        if (newFilters.coordinates && newFilters.coordinates !== 'all') {
            params.set('coordinates', newFilters.coordinates);
        }

        // Add sorting
        if (newFilters.sort_by && newFilters.sort_by !== 'name') {
            params.set('sort_by', newFilters.sort_by);
        }

        if (newFilters.sort_order && newFilters.sort_order !== 'asc') {
            params.set('sort_order', newFilters.sort_order);
        }

        // Navigate with new filters
        router.get(window.location.pathname, Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Debounced search function
    const debouncedSearch = useCallback(
        (value: string) => {
            setTimeout(() => {
                updateFilters({
                    search: value,
                    coordinates: coordinatesFilter,
                    sort_by: sortBy,
                    sort_order: sortOrder,
                });
            }, 500);
        },
        [coordinatesFilter, sortBy, sortOrder]
    );

    // Handle search input change
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        debouncedSearch(value);
    };

    // Handle coordinates filter change
    const handleCoordinatesChange = (value: string) => {
        setCoordinatesFilter(value);
        updateFilters({
            search: searchQuery,
            coordinates: value,
            sort_by: sortBy,
            sort_order: sortOrder,
        });
    };

    // Handle sorting change
    const handleSortChange = (value: string) => {
        const [field, order] = value.split('-');
        setSortBy(field);
        setSortOrder(order as 'asc' | 'desc');
        updateFilters({
            search: searchQuery,
            coordinates: coordinatesFilter,
            sort_by: field,
            sort_order: order,
        });
    };

    // Use projects.data directly since filtering is done server-side
    const filteredProjects = projects.data;



    const columns: DataTableColumn<Project>[] = [
        {
            key: 'name',
            header: 'Nama Projek',
            cell: (p) => (
                <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <span className="font-medium text-sm text-foreground">{p.name}</span>
                            {p.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-xs">
                                    {p.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'checkpoints',
            header: 'Checkpoint',
            align: 'center',
            cell: (p) => (
                <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-sm">{p.checkpoints_count || 0}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">checkpoint</span>
                </div>
            ),
        },
        {
            key: 'required_agents',
            header: 'Agent Required',
            align: 'center',
            cell: (p) => (
                <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-sm">{p.required_agents || 0}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">required</span>
                </div>
            ),
        },
        {
            key: 'current_agents',
            header: 'Agent Saat Ini',
            align: 'center',
            cell: (p) => {
                const current = p.current_agents_count || 0;
                const required = p.required_agents || 0;
                const isComplete = current >= required;
                const isOver = current > required;

                return (
                    <div className="flex flex-col items-center">
                        <div className="flex items-center space-x-1">
                            <UserCheck className={`h-3 w-3 ${
                                isOver ? 'text-blue-500' :
                                isComplete ? 'text-green-500' :
                                'text-red-500'
                            }`} />
                            <span className={`font-medium text-sm ${
                                isOver ? 'text-blue-600' :
                                isComplete ? 'text-green-600' :
                                'text-red-600'
                            }`}>
                                {current}
                            </span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <span className="text-xs text-muted-foreground">assigned</span>
                            <Badge variant={isOver ? 'default' : isComplete ? 'default' : 'destructive'}
                                   className={`text-xs px-1 py-0 ${
                                       isOver ? 'bg-blue-100 text-blue-700' :
                                       isComplete ? 'bg-green-100 text-green-700' :
                                       'bg-red-100 text-red-700'
                                   }`}>
                                {isOver ? 'Lebih' : isComplete ? 'Cukup' : 'Kurang'}
                            </Badge>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'coords',
            header: 'Koordinat',
            cell: (p) => (
                <div className="font-mono text-xs text-muted-foreground">
                    {p.latitude && p.longitude ?
                        `${Number(p.latitude).toFixed(6)}, ${Number(p.longitude).toFixed(6)}` :
                        <span className="text-muted-foreground/60">Belum diset</span>
                    }
                </div>
            ),
        },
        {
            key: 'actions',
            header: '',
            align: 'right',
            cell: (p) => (
                <div className="flex space-x-1">
                    <Link href={`/security-ops/projects/${p.id}/patroli-checkpoints`}>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            title="Kelola Checkpoint"
                        >
                            <Settings className="h-3 w-3 mr-1" />
                            Checkpoint
                        </Button>
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Security Ops', href: '/security-ops' },
                { title: 'Patroli', href: '/security-ops/patroli' },
                { title: 'Konfigurasi Projek', href: '/security-ops/projects' }
            ]}
        >
            <Head title="Projek Patroli - Security Operations" />

            <div className="flex h-full flex-1 flex-col space-y-6 p-6">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Projek Patroli</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Kelola konfigurasi projek untuk sistem patroli keamanan
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-sm">
                                {projects.data.length} projek ditemukan
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span className="text-lg font-semibold text-foreground">Filter & Pencarian</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Menampilkan <Badge variant="secondary">{projects.data.length}</Badge> projek
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="lg:col-span-2">
                                <Label className="text-sm font-medium text-foreground">Pencarian Projek</Label>
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Cari berdasarkan nama projek atau deskripsi..."
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-foreground">Koordinat</Label>
                                <Select value={coordinatesFilter} onValueChange={handleCoordinatesChange}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Filter Koordinat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua</SelectItem>
                                        <SelectItem value="with-coords">📍 Ada Koordinat</SelectItem>
                                        <SelectItem value="without-coords">❌ Belum Ada Koordinat</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-foreground">Urutkan</Label>
                                <Select
                                    value={`${sortBy}-${sortOrder}`}
                                    onValueChange={handleSortChange}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Urutkan berdasarkan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name-asc">📝 Nama A-Z</SelectItem>
                                        <SelectItem value="name-desc">📝 Nama Z-A</SelectItem>
                                        <SelectItem value="checkpoints-desc">📍 Checkpoint Terbanyak</SelectItem>
                                        <SelectItem value="checkpoints-asc">📍 Checkpoint Tersedikit</SelectItem>
                                        <SelectItem value="required_agents-desc">👥 Agent Required Terbanyak</SelectItem>
                                        <SelectItem value="required_agents-asc">👥 Agent Required Tersedikit</SelectItem>
                                        <SelectItem value="current_agents-desc">✅ Agent Assigned Terbanyak</SelectItem>
                                        <SelectItem value="current_agents-asc">✅ Agent Assigned Tersedikit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center space-x-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {(searchQuery || coordinatesFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc') ? (
                                        <>Filter aktif: Menampilkan {projects.data.length} hasil</>
                                    ) : (
                                        <>Menampilkan {projects.data.length} projek</>
                                    )}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery('');
                                    setCoordinatesFilter('all');
                                    setSortBy('name');
                                    setSortOrder('asc');
                                    router.get(window.location.pathname, {}, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                                disabled={searchQuery === '' && coordinatesFilter === 'all' && sortBy === 'name' && sortOrder === 'asc'}
                            >
                                Reset Semua Filter
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Projects Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                                    <MapPin className="h-4 w-4 text-accent-foreground" />
                                </div>
                                <span className="text-lg font-semibold text-foreground">Daftar Projek</span>
                            </div>
                            {projects.links && projects.links.length > 3 && (
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {projects.data.length} dari {projects.links.find(link => link.active)?.label || '1'} halaman
                                </div>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={filteredProjects}
                            columns={columns}
                            emptyIcon={Building2}
                            emptyTitle="Tidak ada projek yang ditemukan"
                            emptyDescription={
                                searchQuery
                                    ? "Tidak ada projek yang cocok dengan pencarian Anda. Coba ubah kata kunci pencarian."
                                    : "Projek untuk konfigurasi patroli belum tersedia. Hubungi administrator untuk menambah projek."
                            }
                        />
                        {projects.links && projects.links.length > 3 && (
                            <PaginationLinks links={projects.links} className="mt-6" />
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
