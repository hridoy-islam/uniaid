import { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { AlertCircle, Check, Timer, Trash2, UserX, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { AlertModal } from '@/components/shared/alert-modal';
import axiosInstance from '@/lib/axios';
import {
  START_H,
  durationLabel,
  durationMinutes,
  fmtH,
  formatTimeInput,
  keepOpenForSelectMenu,
  keyToLocalDate,
  localDateKey,
  maskTimeInput,
  portalSelectProps,
  slotDateKey,
  studentName,
  teacherIdOf,
  timeRangesOverlap,
  timeRegex
} from '../utils';

export type SlotFormDefaults = { date: Date; startTime: string; endTime: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // null → create, otherwise the slot being edited
  slot: any | null;
  defaults?: SlotFormDefaults | null;
  teacherOptions: { value: string; label: string }[];
  teachersLoading?: boolean;
  onSaved: () => void;
};

type FormState = {
  date: Date | null;
  startTime: string;
  endTime: string;
  teacher: string;
  note: string;
};

export function SlotFormSheet({
  open,
  onOpenChange,
  slot,
  defaults,
  teacherOptions,
  teachersLoading,
  onSaved
}: Props) {
  const isEdit = !!slot;
  const [form, setForm] = useState<FormState>({
    date: new Date(),
    startTime: '09:00',
    endTime: '10:00',
    teacher: '',
    note: ''
  });
  const [timeErrors, setTimeErrors] = useState({ startTime: '', endTime: '' });
  const [teacherSlots, setTeacherSlots] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState<'delete' | 'cancel' | null>(null);

  useEffect(() => {
    if (!open) return;
    setTimeErrors({ startTime: '', endTime: '' });
    if (slot) {
      setForm({
        date: keyToLocalDate(slotDateKey(slot.date)),
        startTime: slot.startTime,
        endTime: slot.endTime,
        teacher: teacherIdOf(slot),
        note: slot.note || ''
      });
    } else {
      setForm({
        date: defaults?.date || new Date(),
        startTime: defaults?.startTime || '09:00',
        endTime: defaults?.endTime || '10:00',
        teacher: '',
        note: ''
      });
    }
  }, [open, slot, defaults]);

  // The chosen teacher's slots on the chosen day, for a live clash check.
  // Without a teacher there is nothing to clash with.
  useEffect(() => {
    if (!open || !form.teacher || !form.date) {
      setTeacherSlots([]);
      return;
    }
    let cancelled = false;
    const key = localDateKey(form.date);
    axiosInstance
      .get('/teacher-slots', {
        params: { teacherId: form.teacher, fromDate: key, toDate: key, limit: 'all' }
      })
      .then((res) => !cancelled && setTeacherSlots(res.data?.data?.result || []))
      .catch(() => !cancelled && setTeacherSlots([]));
    return () => {
      cancelled = true;
    };
  }, [open, form.teacher, form.date]);

  const timesValid = timeRegex.test(form.startTime) && timeRegex.test(form.endTime);
  const duration = durationMinutes(form.startTime, form.endTime);

  const clash = useMemo(() => {
    if (!form.teacher || !timesValid || !duration) return null;
    return (
      teacherSlots.find(
        (s) =>
          s._id !== slot?._id &&
          timeRangesOverlap(form.startTime, form.endTime, s.startTime, s.endTime)
      ) || null
    );
  }, [teacherSlots, form.teacher, form.startTime, form.endTime, timesValid, duration, slot]);

  const blurTime = (field: 'startTime' | 'endTime', value: string) => {
    const formatted = formatTimeInput(value);
    setForm((prev) => ({ ...prev, [field]: formatted }));
    setTimeErrors((prev) => ({
      ...prev,
      [field]: !formatted
        ? `${field === 'startTime' ? 'Start' : 'End'} time is required`
        : !timeRegex.test(formatted)
          ? 'Invalid time format (HH:MM)'
          : ''
    }));
  };

  const fail = (title: string, error: any) =>
    toast({
      title,
      description: error?.response?.data?.message || error?.message || 'Something went wrong.',
      className: 'bg-red-500 border-none text-white'
    });

  const handleSubmit = async () => {
    const errors = { startTime: '', endTime: '' };
    if (!timeRegex.test(form.startTime))
      errors.startTime = form.startTime ? 'Invalid format' : 'Required';
    if (!timeRegex.test(form.endTime)) errors.endTime = form.endTime ? 'Invalid format' : 'Required';
    if (errors.startTime || errors.endTime) {
      setTimeErrors(errors);
      return;
    }
    if (Number(form.startTime.split(':')[0]) < START_H) {
      setTimeErrors((p) => ({ ...p, startTime: `Start time must be ${fmtH(START_H)} or later` }));
      return;
    }
    if (!duration) {
      fail('End time must be after start time.', null);
      return;
    }
    if (!form.date || clash) return;

    setSubmitting(true);
    try {
      const payload = {
        date: localDateKey(form.date),
        startTime: form.startTime,
        endTime: form.endTime,
        teacherId: form.teacher || null,
        note: form.note.trim()
      };
      if (isEdit) await axiosInstance.patch(`/teacher-slots/${slot._id}`, payload);
      else await axiosInstance.post('/teacher-slots', payload);
      toast({
        title: isEdit ? 'Slot updated!' : 'Slot added!',
        className: 'bg-supperagent border-none text-white'
      });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      fail('Failed to save slot.', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!slot || !confirm) return;
    setSubmitting(true);
    try {
      if (confirm === 'delete') {
        await axiosInstance.delete(`/teacher-slots/${slot._id}`);
        toast({ title: 'Slot deleted.', className: 'bg-supperagent border-none text-white' });
      } else {
        await axiosInstance.patch(`/teacher-slots/${slot._id}/cancel-booking`);
        toast({ title: 'Booking cancelled.', className: 'bg-supperagent border-none text-white' });
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      fail(confirm === 'delete' ? 'Failed to delete slot.' : 'Failed to cancel booking.', error);
    } finally {
      setSubmitting(false);
      setConfirm(null);
    }
  };

  const isBooked = slot?.status === 'booked';

  const timeInput = (field: 'startTime' | 'endTime', label: string, placeholder: string) => (
    <div className="flex-1">
      <label className="mb-1.5 block text-[10px] font-bold uppercase text-black">{label}</label>
      <Input
        value={form[field]}
        placeholder={placeholder}
        maxLength={5}
        className={`h-9 font-mono text-sm ${timeErrors[field] ? 'border-red-500' : ''}`}
        onChange={(e) => {
          const val = maskTimeInput(e.target.value, form[field]);
          setForm((prev) => ({ ...prev, [field]: val }));
        }}
        onBlur={(e) => blurTime(field, e.target.value)}
      />
      {timeErrors[field] && <p className="mt-1 text-[10px] text-red-500">{timeErrors[field]}</p>}
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="sm:max-w-md"
          onInteractOutside={keepOpenForSelectMenu}
        >
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="text-base font-bold text-black">
              {isEdit ? 'Edit Slot' : 'Create Slot'}
            </SheetTitle>
            <SheetDescription className="text-xs text-black">
              {isEdit
                ? 'Update the slot details below.'
                : 'Fill in the details to add a new slot. The teacher can be assigned later.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 overflow-y-auto pb-24 pt-6">
            {isBooked && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                Booked by <span className="font-semibold">{studentName(slot.studentId)}</span>
                {slot.studentId?.email && <> ({slot.studentId.email})</>}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Date (DD-MM-YYYY)</Label>
              <DatePicker
                selected={form.date}
                onChange={(date: Date | null) => {
                  if (date) setForm((f) => ({ ...f, date }));
                }}
                minDate={isEdit ? undefined : new Date()}
                dateFormat="dd-MM-yyyy"
                popperPlacement="bottom-start"
                popperProps={{ strategy: 'fixed' }}
                popperClassName="!z-[9999]"
                className="flex h-10 w-full rounded-md border border-black/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                wrapperClassName="w-full"
                preventOpenOnFocus
              />
            </div>

            <div className="flex flex-1 gap-3">
              {timeInput('startTime', 'Start Time', '09:00')}
              {timeInput('endTime', 'End Time', '10:00')}
            </div>

            <div className="flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-xs">
              <Timer className="h-4 w-4 text-supperagent" />
              <span className="font-bold uppercase text-black">Duration</span>
              <span className="ml-auto font-mono font-semibold text-black">
                {timesValid ? durationLabel(duration) : '—'}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label>
                Teacher <span className="text-[10px] font-normal text-black">(optional)</span>
              </Label>
              <Select
                {...portalSelectProps}
                isLoading={teachersLoading}
                options={teacherOptions}
                value={teacherOptions.find((opt) => opt.value === form.teacher) || null}
                onChange={(selected: any) =>
                  setForm((f) => ({ ...f, teacher: selected?.value || '' }))
                }
                placeholder="Select a teacher..."
                isClearable={!isBooked}
              />
              {clash && (
                <p className="flex items-center gap-1 text-[11px] font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  Clashes with this teacher's slot {clash.startTime}–{clash.endTime}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Note</Label>
              <Textarea
                placeholder="e.g. Room 101, Online"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
          </div>

          <SheetFooter className="absolute bottom-0 left-0 right-0 flex flex-col gap-2 border-t bg-supperagent/5 p-4 sm:flex-row sm:justify-between">
            {isEdit && (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-9 w-full sm:w-auto"
                  onClick={() => setConfirm('delete')}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                </Button>
                {isBooked && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-full sm:w-auto"
                    onClick={() => setConfirm('cancel')}
                  >
                    <UserX className="mr-1.5 h-4 w-4" /> Unbook
                  </Button>
                )}
              </div>
            )}
            <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-full border-black/10 sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
              </Button>
              <Button
                size="sm"
                className="h-9 w-full bg-supperagent text-white hover:bg-supperagent/90 sm:w-auto"
                onClick={handleSubmit}
                disabled={submitting || !!clash}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                {submitting ? 'Saving…' : isEdit ? 'Update' : 'Create'}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirm}
        loading={submitting}
        title={confirm === 'delete' ? 'Delete Slot' : 'Cancel Booking'}
        description={
          confirm === 'delete'
            ? isBooked
              ? 'This slot is booked. Deleting it also removes the student booking. This can not be undone.'
              : 'Are you sure you want to delete this slot? This can not be undone.'
            : 'The slot becomes available for other students again.'
        }
      />
    </>
  );
}
