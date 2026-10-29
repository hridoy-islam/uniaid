import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  Mail,
  ShieldCheck,
  Timer,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@/components/ui/input-otp';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import AsyncSelect from 'react-select/async';
import axiosInstance from '@/lib/axios';
import {
  durationLabel,
  formatSlotDate,
  formatTime,
  localDateKey,
  slotDateKey
} from '../teacher-slot/utils';

// Plain axios on purpose: this page is used by students who are not logged in
// to the portal, so it must not send (or try to refresh) a staff token.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

const RESET_SECONDS = 10;
const DATE_FORMAT = 'DD/MM/YYYY';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Verified = { email: string; token: string };

// Slots with the same start and end time are one time with several seats.
// The student books the time, the server picks one of its free seats.
type SeatGroup = {
  key: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  seats: number;
  available: number;
};

const errorMessage = (error: any) =>
  error?.response?.data?.message || 'Something went wrong, please try again.';

const failToast = (title: string, error: any) =>
  toast({
    title,
    description: errorMessage(error),
    className: 'bg-red-500 border-none text-white'
  });

const hasStarted = (slot: { date: string; startTime: string }) =>
  moment(
    `${slotDateKey(slot.date)} ${slot.startTime}`,
    'YYYY-MM-DD HH:mm'
  ).isBefore(moment());

const isBookable = (group: SeatGroup) =>
  group.available > 0 && !hasStarted(group);

const groupBySeats = (slots: any[]): SeatGroup[] => {
  const map = new Map<string, SeatGroup>();
  for (const slot of slots) {
    const key = `${slot.startTime}-${slot.endTime}`;
    const group = map.get(key) || {
      key,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
      seats: 0,
      available: 0
    };
    group.seats += 1;
    if (slot.status === 'available') group.available += 1;
    map.set(key, group);
  }
  return [...map.values()].sort(
    (a, b) =>
      a.startTime.localeCompare(b.startTime) ||
      a.endTime.localeCompare(b.endTime)
  );
};

const startOfToday = () => moment().startOf('day').toDate();

// Keeps typed text to digits and adds the slashes: "28102026" -> "28/10/2026"
const maskDate = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)]
    .filter(Boolean)
    .join('/');
};

