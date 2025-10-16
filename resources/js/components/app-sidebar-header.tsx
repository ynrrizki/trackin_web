import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link } from '@inertiajs/react';
import { Inbox, Settings } from 'lucide-react';
import {
    // useEffect,
    useState,
} from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const [inboxCount] = useState(0);

    // Simulate fetching unread messages count
    // In a real application, you would fetch this from an API
    // useEffect(() => {
    //     const response = axios.get(route('notifications.unreadCount'), {
    //         headers: {
    //             'Authorization': `Bearer ${this.$page.props.user.token}`,
    //         }
    //     });
    // }, []);

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                    {inboxCount > 0 && (
                        <Badge variant={'destructive'} className="absolute -top-1 -right-3 min-w-5 px-1">
                            {inboxCount}
                            <span className="sr-only">Unread messages</span>
                        </Badge>
                    )}
                    <Link href="/inbox">
                        <Button variant="outline" size="icon" className="cursor-pointer">
                            <Inbox className="size-4" />
                            <span className="sr-only">Inbox</span>
                        </Button>
                    </Link>
                </div>
                <Link href="/settings">
                    <Button variant="outline" size="icon" className="cursor-pointer">
                        <Settings className="size-4" />
                        <span className="sr-only">Settings</span>
                    </Button>
                </Link>
            </div>
        </header>
    );
}
