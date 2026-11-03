import { useEffect, useState } from 'react';
import Select from 'react-select';
import { Loader2, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import {
  SLOT_MARK_OPTIONS,
  formatSlotDate,
  formatTime,
  keepOpenForSelectMenu,
  markClass,
  markLabel,
  portalSelectProps,
  studentName
} from '../utils';

type MarkOption = { value: string; label: string };

const findMark = (value?: string | null) =>
  (SLOT_MARK_OPTIONS as unknown as MarkOption[]).find(
    (o) => o.value === value
  ) || null;

// The "Feedback" button for a booked slot, it opens the feedback dialog
export function FeedbackButton({
  onClick,
  size
}: {
  onClick: () => void;
  size?: 'sm';
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={`border-none bg-black text-white hover:bg-black/80 ${
        size === 'sm' ? 'h-7 px-2.5 text-xs' : ''
      }`}
    >
      <MessageSquareText
        className={size === 'sm' ? 'mr-1 h-3.5 w-3.5' : 'mr-1.5 h-4 w-4'}
      />
      Feedback
    </Button>
  );
}

// The teacher's mark and comment for a booked slot, both optional
export function FeedbackDialog({
  slot,
  open,
  onOpenChange,
  onSaved
}: {
  slot: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (slot: any) => void;
}) {
  const [comment, setComment] = useState('');
  const [mark, setMark] = useState<MarkOption | null>(null);
  const [saving, setSaving] = useState(false);

  // Start from the saved feedback each time it opens
  useEffect(() => {
    if (!open) return;
    setComment(slot?.feedback?.comment || '');
    setMark(findMark(slot?.feedback?.mark));
  }, [open, slot]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axiosInstance.patch(
        `/teacher-slots/${slot._id}/feedback`,
        { comment: comment.trim(), mark: mark?.value || null }
      );
      toast({
        title: 'Feedback saved!',
        className: 'bg-supperagent border-none text-white'
      });
      onSaved?.(response.data?.data);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Failed to save feedback.',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Something went wrong.',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent
        className="max-w-[calc(100vw-2rem)] sm:max-w-md"
        onPointerDownOutside={keepOpenForSelectMenu}
        onInteractOutside={keepOpenForSelectMenu}
      >
        <DialogHeader>
          <DialogTitle>Feedback</DialogTitle>
          {slot && (
            <DialogDescription className="text-black">
              {slot.studentId ? `${studentName(slot.studentId)} · ` : ''}
              {formatSlotDate(slot.date, 'ddd, D MMM YYYY')},{' '}
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 text-black">
          <div className="space-y-1.5">
            <Label>Mark</Label>
            <Select<MarkOption>
              {...portalSelectProps}
              options={SLOT_MARK_OPTIONS as unknown as MarkOption[]}
              value={mark}
              onChange={(o) => setMark(o)}
              isClearable
              isSearchable={false}
              placeholder="Select a mark (optional)"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Comment</Label>
            <Textarea
              placeholder="Comment (optional)"
              className="border-gray-300"
              value={comment}
              maxLength={2000}
              rows={4}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="border-none bg-supperagent text-white hover:bg-supperagent/90"
          >
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// The saved mark as a coloured badge
export function MarkBadge({ mark }: { mark?: string | null }) {
  if (!mark) return null;
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${markClass(mark)}`}
    >
      {markLabel(mark)}
    </span>
  );
}
