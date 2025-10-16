import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeFormStepProps } from '@/types/employee';
import { Textarea } from '../ui/textarea';

export default function PersonalDataStep({ form, errors, setData }: EmployeeFormStepProps) {
    return (
        <>
            {/* Step 1: Personal Data - sesuai migration dan controller */}
            <div className="grid gap-2">
                <Label htmlFor="full_name" className="after:ml-1 after:text-red-500 after:content-['*']">
                    Nama Lengkap
                </Label>
                <Input id="full_name" name="full_name" value={form.full_name || ''} onChange={(e) => setData('full_name', e.target.value)} required />
                <InputError message={errors.full_name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="email" className="after:ml-1 after:text-red-500 after:content-['*']">
                    Email
                </Label>
                <Input id="email" type="email" name="email" value={form.email || ''} onChange={(e) => setData('email', e.target.value)} required />
                <InputError message={errors.email} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="phone" className="after:ml-1 after:text-red-500 after:content-['*']">
                    No. Telepon
                </Label>
                <Input id="phone" name="phone" value={form.phone || ''} onChange={(e) => setData('phone', e.target.value)} required />
                <InputError message={errors.phone} />
            </div>

            {/* Gender Information */}
            <div className="grid gap-2">
                <Label htmlFor="gender" className="after:ml-1 after:text-red-500 after:content-['*']">
                    Jenis Kelamin
                </Label>
                <Select
                    value={form.gender || ''}
                    onValueChange={(val) => setData('gender', val)}
                    required
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih Jenis Kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MALE">Laki-laki</SelectItem>
                        <SelectItem value="FEMALE">Perempuan</SelectItem>
                    </SelectContent>
                </Select>
                <InputError message={errors.gender} />
            </div>

            {/* Identity Information */}
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="identity_number">Nomor Identitas (KTP/ID)</Label>
                    <Input
                        id="identity_number"
                        name="identity_number"
                        value={form.identity_number || ''}
                        onChange={(e) => setData('identity_number', e.target.value)}
                        placeholder="Nomor KTP atau ID lainnya"
                    />
                    <InputError message={errors.identity_number} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="kk_number">Nomor Kartu Keluarga</Label>
                    <Input
                        id="kk_number"
                        name="kk_number"
                        value={form.kk_number || ''}
                        onChange={(e) => setData('kk_number', e.target.value)}
                        placeholder="Nomor Kartu Keluarga"
                    />
                    <InputError message={errors.kk_number} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="address" className="after:ml-1 after:text-red-500 after:content-['*']">
                    Alamat
                </Label>
                <Textarea
                    id="address"
                    name="address"
                    value={form.address || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('address', e.target.value)}
                    required
                />
                <InputError message={errors.address} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="postal_code">Kode Pos</Label>
                    <Input
                        id="postal_code"
                        name="postal_code"
                        value={form.postal_code || ''}
                        onChange={(e) => setData('postal_code', e.target.value)}
                    />
                    <InputError message={errors.postal_code} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="place_of_birth">Tempat Lahir</Label>
                    <Input
                        id="place_of_birth"
                        name="place_of_birth"
                        value={form.place_of_birth || ''}
                        onChange={(e) => setData('place_of_birth', e.target.value)}
                    />
                    <InputError message={errors.place_of_birth} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="birth_date" className="after:ml-1 after:text-red-500 after:content-['*']">
                    Tanggal Lahir
                </Label>
                <Input
                    id="birth_date"
                    type="date"
                    name="birth_date"
                    value={form.birth_date || ''}
                    onChange={(e) => setData('birth_date', e.target.value)}
                    required
                />
                <InputError message={errors.birth_date} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="religion" className="after:ml-1 after:text-red-500 after:content-['*']">
                        Agama
                    </Label>
                    <Select value={form.religion || ''} onValueChange={(val) => setData('religion', val)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih Agama" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Islam">Islam</SelectItem>
                            <SelectItem value="Katolik">Katolik</SelectItem>
                            <SelectItem value="Kristen">Kristen</SelectItem>
                            <SelectItem value="Buddha">Buddha</SelectItem>
                            <SelectItem value="Hindu">Hindu</SelectItem>
                            <SelectItem value="Confucius">Confucius</SelectItem>
                            <SelectItem value="Others">Lainnya</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.religion} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="marital_status" className="after:ml-1 after:text-red-500 after:content-['*']">
                        Status Pernikahan
                    </Label>
                    <Select value={form.marital_status || ''} onValueChange={(val) => setData('marital_status', val)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="SINGLE">Belum Menikah</SelectItem>
                            <SelectItem value="MARRIED">Menikah</SelectItem>
                            <SelectItem value="WIDOW">Janda</SelectItem>
                            <SelectItem value="WIDOWER">Duda</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.marital_status} />
                </div>
            </div>

            {/* Spouse Information - Conditional based on marital status */}
            {form.marital_status === 'MARRIED' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="spouse_name">Nama Pasangan</Label>
                        <Input
                            id="spouse_name"
                            name="spouse_name"
                            value={form.spouse_name || ''}
                            onChange={(e) => setData('spouse_name', e.target.value)}
                            placeholder="Nama lengkap pasangan"
                        />
                        <InputError message={errors.spouse_name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="spouse_phone">No. Telepon Pasangan</Label>
                        <Input
                            id="spouse_phone"
                            name="spouse_phone"
                            value={form.spouse_phone || ''}
                            onChange={(e) => setData('spouse_phone', e.target.value)}
                            placeholder="Nomor telepon pasangan"
                        />
                        <InputError message={errors.spouse_phone} />
                    </div>
                </div>
            )}

            {/* Education Information */}
            <div className="grid gap-2">
                <Label htmlFor="last_education">Pendidikan Terakhir</Label>
                <Select value={form.last_education || ''} onValueChange={(val) => setData('last_education', val)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih Pendidikan Terakhir" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="SD">SD (Sekolah Dasar)</SelectItem>
                        <SelectItem value="SMP">SMP (Sekolah Menengah Pertama)</SelectItem>
                        <SelectItem value="SMA">SMA (Sekolah Menengah Atas)</SelectItem>
                        <SelectItem value="SMK">SMK (Sekolah Menengah Kejuruan)</SelectItem>
                        <SelectItem value="D1">D1 (Diploma 1)</SelectItem>
                        <SelectItem value="D2">D2 (Diploma 2)</SelectItem>
                        <SelectItem value="D3">D3 (Diploma 3)</SelectItem>
                        <SelectItem value="D4">D4 (Diploma 4)</SelectItem>
                        <SelectItem value="S1">S1 (Sarjana)</SelectItem>
                        <SelectItem value="S2">S2 (Magister)</SelectItem>
                        <SelectItem value="S3">S3 (Doktor)</SelectItem>
                    </SelectContent>
                </Select>
                <InputError message={errors.last_education} />
            </div>
            <div className="grid gap-4">
                <Label htmlFor="mothermaiden_name">Nama Ibu Kandung</Label>
                <Input
                    id="mothermaiden_name"
                    name="mothermaiden_name"
                    value={form.mothermaiden_name || ''}
                    onChange={(e) => setData('mothermaiden_name', e.target.value)}
                    placeholder="Nama lengkap ibu kandung"
                />
                <InputError message={errors.mothermaiden_name} />
            </div>

            {/* Body Profile Section */}
            <div className="mt-6 border-t pt-4">
                <h3 className="mb-2 text-lg font-semibold">Data Fisik</h3>
                <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="height">Tinggi Badan (cm)</Label>
                            <Input
                                id="height"
                                type="number"
                                name="height"
                                value={form.height || ''}
                                onChange={(e) => setData('height', e.target.value)}
                                step="0.01"
                                min="0"
                                max="300"
                            />
                            <InputError message={errors.height} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="weight">Berat Badan (kg)</Label>
                            <Input
                                id="weight"
                                type="number"
                                name="weight"
                                value={form.weight || ''}
                                onChange={(e) => setData('weight', e.target.value)}
                                step="0.01"
                                min="0"
                                max="500"
                            />
                            <InputError message={errors.weight} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="blood_type">Golongan Darah</Label>
                            <Select
                                value={form.blood_type || ''}
                                onValueChange={(val) => setData('blood_type', val as 'A' | 'B' | 'AB' | 'O' | 'UNKNOWN' | '')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Golongan Darah" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">A</SelectItem>
                                    <SelectItem value="B">B</SelectItem>
                                    <SelectItem value="AB">AB</SelectItem>
                                    <SelectItem value="O">O</SelectItem>
                                    <SelectItem value="UNKNOWN">Tidak Diketahui</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.blood_type} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="shoe_size">Ukuran Sepatu</Label>
                            <Input
                                id="shoe_size"
                                name="shoe_size"
                                value={form.shoe_size || ''}
                                onChange={(e) => setData('shoe_size', e.target.value)}
                                placeholder="Contoh: 42, 7.5, dll"
                            />
                            <InputError message={errors.shoe_size} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="shirt_size">Ukuran Baju</Label>
                        <Select
                            value={form.shirt_size || ''}
                            onValueChange={(val) => setData('shirt_size', val as 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'CUSTOM' | 'UNKNOWN' | '')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Ukuran Baju" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="S">S (Small)</SelectItem>
                                <SelectItem value="M">M (Medium)</SelectItem>
                                <SelectItem value="L">L (Large)</SelectItem>
                                <SelectItem value="XL">XL (Extra Large)</SelectItem>
                                <SelectItem value="XXL">XXL (Double Extra Large)</SelectItem>
                                <SelectItem value="XXXL">XXXL (Triple Extra Large)</SelectItem>
                                <SelectItem value="CUSTOM">Custom</SelectItem>
                                <SelectItem value="UNKNOWN">Tidak Diketahui</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.shirt_size} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="health_notes">Catatan Kesehatan</Label>
                        <Input
                            id="health_notes"
                            name="health_notes"
                            value={form.health_notes || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('health_notes', e.target.value)}
                            placeholder="Catatan khusus tentang kondisi kesehatan, alergi, dll (opsional)"
                        />
                        <InputError message={errors.health_notes} />
                    </div>
                </div>
            </div>

            {/* Emergency Contact Section - sesuai controller */}
            <div className="mt-6 border-t pt-4">
                <h3 className="mb-2 text-lg font-semibold">
                    Kontak Darurat <span className="text-red-500">*</span>
                </h3>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="emergency_contact_name" className="after:ml-1 after:text-red-500 after:content-['*']">
                            Nama Kontak Darurat
                        </Label>
                        <Input
                            id="emergency_contact_name"
                            name="emergency_contact_name"
                            value={form.emergency_contact.name || ''}
                            onChange={(e) => setData('emergency_contact', { ...form.emergency_contact, name: e.target.value })}
                            required
                        />
                        <InputError message={errors.emergency_contact?.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="emergency_contact_relationship" className="after:ml-1 after:text-red-500 after:content-['*']">
                                Hubungan
                            </Label>
                            <Input
                                id="emergency_contact_relationship"
                                name="emergency_contact_relationship"
                                value={form.emergency_contact.relationship || ''}
                                onChange={(e) => setData('emergency_contact', { ...form.emergency_contact, relationship: e.target.value })}
                                placeholder="Contoh: Orang Tua, Saudara, Pasangan"
                                required
                            />
                            <InputError message={errors.emergency_contact?.relationship} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="emergency_contact_phone" className="after:ml-1 after:text-red-500 after:content-['*']">
                                No. Telepon Kontak Darurat
                            </Label>
                            <Input
                                id="emergency_contact_phone"
                                name="emergency_contact_phone"
                                value={form.emergency_contact.phone || ''}
                                onChange={(e) => setData('emergency_contact', { ...form.emergency_contact, phone: e.target.value })}
                                required
                            />
                            <InputError message={errors.emergency_contact?.phone} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
