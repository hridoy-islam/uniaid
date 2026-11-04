import { useEffect, useState } from 'react';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { MarkBadge } from '@/pages/teacher-slot/components/slot-feedback';
import {
  fetchStudentFeedback,
  formatSlotDate,
  formatTime
} from '@/pages/teacher-slot/utils';

// Date, time and teacher are hidden for now, set this to true to bring them back
const SHOW_SESSION_DETAILS = false;

// The mark and comment the teachers gave this student's booked sessions
export function StudentFeedback({ studentId }: { studentId?: string }) {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    setLoading(true);
    setFailed(false);
    fetchStudentFeedback([studentId])
      .then((result) => active && setSlots(result))
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [studentId]);

  return (
    <div className="space-y-4 rounded-md p-4 text-black shadow-md">
      <h2 className="text-lg font-semibold">Feedback</h2>
      {loading ? (
        <div className="flex justify-center py-6">
          <BlinkingDots size="large" color="bg-supperagent" />
        </div>
      ) : failed ? (
        <p className="text-sm text-red-600">Failed to load feedback.</p>
      ) : !slots.length ? (
        <p className="text-sm">No feedback yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-black/10">
              {SHOW_SESSION_DETAILS && (
                <>
                  <TableHead className="text-black">Time</TableHead>
                  <TableHead className="text-black">Teacher</TableHead>
                </>
              )}
              <TableHead className="text-black">Date</TableHead>
              <TableHead className="text-black">Mark</TableHead>
              <TableHead className="text-black">Comment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.map((slot) => (
              <TableRow key={slot._id} className="border-black/10">
                {SHOW_SESSION_DETAILS && (
                  <>
                   
                    <TableCell className="whitespace-nowrap">
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </TableCell>
                    <TableCell>{slot.teacherId?.name || '—'}</TableCell>
                  </>
                )}
                 <TableCell className="whitespace-nowrap">
                      {formatSlotDate(slot.date)}
                    </TableCell>
                    
                <TableCell>
                  {slot.feedback?.mark ? (
                    <MarkBadge mark={slot.feedback.mark} />
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="whitespace-pre-wrap break-words">
                  {slot.feedback?.comment || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
