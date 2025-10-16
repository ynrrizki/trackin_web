import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Response<T> {
    data: T;
}

export interface Pagination<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    next_page_url: string | null;
}

// Table Types
export interface Position {
    id: number;
    name: string;
}

export interface Department {
    id: number;
    name: string;
}

export interface Employee {
    id: number;
    employee_code: string; // NIP or Employee Code
    user_id: number | null;
    full_name: string;
    email: string;
    phone: string | null;
    address: string | null;
    postal_code: string | null;
    identity_number: string | null; // KTP or other ID
    kk_number: string | null; // Kartu Keluarga
    place_of_birth: string | null;
    religion: string | null;
    marital_status: string | null;
    mothermaiden_name: string | null; // Nama Ibu Kandung
    spouse_name: string | null; // Nama Pasangan
    spouse_phone: string | null; // No. Telepon Pasangan
    last_education: string | null; // Pendidikan Terakhir
    birth_date: string | null;
    join_date: string | null;
    end_date: string | null;
    basic_salary: number | null;
    status: string;
    photo_url: string | null;

    // Relationships
    position: Position | null;
    department: Department | null;
    position_level?: {
        id: number;
        name: string;
    } | null;
    employment_status?: {
        id: number;
        name: string;
    } | null;
    employee_type?: {
        id: number;
        name: string;
    } | null;
    outsource_field?: {
        id: number;
        name: string;
    } | null;
    user?: {
        id: number;
        name: string;
        email: string;
        email_verified_at: string | null;
        roles?: Array<{
            id: number;
            name: string;
        }>;
    } | null;

    // Optional body profile
    body_profile?: {
        height: string | null;
        weight: string | null;
        blood_type: 'A' | 'B' | 'AB' | 'O' | 'UNKNOWN' | '' | null;
        shirt_size: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'CUSTOM' | 'UNKNOWN' | '' | null;
        shoe_size: string | null;
        health_notes: string | null;
    };

    // Optional emergency contact
    emergency_contact?: {
        name: string;
        relationship: string;
        phone: string;
    } | null;

    created_at: string;
    updated_at: string;
}
