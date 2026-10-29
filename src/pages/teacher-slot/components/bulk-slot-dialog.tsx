import { Fragment, useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import moment from 'moment';
import {
  AlertCircle,
  CalendarRange,
  Check,
  CheckCircle2,
  Copy,
  Layers,
  Loader2,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import {
  START_H,
  WEEKDAYS,
  durationLabel,
  durationMinutes,
  fmtH,
  formatTimeInput,
  keepOpenForSelectMenu,
  localDateKey,
  makeRowId,
  maskTimeInput,
  portalSelectProps,
  slotDateKey,
  teacherIdOf,
  timeRangesOverlap,
  timeRegex
} from '../utils';

interface BulkRow {
  id: string;
  date: Date | null;
  startTime: string;
  endTime: string;
  teacher: string;
}

interface BulkRowErrors {
  date?: string;
  startTime?: string;
  endTime?: string;
  overlap?: string;
}

export interface SkippedSlot {
  date?: string;
  startTime?: string;
  endTime?: string;
  reason: string;
}

type DayTimes = { start: string; end: string; teacher: string };

function createEmptyRow(seed?: Partial<BulkRow>): BulkRow {
  return { id: makeRowId(), date: null, startTime: '', endTime: '', teacher: '', ...seed };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherOptions: { value: string; label: string }[];
  teachersLoading?: boolean;
  onSaved: (skipped: SkippedSlot[]) => void;
};

export function BulkSlotDialog({
  open,
  onOpenChange,
  teacherOptions,
  teachersLoading,
  onSaved
}: Props) {
  const [rows, setRows] = useState<BulkRow[]>([createEmptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  // Missing fields are only flagged after a save attempt; clashes are shown
  // live since they are checked against data already fetched.
  const [attempted, setAttempted] = useState(false);
  const [savedSlots, setSavedSlots] = useState<any[]>([]);

  const [genShow, setGenShow] = useState(true);
  const [genRange, setGenRange] = useState<[Date | null, Date | null]>([null, null]);
  // Weekday (0 = Sunday … 6 = Saturday) → its own times and, optionally, teacher
  const [genDayTimes, setGenDayTimes] = useState<Record<number, DayTimes>>({});

  useEffect(() => {
    if (open) {
      setRows([createEmptyRow()]);
      setAttempted(false);
      setGenShow(true);
      setGenRange([null, null]);
      setGenDayTimes({});
    }
  }, [open]);

  // Saved slots on the dates in the table, for the live clash check.
  const dateKeys = useMemo(
    () => [...new Set(rows.map((r) => r.date && localDateKey(r.date)).filter(Boolean))].sort() as string[],
    [rows]
  );
  const rangeKey = dateKeys.length ? `${dateKeys[0]}|${dateKeys[dateKeys.length - 1]}` : '';

  useEffect(() => {
    if (!open || !rangeKey) {
      setSavedSlots([]);
      return;
    }
    const [fromDate, toDate] = rangeKey.split('|');
    let cancelled = false;
    axiosInstance
      .get('/teacher-slots', { params: { fromDate, toDate, limit: 'all' } })
      .then((res) => !cancelled && setSavedSlots(res.data?.data?.result || []))
      .catch(() => !cancelled && setSavedSlots([]));
    return () => {
      cancelled = true;
    };
  }, [open, rangeKey]);

  // ── Rows ────────────────────────────────────────────────────────────────
  const updateRow = (id: string, patch: Partial<BulkRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const duplicateRow = (id: string) =>
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx + 1, 0, { ...prev[idx], id: makeRowId() });
      return next;
    });

  const removeRow = (id: string) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));

  // ── Generator ───────────────────────────────────────────────────────────
  const [genFrom, genTo] = genRange;
  const genDays = WEEKDAYS.filter((d) => genDayTimes[d.value]);

  const toggleGenDay = (day: number) =>
    setGenDayTimes((prev) => {
      if (prev[day]) {
        const next = { ...prev };
        delete next[day];
        return next;
      }
      return { ...prev, [day]: { start: '', end: '', teacher: '' } };
    });

  const updateGenDay = (day: number, field: keyof DayTimes, value: string) =>
    setGenDayTimes((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  const genDayError = (day: number) => {
    const t = genDayTimes[day];
    if (!t || !t.start || !t.end) return '';
    if (!timeRegex.test(t.start) || !timeRegex.test(t.end)) return 'Use HH:mm';
    if (!durationMinutes(t.start, t.end)) return 'End must be after start';
    return '';
  };

  // The teacher is optional here too, only the times are required
  const genDayComplete = (day: number) => {
    const t = genDayTimes[day];
    return !!t && !!t.start && !!t.end && !genDayError(day);
  };

  const canGenerate =
    !!genFrom && !!genTo && genDays.length > 0 && genDays.every((d) => genDayComplete(d.value));

  const handleGenerate = () => {
    if (!canGenerate) return;
    const generated: BulkRow[] = [];
    const curr = moment(genFrom as Date);
    const end = moment(genTo as Date);
    while (curr.isSameOrBefore(end, 'day')) {
      const times = genDayTimes[curr.day()];
      if (times) {
        generated.push(
          createEmptyRow({
            date: curr.clone().toDate(),
            startTime: times.start,
            endTime: times.end,
            teacher: times.teacher
          })
        );
      }
      curr.add(1, 'day');
    }
    if (generated.length === 0) {
      toast({
        title: 'No slots generated',
        description: 'None of the selected weekdays fall within this date range.',
        className: 'bg-red-500 border-none text-white'
      });
      return;
    }
    // Keep rows already filled in by hand, drop the empty starter row
    setRows((prev) => [...prev.filter((r) => r.date || r.startTime || r.endTime), ...generated]);
    setGenShow(false);
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const validation = useMemo(() => {
    const errorsById: Record<string, BulkRowErrors> = {};
    const todayKey = localDateKey(new Date());

    rows.forEach((row) => {
      const err: BulkRowErrors = {};
      if (!row.date) err.date = 'Required';
      else if (localDateKey(row.date) < todayKey) err.date = 'Date is in the past';

      if (!row.startTime || !timeRegex.test(row.startTime)) {
        err.startTime = !row.startTime ? 'Required' : 'Invalid (HH:MM)';
      } else if (Number(row.startTime.split(':')[0]) < START_H) {
        err.startTime = `Must be ${fmtH(START_H)} or later`;
      }
      if (!row.endTime || !timeRegex.test(row.endTime)) {
        err.endTime = !row.endTime ? 'Required' : 'Invalid (HH:MM)';
      }
      if (!err.startTime && !err.endTime && !durationMinutes(row.startTime, row.endTime)) {
        err.endTime = 'Must be after start time';
      }
      errorsById[row.id] = err;
    });

    // Only a teacher can clash: the same teacher on the same day at overlapping times
    rows.forEach((row, i) => {
      const rowErr = errorsById[row.id];
      if (!row.teacher || !row.date || rowErr.startTime || rowErr.endTime) return;
      const rowKey = localDateKey(row.date);

      const inBatch = rows.some((other, j) => {
        if (j === i || other.teacher !== row.teacher || !other.date) return false;
        const otherErr = errorsById[other.id];
        if (otherErr.startTime || otherErr.endTime) return false;
        if (localDateKey(other.date) !== rowKey) return false;
        return timeRangesOverlap(row.startTime, row.endTime, other.startTime, other.endTime);
      });

      const saved = savedSlots.find(
        (s) =>
          teacherIdOf(s) === row.teacher &&
          slotDateKey(s.date) === rowKey &&
          timeRangesOverlap(row.startTime, row.endTime, s.startTime, s.endTime)
      );

      if (inBatch) {
        errorsById[row.id] = { ...rowErr, overlap: 'Same teacher overlaps another row in this batch' };
      } else if (saved) {
        errorsById[row.id] = {
          ...rowErr,
          overlap: `Teacher already has a slot ${saved.startTime}–${saved.endTime} on this day`
        };
      }
    });

    const hasOverlap = Object.values(errorsById).some((e) => !!e.overlap);
    const hasErrors = Object.values(errorsById).some(
      (e) => e.date || e.startTime || e.endTime || e.overlap
    );
    return { errorsById, hasErrors, hasOverlap };
  }, [rows, savedSlots]);

  const rowComplete = (row: BulkRow, err: BulkRowErrors) =>
    !!row.date && !!row.startTime && !!row.endTime && !err.date && !err.startTime && !err.endTime && !err.overlap;

  const handleSubmit = async () => {
    if (validation.hasErrors) {
      setAttempted(true);
      return;
    }
    setSubmitting(true);
    try {
      const payload = rows.map((row) => ({
        date: localDateKey(row.date as Date),
        startTime: row.startTime,
        endTime: row.endTime,
        teacherId: row.teacher || null
      }));
      const res = await axiosInstance.post('/teacher-slots/bulk', payload);
      const { created = [], skipped = [] } = res.data?.data || {};
      toast({
        title: `${created.length} slot${created.length === 1 ? '' : 's'} created successfully`,
        className: 'bg-supperagent border-none text-white'
      });
      onSaved(
        skipped.map((s: any) => ({
          date: s.slot?.date,
          startTime: s.slot?.startTime,
          endTime: s.slot?.endTime,
          reason: s.reason
        }))
      );
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Failed to create slots',
        description: error?.response?.data?.message || 'Something went wrong',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const timeCell = (row: BulkRow, field: 'startTime' | 'endTime', showErr: boolean, msg?: string) => (
    <td className="px-3 py-3">
      <Input
        value={row[field]}
        placeholder={field === 'startTime' ? '09:00' : '10:00'}
        maxLength={5}
        className={`h-9 w-full font-mono text-xs ${showErr ? 'border-red-400 bg-red-50/30' : ''}`}
        onChange={(e) => updateRow(row.id, { [field]: maskTimeInput(e.target.value, row[field]) })}
        onBlur={(e) => updateRow(row.id, { [field]: formatTimeInput(e.target.value) })}
      />
      {showErr && <p className="mt-1 text-[10px] font-medium text-red-500">{msg}</p>}
    </td>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent
        className="flex h-[85vh] max-h-[90vh] max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 p-0 shadow-2xl"
        onInteractOutside={keepOpenForSelectMenu}
      >
        <DialogHeader className="flex-none border-b border-gray-100 bg-supperagent/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-supperagent/10 text-supperagent ring-1 ring-supperagent/20">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold leading-tight text-black">
                Bulk Slot Entry
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-black">
                Add multiple slots at once. Teachers are optional and can be assigned later.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Generator */}
        <div className="flex-none border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-black">Generate Bulk</h3>
              <p className="mt-0.5 text-[11px] text-black/70">
                Pick a date range and the weekdays, then generate a row for each of them.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-supperagent/30 bg-supperagent/10 text-supperagent hover:bg-supperagent/20 hover:text-supperagent"
              onClick={() => setGenShow((s) => !s)}
            >
              <Layers className="mr-1.5 h-4 w-4" /> Generate Bulk
            </Button>
          </div>

          {genShow && (
            <div className="mt-4 max-h-[38vh] overflow-y-auto rounded-lg border border-supperagent/20 bg-white p-4 shadow-sm">
              <div className="mb-4 grid gap-4 md:grid-cols-[auto_1fr] md:items-end">
                <div className="space-y-1.5">
                  <label className="mb-1 block text-[10px] font-bold uppercase text-black">
                    Date Range <span className="text-red-500">*</span>
                  </label>
                  <div className="flex h-9 w-[16rem] items-center gap-2 rounded-md border border-gray-300 bg-white px-3">
                    <CalendarRange className="h-4 w-4 flex-shrink-0 text-supperagent" />
                    <DatePicker
                      selectsRange
                      startDate={genFrom}
                      endDate={genTo}
                      minDate={new Date()}
                      onChange={(dates: [Date | null, Date | null]) => setGenRange(dates)}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="From → To"
                      popperPlacement="bottom-start"
                      popperProps={{ strategy: 'fixed' }}
                      popperClassName="!z-[9999]"
                      wrapperClassName="w-full"
                      className="w-full border-none bg-transparent text-xs font-medium text-black outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="mb-1 block text-[10px] font-bold uppercase text-black">
                    Days <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((d) => {
                      const active = !!genDayTimes[d.value];
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleGenDay(d.value)}
                          className={`h-9 min-w-[3.25rem] rounded-md border px-3 text-xs font-semibold transition-colors ${
                            active
                              ? 'border-supperagent bg-supperagent text-white'
                              : 'border-gray-300 bg-white text-black hover:border-supperagent hover:bg-supperagent/5'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {genDays.length > 0 && (
                <div className="mb-4 space-y-1.5">
                  <label className="mb-1 block text-[10px] font-bold uppercase text-black">
                    Times <span className="text-red-500">*</span> &amp; Teacher{' '}
                    <span className="font-normal normal-case text-gray-500">(optional)</span>
                  </label>
                  <div className="grid gap-2 md:grid-cols-2">
                    {genDays.map((d) => {
                      const times = genDayTimes[d.value];
                      const error = genDayError(d.value);
                      const mins = durationMinutes(times.start, times.end);
                      return (
                        <div
                          key={d.value}
                          className={`rounded-md border px-3 py-2 ${
                            error ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-9 shrink-0 text-xs font-bold text-supperagent">
                              {d.label}
                            </span>
                            {(['start', 'end'] as const).map((field, i) => (
                              <div key={field} className="flex items-center gap-2">
                                {i === 1 && <span className="text-xs text-black">–</span>}
                                <Input
                                  value={times[field]}
                                  placeholder={field === 'start' ? 'Start' : 'End'}
                                  maxLength={5}
                                  aria-label={`${d.label} ${field} time`}
                                  className="h-8 w-[4.5rem] bg-white font-mono text-xs"
                                  onChange={(e) =>
                                    updateGenDay(d.value, field, maskTimeInput(e.target.value, times[field]))
                                  }
                                  onBlur={(e) =>
                                    updateGenDay(d.value, field, formatTimeInput(e.target.value))
                                  }
                                />
                              </div>
                            ))}
                            <span className="w-14 shrink-0 text-center font-mono text-[10px] text-gray-600">
                              {mins ? durationLabel(mins) : ''}
                            </span>
                            <div className="min-w-0 flex-1">
                              <Select
                                {...portalSelectProps}
                                isLoading={teachersLoading}
                                options={teacherOptions}
                                value={teacherOptions.find((opt) => opt.value === times.teacher) || null}
                                onChange={(selected: any) =>
                                  updateGenDay(d.value, 'teacher', selected?.value || '')
                                }
                                placeholder="Teacher..."
                                aria-label={`${d.label} teacher`}
                                isClearable
                              />
                            </div>
                          </div>
                          {error && (
                            <p className="mt-1 text-[10px] font-medium text-red-600">{error}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="h-9 bg-supperagent text-white hover:bg-supperagent/90"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Generate
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto bg-white p-6">
          <div className="overflow-visible rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full table-fixed text-xs">
              <thead className="border-b border-gray-200 bg-supperagent/5">
                <tr>
                  {[
                    ['#', 'w-10 text-center'],
                    ['Date (DD-MM-YYYY)', 'w-[18%] text-left'],
                    ['Start Time (HH:mm)', 'w-[15%] text-left'],
                    ['End Time (HH:mm)', 'w-[15%] text-left'],
                    ['Duration', 'w-[11%] text-left'],
                    ['Teacher (optional)', 'w-[25%] text-left'],
                    ['Actions', 'w-20 text-center']
                  ].map(([label, cls]) => (
                    <th
                      key={label}
                      className={`px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-black ${cls}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((row, i) => {
                  const err = validation.errorsById[row.id] || {};
                  const showDateErr = !!err.date && attempted;
                  const showStartErr = !!err.startTime && attempted;
                  const showEndErr = !!err.endTime && attempted;
                  const mins = durationMinutes(row.startTime, row.endTime);
                  return (
                    <Fragment key={row.id}>
                      <tr className="align-middle transition-colors hover:bg-supperagent/5">
                        <td className="px-3 py-3 text-center">
                          {rowComplete(row, err) ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                          ) : (
                            <span className="text-[11px] font-semibold text-black">{i + 1}</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <DatePicker
                            selected={row.date}
                            onChange={(date: Date | null) => updateRow(row.id, { date })}
                            minDate={new Date()}
                            dateFormat="dd-MM-yyyy"
                            placeholderText="Select date"
                            popperPlacement="bottom-start"
                            popperProps={{ strategy: 'fixed' }}
                            popperClassName="!z-[9999]"
                            wrapperClassName="w-full"
                            preventOpenOnFocus
                            className={`h-9 w-full rounded-md border px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-supperagent ${
                              showDateErr ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                            }`}
                          />
                          {showDateErr && (
                            <p className="mt-1 text-[10px] font-medium text-red-500">{err.date}</p>
                          )}
                        </td>
                        {timeCell(row, 'startTime', showStartErr, err.startTime)}
                        {timeCell(row, 'endTime', showEndErr, err.endTime)}
                        <td className="px-3 py-3 font-mono text-[11px] text-black">
                          {mins ? durationLabel(mins) : '—'}
                        </td>
                        <td className="px-3 py-3">
                          <Select
                            {...portalSelectProps}
                            isLoading={teachersLoading}
                            options={teacherOptions}
                            value={teacherOptions.find((opt) => opt.value === row.teacher) || null}
                            onChange={(selected: any) =>
                              updateRow(row.id, { teacher: selected?.value || '' })
                            }
                            placeholder="Assign later..."
                            isClearable
                          />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-black hover:bg-supperagent/10"
                              title="Duplicate row"
                              onClick={() => duplicateRow(row.id)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                              title="Remove row"
                              disabled={rows.length === 1}
                              onClick={() => removeRow(row.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {err.overlap && (
                        <tr className="bg-red-50/50">
                          <td colSpan={7} className="px-3 py-1.5 pl-11">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-red-600">
                              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                              Row {i + 1}: {err.overlap}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((prev) => [...prev, createEmptyRow()])}
            className="mt-4"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add New Row
          </Button>
        </div>

        <DialogFooter className="flex flex-none items-center justify-between border-t border-gray-100 bg-supperagent/5 px-6 py-4 sm:justify-between">
          <span className="text-xs text-black">
            Total rows: <strong>{rows.length}</strong>
            {(validation.hasOverlap || (validation.hasErrors && attempted)) && (
              <span className="ml-2 font-semibold text-red-500">
                · {validation.hasOverlap ? 'Resolve conflicts' : 'Fix errors'} to save
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-gray-300"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
            </Button>
            <Button
              size="sm"
              className="h-9 bg-supperagent text-white shadow-sm hover:bg-supperagent/90"
              onClick={handleSubmit}
              disabled={submitting || validation.hasOverlap}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Save {rows.length} Slot
                  {rows.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
