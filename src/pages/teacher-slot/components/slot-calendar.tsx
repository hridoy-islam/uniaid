import { useEffect, useMemo, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  User,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import {
  END_H,
  HOURS,
  ROW_HEIGHT,
  START_H,
  durationLabel,
  fmtH,
  formatTime,
  isSlotPast,
  isToday,
  localDateKey,
  slotDateKey,
  studentName,
  toMinutes
} from '../utils';

// ── Visible range (week / month / custom) ────────────────────────────────────
export function useSlotCalendar() {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [currentDate, setCurrentDate] = useState(moment());
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [isCustomMode, setIsCustomMode] = useState(false);

  const [rangeStart, rangeEnd] = dateRange;
  const isCustomRange = !!(rangeStart && rangeEnd);

  const days = useMemo(() => {
    if (isCustomRange && !isCustomMode && rangeStart && rangeEnd) {
      const arr: Date[] = [];
      const curr = moment(rangeStart);
      const end = moment(rangeEnd);
      while (curr.isSameOrBefore(end, 'day')) {
        arr.push(curr.toDate());
        curr.add(1, 'day');
      }
      return arr;
    }
    if (viewMode === 'week') {
      const startOfWeek = currentDate.clone().startOf('isoWeek');
      return Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'days').toDate());
    }
    const startOfMonth = currentDate.clone().startOf('month');
    return Array.from({ length: currentDate.daysInMonth() }, (_, i) =>
      startOfMonth.clone().add(i, 'days').toDate()
    );
  }, [viewMode, currentDate, isCustomRange, isCustomMode, rangeStart, rangeEnd]);

  return {
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
    dateRange,
    setDateRange,
    isCustomMode,
    setIsCustomMode,
    isCustomRange,
    days,
    fromDate: days.length ? localDateKey(days[0]) : '',
    toDate: days.length ? localDateKey(days[days.length - 1]) : ''
  };
}

type Calendar = ReturnType<typeof useSlotCalendar>;

