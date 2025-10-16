import { cn } from '@/lib/utils';

export default function AppLogo({ className, imageClassName }: { className?: string; imageClassName?: string }) {
    return (
        <>
            {/* <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                <img src="/images/logo_no_text.png" alt="TrackIN Logo" className="size-5 fill-current" />
            </div> */}
            <div
                className={cn(
                    'flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-border text-sidebar-primary-foreground',
                    className,
                )}
            >
                {/* <img src="/images/logo_no_text.png" alt="TrackIN Logo" className={cn('size-5 fill-current', imageClassName)} /> */}
                <img src="/images/Logo_wise-removebg.png" alt="TrackIN Logo" className={cn('size-5 fill-current', imageClassName)} />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                {/* <span className="mb-0.5 truncate leading-tight font-semibold">TrackIN</span> */}
                <span className="mb-0.5 truncate leading-tight font-semibold">WMI</span>
            </div>
        </>
    );
}
