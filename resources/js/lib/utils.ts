import { type ClassValue, clsx } from 'clsx';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export const formatDuration = (timeIn: string, timeOut?: string) => {
    if (!timeOut) return '-';

    const start = new Date(`2000-01-01T${timeIn}`);
    const end = new Date(`2000-01-01T${timeOut}`);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
};

export const getInitials = (name: string) => {
    const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts
        .map((p) => p[0])
        .join('')
        .toUpperCase();
};

export const formatCurrency = (amount: number | string) => {
    const number = typeof amount === 'string' ? parseFloat(amount) : amount;
    return Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
};

export const getStatusBadge = (status: string = 'active') => {
    const variants = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-red-100 text-red-800',
        on_leave: 'bg-yellow-100 text-yellow-800',
        resigned: 'bg-gray-100 text-gray-800',
        terminated: 'bg-red-100 text-red-800',
    };
    return variants[status.toLowerCase() as keyof typeof variants] || 'bg-gray-100 text-gray-800';
};

export const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard?.writeText(text);
        toast.success('Copied to clipboard');
    } catch {
        toast.error('Failed to copy to clipboard');
    }
};