// `embedded` renders the same page inside the portal (for agents), without
// its own header
export default function BookSlotPage({
  embedded = false
}: {
  embedded?: boolean;
}) {
  const [date, setDate] = useState<Date>(startOfToday);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableOnly, setAvailableOnly] = useState(false);
  // The calendar follows a typed date to its month, its arrows still browse
  const [month, setMonth] = useState<Date>(date);
  const [selected, setSelected] = useState<SeatGroup | null>(null);
  // A verified email stays usable if a booking fails, so the student can pick
  // another slot without a new code. Cleared when the page resets.
  const [verified, setVerified] = useState<Verified | null>(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/teacher-slots/public/slots', {
        params: { date: localDateKey(date) }
      });
      setSlots(res.data?.data || []);
    } catch (error) {
      failToast('Could not load slots', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    setMonth(date);
  }, [date]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [selected]);

  const backToSlots = useCallback(() => {
    setSelected(null);
    fetchSlots();
  }, [fetchSlots]);

  // Back to today with a clean form, as if the page was just opened
  const reset = useCallback(() => {
    setSelected(null);
    setVerified(null);
    setAvailableOnly(false);
    if (moment(date).isSame(moment(), 'day')) fetchSlots();
    else setDate(startOfToday());
  }, [date, fetchSlots]);

  const isToday = moment(date).isSame(moment(), 'day');
  const shiftDay = (days: number) =>
    setDate(moment(date).add(days, 'day').toDate());

  const groups = useMemo(() => groupBySeats(slots), [slots]);
  const bookableCount = groups.filter(isBookable).length;
  // Bookable times first, each part still in time order
  const visible = availableOnly
    ? groups.filter(isBookable)
    : [...groups.filter(isBookable), ...groups.filter((g) => !isBookable(g))];

  return (
    <div className={embedded ? '' : 'min-h-screen bg-white'}>
      {!embedded && (
        <header className="flex h-14 items-center bg-supperagent px-4 text-white sm:h-16 sm:px-6">
          <Layers className="mr-2 h-6 w-6" />
          <span className="text-lg font-semibold">UniAid</span>
          <span className="ml-3 border-l border-white/30 pl-3 text-sm opacity-90">
            Slot Booking
          </span>
        </header>
      )}

      <main
        className={
          embedded ? 'py-2' : 'container mx-auto px-4 py-5 sm:px-8 sm:py-10'
        }
      >
        {selected ? (
          <BookingView
            slot={selected}
            verified={verified}
            onVerified={setVerified}
            onBack={backToSlots}
            onReset={reset}
            staff={embedded}
          />
        ) : (
          <>
            <div className="mb-5 sm:mb-8">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Book a Slot
              </h1>
              <p className="mt-1.5 text-sm text-black">
                {embedded
                  ? 'Pick a date, choose an available time and assign it to a student.'
                  : 'Pick a date, choose an available time and confirm with your student email.'}
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[320px_1fr]">
              {/* ── Date ─────────────────────────────────────────────── */}
              <aside className="h-fit overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                <div className="border-b border-black/10 px-4 py-3 sm:px-5 sm:py-4">
                  <h2 className="text-sm font-semibold">Date</h2>
                  <p className="text-xs text-black">
                    <span className="hidden lg:inline">
                      Type a date or pick one from the calendar.
                    </span>
                    <span className="lg:hidden">
                      Type a date or tap the calendar icon.
                    </span>
                  </p>
                </div>
                <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
                  <DateField value={date} onChange={setDate} />
                  <div className="flex gap-2">
                    {[
                      { label: 'Today', days: 0 },
                      { label: 'Tomorrow', days: 1 }
                    ].map(({ label, days }) => {
                      const target = moment().add(days, 'day').startOf('day');
                      const active = target.isSame(date, 'day');
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setDate(target.toDate())}
                          className={`h-9 flex-1 rounded-md border px-3 text-xs font-semibold transition sm:h-8 ${
                            active
                              ? 'border-supperagent bg-supperagent text-white'
                              : 'border-black/10 text-black hover:border-supperagent hover:text-supperagent'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* On a phone the calendar opens from the date field instead */}
                <div className="hidden justify-center border-t border-black/10 lg:flex">
                  <Calendar
                    mode="single"
                    selected={date}
                    month={month}
                    onMonthChange={setMonth}
                    onSelect={(d) => d && setDate(d)}
                    {...calendarProps}
                  />
                </div>
              </aside>

              {/* ── Slots ────────────────────────────────────────────── */}
              <section className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
                    <Button
                      size="icon"
                      className="h-9 w-9 shrink-0 border-none bg-supperagent text-white hover:bg-supperagent/90 sm:h-8 sm:w-8"
                      disabled={isToday}
                      onClick={() => shiftDay(-1)}
                      aria-label="Previous day"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0 text-center sm:text-left">
                      <h2 className="truncate font-semibold">
                        <span className="sm:hidden">
                          {moment(date).format('ddd, D MMM YYYY')}
                        </span>
                        <span className="hidden sm:inline">
                          {moment(date).format('dddd, D MMMM YYYY')}
                        </span>
                      </h2>
                      <p className="text-xs text-black">
                        {loading
                          ? 'Loading slots…'
                          : `${bookableCount} available · ${groups.length} total`}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      className="h-9 w-9 shrink-0 border-none bg-supperagent text-white hover:bg-supperagent/90 sm:h-8 sm:w-8"
                      onClick={() => shiftDay(1)}
                      aria-label="Next day"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Colour key: beside the filter on a phone, below it on larger screens */}
                  <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:w-auto sm:flex-col sm:items-end sm:justify-start">
                    <label className="flex h-9 cursor-pointer select-none items-center gap-2 rounded-md border border-black/10 px-3 text-sm font-medium sm:h-8">
                      <Checkbox
                        checked={availableOnly}
                        onCheckedChange={(checked) =>
                          setAvailableOnly(checked === true)
                        }
                        className="h-4 w-4 border border-black/10 shadow-none [&_svg]:h-3.5 [&_svg]:w-3.5"
                      />
                      Show available only
                    </label>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
                      {[
                        {
                          label: 'Available',
                          swatch: 'border-emerald-500 bg-emerald-100'
                        },
                        {
                          label: 'Booked',
                          swatch: 'border-rose-500 bg-rose-100'
                        },
                        {
                          label: 'Unavailable',
                          swatch: 'border-amber-500 bg-amber-100'
                        }
                      ].map(({ label, swatch }) => (
                        <span key={label} className="flex items-center gap-1.5">
                          <span
                            className={`h-3 w-3 rounded-sm border ${swatch}`}
                          />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-5">
                  {loading ? (
                    <div className="flex justify-center py-20">
                      <BlinkingDots size="large" color="bg-supperagent" />
                    </div>
                  ) : visible.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white">
                        <CalendarDays className="h-7 w-7 text-black" />
                      </div>
                      <p className="font-semibold">
                        {availableOnly && groups.length
                          ? 'No available slots on this day'
                          : 'No slots on this day'}
                      </p>
                      <p className="mt-1 text-sm text-black">
                        Please choose another date.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {visible.map((group) => (
                        <SlotCard
                          key={group.key}
                          group={group}
                          onSelect={setSelected}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {/* The portal layout already has its own toaster */}
      {!embedded && <Toaster />}
    </div>
  );
}

// Shared look and limits for both calendars
const calendarProps = {
  fromDate: startOfToday(),
  disabled: { before: startOfToday() },
  showOutsideDays: false,
  classNames: {
    day_selected:
      'bg-supperagent text-white hover:bg-supperagent hover:text-white focus:bg-supperagent focus:text-white',
    day_today: 'font-bold text-supperagent'
  }
};

// On a phone the inline calendar is hidden, so the field opens one instead
function CalendarButton({
  value,
  onChange
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Open calendar"
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-supperagent text-white transition hover:bg-supperagent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-supperagent lg:hidden"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          onSelect={(d) => {
            if (!d) return;
            onChange(moment(d).startOf('day').toDate());
            setOpen(false);
          }}
          initialFocus
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  );
}

function DateField({
  value,
  onChange
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [text, setText] = useState(moment(value).format(DATE_FORMAT));
  const [error, setError] = useState('');

  useEffect(() => {
    setText(moment(value).format(DATE_FORMAT));
    setError('');
  }, [value]);

  const commit = (raw = text) => {
    const parsed = moment(raw, DATE_FORMAT, true);
    if (!parsed.isValid()) return setError('Enter a valid date as DD/MM/YYYY');
    if (parsed.isBefore(moment(), 'day'))
      return setError('Choose today or a later date');
    setError('');
    if (!parsed.isSame(value, 'day')) onChange(parsed.startOf('day').toDate());
  };

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
        <Input
          value={text}
          inputMode="numeric"
          placeholder="DD/MM/YYYY"
          aria-label="Date"
          aria-invalid={!!error}
          className={`h-10 pl-9 pr-11 font-medium tracking-wide lg:pr-3 ${error ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
          onChange={(e) => {
            const next = maskDate(e.target.value);
            setText(next);
            setError('');
            if (next.length === DATE_FORMAT.length) commit(next);
          }}
          onBlur={() => commit()}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
        <CalendarButton value={value} onChange={onChange} />
      </div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

// Status shown by colour: available green, booked red, passed amber
function SlotCard({
  group,
  onSelect
}: {
  group: SeatGroup;
  onSelect: (group: SeatGroup) => void;
}) {
  const full = group.available === 0;
  const disabled = !isBookable(group);
  const tone = full
    ? {
        card: 'border-rose-200 border-l-rose-500 bg-rose-50/60',
        icon: 'bg-rose-100 text-rose-600',
        badge: 'bg-rose-100 text-rose-700 ring-rose-200',
        label: 'Booked',
        footer: 'No seats left'
      }
    : disabled
      ? {
          card: 'border-amber-200 border-l-amber-500 bg-amber-50/60',
          icon: 'bg-amber-100 text-amber-700',
          badge: 'bg-amber-100 text-amber-800 ring-amber-200',
          label: 'Unavailable',
          footer: 'This time has passed'
        }
      : {
          card: 'border-emerald-200 border-l-emerald-500 bg-white hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100',
          icon: 'bg-emerald-100 text-emerald-700',
          badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
          label: 'Available',
          footer: ''
        };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(group)}
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-l-4 text-left text-black shadow-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${tone.card} ${
        disabled ? 'cursor-not-allowed' : ''
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
        >
          <Clock className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="whitespace-nowrap text-lg font-semibold tabular-nums leading-tight">
            {formatTime(group.startTime)} – {formatTime(group.endTime)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tone.badge}`}
            >
              {tone.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-black/5 px-4 py-2.5 text-xs font-medium">
        <span className="inline-flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5" />
          {durationLabel(group.duration)}
        </span>
        {disabled ? (
          <span>{tone.footer}</span>
        ) : (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
            Book now
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </button>
  );
}

// The booking step, shown in place of the slot list
function BookingView({
  slot,
  verified,
  onVerified,
  onBack,
  onReset,
  staff = false
}: {
  slot: SeatGroup;
  verified: Verified | null;
  onVerified: (v: Verified) => void;
  onBack: () => void;
  onReset: () => void;
  // Admin or agent in the portal: choose a student, no OTP
  staff?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [booked, setBooked] = useState<any>(null);
  const [resetIn, setResetIn] = useState(RESET_SECONDS);
  const [student, setStudent] = useState<StudentOption | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Fresh form for each slot, keeping the email once it has been verified
  useEffect(() => {
    setEmail(verified?.email || '');
    setOtp('');
    setCodeSent(false);
    setBooked(null);
    setResetIn(RESET_SECONDS);
    setConfirming(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // The thank you message counts down, then the whole page starts over
  useEffect(() => {
    if (!booked) return;
    if (resetIn <= 0) {
      onReset();
      return;
    }
    const t = setTimeout(() => setResetIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [booked, resetIn, onReset]);

  const trimmed = email.trim().toLowerCase();
  const isVerified = !!verified && verified.email === trimmed;
  const validEmail = emailRegex.test(trimmed);

  const sendCode = async () => {
    if (!validEmail) return;
    setSending(true);
    try {
      await api.post('/teacher-slots/public/send-otp', { email: trimmed });
      setCodeSent(true);
      setOtp('');
      setResendIn(60);
      toast({
        title: 'Verification code sent',
        description: `Check ${trimmed} for a 6 digit code.`,
        className: 'bg-supperagent border-none text-white'
      });
    } catch (error) {
      failToast('Could not send code', error);
    } finally {
      setSending(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let token = isVerified ? verified!.token : '';
    if (!token) {
      try {
        const res = await api.post('/teacher-slots/public/verify-otp', {
          email: trimmed,
          otp
        });
        token = res.data.data.bookingToken;
        onVerified({ email: trimmed, token });
      } catch (error) {
        failToast('Verification failed', error);
        setSubmitting(false);
        return;
      }
    }

    try {
      const res = await api.post(
        '/teacher-slots/public/book',
        {
          date: slotDateKey(slot.date),
          startTime: slot.startTime,
          endTime: slot.endTime
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBooked(res.data.data);
    } catch (error: any) {
      failToast('Booking failed', error);
      // The last seats went to someone else first, so show the day again
      if (error?.response?.status === 409) onBack();
    } finally {
      setSubmitting(false);
    }
  };

  const bookForStudent = async () => {
    if (!student) return;
    setSubmitting(true);
    try {
      const res = await axiosInstance.post('/teacher-slots/book-for-student', {
        date: slotDateKey(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        studentId: student.value
      });
      setBooked(res.data.data);
    } catch (error: any) {
      failToast('Booking failed', error);
      // Seats gone: show the day again. A clash with the student's own
      // booking keeps this view so another student can be chosen.
      if (
        error?.response?.status === 409 &&
        !/already booked/i.test(errorMessage(error))
      )
        onBack();
    } finally {
      setConfirming(false);
      setSubmitting(false);
    }
  };

  const bookedEmail = staff ? student?.email : trimmed;

  if (booked) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-black/10 bg-white px-6 py-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold">Thank you!</h1>
        <p className="mt-1.5 text-sm text-black">
          {staff ? (
            <>
              The slot is booked for{' '}
              <span className="font-semibold">{student?.name}</span>.
            </>
          ) : (
            'Your slot is booked.'
          )}{' '}
          A confirmation email has been sent to{' '}
          <span className="font-semibold text-black">{bookedEmail}</span>.
        </p>
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-4 text-left text-sm">
          <SlotSummary slot={booked} showTeacher={staff} />
        </div>
        <Button variant="outline" className="mt-6" onClick={onReset}>
          Book another slot
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-4 h-9 text-supperagent hover:bg-supperagent/10 hover:text-supperagent sm:mb-6"
        onClick={onBack}
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to slots
      </Button>

      <div className="mb-5 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Confirm your booking
        </h1>
        <p className="mt-1.5 text-sm text-black">
          {staff
            ? 'Choose the student to book this time for.'
            : 'Verify your student email to book this time.'}
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-[1fr_1.2fr]">
        <section className="h-fit overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="text-sm font-semibold">Your slot</h2>
          </div>
          <div className="p-4 text-sm sm:p-5">
            <SlotSummary slot={slot} showTeacher={false} />
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="text-sm font-semibold">Student details</h2>
          </div>
          {staff ? (
            <div className="space-y-5 p-4 sm:p-5">
              <div className="space-y-2">
                <Label>Student</Label>
                <StudentSelect value={student} onChange={setStudent} />
                <p className="text-xs text-black">
                  Search by name, email or student ID.
                </p>
              </div>
              <Button
                type="button"
                disabled={!student}
                onClick={() => setConfirming(true)}
                className="h-10 w-full bg-supperagent text-white hover:bg-supperagent/90"
              >
                Confirm Booking
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5 p-4 sm:p-5">
              <div className="space-y-2">
                <Label htmlFor="email">Student email</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setCodeSent(false);
                      setOtp('');
                    }}
                    placeholder="you@example.com"
                    className="h-10 min-w-0"
                    autoFocus
                  />
                  {isVerified ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-3 text-sm font-semibold text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                      Verified
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={sendCode}
                      disabled={!validEmail || sending || resendIn > 0}
                      className="h-10 shrink-0 border-none bg-supperagent text-white hover:bg-supperagent/90"
                    >
                      {sending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      {codeSent
                        ? resendIn > 0
                          ? `Resend ${resendIn}s`
                          : 'Resend'
                        : 'Verify'}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-black">
                  Use the email you registered with as a student.
                </p>
              </div>

              {codeSent && !isVerified && (
                <div className="space-y-3 rounded-xl border border-supperagent/20 bg-supperagent/5 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-supperagent text-white">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <Label className="text-sm font-semibold">
                        Enter verification code
                      </Label>
                      <p className="text-xs text-black">
                        We sent a 6 digit code to{' '}
                        <span className="break-all font-semibold">
                          {trimmed}
                        </span>
                      </p>
                    </div>
                  </div>
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    autoFocus
                    containerClassName="justify-center gap-2 sm:justify-start"
                  >
                    <InputOTPGroup className="gap-1.5 sm:gap-2">
                      {[0, 1, 2].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-12 w-11 rounded-lg border border-black/15 bg-white text-xl font-semibold text-black shadow-none first:rounded-lg last:rounded-lg data-[active=true]:border-supperagent data-[active=true]:ring-2 data-[active=true]:ring-supperagent/20 sm:h-14 sm:w-12"
                        />
                      ))}
                    </InputOTPGroup>
                    <span className="h-0.5 w-3 rounded-full bg-black/30" />
                    <InputOTPGroup className="gap-1.5 sm:gap-2">
                      {[3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-12 w-11 rounded-lg border border-black/15 bg-white text-xl font-semibold text-black shadow-none first:rounded-lg last:rounded-lg data-[active=true]:border-supperagent data-[active=true]:ring-2 data-[active=true]:ring-supperagent/20 sm:h-14 sm:w-12"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-xs text-black">
                    The code is valid for 10 minutes. Didn't get it? Check your
                    spam folder or use Resend.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  submitting || (!isVerified && (!codeSent || otp.length !== 6))
                }
                className="h-10 w-full bg-supperagent text-white hover:bg-supperagent/90"
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Booking
              </Button>
            </form>
          )}
        </section>
      </div>

      <Dialog
        open={confirming}
        onOpenChange={(open) => !submitting && setConfirming(open)}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm booking</DialogTitle>
            <DialogDescription className="text-black">
              Book this slot for the student below? They will get a confirmation
              email.
            </DialogDescription>
          </DialogHeader>
          {student && (
            <div className="space-y-4 rounded-lg border border-black/10 p-4 text-sm text-black">
              <SlotSummary slot={slot} showTeacher={false} />
              <div className="flex items-start gap-3 border-t border-black/10 pt-4">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-supperagent" />
                <div className="min-w-0">
                  <p className="font-semibold">{student.name}</p>
                  <p className="truncate">{student.email}</p>
                  {student.refId && <p>ID: {student.refId}</p>}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={submitting}
              onClick={bookForStudent}
              className="bg-supperagent text-white hover:bg-supperagent/90"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export type StudentOption = {
  value: string;
  name: string;
  email: string;
  refId?: string;
};

const toStudentOption = (s: any): StudentOption => ({
  value: s._id,
  name: [s.firstName, s.lastName].filter(Boolean).join(' ') || s.email,
  email: s.email,
  refId: s.refId
});

// The server limits agents to their own students. Typing is debounced so a
// search only runs once the user pauses.
const SEARCH_DELAY_MS = 300;
let searchTimer: ReturnType<typeof setTimeout> | undefined;
const searchStudents = (searchTerm: string) =>
  new Promise<StudentOption[]>((resolve) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      try {
        const res = await axiosInstance.get('/teacher-slots/booking-students', {
          params: { searchTerm }
        });
        resolve((res.data?.data || []).map(toStudentOption));
      } catch (error) {
        failToast('Could not load students', error);
        resolve([]);
      }
    }, SEARCH_DELAY_MS);
  });

export function StudentSelect({
  value,
  onChange,
  portal = true
}: {
  value: StudentOption | null;
  onChange: (student: StudentOption | null) => void;
  // Off inside a dialog: a modal dialog blocks clicks outside itself
  portal?: boolean;
}) {
  return (
    <AsyncSelect<StudentOption>
      cacheOptions
      defaultOptions
      isClearable
      value={value}
      onChange={(option) => onChange(option)}
      loadOptions={searchStudents}
      // Rendered on the body so the card's overflow does not clip it
      menuPortalTarget={portal ? document.body : undefined}
      getOptionValue={(option) => option.value}
      getOptionLabel={(option) => option.name}
      placeholder="Search student…"
      noOptionsMessage={({ inputValue }) =>
        inputValue ? 'No matching students' : 'No students found'
      }
      formatOptionLabel={(option, { context }) =>
        context === 'value' ? (
          <span className="text-sm font-medium text-black">
            {option.name} · {option.email}
          </span>
        ) : (
          <div className="min-w-0 text-sm text-black">
            <p className="truncate font-medium">{option.name}</p>
            <p className="truncate text-xs">
              {[option.email, option.refId].filter(Boolean).join(' · ')}
            </p>
          </div>
        )
      }
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: 44,
          borderColor: state.isFocused ? 'black' : 'rgba(0,0,0,0.1)',
          boxShadow: 'none',
          '&:hover': { borderColor: 'black' }
        }),
        placeholder: (base) => ({ ...base, color: 'black' }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected
            ? 'rgba(0,0,0,0.08)'
            : state.isFocused
              ? 'rgba(0,0,0,0.04)'
              : 'white',
          color: 'black'
        }),
        menuPortal: (base) => ({ ...base, zIndex: 50 }),
        menu: (base) => ({ ...base, zIndex: 50 })
      }}
    />
  );
}

// The teacher is only known once a seat has been booked
function SlotSummary({
  slot,
  showTeacher = true
}: {
  slot: any;
  showTeacher?: boolean;
}) {
  const rows = [
    {
      icon: CalendarDays,
      label: 'Date',
      value: formatSlotDate(slot.date, 'dddd, D MMMM YYYY')
    },
    {
      icon: Clock,
      label: 'Time',
      value: `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`
    },
    { icon: Timer, label: 'Duration', value: durationLabel(slot.duration) },
    ...(showTeacher
      ? [{ icon: User, label: 'Teacher', value: slot.teacherId?.name || '—' }]
      : [])
  ];
  return (
    <dl className="space-y-2.5">
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-start gap-3">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-supperagent" />
          <dt className="w-20 shrink-0 text-black">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
