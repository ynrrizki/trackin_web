import { NavFooter } from '@/components/nav-footer';
import { NavClient, NavHR, NavMain, NavSecurityOps } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    BadgeDollarSign,
    BookOpen,
    Building,
    Calendar,
    CarFront,
    Folder,
    LayoutGrid,
    Map,
    // Newspaper,
    Paperclip,
    Pin,
    Timer,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';
import { Separator } from './ui/separator';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
        icon: LayoutGrid,
    },
    {
        title: 'Tracking Karyawan',
        href: route('employee-tracking.index'),
        icon: Map,
    },
    // {
    //     title: 'Blog',
    //     href: '/blog',
    //     icon: Newspaper,
    // },
];

const hrNavItems: NavItem[] = [
    {
        title: 'Karyawan',
        href: route('hrms.employees.index'),
        icon: Users,
    },
    {
        title: 'Absensi',
        href: route('hrms.attendance.index'),
        icon: Calendar,
    },
    {
        title: 'Lemburan',
        href: route('hrms.overtime.index'),
        icon: Timer,
    },
    {
        title: 'Cuti',
        href: route('hrms.leave.index'),
        icon: Paperclip,
    },
    {
        title: 'Penggajian',
        href: route('hrms.payroll.index'),
        icon: BadgeDollarSign,
    },
];

const clientNavItems: NavItem[] = [
    {
        title: 'Klien',
        href: route('crm.clients.index'),
        icon: Building,
    },
    {
        title: 'Proyek',
        href: route('crm.client-projects.index'),
        icon: Folder,
    },
    {
        title: 'Penugasan Karyawan',
        href: route('crm.employee-projects.index'),
        icon: Users,
    },
];

const securityOpsNavItems: NavItem[] = [
    {
        title: 'Monitoring Patroli',
        href: '/security-ops/patroli',
        icon: CarFront,
    },
    {
        title: 'Konfigurasi Checkpoint',
        href: '/security-ops/projects',
        icon: Folder,
    },
    {
        title: 'Laporan Kejadian',
        href: '/security-ops/incident',
        icon: Pin,
    },
];

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: Folder,
    // },
    {
        title: 'Dokumentasi',
        href: '#',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                <Separator className="my-2" />
                <NavHR items={hrNavItems} />
                <Separator className="my-2" />
                <NavClient items={clientNavItems} />
                <Separator className="my-2" />
                <NavSecurityOps items={securityOpsNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
