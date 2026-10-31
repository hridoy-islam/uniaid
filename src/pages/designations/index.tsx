import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { AlertModal } from '@/components/shared/alert-modal';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';

const errorMessage = (error: any) =>
  error?.response?.data?.message || 'Something went wrong, please try again.';

export const failToast = (title: string, error: any) =>
  toast({
    title,
    description: errorMessage(error),
    className: 'bg-red-500 border-none text-white'
  });

export const DESIGNATION_MODULES = [
  { key: 'teacherSlot', label: 'Teacher Slot' },
  { key: 'slotTemplate', label: 'Slot Template' }
] as const;

export const DESIGNATION_ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' }
] as const;

// "View, Create" for one module, or "No access"
export const accessSummary = (access?: Record<string, boolean>) => {
  const allowed = DESIGNATION_ACTIONS.filter((a) => access?.[a.key]).map(
    (a) => a.label
  );
  return allowed.length ? allowed.join(', ') : 'No access';
};

// A designation is a named set of what a teacher may do in Teacher Slots and
// Slot Templates. It is created with a name only; what it may do is set on
// its Access Control page. A teacher gets one on their privilege screen.
export default function DesignationsPage() {
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDesignations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/designations?limit=1000');
      setDesignations(res.data?.data || []);
    } catch (error) {
      failToast('Could not load designations', error);
      setDesignations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  const openForm = (designation: any = null) => {
    setEditing(designation);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/designations/${deleting._id}`);
      toast({
        title: 'Designation deleted',
        className: 'bg-supperagent border-none text-white'
      });
      fetchDesignations();
    } catch (error) {
      failToast('Could not delete designation', error);
    } finally {
      setDeleteLoading(false);
      setDeleting(null);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-supperagent" />
          <h1 className="text-2xl font-semibold">Designations</h1>
        </div>
        <Button
          size="sm"
          className="h-9 bg-supperagent text-white shadow-sm hover:bg-supperagent/90"
          onClick={() => openForm()}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Designation
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <BlinkingDots size="large" color="bg-supperagent" />
        </div>
      ) : designations.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-black/10 bg-white py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-supperagent/10">
            <BadgeCheck className="h-7 w-7 text-supperagent" />
          </div>
          <p className="font-semibold">No designations yet</p>
          <p className="mt-1 max-w-sm text-sm text-black">
            Add a designation, set its access control, then give it to teachers
            on their privilege screen.
          </p>
          <Button
            size="sm"
            className="mt-5 bg-supperagent text-white hover:bg-supperagent/90"
            onClick={() => openForm()}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Designation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {designations.map((designation) => (
            <div
              key={designation._id}
              className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-4 shadow-sm transition hover:border-supperagent/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 break-words text-base font-semibold">
                  {designation.name}
                </h3>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openForm(designation)}
                    className="rounded-lg p-2 text-black transition hover:bg-supperagent/10 hover:text-supperagent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-supperagent"
                    aria-label="Edit designation"
                    title="Edit designation"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(designation)}
                    className="rounded-lg p-2 text-black transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    aria-label="Delete designation"
                    title="Delete designation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <Link to={designation._id} className="mt-auto">
                <Button
                  size="sm"
                  className="w-full bg-supperagent text-white hover:bg-supperagent/90"
                >
                  <ShieldCheck className="mr-1.5 h-4 w-4" /> Access Control
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      <DesignationFormDialog
        open={formOpen}
        designation={editing}
        onOpenChange={setFormOpen}
        onSaved={fetchDesignations}
      />

      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete this designation?"
        description={
          deleting
            ? `${deleting.name}. Teachers who have it lose its access to Teacher Slots and Slot Templates.`
            : ''
        }
      />
    </div>
  );
}

// Name only, access is set on the Access Control page
function DesignationFormDialog({
  open,
  designation,
  onOpenChange,
  onSaved
}: {
  open: boolean;
  designation: any;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setName(designation?.name || '');
  }, [open, designation]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: name.trim() };
      if (designation) {
        await axiosInstance.patch(`/designations/${designation._id}`, payload);
      } else {
        await axiosInstance.post('/designations', payload);
      }
      toast({
        title: designation ? 'Designation updated' : 'Designation created',
        className: 'bg-supperagent border-none text-white'
      });
      onOpenChange(false);
      onSaved();
    } catch (error) {
      failToast('Could not save designation', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {designation ? 'Edit Designation' : 'Add Designation'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="designation-name">Name</Label>
            <Input
              id="designation-name"
              value={name}
              placeholder="e.g. Senior Teacher"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={!name.trim() || saving}
            className="w-full bg-supperagent text-white hover:bg-supperagent/90"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {designation ? 'Save Changes' : 'Create Designation'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
