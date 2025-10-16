import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import React from 'react';

interface LockLayoutProps {
    title: string;
    status: string;
    description?: string;

    children?: React.ReactNode;
}

export default function LockLayout({ children, title, status, description }: LockLayoutProps) {
    return (
        <div className="relative">
            <div aria-hidden className="pointer-events-none opacity-70 blur-[2px] select-none">
                {children}
            </div>
            {/* ---- OVERLAY NOTICE (NOT BLURRED) ---- */}
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg border-dashed bg-background/80 backdrop-blur-md">
                    <CardHeader className="text-center">
                        <Badge variant="secondary" className="mx-auto">
                            {status}
                        </Badge>
                        <CardTitle className="mt-2 text-2xl">{title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center gap-2">
                        <Button asChild variant="outline">
                            <Link href={route('dashboard')}>Kembali ke Dashboard</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
