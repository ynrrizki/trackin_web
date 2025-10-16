import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RupiahInput } from '@/components/ui/rupiah-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { EmployeeFormStepProps } from '@/types/employee';
import { motion } from 'framer-motion';

export default function PayrollDataStep({ form, errors, setData }: EmployeeFormStepProps) {
    return (
        <>
            {/* Section 1: Informasi Gaji */}
            <div className="space-y-4">
                <div className="border-b pb-2">
                    <h3 className="text-lg font-medium">Informasi Gaji</h3>
                    <p className="text-sm text-muted-foreground">Data gaji pokok dan komponen gaji lainnya</p>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="basic_salary" className="after:ml-1 after:text-red-500 after:content-['*']">
                        Gaji Pokok
                    </Label>
                    <RupiahInput
                        id="basic_salary"
                        name="basic_salary"
                        value={form.basic_salary || 0}
                        onChange={(value) => setData('basic_salary', value)}
                        // required
                    />
                    <InputError message={errors.basic_salary} />
                </div>
            </div>

            {/* Section 2: Informasi Rekening Bank */}
            <div className="space-y-4">
                <div className="border-b pb-2">
                    <h3 className="text-lg font-medium">Informasi Rekening Bank</h3>
                    <p className="text-sm text-muted-foreground">Detail rekening untuk transfer gaji</p>
                </div>

                <motion.div
                    // Animate when cash_active is false
                    initial={{ opacity: 1 }}
                    animate={{ opacity: form.cash_active ? 0.5 : 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                >
                    <h4 className="mb-2 text-base font-medium">Detail Rekening {!form.cash_active && <span className="text-red-500">*</span>}</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="bank_name" className={cn(!form.cash_active && "after:ml-1 after:text-red-500 after:content-['*']")}>
                                Nama Bank
                            </Label>
                            <Input
                                id="bank_name"
                                name="bank_name"
                                value={form.bank.name || ''}
                                onChange={(e) => setData('bank', { ...form.bank, name: e.target.value })}
                                {...(form.cash_active
                                    ? { disabled: true }
                                    : {
                                          // required: true
                                      })}
                            />
                            <InputError message={errors.bank?.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="bank_account_number"
                                className={cn(!form.cash_active && "after:ml-1 after:text-red-500 after:content-['*']")}
                            >
                                No. Rekening
                            </Label>
                            <Input
                                id="bank_account_number"
                                name="bank_account_number"
                                value={form.bank.account_number || ''}
                                onChange={(e) => setData('bank', { ...form.bank, account_number: e.target.value })}
                                {...(form.cash_active
                                    ? { disabled: true }
                                    : {
                                          // required: true
                                      })}
                            />
                            <InputError message={errors.bank?.account_number} />
                        </div>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="bank_account_name"
                                className={cn(!form.cash_active && "after:ml-1 after:text-red-500 after:content-['*']")}
                            >
                                Nama Pemilik Rekening
                            </Label>
                            <Input
                                id="bank_account_name"
                                name="bank_account_name"
                                value={form.bank.account_name || ''}
                                onChange={(e) => setData('bank', { ...form.bank, account_name: e.target.value })}
                                {...(form.cash_active
                                    ? { disabled: true }
                                    : {
                                          // required: true
                                      })}
                            />
                            <InputError message={errors.bank?.account_name} />
                        </div>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="bank_code">Kode Bank (opsional)</Label>
                            <Input
                                id="bank_code"
                                name="bank_code"
                                value={form.bank.bank_code || ''}
                                onChange={(e) => setData('bank', { ...form.bank, bank_code: e.target.value })}
                                {...(form.cash_active ? { disabled: true } : {})}
                            />
                            <InputError message={errors.bank?.bank_code} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bank_branch">Cabang Bank (opsional)</Label>
                            <Input
                                id="bank_branch"
                                name="bank_branch"
                                value={form.bank.bank_branch || ''}
                                onChange={(e) => setData('bank', { ...form.bank, bank_branch: e.target.value })}
                                {...(form.cash_active ? { disabled: true } : {})}
                            />
                            <InputError message={errors.bank?.bank_branch} />
                        </div>
                    </div>
                </motion.div>

                <div className="mt-4 grid gap-2">
                    <Label htmlFor="cash_active">Aktifkan Pembayaran Tunai</Label>
                    <div className="flex items-center space-x-2">
                        <Switch id="cash_active" checked={form.cash_active} onCheckedChange={(val) => setData('cash_active', !!val)} />
                        <span className="text-sm text-muted-foreground">
                            {form.cash_active ? 'Gaji dibayar tunai' : 'Gaji ditransfer ke rekening'}
                        </span>
                    </div>
                    <InputError message={errors.cash_active} />
                </div>
            </div>

            {/* Section 3: BPJS */}
            <div className="space-y-4">
                <div className="border-b pb-2">
                    <h3 className="text-lg font-medium">BPJS</h3>
                    <p className="text-sm text-muted-foreground">Informasi kepesertaan BPJS Kesehatan dan Ketenagakerjaan</p>
                </div>

                {/* BPJS Kesehatan */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="bpjs_kesehatan_active"
                            checked={form.bpjs_kesehatan_active}
                            onCheckedChange={(val) => setData('bpjs_kesehatan_active', !!val)}
                        />
                        <Label htmlFor="bpjs_kesehatan_active">BPJS Kesehatan Aktif</Label>
                    </div>

                    {form.bpjs_kesehatan_active && (
                        <div className="ml-6 grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="bpjs_kesehatan_number">Nomor BPJS Kesehatan</Label>
                                <Input
                                    id="bpjs_kesehatan_number"
                                    name="bpjs_kesehatan_number"
                                    value={form.bpjs_kesehatan_number || ''}
                                    onChange={(e) => setData('bpjs_kesehatan_number', e.target.value)}
                                />
                                <InputError message={errors.bpjs_kesehatan_number} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bpjs_kesehatan_contribution">Kontribusi BPJS Kesehatan</Label>
                                <Select
                                    value={form.bpjs_kesehatan_contribution || ''}
                                    onValueChange={(val) => setData('bpjs_kesehatan_contribution', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Kontribusi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BY-COMPANY">Perusahaan</SelectItem>
                                        <SelectItem value="BY-EMPLOYEE">Karyawan</SelectItem>
                                        <SelectItem value="DEFAULT">Berbagi</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.bpjs_kesehatan_contribution} />
                            </div>
                        </div>
                    )}
                </div>

                {/* BPJS Ketenagakerjaan */}
                <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="bpjs_ketenagakerjaan_active"
                            checked={form.bpjs_ketenagakerjaan_active}
                            onCheckedChange={(val) => setData('bpjs_ketenagakerjaan_active', !!val)}
                        />
                        <Label htmlFor="bpjs_ketenagakerjaan_active">BPJS Ketenagakerjaan Aktif</Label>
                    </div>

                    {form.bpjs_ketenagakerjaan_active && (
                        <div className="ml-6 grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="bpjs_ketenagakerjaan_number">Nomor BPJS Ketenagakerjaan</Label>
                                <Input
                                    id="bpjs_ketenagakerjaan_number"
                                    name="bpjs_ketenagakerjaan_number"
                                    value={form.bpjs_ketenagakerjaan_number || ''}
                                    onChange={(e) => setData('bpjs_ketenagakerjaan_number', e.target.value)}
                                />
                                <InputError message={errors.bpjs_ketenagakerjaan_number} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bpjs_ketenagakerjaan_contribution">Kontribusi BPJS Ketenagakerjaan</Label>
                                <Select
                                    value={form.bpjs_ketenagakerjaan_contribution || ''}
                                    onValueChange={(val) => setData('bpjs_ketenagakerjaan_contribution', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Kontribusi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BY-COMPANY">Perusahaan</SelectItem>
                                        <SelectItem value="BY-EMPLOYEE">Karyawan</SelectItem>
                                        <SelectItem value="DEFAULT">Berbagi</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.bpjs_ketenagakerjaan_contribution} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 4: Informasi Pajak */}
            <div className="space-y-4">
                <div className="border-b pb-2">
                    <h3 className="text-lg font-medium">Informasi Pajak</h3>
                    <p className="text-sm text-muted-foreground">Data perpajakan dan NPWP karyawan</p>
                </div>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="ptkp_code" className="after:ml-1 after:text-red-500 after:content-['*']">
                            Kode PTKP (Penghasilan Tidak Kena Pajak)
                        </Label>
                        <Select value={form.ptkp_code || ''} onValueChange={(val) => setData('ptkp_code', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="-- Pilih Kode PTKP --" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TK/0">TK/0 - Tidak Kawin tanpa tanggungan</SelectItem>
                                <SelectItem value="TK/1">TK/1 - Tidak Kawin 1 tanggungan</SelectItem>
                                <SelectItem value="TK/2">TK/2 - Tidak Kawin 2 tanggungan</SelectItem>
                                <SelectItem value="TK/3">TK/3 - Tidak Kawin 3 tanggungan</SelectItem>
                                <SelectItem value="K/1">K/1 - Kawin 1 tanggungan</SelectItem>
                                <SelectItem value="K/2">K/2 - Kawin 2 tanggungan</SelectItem>
                                <SelectItem value="K3">K3 - Kawin 3 tanggungan</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.ptkp_code} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="npwp">NPWP (Nomor Pokok Wajib Pajak)</Label>
                        <Input
                            id="npwp"
                            name="npwp"
                            value={form.npwp || ''}
                            onChange={(e) => setData('npwp', e.target.value)}
                            placeholder="xx.xxx.xxx.x-xxx.xxx"
                        />
                        <InputError message={errors.npwp} />
                    </div>

                    {form.marital_status === 'MARRIED' && (
                        <>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is_spouse_working"
                                    checked={form.is_spouse_working}
                                    onCheckedChange={(val) => setData('is_spouse_working', !!val)}
                                />
                                <Label htmlFor="is_spouse_working">Pasangan Bekerja</Label>
                            </div>
                            <InputError message={errors.is_spouse_working} />
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
