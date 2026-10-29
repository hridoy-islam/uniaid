import { useCallback, useEffect, useState } from 'react';
import { Clock, LayoutGrid, Loader2, Pencil, Plus, Timer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { AlertModal } from '@/components/shared/alert-modal';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import {
  durationLabel,
  durationMinutes,
  formatTime,
  formatTimeInput,
  maskTimeInput,
  timeRegex
} from '../teacher-slot/utils';

const errorMessage = (error: any) =>
  error?.response?.data?.message || 'Something went wrong, please try again.';

const failToast = (title: string, error: any) =>
  toast({ title, description: errorMessage(error), className: 'bg-red-500 border-none text-white' });

// The times of day offered every day. Teacher Slots generates a teacher's
// slots for a date from these.
export default function SlotTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/slot-templates');
      setTemplates(res.data?.data || []);
    } catch (error) {
      failToast('Could not load slots', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openForm = (template: any = null) => {
    setEditing(template);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/slot-templates/${deleting._id}`);
      toast({ title: 'Slot deleted', className: 'bg-supperagent border-none text-white' });
      fetchTemplates();
    } catch (error) {
      failToast('Could not delete slot', error);
    } finally {
      setDeleteLoading(false);
      setDeleting(null);
    }
  };

  const totalMinutes = templates.reduce((sum, t) => sum + (t.duration || 0), 0);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-supperagent" />
            <h1 className="text-2xl font-semibold">Slot Templates</h1>
          </div>
          <p className="pl-7 text-xs font-semibold text-black/70">
            {templates.length} slot{templates.length === 1 ? '' : 's'} a day ·{' '}
            {durationLabel(totalMinutes) === '—' ? '0 min' : durationLabel(totalMinutes)} in total
          </p>
        </div>
        <Button
          size="sm"
          className="h-9 bg-supperagent text-white shadow-sm hover:bg-supperagent/90"
          onClick={() => openForm()}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Slot
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <BlinkingDots size="large" color="bg-supperagent" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-black/10 bg-white py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-supperagent/10">
            <Clock className="h-7 w-7 text-supperagent" />
          </div>
          <p className="font-semibold">No slots yet</p>
          <p className="mt-1 max-w-sm text-sm text-black">
            Add the times of day you offer. Teacher Slots then generates them for any date and
            teacher.
          </p>
          <Button
            size="sm"
            className="mt-5 bg-supperagent text-white hover:bg-supperagent/90"
            onClick={() => openForm()}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Slot
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((template, i) => (
           
<div
  key={template._id}
  className="group relative flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-4 shadow-sm transition-all duration-200 hover:border-supperagent/40 hover:shadow-md"
>
  {/* Header */}
  <div className="flex items-start justify-between gap-3">
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-supperagent/10">
        <Clock className="h-5 w-5 text-supperagent" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-black">
          Time slot
        </p>
        <h3 className="mt-0.5 text-base font-semibold tracking-tight text-gray-900">
          {formatTime(template.startTime)} – {formatTime(template.endTime)}
        </h3>
      </div>
    </div>

    {/* Actions */}
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => openForm(template)}
        className="rounded-lg p-2 text-black transition hover:bg-supperagent/10 hover:text-supperagent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-supperagent"
        aria-label="Edit slot"
        title="Edit slot"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setDeleting(template)}
        className="rounded-lg p-2 text-black transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        aria-label="Delete slot"
        title="Delete slot"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  </div>

  {/* Duration */}
  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
    <span className="text-sm text-black">Duration</span>

    <span className="inline-flex items-center gap-1.5 rounded-full bg-supperagent/10 px-3 py-1 text-xs font-semibold text-supperagent">
      <Timer className="h-3.5 w-3.5" />
      {durationLabel(template.duration)}
    </span>
  </div>
</div>

          ))}
        </div>
      )}

      <TemplateFormDialog
        open={formOpen}
        template={editing}
        onOpenChange={setFormOpen}
        onSaved={fetchTemplates}
      />

      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete this slot?"
        description={
          deleting
            ? `${formatTime(deleting.startTime)} – ${formatTime(deleting.endTime)}. Teacher slots already generated from it are kept.`
            : ''
        }
      />
    </div>
  );
}

function TemplateFormDialog({
  open,
  template,
  onOpenChange,
  onSaved
}: {
  open: boolean;
  template: any;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStartTime(template?.startTime || '');
    setEndTime(template?.endTime || '');
  }, [open, template]);

  const duration = durationMinutes(startTime, endTime);
  const valid = timeRegex.test(startTime) && timeRegex.test(endTime) && duration > 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      if (template) {
        await axiosInstance.patch(`/slot-templates/${template._id}`, { startTime, endTime });
      } else {
        await axiosInstance.post('/slot-templates', { startTime, endTime });
      }
      toast({
        title: template ? 'Slot updated' : 'Slot created',
        className: 'bg-supperagent border-none text-white'
      });
      onOpenChange(false);
      onSaved();
    } catch (error) {
      failToast('Could not save slot', error);
    } finally {
      setSaving(false);
    }
  };

  const timeField = (
    id: string,
    label: string,
    value: string,
    setValue: (value: string) => void
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder="HH:mm"
        inputMode="numeric"
        onChange={(e) => setValue(maskTimeInput(e.target.value, value))}
        onBlur={() => setValue(formatTimeInput(value))}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Slot' : 'Add Slot'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {timeField('startTime', 'Start time', startTime, setStartTime)}
            {timeField('endTime', 'End time', endTime, setEndTime)}
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
            <span className="text-black">Duration</span>
            <span className="font-semibold">
              {duration > 0 ? durationLabel(duration) : '—'}
            </span>
          </div>
          {startTime && endTime && timeRegex.test(startTime) && timeRegex.test(endTime) && duration <= 0 && (
            <p className="text-xs font-medium text-red-500">End time must be after start time.</p>
          )}
          <Button
            type="submit"
            disabled={!valid || saving}
            className="w-full bg-supperagent text-white hover:bg-supperagent/90"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {template ? 'Save Changes' : 'Create Slot'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
