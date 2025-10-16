import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

type LinkProps = {
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    className?: string;
};

export function PaginationLinks({ links, className }: LinkProps) {
    return (
        <Pagination className={cn('flex items-center justify-end', className)}>
            <PaginationContent>
                {links.map((link, index) => {
                    if (link.label.includes('Previous')) {
                        return (
                            <PaginationItem key={index}>
                                {link.url ? (
                                    <Link href={link.url} preserveState preserveScroll>
                                        <PaginationPrevious />
                                    </Link>
                                ) : (
                                    <PaginationPrevious className="pointer-events-none opacity-50" />
                                )}
                            </PaginationItem>
                        );
                    }

                    if (link.label.includes('Next')) {
                        return (
                            <PaginationItem key={index}>
                                {link.url ? (
                                    <Link href={link.url} preserveState preserveScroll>
                                        <PaginationNext />
                                    </Link>
                                ) : (
                                    <PaginationNext className="pointer-events-none opacity-50" />
                                )}
                            </PaginationItem>
                        );
                    }

                    // Page numbers
                    return (
                        <PaginationItem key={index}>
                            {link.url ? (
                                <Link href={link.url} preserveState preserveScroll>
                                    <PaginationLink isActive={link.active}>
                                        {link.label}
                                    </PaginationLink>
                                </Link>
                            ) : (
                                <PaginationLink isActive={link.active}>
                                    {link.label}
                                </PaginationLink>
                            )}
                        </PaginationItem>
                    );
                })}
            </PaginationContent>
        </Pagination>
    );
}
