<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Insiden - Admin WMI</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <div class="min-h-screen">
        <!-- Navbar -->
        <nav class="bg-white shadow-lg border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <h1 class="text-xl font-bold text-gray-900">
                                <i class="fas fa-shield-alt mr-2 text-blue-600"></i>
                                Dashboard Insiden
                            </h1>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="text-sm text-gray-600">
                            Admin WMI Security
                        </div>
                        <div class="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-white text-sm"></i>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" x-data="incidentDashboard()">
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-exclamation-triangle text-2xl text-yellow-500"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Total Insiden</dt>
                                    <dd class="text-lg font-medium text-gray-900" x-text="stats.total">-</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-clock text-2xl text-orange-500"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Dalam Investigasi</dt>
                                    <dd class="text-lg font-medium text-gray-900" x-text="stats.investigating">-</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-check-circle text-2xl text-green-500"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Terselesaikan</dt>
                                    <dd class="text-lg font-medium text-gray-900" x-text="stats.resolved">-</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-fire text-2xl text-red-500"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Prioritas Tinggi</dt>
                                    <dd class="text-lg font-medium text-gray-900" x-text="stats.high_priority">-</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filters and Actions -->
            <div class="bg-white shadow rounded-lg mb-6">
                <div class="px-6 py-4 border-b border-gray-200">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h3 class="text-lg leading-6 font-medium text-gray-900">Daftar Insiden</h3>
                        <div class="mt-3 sm:mt-0 sm:ml-4 flex space-x-3">
                            <select x-model="filters.status" @change="loadIncidents()" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                                <option value="">Semua Status</option>
                                <option value="reported">Dilaporkan</option>
                                <option value="investigating">Dalam Investigasi</option>
                                <option value="resolved">Terselesaikan</option>
                                <option value="closed">Ditutup</option>
                            </select>
                            <select x-model="filters.priority" @change="loadIncidents()" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                                <option value="">Semua Prioritas</option>
                                <option value="low">Rendah</option>
                                <option value="medium">Sedang</option>
                                <option value="high">Tinggi</option>
                                <option value="critical">Kritis</option>
                            </select>
                            <button @click="exportIncidents()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm">
                                <i class="fas fa-download mr-2"></i>Export
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Incidents Table -->
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insiden</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioritas</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Petugas</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <template x-for="incident in incidents" :key="incident.id">
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <div class="flex-shrink-0 h-10 w-10">
                                                <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center" :class="getPriorityColor(incident.priority)">
                                                    <i class="fas fa-exclamation-triangle text-white"></i>
                                                </div>
                                            </div>
                                            <div class="ml-4">
                                                <div class="text-sm font-medium text-gray-900" x-text="incident.title || 'Insiden #' + incident.id"></div>
                                                <div class="text-sm text-gray-500" x-text="incident.location"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                                              :class="getStatusColor(incident.status)"
                                              x-text="getStatusLabel(incident.status)"></span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                                              :class="getPriorityColorText(incident.priority)"
                                              x-text="getPriorityLabel(incident.priority)"></span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div x-text="formatDate(incident.incident_datetime)"></div>
                                        <div class="text-xs text-gray-500" x-text="formatTime(incident.incident_datetime)"></div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span x-text="incident.assigned_to?.name || 'Belum ditugaskan'"></span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button @click="viewIncident(incident)" class="text-blue-600 hover:text-blue-900">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button @click="editIncident(incident)" class="text-green-600 hover:text-green-900">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button @click="assignIncident(incident)" class="text-purple-600 hover:text-purple-900">
                                            <i class="fas fa-user-plus"></i>
                                        </button>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                    <div class="flex-1 flex justify-between sm:hidden">
                        <button @click="previousPage()" :disabled="currentPage === 1" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Previous
                        </button>
                        <button @click="nextPage()" :disabled="currentPage === totalPages" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Next
                        </button>
                    </div>
                    <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p class="text-sm text-gray-700">
                                Menampilkan <span class="font-medium" x-text="((currentPage - 1) * perPage) + 1"></span> sampai
                                <span class="font-medium" x-text="Math.min(currentPage * perPage, totalRecords)"></span> dari
                                <span class="font-medium" x-text="totalRecords"></span> insiden
                            </p>
                        </div>
                        <div>
                            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button @click="previousPage()" :disabled="currentPage === 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <template x-for="page in visiblePages" :key="page">
                                    <button @click="goToPage(page)"
                                            :class="page === currentPage ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'"
                                            class="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                                            x-text="page"></button>
                                </template>
                                <button @click="nextPage()" :disabled="currentPage === totalPages" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Incident Detail Modal -->
            <div x-show="showModal" x-cloak class="fixed inset-0 z-50 overflow-y-auto" x-transition>
                <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div x-show="showModal" x-transition:enter="ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" x-transition:leave="ease-in duration-200" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

                    <div x-show="showModal" x-transition:enter="ease-out duration-300" x-transition:enter-start="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" x-transition:enter-end="opacity-100 translate-y-0 sm:scale-100" x-transition:leave="ease-in duration-200" x-transition:leave-start="opacity-100 translate-y-0 sm:scale-100" x-transition:leave-end="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div class="sm:flex sm:items-start">
                                <div class="w-full">
                                    <div class="flex justify-between items-center mb-4">
                                        <h3 class="text-lg leading-6 font-medium text-gray-900" x-text="'Detail Insiden #' + (selectedIncident?.id || '')"></h3>
                                        <button @click="closeModal()" class="text-gray-400 hover:text-gray-600">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6" x-show="selectedIncident">
                                        <!-- Left Column -->
                                        <div class="space-y-4">
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700">Lokasi</label>
                                                <p class="mt-1 text-sm text-gray-900" x-text="selectedIncident?.location"></p>
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700">Waktu Kejadian</label>
                                                <p class="mt-1 text-sm text-gray-900" x-text="formatDateTime(selectedIncident?.incident_datetime)"></p>
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700">Status</label>
                                                <div class="mt-1">
                                                    <select x-model="selectedIncident.status" @change="updateIncidentStatus(selectedIncident.id, selectedIncident.status)" class="border border-gray-300 rounded-md px-3 py-2 text-sm w-full">
                                                        <option value="reported">Dilaporkan</option>
                                                        <option value="investigating">Dalam Investigasi</option>
                                                        <option value="resolved">Terselesaikan</option>
                                                        <option value="closed">Ditutup</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700">Prioritas</label>
                                                <div class="mt-1">
                                                    <select x-model="selectedIncident.priority" @change="updateIncidentPriority(selectedIncident.id, selectedIncident.priority)" class="border border-gray-300 rounded-md px-3 py-2 text-sm w-full">
                                                        <option value="low">Rendah</option>
                                                        <option value="medium">Sedang</option>
                                                        <option value="high">Tinggi</option>
                                                        <option value="critical">Kritis</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Right Column -->
                                        <div class="space-y-4">
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700">Deskripsi</label>
                                                <p class="mt-1 text-sm text-gray-900" x-text="selectedIncident?.description"></p>
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700">Tindakan</label>
                                                <p class="mt-1 text-sm text-gray-900" x-text="selectedIncident?.action_taken"></p>
                                            </div>
                                            <div x-show="selectedIncident?.photos && selectedIncident.photos.length > 0">
                                                <label class="block text-sm font-medium text-gray-700">Foto</label>
                                                <div class="mt-2 grid grid-cols-2 gap-2">
                                                    <template x-for="photo in selectedIncident?.photos" :key="photo.id">
                                                        <img :src="photo.path" :alt="'Foto ' + photo.id" class="w-full h-32 object-cover rounded-lg cursor-pointer" @click="viewPhoto(photo.path)">
                                                    </template>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Follow-up Actions -->
                                    <div class="mt-6 border-t pt-6">
                                        <h4 class="text-lg font-medium text-gray-900 mb-4">Tindak Lanjut</h4>
                                        <div class="space-y-3">
                                            <template x-for="action in selectedIncident?.follow_up_actions || []" :key="action.id">
                                                <div class="bg-gray-50 p-3 rounded-lg">
                                                    <div class="flex justify-between items-start">
                                                        <div>
                                                            <p class="text-sm text-gray-900" x-text="action.description"></p>
                                                            <p class="text-xs text-gray-500" x-text="'Oleh: ' + action.created_by + ' • ' + formatDate(action.created_at)"></p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>
                                        </div>
                                        <div class="mt-4">
                                            <textarea x-model="newFollowUpAction" placeholder="Tambah tindak lanjut..." class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows="3"></textarea>
                                            <button @click="addFollowUpAction(selectedIncident.id)" class="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm">
                                                Tambah Tindak Lanjut
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function incidentDashboard() {
            return {
                incidents: [],
                selectedIncident: null,
                showModal: false,
                stats: {
                    total: 0,
                    investigating: 0,
                    resolved: 0,
                    high_priority: 0
                },
                filters: {
                    status: '',
                    priority: ''
                },
                currentPage: 1,
                perPage: 10,
                totalPages: 1,
                totalRecords: 0,
                newFollowUpAction: '',

                init() {
                    this.loadIncidents();
                    this.loadStats();
                },

                async loadIncidents() {
                    try {
                        const params = new URLSearchParams({
                            page: this.currentPage,
                            per_page: this.perPage,
                            ...this.filters
                        });

                        const response = await fetch(`/api/v1/incidents?${params}`);
                        const data = await response.json();

                        this.incidents = data.data;
                        this.currentPage = data.current_page;
                        this.totalPages = data.last_page;
                        this.totalRecords = data.total;
                    } catch (error) {
                        console.error('Error loading incidents:', error);
                    }
                },

                async loadStats() {
                    try {
                        const response = await fetch('/api/v1/incidents/statistics');
                        const data = await response.json();
                        this.stats = data;
                    } catch (error) {
                        console.error('Error loading stats:', error);
                    }
                },

                viewIncident(incident) {
                    this.selectedIncident = incident;
                    this.showModal = true;
                },

                closeModal() {
                    this.showModal = false;
                    this.selectedIncident = null;
                    this.newFollowUpAction = '';
                },

                async updateIncidentStatus(incidentId, status) {
                    try {
                        await fetch(`/api/v1/incidents/${incidentId}/status`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                            },
                            body: JSON.stringify({ status })
                        });
                        this.loadIncidents();
                        this.loadStats();
                    } catch (error) {
                        console.error('Error updating status:', error);
                    }
                },

                async updateIncidentPriority(incidentId, priority) {
                    try {
                        await fetch(`/api/v1/incidents/${incidentId}/priority`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                            },
                            body: JSON.stringify({ priority })
                        });
                        this.loadIncidents();
                        this.loadStats();
                    } catch (error) {
                        console.error('Error updating priority:', error);
                    }
                },

                async addFollowUpAction(incidentId) {
                    if (!this.newFollowUpAction.trim()) return;

                    try {
                        await fetch(`/api/v1/incidents/${incidentId}/follow-up`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                            },
                            body: JSON.stringify({
                                description: this.newFollowUpAction,
                                created_by: 'Admin' // This should be the actual user name
                            })
                        });

                        // Refresh the incident data
                        const response = await fetch(`/api/v1/incidents/${incidentId}`);
                        const data = await response.json();
                        this.selectedIncident = data;
                        this.newFollowUpAction = '';
                    } catch (error) {
                        console.error('Error adding follow-up action:', error);
                    }
                },

                getStatusColor(status) {
                    const colors = {
                        'reported': 'bg-yellow-100 text-yellow-800',
                        'investigating': 'bg-blue-100 text-blue-800',
                        'resolved': 'bg-green-100 text-green-800',
                        'closed': 'bg-gray-100 text-gray-800'
                    };
                    return colors[status] || 'bg-gray-100 text-gray-800';
                },

                getStatusLabel(status) {
                    const labels = {
                        'reported': 'Dilaporkan',
                        'investigating': 'Investigasi',
                        'resolved': 'Terselesaikan',
                        'closed': 'Ditutup'
                    };
                    return labels[status] || status;
                },

                getPriorityColor(priority) {
                    const colors = {
                        'low': 'bg-green-500',
                        'medium': 'bg-yellow-500',
                        'high': 'bg-red-500',
                        'critical': 'bg-purple-500'
                    };
                    return colors[priority] || 'bg-gray-500';
                },

                getPriorityColorText(priority) {
                    const colors = {
                        'low': 'bg-green-100 text-green-800',
                        'medium': 'bg-yellow-100 text-yellow-800',
                        'high': 'bg-red-100 text-red-800',
                        'critical': 'bg-purple-100 text-purple-800'
                    };
                    return colors[priority] || 'bg-gray-100 text-gray-800';
                },

                getPriorityLabel(priority) {
                    const labels = {
                        'low': 'Rendah',
                        'medium': 'Sedang',
                        'high': 'Tinggi',
                        'critical': 'Kritis'
                    };
                    return labels[priority] || priority;
                },

                formatDate(dateString) {
                    return new Date(dateString).toLocaleDateString('id-ID');
                },

                formatTime(dateString) {
                    return new Date(dateString).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                },

                formatDateTime(dateString) {
                    return new Date(dateString).toLocaleString('id-ID');
                },

                get visiblePages() {
                    const pages = [];
                    const start = Math.max(1, this.currentPage - 2);
                    const end = Math.min(this.totalPages, this.currentPage + 2);

                    for (let i = start; i <= end; i++) {
                        pages.push(i);
                    }
                    return pages;
                },

                goToPage(page) {
                    this.currentPage = page;
                    this.loadIncidents();
                },

                nextPage() {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                        this.loadIncidents();
                    }
                },

                previousPage() {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.loadIncidents();
                    }
                },

                async exportIncidents() {
                    try {
                        const params = new URLSearchParams(this.filters);
                        window.open(`/api/v1/incidents/export?${params}`, '_blank');
                    } catch (error) {
                        console.error('Error exporting incidents:', error);
                    }
                }
            }
        }
    </script>

    <style>
        [x-cloak] { display: none !important; }
    </style>
</body>
</html>
