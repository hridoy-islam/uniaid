import { useCallback, useEffect, useState } from 'react';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  Timer,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { DateButton } from './index';
import {
  durationLabel,
  formatSlotDate,
  formatTime,
  localDateKey,
  studentName,
  ukTodayKey
} from './utils';

// Today in UK time, as a local date for the date picker
const startOfToday = () => moment(ukTodayKey(), 'YYYY-MM-DD').toDate();

// A teacher's own slots, one day at a time, laid out like Teacher Slots
export default function MySlotsPage() {
  const [date, setDate] = useState<Date>(startOfToday);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  // The server scopes this list to the logged in teacher
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const key = localDateKey(date);
      const response = await axiosInstance.get('/teacher-slots', {
        params: { fromDate: key, toDate: key, limit: 'all' }
      });
      setSlots(response.data?.data?.result || []);
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

  const booked = slots.filter((s) => s.status === 'booked').length;
  const isToday = localDateKey(date) === ukTodayKey();
  const shiftDay = (days: number) =>
    setDate(moment(date).add(days, 'day').toDate());

  return (
    // The whole page is one card: header, day navigation and the slots
    <div className="flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white text-black shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 px-4 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-supperagent" />
              <h1 className="text-2xl font-semibold">My Slots</h1>
            </div>
            <p className="pl-7 text-xs font-semibold">
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

        <div className="flex items-center gap-4 text-xs font-medium">
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

      {/* ── Slots ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <BlinkingDots size="large" color="bg-supperagent" />
        </div>
      ) : slots.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-supperagent/10">
            <CalendarDays className="h-7 w-7 text-supperagent" />
          </div>
          <p className="font-semibold">
            No slots on {moment(date).format('dddd, D MMMM YYYY')}
          </p>
          <p className="mt-1 text-sm">Choose another date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {slots.map((slot) => (
            <MySlotCard key={slot._id} slot={slot} onClick={setSelected} />
          ))}
        </div>
      )}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Slot Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <dl className="grid grid-cols-3 gap-y-2 text-sm text-black">
              <dt>Teacher</dt>
              <dd className="col-span-2 font-medium">
                {selected.teacherId?.name || '—'}
              </dd>
              <dt>Date</dt>
              <dd className="col-span-2 font-medium">
                {formatSlotDate(selected.date)}
              </dd>
              <dt>Time</dt>
              <dd className="col-span-2 font-medium">
                {formatTime(selected.startTime)} –{' '}
                {formatTime(selected.endTime)}
              </dd>
              <dt>Duration</dt>
              <dd className="col-span-2 font-medium">
                {durationLabel(selected.duration)}
              </dd>
              <dt>Status</dt>
              <dd className="col-span-2 font-medium capitalize">
                {selected.status}
              </dd>
              {selected.note && (
                <>
                  <dt>Note</dt>
                  <dd className="col-span-2">{selected.note}</dd>
                </>
              )}
              {selected.status === 'booked' && selected.studentId && (
                <>
                  <dt>Student</dt>
                  <dd className="col-span-2 font-medium">
                    {studentName(selected.studentId)}
                  </dd>
                  <dt>Email</dt>
                  <dd className="col-span-2">{selected.studentId.email}</dd>
                  {selected.studentId.phone && (
                    <>
                      <dt>Phone</dt>
                      <dd className="col-span-2">{selected.studentId.phone}</dd>
                    </>
                  )}
                  {selected.bookedAt && (
                    <>
                      <dt>Booked At</dt>
                      <dd className="col-span-2">
                        {moment(selected.bookedAt).format('DD MMM YYYY, HH:mm')}
                      </dd>
                    </>
                  )}
                </>
              )}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// A full card per slot: time and status on top, then duration and the
// student it is booked for
function MySlotCard({
  slot,
  onClick
}: {
  slot: any;
  onClick: (slot: any) => void;
}) {
  const booked = slot.status === 'booked';
  const student = booked && slot.studentId ? studentName(slot.studentId) : '';

  return (
    <button
      type="button"
      onClick={() => onClick(slot)}
      className={`group relative flex flex-col overflow-hidden rounded-xl border text-left text-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-supperagent ${
        booked
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-blue-200 bg-blue-50'
      }`}
    >
      {/* Status accent down the left edge */}
      <span
        className={`absolute inset-y-0 left-0 w-1 ${
          booked ? 'bg-emerald-500' : 'bg-blue-500'
        }`}
      />

      <div className="space-y-4 p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${
                booked ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
            >
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-semibold tabular-nums leading-tight">
                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
              </p>
              <p className="text-xs font-medium">
                {formatSlotDate(slot.date, 'ddd, D MMM YYYY')}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ${
              booked ? 'bg-emerald-600' : 'bg-blue-600'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            {booked ? 'Booked' : 'Available'}
          </span>
        </div>

        <div
          className={`grid grid-cols-[auto_1fr] divide-x rounded-lg border bg-white ${
            booked
              ? 'divide-emerald-200 border-emerald-200'
              : 'divide-blue-200 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <Timer className="h-4 w-4 shrink-0 text-supperagent" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider">
                Duration
              </p>
              <p className="whitespace-nowrap text-sm font-semibold">
                {durationLabel(slot.duration)}
              </p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2.5 px-3 py-2.5">
            <User className="h-4 w-4 shrink-0 text-supperagent" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider">
                Student
              </p>
              {booked ? (
                <>
                  <p className="truncate text-sm font-semibold">
                    {student || 'Student'}
                  </p>
                  {slot.studentId?.email && (
                    <p className="flex items-center gap-1 truncate text-xs">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{slot.studentId.email}</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm font-medium">Not booked yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
