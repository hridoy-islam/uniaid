import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { useSelector } from 'react-redux';
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Timer,
  Trash2,
  User,
  UserPlus,
  Clock,
  GraduationCap,
  Hash,
  Mail,
  Phone,
  StickyNote,
  CalendarCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/use-toast';
import { AlertModal } from '@/components/shared/alert-modal';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import {
  durationLabel,
  formatSlotDate,
  formatTime,
  formatTimeInput,
  localDateKey,
  makeRowId,
  maskTimeInput,
  selectStyles,
  studentName,
  teacherIdOf,
  timeRangesOverlap,
  timeRegex,
  toMinutes,
  WEEKDAYS
} from './utils';
import { SlotFormSheet } from './components/slot-form-sheet';
import { StudentSelect, type StudentOption } from '../book-slot';

const errorMessage = (error: any) =>
  error?.response?.data?.message || 'Something went wrong, please try again.';

const failToast = (title: string, error: any) =>
  toast({
    title,
    description: errorMessage(error),
    className: 'bg-red-500 border-none text-white'
  });

const startOfToday = () => moment().startOf('day').toDate();

// The button react-datepicker opens from
export const DateButton = forwardRef<
  HTMLButtonElement,
  { value?: string; onClick?: () => void; fullWidth?: boolean }
>(({ value, onClick, fullWidth }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    className={`flex h-9 items-center gap-2 rounded-md border border-black/10 bg-white px-3 text-sm font-medium shadow-sm transition hover:border-supperagent ${
      fullWidth ? 'w-full' : ''
    }`}
  >
    <CalendarDays className="h-4 w-4 text-supperagent" />
    {value}
  </button>
));
DateButton.displayName = 'DateButton';

