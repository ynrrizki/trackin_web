import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { type FormEvent } from 'react';

interface Props {
  projects: { id: number; name: string }[];
}

export default function PatroliCreate({ projects }: Props) {
  const { data, setData, post, processing } = useForm({
    start_time: '',
    end_time: '',
    note: '',
    project_id: '',
    files: [] as File[],
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    post('/security-ops/patroli', { forceFormData: true });
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Patroli', href: '/security-ops/patroli' }, { title: 'Create', href: '#' }]}>
      <Head title="Create Patroli" />
      <Card>
        <CardHeader>
          <CardTitle>Buat Patroli</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={data.start_time} onChange={e => setData('start_time', e.target.value)} required />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={data.end_time} onChange={e => setData('end_time', e.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <Label>Catatan</Label>
                <Input value={data.note} onChange={e => setData('note', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Project</Label>
                <select className="w-full border rounded h-10 px-2" value={data.project_id} onChange={e => setData('project_id', e.target.value)}>
                  <option value="">-- Pilih Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Files</Label>
                <Input type="file" multiple onChange={e => setData('files', Array.from(e.target.files || []))} />
              </div>
            </div>
            <Button type="submit" disabled={processing}>Simpan</Button>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
