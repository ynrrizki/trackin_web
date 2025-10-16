import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface AttendanceStatsProps {
    employee: {
        attendanceData: {
            present_days: number;
            attendance_rate: number;
            late_arrivals: number;
        };
        totalOvertimePay: number;
        overtimeData?: Array<{
            date: string;
            start_time: string;
            end_time: string;
            hours: number;
            overtime_pay: number;
            status: string;
            description?: string;
        }>;
    };
    formatDate: (date: string) => string;
    formatCurrency: (amount: number) => string;
}

export function AttendanceStats({ employee, formatDate, formatCurrency }: AttendanceStatsProps) {
    return (
        <div className="order-2 space-y-6 lg:order-1 lg:col-span-1">
            {/* Attendance Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5" />
                        Attendance This Month
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="w-fit">
                        View All
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-card-gradient grid grid-cols-2 gap-4">
                        <Card className="@container/card p-3 text-center shadow-xs">
                            <CardContent className="p-0">
                                <p className="text-2xl font-bold text-green-600">{employee.attendanceData.present_days}</p>
                                <p className="text-sm text-muted-foreground">Present Days</p>
                            </CardContent>
                        </Card>
                        <Card className="@container/card p-3 text-center shadow-xs">
                            <CardContent className="p-0">
                                <p className="text-2xl font-bold text-blue-600">{employee.attendanceData.attendance_rate}%</p>
                                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="bg-card-gradient grid grid-cols-2 gap-4">
                        <Card className="@container/card p-3 text-center shadow-xs">
                            <CardContent className="p-0">
                                <p className="text-2xl font-bold text-yellow-600">{employee.attendanceData.late_arrivals}</p>
                                <p className="text-sm text-muted-foreground">Late Arrivals</p>
                            </CardContent>
                        </Card>
                        <Card className="@container/card p-3 text-center shadow-xs">
                            <CardContent className="p-0">
                                <p className="text-xl font-bold text-purple-600 sm:text-2xl">
                                    {formatCurrency(employee.totalOvertimePay)}
                                </p>
                                <p className="text-sm text-muted-foreground">Overtime Pay</p>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Overtime */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <DollarSign className="h-5 w-5" />
                        Recent Overtime
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="w-fit">
                        View All
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {employee.overtimeData && employee.overtimeData.length > 0 ? (
                        employee.overtimeData.map((overtime, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className="space-y-2 rounded-lg border p-3"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{formatDate(overtime.date)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {overtime.start_time} - {overtime.end_time} ({overtime.hours.toFixed(1)}h)
                                        </p>
                                    </div>
                                    <Badge variant={overtime.status === 'approved' ? 'default' : 'secondary'}>{overtime.status}</Badge>
                                </div>
                                <p className="text-sm font-medium text-green-600">{formatCurrency(overtime.overtime_pay)}</p>
                                {overtime.description && <p className="text-xs text-muted-foreground">{overtime.description}</p>}
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            <DollarSign className="mx-auto mb-2 h-12 w-12 opacity-50" />
                            <p className="text-sm">No overtime records</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