export function SlotCalendarToolbar({ calendar }: { calendar: Calendar }) {
  const {
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
    dateRange,
    setDateRange,
    isCustomMode,
    setIsCustomMode,
    isCustomRange,
    days
  } = calendar;
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [rangeStart, rangeEnd] = dateRange;
  const safeStart = rangeStart ? moment(rangeStart) : null;
  const safeEnd = rangeEnd ? moment(rangeEnd) : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const step = (dir: 1 | -1) =>
    setCurrentDate((prev) => prev.clone().add(dir, viewMode === 'week' ? 'week' : 'month'));

  const clearRange = () => {
    setDateRange([null, null]);
    setIsCustomMode(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border border-gray-200 bg-supperagent/10 p-1 shadow-sm">
        {(['week', 'month'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold capitalize transition-all duration-200 ${
              viewMode === mode
                ? 'bg-white text-supperagent shadow-sm'
                : 'text-black hover:bg-supperagent/20'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {isCustomRange && !isCustomMode ? (
        <div className="flex items-center gap-1 rounded-full border border-supperagent/30 bg-supperagent/5 p-1">
          <button
            onClick={() => setIsCustomMode(true)}
            className="flex items-center gap-2 px-3 py-1 text-xs font-semibold text-supperagent"
          >
            <CalendarRange className="h-3.5 w-3.5 flex-shrink-0" />
            {safeStart && safeEnd && safeStart.isSame(safeEnd, 'day')
              ? safeStart.format('DD MMM YYYY')
              : `${safeStart?.format('DD MMM YYYY')} → ${safeEnd?.format('DD MMM YYYY')}`}
          </button>
          <button
            onClick={clearRange}
            title="Back to normal view"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-supperagent transition-all hover:bg-red-100 hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : isCustomMode ? (
        <div
          className="flex w-full items-center gap-2 rounded-full border border-blue-300 bg-white p-1 shadow-sm sm:w-[19rem]"
          style={{ position: 'relative', zIndex: 50 }}
        >
          <CalendarRange className="ml-2 h-3.5 w-3.5 flex-shrink-0 text-supperagent" />
          <DatePicker
            selectsRange
            startDate={rangeStart}
            endDate={rangeEnd}
            onChange={(dates: [Date | null, Date | null]) => setDateRange(dates)}
            dateFormat="dd MMM yyyy"
            placeholderText="Select date range..."
            isClearable={false}
            popperPlacement="bottom-start"
            popperProps={{ strategy: 'fixed' }}
            wrapperClassName="w-full"
            className="w-full border-none bg-transparent text-xs font-semibold text-black outline-none placeholder:text-black"
          />
          <button
            onClick={() => setIsCustomMode(false)}
            disabled={!rangeStart || !rangeEnd}
            className="flex h-7 items-center gap-1 rounded-full bg-supperagent px-3 text-[11px] font-bold text-white transition-all hover:bg-supperagent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setIsCustomMode(false);
              if (!isCustomRange) setDateRange([null, null]);
            }}
            className="mr-1 flex h-7 w-7 items-center justify-center rounded-full text-black transition-all hover:bg-supperagent/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-supperagent/5 p-1">
          <Button
            variant="ghost"
            onClick={() => step(-1)}
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-supperagent hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setPickerOpen((o) => !o)}
              className="flex w-40 items-center justify-center gap-2 border-none text-sm font-bold uppercase text-black"
            >
              <CalendarDays className="h-4 w-4 text-supperagent" />
              {viewMode === 'week'
                ? `${moment(days[0]).format('DD MMM')} – ${moment(days[days.length - 1]).format('DD MMM')}`
                : currentDate.format('MMM YYYY')}
            </button>
            {pickerOpen && (
              <div className="absolute left-1/2 z-50 mt-2 -translate-x-1/2">
                <DatePicker
                  selected={currentDate.toDate()}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setCurrentDate(moment(date));
                      setPickerOpen(false);
                    }
                  }}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  inline
                />
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={() => step(1)}
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-supperagent hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <button
            onClick={() => setIsCustomMode(true)}
            className="ml-1 flex h-8 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-[11px] font-semibold text-black shadow-sm transition-all hover:border-supperagent hover:bg-supperagent/5 hover:text-supperagent"
          >
            <CalendarRange className="h-3 w-3" />
            Custom
          </button>
        </div>
      )}
    </div>
  );
}

// ── Grid ──────────────────────────────────────────────────────────────────────
type Placed = { slot: any; top: number; height: number; lane: number; lanes: number };

// Several teachers can hold slots at the same time, so overlapping slots of a
// day share the column side by side instead of covering each other.
function layoutDay(daySlots: any[]): Placed[] {
  const gridStart = START_H * 60;
  const gridEnd = END_H * 60;
  const items = daySlots
    .map((slot) => ({
      slot,
      s: Math.max(toMinutes(slot.startTime), gridStart),
      e: Math.min(toMinutes(slot.endTime), gridEnd)
    }))
    .filter((i) => i.s < i.e)
    .sort((a, b) => a.s - b.s || a.e - b.e);

  const placed: Placed[] = [];
  let cluster: (typeof items[number] & { lane: number })[] = [];
  let clusterEnd = -1;
  let laneEnds: number[] = [];

  const flush = () => {
    cluster.forEach((i) =>
      placed.push({
        slot: i.slot,
        top: ((i.s - gridStart) / 60) * ROW_HEIGHT,
        height: ((i.e - i.s) / 60) * ROW_HEIGHT,
        lane: i.lane,
        lanes: laneEnds.length
      })
    );
    cluster = [];
    laneEnds = [];
    clusterEnd = -1;
  };

  items.forEach((i) => {
    if (cluster.length && i.s >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= i.s);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = i.e;
    cluster.push({ ...i, lane });
    clusterEnd = Math.max(clusterEnd, i.e);
  });
  flush();
  return placed;
}

function slotColor(slot: any) {
  if (slot.status === 'booked') return { border: '#10b981', bg: 'bg-emerald-50' };
  if (!slot.teacherId) return { border: '#f59e0b', bg: 'bg-amber-50' };
  return { border: '#3b82f6', bg: 'bg-white' };
}

type GridProps = {
  days: Date[];
  slots: any[];
  loading?: boolean;
  showTeacher?: boolean;
  // Off where every slot belongs to the viewer, so none reads "No teacher yet".
  showUnassigned?: boolean;
  onCellClick?: (day: Date, hour: number) => void;
  onSlotClick?: (slot: any) => void;
};

export function SlotCalendarGrid({
  days,
  slots,
  loading,
  showTeacher,
  showUnassigned = true,
  onCellClick,
  onSlotClick
}: GridProps) {
  const byDay = useMemo(() => {
    const map: Record<string, Placed[]> = {};
    const grouped: Record<string, any[]> = {};
    slots.forEach((slot) => {
      const key = slotDateKey(slot.date);
      (grouped[key] = grouped[key] || []).push(slot);
    });
    Object.entries(grouped).forEach(([key, list]) => (map[key] = layoutDay(list)));
    return map;
  }, [slots]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div>
    );
  }

  return (
    <div className="relative my-3 max-h-[60vh] flex-1 overflow-auto rounded-sm border border-gray-300 bg-white shadow-sm md:max-h-[75vh]">
      <div className="flex" style={{ width: 'max-content', minWidth: '100%' }}>
        {/* Time column */}
        <div className="sticky left-0 z-30 w-16 min-w-[64px] flex-none bg-white shadow-[4px_0_8px_-3px_rgba(0,0,0,0.15)]">
          <div className="sticky top-0 z-30 flex h-[64px] items-center justify-end border-b border-r border-gray-200 bg-white px-2 text-[10px] font-semibold uppercase tracking-wide">
            Time
          </div>
          {HOURS.map((hr) => (
            <div
              key={hr}
              className="border-b border-r border-gray-200 px-2 pt-1 text-right text-[11px] font-semibold text-black"
              style={{ height: ROW_HEIGHT }}
            >
              {fmtH(hr)}
            </div>
          ))}
        </div>

        {days.map((d) => {
          const key = localDateKey(d);
          const today = isToday(d);
          const wknd = [0, 6].includes(d.getDay());
          return (
            <div key={key} className="min-w-[96px] flex-1 sm:min-w-[120px]">
              <div
                className="sticky top-0 z-20 h-[64px] border-b border-r border-gray-200 bg-white py-2 text-center"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-black">
                  {moment(d).format('ddd')}
                </div>
                {today ? (
                  <div className="mx-auto mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[13px] font-medium text-white">
                    {d.getDate()}
                  </div>
                ) : (
                  <div className="mt-1 text-sm font-medium text-black">{d.getDate()}</div>
                )}
                <div className="mt-0.5 text-[9px] font-medium text-black">
                  {moment(d).format('MMM')}
                </div>
              </div>

              <div className="relative">
                {HOURS.map((hr) => (
                  <div
                    key={hr}
                    className={`border-b border-r border-gray-200 p-1 ${
                      today ? 'bg-blue-50/20' : wknd ? 'bg-supperagent/5' : ''
                    }`}
                    style={{ height: ROW_HEIGHT }}
                  >
                    {onCellClick && (
                      <div
                        onClick={() => onCellClick(d, hr)}
                        className="group h-full w-full cursor-pointer"
                      >
                        <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-transparent transition-all group-hover:border-supperagent group-hover:bg-supperagent/5">
                          <Plus className="h-4 w-4 text-supperagent opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {(byDay[key] || []).map(({ slot, top, height, lane, lanes }) => {
                  const color = slotColor(slot);
                  return (
                    <div
                      key={slot._id}
                      onClick={() => onSlotClick?.(slot)}
                      title={`${slot.startTime} – ${slot.endTime}`}
                      className={`absolute z-10 flex flex-col overflow-hidden rounded-md border border-supperagent/20 p-1.5 text-xs shadow-sm transition-all ${color.bg} ${
                        onSlotClick ? 'cursor-pointer hover:shadow-md' : ''
                      } ${isSlotPast(slot) ? 'opacity-60' : ''}`}
                      style={{
                        top: top + 2,
                        height: Math.max(height - 4, 26),
                        left: `calc(${(lane / lanes) * 100}% + 4px)`,
                        width: `calc(${100 / lanes}% - 8px)`,
                        borderLeft: `3px solid ${color.border}`
                      }}
                    >
                      <div className="flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold text-black/80">
                        <Clock className="h-3 w-3 flex-shrink-0 text-supperagent" />
                        {slot.startTime} – {slot.endTime}
                      </div>
                      {showTeacher && (slot.teacherId || showUnassigned) && (
                        <div
                          className={`mt-0.5 truncate text-[10px] font-medium ${
                            slot.teacherId ? 'text-black' : 'italic text-amber-700'
                          }`}
                        >
                          {slot.teacherId?.name || 'No teacher yet'}
                        </div>
                      )}
                      {slot.status === 'booked' ? (
                        <div className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-semibold text-emerald-700">
                          <User className="h-3 w-3 flex-shrink-0" />
                          {studentName(slot.studentId) || 'Booked'}
                        </div>
                      ) : (
                        slot.note && (
                          <div className="mt-0.5 truncate text-[10px] text-black/70">{slot.note}</div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── List ──────────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  booked: 'bg-emerald-100 text-emerald-700',
  available: 'bg-blue-100 text-blue-700'
};

// The same slots as the grid, one card each, grouped under their day.
export function SlotList({
  slots,
  loading,
  onSlotClick
}: {
  slots: any[];
  loading?: boolean;
  onSlotClick?: (slot: any) => void;
}) {
  const groups = useMemo(() => {
    const byDay: Record<string, any[]> = {};
    [...slots]
      .sort(
        (a, b) =>
          slotDateKey(a.date).localeCompare(slotDateKey(b.date)) ||
          toMinutes(a.startTime) - toMinutes(b.startTime)
      )
      .forEach((slot) => {
        const key = slotDateKey(slot.date);
        (byDay[key] = byDay[key] || []).push(slot);
      });
    return Object.entries(byDay);
  }, [slots]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="my-3 rounded-md border border-gray-200 bg-white py-12 text-center">
        <p className="text-sm font-medium text-black">No slots in this period</p>
        <p className="mt-1 text-xs text-black">Try another week or month.</p>
      </div>
    );
  }

  return (
    <div className="my-3 space-y-4">
      {groups.map(([key, daySlots]) => {
        const day = moment(key, 'YYYY-MM-DD');
        return (
          <section key={key}>
            <h3
              className={`mb-2 text-xs font-bold uppercase tracking-wide ${
                isToday(day.toDate()) ? 'text-supperagent' : 'text-black'
              }`}
            >
              {day.format('ddd, DD MMM YYYY')}
              {isToday(day.toDate()) && ' · Today'}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {daySlots.map((slot) => {
                const color = slotColor(slot);
                return (
                  <button
                    key={slot._id}
                    type="button"
                    onClick={() => onSlotClick?.(slot)}
                    className={`flex w-full flex-col gap-1 rounded-md border border-gray-200 p-3 text-left shadow-sm transition-all hover:shadow-md ${color.bg} ${
                      isSlotPast(slot) ? 'opacity-60' : ''
                    }`}
                    style={{ borderLeft: `3px solid ${color.border}` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-sm font-semibold text-black">
                        <Clock className="h-3.5 w-3.5 text-supperagent" />
                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          STATUS_STYLES[slot.status] || 'bg-gray-100 text-black'
                        }`}
                      >
                        {slot.status}
                      </span>
                    </div>
                    <div className="text-xs text-black">
                      {durationLabel(slot.duration)}
                      {slot.teacherId?.name && ` · ${slot.teacherId.name}`}
                    </div>
                    {slot.status === 'booked' ? (
                      <div className="flex items-center gap-1 truncate text-xs font-semibold text-emerald-700">
                        <User className="h-3 w-3 flex-shrink-0" />
                        {studentName(slot.studentId) || 'Booked'}
                      </div>
                    ) : (
                      slot.note && <div className="truncate text-xs text-black/70">{slot.note}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// `showUnassigned` off for a teacher's own view: every slot there is theirs.
export function SlotLegend({ showUnassigned = true }: { showUnassigned?: boolean }) {
  const items = [
    { color: '#3b82f6', label: 'Available' },
    ...(showUnassigned ? [{ color: '#f59e0b', label: 'No teacher yet' }] : []),
    { color: '#10b981', label: 'Booked' }
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1">
          <span className="inline-block h-3 w-1 rounded" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