export default function TeacherSlotPage() {
  const [date, setDate] = useState<Date>(startOfToday);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  // Only an admin edits or deletes a slot
  const isAdmin =
    useSelector((state: any) => state.auth?.user?.role) === 'admin';
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [assigning, setAssigning] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setTeachersLoading(true);
    axiosInstance
      .get('/users', {
        params: { role: 'teacher', limit: 'all', sort: 'name' }
      })
      .then((res) => setTeachers(res.data?.data?.result || []))
      .catch((error) => console.error('Error fetching teachers:', error))
      .finally(() => setTeachersLoading(false));
  }, []);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const key = localDateKey(date);
      const res = await axiosInstance.get('/teacher-slots', {
        params: { fromDate: key, toDate: key, limit: 'all' }
      });
      setSlots(res.data?.data?.result || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // A section for every teacher, in name order, even ones with no slots that
  // day. Slots without a teacher get their own section at the end.
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; slots: any[] }>();
    teachers.forEach((t) => map.set(t._id, { name: t.name, slots: [] }));
    slots.forEach((slot) => {
      const id = teacherIdOf(slot) || 'none';
      if (!map.has(id))
        map.set(id, {
          name: slot.teacherId?.name || 'No teacher yet',
          slots: []
        });
      map.get(id)!.slots.push(slot);
    });
    return Array.from(map, ([id, group]) => ({ id, ...group })).sort(
      (a, b) =>
        Number(a.id === 'none') - Number(b.id === 'none') ||
        a.name.localeCompare(b.name)
    );
  }, [teachers, slots]);

  const deleteSlot = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/teacher-slots/${deleting._id}`);
      toast({
        title: 'Slot deleted',
        className: 'bg-supperagent border-none text-white'
      });
      fetchSlots();
    } catch (error) {
      failToast('Could not delete slot', error);
    } finally {
      setDeleteLoading(false);
      setDeleting(null);
    }
  };

  // Shared by both generate dialogs
  const generateProps = {
    initialDate: moment(date).isBefore(moment(), 'day') ? startOfToday() : date,
    teachers,
    teachersLoading,
    onGenerated: (generatedFor: Date) => {
      if (moment(generatedFor).isSame(date, 'day')) fetchSlots();
      else setDate(generatedFor);
    }
  };

  const booked = slots.filter((s) => s.status === 'booked').length;
  const isToday = moment(date).isSame(moment(), 'day');
  const shiftDay = (days: number) =>
    setDate(moment(date).add(days, 'day').toDate());

  const bookingLink = `${window.location.origin}/book-slot`;
  const copyBookingLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingLink);
      toast({
        title: 'Booking link copied',
        description: bookingLink,
        className: 'bg-supperagent border-none text-white'
      });
    } catch {
      toast({ title: bookingLink });
    }
  };

  return (
    // The whole page is one card: header with the day navigation, then the grid
    <div className="flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 px-4 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-supperagent" />
              <h1 className="text-2xl font-semibold">Teacher Slots</h1>
            </div>
            <p className="pl-7 text-xs font-semibold text-black/70">
              {slots.length} slot{slots.length === 1 ? '' : 's'} ·{' '}
              {slots.length - booked} available · {booked} booked
            </p>
          </div>

          {/* ── Day navigation ─────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              className="h-9 w-9 border-none bg-supperagent text-white hover:bg-supperagent/90"
              onClick={() => shiftDay(-1)}
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <DatePicker
              selected={date}
              onChange={(d: Date | null) =>
                d && setDate(moment(d).startOf('day').toDate())
              }
              dateFormat="EEE, dd MMM yyyy"
              customInput={<DateButton />}
            />
            <Button
              size="icon"
              className="h-9 w-9 border-none bg-supperagent text-white hover:bg-supperagent/90"
              onClick={() => shiftDay(1)}
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isToday && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 "
                onClick={() => setDate(startOfToday())}
              >
                Today
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={copyBookingLink}
            >
              <Link2 className="mr-1.5 h-4 w-4" /> Booking Link
            </Button>
            <Button
              size="sm"
              className="h-9 bg-supperagent text-white shadow-sm hover:bg-supperagent/90"
              onClick={() => setBulkOpen(true)}
            >
              <Sparkles className="mr-1.5 h-4 w-4" /> Generate Slot
            </Button>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-black">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-blue-300 bg-blue-50" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-emerald-400 bg-emerald-100" />
              Booked
            </span>
          </div>
        </div>
      </div>

      {/* ── Slots ────────────────────────────────────────────────── */}
      {loading || teachersLoading ? (
        <div className="flex justify-center py-20">
          <BlinkingDots size="large" color="bg-supperagent" />
        </div>
      ) : slots.length === 0 && groups.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-supperagent/10">
            <CalendarDays className="h-7 w-7 text-supperagent" />
          </div>
          <p className="font-semibold">
            No slots on {moment(date).format('dddd, D MMMM YYYY')}
          </p>
          <p className="mt-1 text-sm text-black">
            Generate slots for this day or choose another date.
          </p>
          {!moment(date).isBefore(moment(), 'day') && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button
                size="sm"
                className="bg-supperagent text-white hover:bg-supperagent/90"
                onClick={() => setBulkOpen(true)}
              >
                <Sparkles className="mr-1.5 h-4 w-4" /> Generate Slot
              </Button>
            </div>
          )}
        </div>
      ) : (
        // A grid of teachers, a column each
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 ">
          {groups.map((group) => {
            const groupBooked = group.slots.filter(
              (s) => s.status === 'booked'
            ).length;
            return (
              <section
                key={group.id}
                className="flex flex-col rounded-lg border border-black/10 bg-white"
              >
                <div className="flex items-center justify-between gap-2 border-b border-black/10 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <User className="h-4 w-4 shrink-0 text-supperagent" />
                    <h2 className="truncate text-sm font-semibold">
                      {group.name}
                    </h2>
                  </div>
                  <span className="shrink-0 text-[11px] font-medium text-black">
                    {groupBooked}/{group.slots.length} booked
                  </span>
                </div>
                {group.slots.length === 0 ? (
                  <p className="flex flex-1 items-center justify-center px-3 py-6 text-sm text-black">
                    No slots on this day
                  </p>
                ) : (
                  <div className="space-y-1.5 p-2.5">
                    {group.slots.map((slot) => (
                      <SlotCard
                        key={slot._id}
                        slot={slot}
                        onEdit={isAdmin ? setEditing : undefined}
                        onDelete={isAdmin ? setDeleting : undefined}
                        onAssign={isAdmin ? setAssigning : undefined}
                        onOpen={setViewing}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <SlotFormSheet
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        slot={editing}
        defaults={null}
        teacherOptions={teachers.map((t) => ({ value: t._id, label: t.name }))}
        teachersLoading={teachersLoading}
        onSaved={fetchSlots}
      />

      <SlotDetailsDialog
        slot={viewing}
        onClose={() => setViewing(null)}
        onEdit={isAdmin ? setEditing : undefined}
        onAssign={isAdmin ? setAssigning : undefined}
      />

      <AssignStudentDialog
        slot={assigning}
        onClose={() => setAssigning(null)}
        onAssigned={fetchSlots}
      />

      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={deleteSlot}
        loading={deleteLoading}
        title="Delete this slot?"
        description={
          deleting
            ? `${deleting.teacherId?.name || 'No teacher'}, ${formatTime(deleting.startTime)} – ${formatTime(deleting.endTime)}${deleting.status === 'booked' ? '. It is booked, the booking will be removed too.' : ''}`
            : ''
        }
      />

      <BulkGenerateDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        {...generateProps}
      />
    </div>
  );
}

function SlotCard({
  slot,
  onEdit,
  onDelete,
  onAssign,
  onOpen
}: {
  slot: any;
  onEdit?: (slot: any) => void;
  onDelete?: (slot: any) => void;
  onAssign?: (slot: any) => void;
  onOpen?: (slot: any) => void;
}) {
  const booked = slot.status === 'booked';

  return (
    // One compact row: status, time, duration, student (when booked), actions
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(slot)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.(slot)}
      className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm text-black transition hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-supperagent ${
        booked
          ? 'border-emerald-300 bg-emerald-50'
          : 'border-blue-300 bg-blue-50'
      }`}
    >
      {/* Only booked slots get a badge, the blue card already means open */}
      {booked && (
        <Badge className="w-[70px] shrink-0 justify-center border-transparent bg-emerald-600 px-2 py-0 text-[11px] text-white shadow-none hover:bg-emerald-600">
          Booked
        </Badge>
      )}
      <span className="shrink-0 font-semibold tabular-nums">
        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium">
        <Timer className="h-3.5 w-3.5" />
        {durationLabel(slot.duration)}
      </span>

      <span
        className="flex min-w-0 flex-1 items-center gap-1 text-xs font-medium"
        title={
          booked && slot.studentId?.email ? slot.studentId.email : undefined
        }
      >
        {booked && slot.studentId && (
          <>
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {studentName(slot.studentId)}
              {slot.studentId.email ? ` · ${slot.studentId.email}` : ''}
            </span>
          </>
        )}
      </span>

      {onAssign && !booked && slot.teacherId && (
        <Button
          type="button"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onAssign(slot);
          }}
          className="h-7 shrink-0 gap-1 border-none bg-blue-600 px-2 text-xs text-white hover:bg-blue-700"
          aria-label="Book for a student"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Book
        </Button>
      )}

      {onEdit && (
        <Button
          type="button"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(slot);
          }}
          className="h-7 w-7 shrink-0 border-none bg-supperagent text-white hover:bg-supperagent/90"
          aria-label="Edit slot"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(slot);
          }}
          className="h-7 w-7 shrink-0"
          aria-label="Delete slot"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children
}: {
  icon: any;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-supperagent/10 text-supperagent">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide">
          {label}
        </p>
        <div className="break-words text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

// Everything about one slot: when, who teaches, who booked it
function SlotDetailsDialog({
  slot,
  onClose,
  onEdit,
  onAssign
}: {
  slot: any;
  onClose: () => void;
  onEdit?: (slot: any) => void;
  onAssign?: (slot: any) => void;
}) {
  const booked = slot?.status === 'booked';
  const student = booked ? slot?.studentId : null;
  const name = student ? studentName(student) : '';

  const handOff = (action?: (slot: any) => void) => {
    if (!action) return;
    const current = slot;
    onClose();
    action(current);
  };

  return (
    <Dialog open={!!slot} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 sm:max-w-lg">
        {slot && (
          <>
            {/* Header, tinted by status like the card */}
            <div
              className={`border-b px-6 py-5 ${
                booked
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <DialogHeader className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  {booked && (
                    <Badge className="border-transparent bg-emerald-600 px-2 py-0 text-[11px] text-white shadow-none hover:bg-emerald-600">
                      Booked
                    </Badge>
                  )}
                  <span className="text-xs font-medium">
                    {durationLabel(slot.duration)}
                  </span>
                </div>
                <DialogTitle className="text-2xl font-semibold tabular-nums">
                  {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                </DialogTitle>
                <DialogDescription className="text-sm font-medium text-black">
                  {formatSlotDate(slot.date, 'dddd, D MMMM YYYY')}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-5 text-black">
              <section>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-supperagent">
                  Slot
                </h3>
                <div className="divide-y divide-black/5">
                  <DetailRow icon={GraduationCap} label="Teacher">
                    {slot.teacherId?.name || 'No teacher'}
                    {slot.teacherId?.email && (
                      <span className="block text-xs font-normal">
                        {slot.teacherId.email}
                      </span>
                    )}
                  </DetailRow>
                  <DetailRow icon={CalendarDays} label="Date">
                    {formatSlotDate(slot.date, 'ddd, D MMM YYYY')}
                  </DetailRow>
                  <DetailRow icon={Clock} label="Time">
                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}{' '}
                    <span className="font-normal">
                      ({durationLabel(slot.duration)})
                    </span>
                  </DetailRow>
                  {slot.note && (
                    <DetailRow icon={StickyNote} label="Note">
                      {slot.note}
                    </DetailRow>
                  )}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-supperagent">
                  Student
                </h3>
                {student ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                        {initials(name) || '?'}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {name || 'Student'}
                        </p>
                        {student.refId && (
                          <p className="flex items-center gap-1 text-xs font-medium">
                            <Hash className="h-3 w-3" />
                            {student.refId}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 border-t border-emerald-200 pt-3 text-sm">
                      {student.email && (
                        <a
                          href={`mailto:${student.email}`}
                          className="flex min-w-0 items-center gap-2 hover:underline"
                        >
                          <Mail className="h-4 w-4 shrink-0 text-emerald-700" />
                          <span className="truncate">{student.email}</span>
                        </a>
                      )}
                      {student.phone && (
                        <a
                          href={`tel:${student.phone}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Phone className="h-4 w-4 shrink-0 text-emerald-700" />
                          {student.phone}
                        </a>
                      )}
                      {slot.bookedAt && (
                        <p className="flex items-center gap-2">
                          <CalendarCheck className="h-4 w-4 shrink-0 text-emerald-700" />
                          Booked{' '}
                          {moment(slot.bookedAt).format('D MMM YYYY, HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-dashed border-black/15 p-4 text-sm">
                    <User className="h-5 w-5 shrink-0" />
                    <p className="font-medium">
                      Not booked yet. It is open on the booking page.
                    </p>
                  </div>
                )}
              </section>
            </div>

            <DialogFooter className="gap-2 border-t border-black/10 px-6 py-4 sm:gap-0">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {onAssign && !booked && slot.teacherId && (
                <Button
                  onClick={() => handOff(onAssign)}
                  className="border-none bg-blue-600 text-white hover:bg-blue-700"
                >
                  <UserPlus className="mr-1.5 h-4 w-4" /> Book for student
                </Button>
              )}
              {onEdit && (
                <Button
                  onClick={() => handOff(onEdit)}
                  className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                >
                  <Pencil className="mr-1.5 h-4 w-4" /> Edit slot
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Admin books an open slot for a student: pick, then confirm
function AssignStudentDialog({
  slot,
  onClose,
  onAssigned
}: {
  slot: any;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [student, setStudent] = useState<StudentOption | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStudent(null);
  }, [slot]);

  const assign = async () => {
    if (!slot || !student) return;
    setSaving(true);
    try {
      await axiosInstance.patch(`/teacher-slots/${slot._id}/assign-student`, {
        studentId: student.value
      });
      toast({
        title: 'Slot booked',
        description: `${student.name} is booked with ${slot.teacherId?.name}, ${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}.`,
        className: 'bg-supperagent border-none text-white'
      });
      onClose();
      onAssigned();
    } catch (error) {
      failToast('Could not book the slot', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={!!slot}
      onOpenChange={(open) => !open && !saving && onClose()}
    >
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book for a student</DialogTitle>
          <DialogDescription className="text-black">
            The student gets a confirmation email.
          </DialogDescription>
        </DialogHeader>
        {slot && (
          <div className="space-y-4 text-sm text-black">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-black/10 p-3">
              <span className="flex items-center gap-1.5 font-semibold">
                <User className="h-4 w-4 text-supperagent" />
                {slot.teacherId?.name}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-supperagent" />
                {formatSlotDate(slot.date, 'ddd, D MMM YYYY')}
              </span>
              <span className="flex items-center gap-1.5 tabular-nums">
                <Timer className="h-4 w-4 text-supperagent" />
                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
              </span>
            </div>
            <div className="space-y-2">
              <Label>Student</Label>
              <StudentSelect
                value={student}
                onChange={setStudent}
                portal={false}
              />
              <p className="text-xs">Search by name, email or student ID.</p>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!student || saving}
            onClick={assign}
            className="bg-supperagent text-white hover:bg-supperagent/90"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Slot templates are only needed while a generate dialog is open
function useSlotTemplates(open: boolean) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    axiosInstance
      .get('/slot-templates')
      .then((res) => setTemplates(res.data?.data || []))
      .catch((error) => failToast('Could not load slot templates', error))
      .finally(() => setLoading(false));
  }, [open]);

  return { templates, loading };
}

async function postGenerate(payload: {
  date?: Date;
  dates?: Date[];
  teacherIds?: string[];
  templateIds?: string[];
  customSlots?: { startTime: string; endTime: string }[];
}) {
  const res = await axiosInstance.post('/teacher-slots/generate', {
    ...payload,
    date: payload.date ? localDateKey(payload.date) : undefined,
    dates: payload.dates?.map((d) => localDateKey(d))
  });
  const { created, skipped } = res.data?.data || { created: 0, skipped: [] };
  // Says which slots were skipped and why, the first few in full
  const shown = skipped
    .slice(0, 3)
    .map((s: any) => `${s.teacher} ${s.startTime}–${s.endTime}: ${s.reason}`);
  if (skipped.length > shown.length)
    shown.push(`and ${skipped.length - shown.length} more`);
  toast({
    title: `${created} slot${created === 1 ? '' : 's'} generated${
      skipped.length ? `, ${skipped.length} skipped` : ''
    }`,
    description: shown.length ? shown.join('\n') : undefined,
    className: `${created ? 'bg-supperagent' : 'bg-red-500'} border-none text-white whitespace-pre-line`
  });
}

const multiSelectStyles = {
  ...selectStyles,
  control: (base: any) => ({ ...selectStyles.control(base), height: 'auto' })
};

type GenerateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate: Date;
  teachers: any[];
  teachersLoading: boolean;
  onGenerated: (date: Date) => void;
};

function DateField({
  date,
  setDate,
  label = 'Date',
  minDate = startOfToday()
}: {
  date: Date;
  setDate: (date: Date) => void;
  label?: string;
  minDate?: Date;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <DatePicker
        selected={date}
        onChange={(d: Date | null) =>
          d && setDate(moment(d).startOf('day').toDate())
        }
        minDate={minDate}
        wrapperClassName="w-full"
        dateFormat="dd-MM-yyyy"
        customInput={<DateButton fullWidth />}
      />
    </div>
  );
}

function NoTemplates() {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600">
      There are no slot templates yet. Create them in Settings → Slot Templates
      first.
    </p>
  );
}

type CustomRow = { id: string; startTime: string; endTime: string };

const newCustomRow = (): CustomRow => ({
  id: makeRowId(),
  startTime: '',
  endTime: ''
});

const isBlankRow = (row: CustomRow) => !row.startTime && !row.endTime;

// A blank row is ignored, so only a half or wrongly filled one is an error
const customRowError = (row: CustomRow) => {
  if (isBlankRow(row)) return '';
  if (!timeRegex.test(row.startTime) || !timeRegex.test(row.endTime))
    return 'Use HH:mm';
  if (toMinutes(row.endTime) <= toMinutes(row.startTime))
    return 'End must be after start';
  return '';
};

// The chosen template times plus the filled custom ones, in time order, and
// the first two that overlap: a teacher can not be in two slots at once
function useChosenSlots(
  templates: any[],
  templateIds: string[],
  customRows: CustomRow[]
) {
  const rowErrors = customRows.map(customRowError);
  const customSlots = customRows
    .filter((r) => !isBlankRow(r))
    .map(({ startTime, endTime }) => ({ startTime, endTime }));

  const ranges = useMemo(
    () =>
      [
        ...templates
          .filter((t) => templateIds.includes(t._id))
          .map((t) => ({ startTime: t.startTime, endTime: t.endTime })),
        ...customRows
          .filter((r) => !isBlankRow(r) && !customRowError(r))
          .map((r) => ({ startTime: r.startTime, endTime: r.endTime }))
      ].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [templates, templateIds, customRows]
  );

  const overlap = useMemo(() => {
    for (let i = 1; i < ranges.length; i++) {
      const prev = ranges[i - 1];
      const cur = ranges[i];
      if (
        timeRangesOverlap(
          prev.startTime,
          prev.endTime,
          cur.startTime,
          cur.endTime
        )
      ) {
        return `${formatTime(cur.startTime)} – ${formatTime(cur.endTime)} overlaps ${formatTime(
          prev.startTime
        )} – ${formatTime(prev.endTime)}`;
      }
    }
    return '';
  }, [ranges]);

  const valid = ranges.length > 0 && !overlap && rowErrors.every((e) => !e);

  return { ranges, overlap, rowErrors, customSlots, valid };
}

function CustomSlotsField({
  rows,
  setRows,
  errors,
  overlap
}: {
  rows: CustomRow[];
  setRows: React.Dispatch<React.SetStateAction<CustomRow[]>>;
  errors: string[];
  overlap: string;
}) {
  const updateRow = (
    id: string,
    field: 'startTime' | 'endTime',
    value: string
  ) =>
    setRows((list) =>
      list.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  const removeRow = (id: string) =>
    setRows((list) => list.filter((r) => r.id !== id));

  return (
    <>
      <div className="space-y-2">
        <Label>Custom slots</Label>
        {rows.map((row, i) => (
          <div key={row.id} className="space-y-1">
            <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
              {(['startTime', 'endTime'] as const).map((field) => (
                <Input
                  key={field}
                  value={row[field]}
                  placeholder={
                    field === 'startTime' ? 'Start HH:mm' : 'End HH:mm'
                  }
                  inputMode="numeric"
                  aria-label={field === 'startTime' ? 'Start time' : 'End time'}
                  onChange={(e) =>
                    updateRow(
                      row.id,
                      field,
                      maskTimeInput(e.target.value, row[field])
                    )
                  }
                  onBlur={() =>
                    updateRow(row.id, field, formatTimeInput(row[field]))
                  }
                />
              ))}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => removeRow(row.id)}
                aria-label="Remove custom slot"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {errors[i] && (
              <p className="text-xs font-medium text-red-600">{errors[i]}</p>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows((list) => [...list, newCustomRow()])}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-black/20 py-2 text-sm font-semibold text-supperagent transition hover:border-supperagent"
        >
          <Plus className="h-4 w-4" />{' '}
          {rows.length ? 'Add more' : 'Add custom slot'}
        </button>
      </div>

      {overlap && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600">
          {overlap}. A teacher can not have two slots at the same time.
        </p>
      )}
    </>
  );
}

// Same cap as the API, so a range is never sent that it would refuse
const MAX_RANGE_DAYS = 92;

// The chosen templates plus any custom times, for all (or the chosen) teachers
// on one date or on chosen days of a range. The slots go live on the public
// booking page at once, so it asks for a confirmation.

function BulkGenerateDialog({
  open,
  onOpenChange,
  initialDate,
  teachers,
  teachersLoading,
  onGenerated
}: GenerateDialogProps) {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [mode, setMode] = useState<'single' | 'range'>('single');
  const [date, setDate] = useState<Date>(initialDate);
  const [toDate, setToDate] = useState<Date>(initialDate);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [scope, setScope] = useState<'all' | 'selected'>('all');
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [templateIds, setTemplateIds] = useState<string[]>([]);
  const [customRows, setCustomRows] = useState<CustomRow[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { templates, loading } = useSlotTemplates(open);

  const teacherOptions = useMemo(
    () => teachers.map((t) => ({ value: t._id, label: t.name })),
    [teachers]
  );

  useEffect(() => {
    if (!open) return;
    setStep('form');
    setMode('single');
    setDate(initialDate);
    setToDate(moment(initialDate).add(6, 'day').toDate());
    setWeekdays([]);
    setScope('all');
    setTeacherIds([]);
    setTemplateIds([]);
    setCustomRows([]);
    setAcknowledged(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (id: string) =>
    setTemplateIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  const allSelected =
    templates.length > 0 && templateIds.length === templates.length;

  const toggleWeekday = (day: number) =>
    setWeekdays((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day]
    );

  // Keeps the range the right way round when the start moves past the end
  const setFromDate = (d: Date) => {
    setDate(d);
    if (moment(d).isAfter(toDate, 'day')) setToDate(d);
  };

  const tooLong =
    mode === 'range' && moment(toDate).diff(date, 'day') + 1 > MAX_RANGE_DAYS;

  // Every day the slots are made for: the one date, or each chosen weekday in the range
  const days = useMemo(() => {
    if (mode === 'single') return [date];
    if (tooLong) return [];
    const list: Date[] = [];
    for (const d = moment(date); !d.isAfter(toDate, 'day'); d.add(1, 'day')) {
      if (weekdays.includes(d.day())) list.push(d.toDate());
    }
    return list;
  }, [mode, date, toDate, weekdays, tooLong]);

  const { ranges, overlap, rowErrors, customSlots, valid } = useChosenSlots(
    templates,
    templateIds,
    customRows
  );

  const teacherCount = scope === 'all' ? teachers.length : teacherIds.length;
  const total = ranges.length * teacherCount * days.length;
  const teacherNames =
    scope === 'all'
      ? `All teachers (${teachers.length})`
      : teacherOptions
          .filter((o) => teacherIds.includes(o.value))
          .map((o) => o.label)
          .join(', ');

  const canContinue = !loading && days.length > 0 && teacherCount > 0 && valid;

  const publish = async () => {
    setGenerating(true);
    try {
      await postGenerate({
        ...(mode === 'single' ? { date } : { dates: days }),
        ...(scope === 'selected' ? { teacherIds } : {}),
        templateIds,
        customSlots
      });
      onOpenChange(false);
      onGenerated(days[0]);
    } catch (error) {
      failToast('Could not generate slots', error);
    } finally {
      setGenerating(false);
    }
  };

  const dateSummary =
    mode === 'single'
      ? moment(date).format('dddd, D MMMM YYYY')
      : `${WEEKDAYS.filter((w) => weekdays.includes(w.value))
          .map((w) => w.label)
          .join(', ')} from ${moment(date).format('D MMM YYYY')} to ${moment(
          toDate
        ).format(
          'D MMM YYYY'
        )} (${days.length} day${days.length === 1 ? '' : 's'})`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'form' ? 'Generate Slots' : 'Confirm & Publish'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' ? (
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-black/10 p-1">
                {[
                  { value: 'single', label: 'Single date' },
                  { value: 'range', label: 'Date range' }
                ].map((option) => (
                  <Button
                    variant="ghost"
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value as 'single' | 'range')}
                    className={`h-auto rounded-md py-1.5 text-sm font-semibold transition ${
                      mode === option.value
                        ? 'bg-supperagent text-white hover:bg-supperagent/90 hover:text-white'
                        : 'text-black hover:bg-transparent hover:text-supperagent'
                    }`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {mode === 'single' ? (
                <DateField date={date} setDate={setDate} />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DateField label="From" date={date} setDate={setFromDate} />
                    <DateField
                      label="To"
                      date={toDate}
                      setDate={setToDate}
                      minDate={date}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Days</Label>
                      <Button
                        variant="link"
                        type="button"
                        onClick={() =>
                          setWeekdays(
                            weekdays.length === WEEKDAYS.length
                              ? []
                              : WEEKDAYS.map((w) => w.value)
                          )
                        }
                        className="h-auto p-0 text-xs font-semibold text-supperagent hover:underline"
                      >
                        {weekdays.length === WEEKDAYS.length
                          ? 'Clear all'
                          : 'Select all'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {WEEKDAYS.map((w) => {
                        const active = weekdays.includes(w.value);
                        return (
                          <Button
                            variant="outline"
                            key={w.value}
                            type="button"
                            onClick={() => toggleWeekday(w.value)}
                            className={`h-auto rounded-md border py-2 text-xs font-semibold transition ${
                              active
                                ? 'border-supperagent bg-supperagent text-white hover:bg-supperagent/90 hover:text-white'
                                : 'border-black/10 bg-white text-black hover:border-supperagent hover:bg-white hover:text-black'
                            }`}
                          >
                            {w.label}
                          </Button>
                        );
                      })}
                    </div>
                    {tooLong ? (
                      <p className="text-xs font-medium text-red-600">
                        The range can be at most {MAX_RANGE_DAYS} days.
                      </p>
                    ) : (
                      weekdays.length > 0 && (
                        <p className="text-xs font-medium">
                          {days.length} day{days.length === 1 ? '' : 's'} in
                          this range
                        </p>
                      )
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label>Teachers</Label>
              <RadioGroup
                value={scope}
                onValueChange={(value) => setScope(value as 'all' | 'selected')}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { value: 'all', label: 'All teachers' },
                  { value: 'selected', label: 'Selected teachers' }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                      scope === option.value
                        ? 'border-supperagent bg-supperagent/5'
                        : 'border-black/10 hover:border-supperagent/50'
                    }`}
                  >
                    <RadioGroupItem value={option.value} />
                    {option.label}
                  </label>
                ))}
              </RadioGroup>
              {scope === 'selected' && (
                <Select
                  isMulti
                  options={teacherOptions}
                  value={teacherOptions.filter((o) =>
                    teacherIds.includes(o.value)
                  )}
                  onChange={(selected: any) =>
                    setTeacherIds(selected.map((o: any) => o.value))
                  }
                  placeholder="Select teachers"
                  isLoading={teachersLoading}
                  styles={multiSelectStyles}
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Slot templates</Label>
                {templates.length > 0 && (
                  <Button
                    variant="link"
                    type="button"
                    onClick={() =>
                      setTemplateIds(
                        allSelected ? [] : templates.map((t) => t._id)
                      )
                    }
                    className="h-auto p-0 text-xs font-semibold text-supperagent hover:underline"
                  >
                    {allSelected ? 'Clear all' : 'Select all'}
                  </Button>
                )}
              </div>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-supperagent" />
                </div>
              ) : templates.length === 0 ? (
                <NoTemplates />
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {templates.map((t) => {
                    const active = templateIds.includes(t._id);
                    return (
                      <Button
                        variant="outline"
                        key={t._id}
                        type="button"
                        onClick={() => toggle(t._id)}
                        className={`flex h-auto items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                          active
                            ? 'border-supperagent bg-supperagent text-white hover:bg-supperagent/90 hover:text-white'
                            : 'border-black/10 bg-white text-black hover:border-supperagent hover:bg-white hover:text-black'
                        }`}
                      >
                        {formatTime(t.startTime)} – {formatTime(t.endTime)}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            <CustomSlotsField
              rows={customRows}
              setRows={setCustomRows}
              errors={rowErrors}
              overlap={overlap}
            />

            <Button
              onClick={() => setStep('confirm')}
              disabled={!canContinue}
              className="w-full bg-supperagent text-white hover:bg-supperagent/90"
            >
              Continue
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-amber-900">
                  These slots will be published
                </p>
                <p className="text-amber-900">
                  As soon as they are generated they go live on the public
                  booking page. Every student can see them and book them
                  straight away.
                </p>
              </div>
            </div>

            <dl className="divide-y divide-black/10 rounded-lg border border-black/10 text-sm">
              {[
                {
                  label: mode === 'single' ? 'Date' : 'Dates',
                  value: dateSummary
                },
                { label: 'Teachers', value: teacherNames },
                {
                  label: mode === 'single' ? 'Slots each' : 'Slots a day',
                  value: `${ranges.length} (${ranges
                    .map(
                      (r) =>
                        `${formatTime(r.startTime)}–${formatTime(r.endTime)}`
                    )
                    .join(', ')})`
                },
                {
                  label: 'Total',
                  value: `Up to ${total} slot${total === 1 ? '' : 's'}`
                }
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3 px-3 py-2.5">
                  <dt className="w-24 shrink-0 font-medium">{label}</dt>
                  <dd className="min-w-0 break-words font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <Checkbox
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
                className="mt-0.5 h-4 w-4 border border-black/30 shadow-none [&_svg]:h-3.5 [&_svg]:w-3.5"
              />
              I understand these slots will be published and visible to
              everyone.
            </label>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep('form')}
                disabled={generating}
              >
                <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={publish}
                disabled={!acknowledged || generating}
                className="flex-1 bg-supperagent text-white hover:bg-supperagent/90"
              >
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Publish Slots
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
