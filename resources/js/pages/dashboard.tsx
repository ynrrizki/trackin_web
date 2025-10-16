import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { TrendingUp, UserMinus, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];
interface TurnoverMonthlyRow {
    month: string; // YYYY-MM
    label: string; // e.g. Jan 2025
    hires: number;
    resignations: number;
    avg_headcount: number;
    turnover_rate: number; // %
}

interface TurnoverPayload {
    filter: {
        type: 'all' | 'internal' | 'outsourcing';
        months: number;
        range: { start: string; end: string };
    };
    monthly: TurnoverMonthlyRow[];
    totals: {
        hires: number;
        resignations: number;
        avg_headcount: number;
        turnover_rate: number;
        current_active: number;
        latest_month?: string | null;
    };
}

export default function Dashboard() {
    const { props } = usePage<{ turnover?: TurnoverPayload }>();
    const turnover = props.turnover as TurnoverPayload | undefined;
    const isMobile = useIsMobile();

    const [type, setType] = useState(turnover?.filter.type || 'all');
    const [months, setMonths] = useState<number>(turnover?.filter.months || 12);

    const handleApply = () => {
        router.get('/dashboard', { type, months }, { preserveState: true, replace: true });
    };

    const maxRate = useMemo(() => {
        if (!turnover) return 0;
        return Math.max(...turnover.monthly.map((m) => m.turnover_rate), 0);
    }, [turnover]);

    // const chartData = useMemo<({ shortLabel: string } & TurnoverMonthlyRow)[]>(() => {
    //     if (!turnover) return [];
    //     return turnover.monthly.map((m) => ({
    //         ...m,
    //         shortLabel: m.label.split(' ')[0],
    //     }));
    // }, [turnover]);

    // const chartConfig: ChartConfig = {
    //     hires: { label: 'Rekrut', color: '#16a34a' },
    //     resignations: { label: 'Resign', color: '#dc2626' },
    //     turnover_rate: { label: 'Turnover %', color: '#6366f1' },
    // };

    // di atas: tambahkan/ubah config biar sinkron dengan ChartContainer shadcn
    const chartConfig: ChartConfig = {
        hires: { label: 'Rekrut', color: 'var(--chart-1)' },
        resignations: { label: 'Resign', color: 'var(--chart-5)' },
        turnover_rate: { label: 'Turnover %', color: 'var(--chart-3)' },
    };

    // siapkan data untuk BarChart (pakai YYYY-MM → tanggal 1 tiap bulan)
    // ⬇️ Data untuk chart (tambahkan turnover_rate)
    const interactiveData = useMemo(() => {
        if (!turnover) return [];
        return turnover.monthly.map((m) => ({
            date: `${m.month}-01`,
            hires: m.hires,
            resignations: m.resignations,
            turnover_rate: m.turnover_rate, // <-- important
            label: m.label,
        }));
    }, [turnover]);

    // ⬇️ Total untuk header toggle (pakai totals dari payload untuk turnover_rate)
    const totalsDisplay = useMemo(() => {
        if (!turnover) return { hires: 0, resignations: 0, turnover_rate: 0 };
        return {
            hires: turnover.totals.hires,
            resignations: turnover.totals.resignations,
            turnover_rate: turnover.totals.turnover_rate, // sudah % dari backend
        };
    }, [turnover]);

    // hitung total masing-masing metrik untuk header toggle
    // const totals = useMemo(() => {
    //     const base = { hires: 0, resignations: 0, turnover_rate: 0 };
    //     return interactiveData.reduce(
    //         (acc, cur) => ({
    //             hires: acc.hires + (cur.hires ?? 0),
    //             resignations: acc.resignations + (cur.resignations ?? 0),
    //             turnover_rate: acc.hires > 0 ? Math.round(((acc.resignations + (cur.resignations ?? 0)) / (acc.hires + (cur.hires ?? 0))) * 100) : 0,
    //         }),
    //         base,
    //     );
    // }, [interactiveData]);

    // state untuk pilih bar yang aktif
    const [activeChart, setActiveChart] = useState<keyof typeof chartConfig>('hires');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Jenis Karyawan</label>
                            <Select value={type} onValueChange={(v) => setType(v as 'all' | 'internal' | 'outsourcing')}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="internal">Internal</SelectItem>
                                    <SelectItem value="outsourcing">Outsourcing</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Periode (bulan)</label>
                            <Select value={months.toString()} onValueChange={(v) => setMonths(parseInt(v))}>
                                <SelectTrigger className="w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[3, 6, 9, 12, 18, 24].map((m) => (
                                        <SelectItem key={m} value={m.toString()}>
                                            {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleApply}>Terapkan</Button>
                        {turnover && (
                            <div className="text-xs text-muted-foreground">
                                Range: {turnover.filter.range.start} s/d {turnover.filter.range.end}
                            </div>
                        )}
                    </div>

                    {turnover ? (
                        <div className="grid gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs md:grid-cols-2 xl:grid-cols-5 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
                            <Card className="@container/card">
                                <CardHeader className="pb-2">
                                    <CardDescription>Total Aktif</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
                                        <Users className="h-5 w-5" />
                                        {turnover.totals.current_active}
                                    </CardTitle>
                                    <div className="mt-1 text-xs text-muted-foreground">Karyawan aktif saat ini</div>
                                </CardContent>
                            </Card>
                            <Card className="@container/card">
                                <CardHeader className="pb-2">
                                    <CardDescription>Rekrut (Total)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
                                        <UserPlus className="h-5 w-5 text-chart-1" />
                                        {turnover.totals.hires}
                                    </CardTitle>
                                    <div className="mt-1 text-xs text-muted-foreground">Masuk dalam periode</div>
                                </CardContent>
                            </Card>
                            <Card className="@container/card">
                                <CardHeader className="pb-2">
                                    <CardDescription>Resign (Total)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
                                        <UserMinus className="h-5 w-5 text-chart-5" />
                                        {turnover.totals.resignations}
                                    </CardTitle>
                                    <div className="mt-1 text-xs text-muted-foreground">Keluar dalam periode</div>
                                </CardContent>
                            </Card>
                            <Card className="@container/card">
                                <CardHeader className="pb-2">
                                    <CardDescription>Rata HC</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="text-2xl tabular-nums">{turnover.totals.avg_headcount}</CardTitle>
                                    <div className="mt-1 text-xs text-muted-foreground">Rata-rata headcount</div>
                                </CardContent>
                            </Card>
                            <Card className="@container/card">
                                <CardHeader className="pb-2">
                                    <CardDescription>Turnover %</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
                                        <TrendingUp className="h-5 w-5 text-chart-3" />
                                        {turnover.totals.turnover_rate}%
                                    </CardTitle>
                                    <div className="mt-1 text-xs text-muted-foreground">Total periode</div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-24 animate-pulse rounded-xl border bg-muted/30" />
                            ))}
                        </div>
                    )}
                </div>

                <div className={'grid gap-6 ' + (isMobile ? 'grid-cols-1' : 'xl:grid-cols-3')}>
                    <Card className={isMobile ? '' : 'xl:col-span-2'}>
                        <CardHeader>
                            <CardTitle>Tren Turnover</CardTitle>
                            <CardDescription>Rekrut, resign & persentase turnover</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!turnover && <div className="h-48 w-full animate-pulse rounded-md bg-muted/30" />}
                            {/* {turnover && (
                                <ChartContainer config={chartConfig} className="h-72 w-full">
                                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: isMobile ? 30 : 0 }}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            strokeOpacity={0.3}
                                        />
                                        <XAxis
                                            dataKey="shortLabel"
                                            angle={isMobile ? -40 : 0}
                                            textAnchor={isMobile ? 'end' : 'middle'}
                                            height={isMobile ? 50 : 30}
                                            tick={{ fontSize: isMobile ? 10 : 12 }}
                                        />
                                        <YAxis yAxisId="left" tick={{ fontSize: 10 }} width={40} />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            tickFormatter={(v) => v + '%'}
                                            domain={[0, maxRate || 'auto']}
                                            tick={{ fontSize: 10 }}
                                            width={46}
                                        />
                                        <Tooltip
                                            content={
                                                <ChartTooltipContent
                                                    formatter={(value, name) => {
                                                        if (name === 'turnover_rate') return <span>{value}%</span>;
                                                        return <span>{value}</span>;
                                                    }}
                                                />
                                            }
                                        />
                                        <Legend content={<ChartLegendContent />} />
                                            <CartesianGrid vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                                minTickGap={32}
                                                tickFormatter={(value) => {
                                                    const date = new Date(value);
                                                    return date.toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    });
                                                }}
                                            />
                                            <ChartTooltip
                                                content={
                                                    <ChartTooltipContent
                                                        className="w-[150px]"
                                                        nameKey="views"
                                                        labelFormatter={(value) => {
                                                            return new Date(value).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            });
                                                        }}
                                                    />
                                                }
                                            />
                                        <Bar
                                            yAxisId="left"
                                            dataKey="hires"
                                            fill="var(--color-hires)"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={isMobile ? 18 : 28}
                                        />
                                        <Bar
                                            yAxisId="left"
                                            dataKey="resignations"
                                            fill="var(--color-resignations)"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={isMobile ? 18 : 28}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="turnover_rate"
                                            stroke="var(--color-turnover_rate)"
                                            strokeWidth={2}
                                            dot={{ r: isMobile ? 2 : 3 }}
                                        />
                                    </ComposedChart>
                                </ChartContainer>
                            )} */}

                            {turnover && (
                                <div className="overflow-hidden rounded-lg border">
                                    {/* Header toggle ala contohmu */}
                                    <div className="flex">
                                        {(['hires', 'resignations', 'turnover_rate'] as const).map((key) => (
                                            <button
                                                key={key}
                                                data-active={activeChart === key}
                                                onClick={() => setActiveChart(key)}
                                                className="flex-1 border-r px-6 py-4 text-left last:border-r-0 data-[active=true]:bg-muted/50"
                                            >
                                                <span className="text-xs text-muted-foreground">{chartConfig[key].label}</span>
                                                <div className="text-2xl font-bold tabular-nums sm:text-3xl">
                                                    {totalsDisplay[key].toLocaleString()}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Chart */}
                                    <ChartContainer config={chartConfig} className="h-[260px] w-full">
                                        <BarChart accessibilityLayer data={interactiveData} margin={{ left: 12, right: 12 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                                minTickGap={32}
                                                tickFormatter={(value) => {
                                                    const d = new Date(value);
                                                    return d.toLocaleDateString('en-US', { month: 'short' });
                                                }}
                                            />
                                            <ChartTooltip
                                                content={
                                                    <ChartTooltipContent
                                                        className="w-[180px]"
                                                        nameKey={activeChart}
                                                        labelFormatter={(value, payload) =>
                                                            payload?.[0]?.payload?.label ??
                                                            new Date(value as string).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })
                                                        }
                                                    />
                                                }
                                            />
                                            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
                                        </BarChart>
                                    </ChartContainer>
                                </div>
                            )}

                            {turnover && (
                                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                    <Badge variant="outline">Max {maxRate}%</Badge>
                                    <Badge variant="outline">Periode {turnover.monthly.length} bulan</Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Detail Bulanan</CardTitle>
                            <CardDescription>Rekrut & resign per bulan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-72 space-y-3 overflow-y-auto pr-1 text-xs">
                                {turnover
                                    ? turnover.monthly
                                          .slice()
                                          .reverse()
                                          .map((m) => (
                                              <div
                                                  key={m.month}
                                                  className="flex items-center justify-between border-b pb-1 last:border-b-0 last:pb-0"
                                              >
                                                  <div className="font-medium">{m.label}</div>
                                                  <div className="flex items-center gap-3">
                                                      <span className="text-green-600">+{m.hires}</span>
                                                      <span className="text-red-600">-{m.resignations}</span>
                                                      <span className="text-muted-foreground">{m.turnover_rate}%</span>
                                                  </div>
                                              </div>
                                          ))
                                    : Array.from({ length: 8 }).map((_, i) => (
                                          <div key={i} className="h-5 w-full animate-pulse rounded bg-muted/30" />
                                      ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
