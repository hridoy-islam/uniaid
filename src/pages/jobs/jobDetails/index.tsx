// index.tsx (Job Details Page)
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Select from 'react-select';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  MessageSquare,
  Clock,
  ArrowLeft,
  User,
  Send,
  Edit,
  Loader2,
  Search,
  Trash2,
  Pencil
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import moment from 'moment';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { countries } from '@/types';

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const logSchema = z
  .object({
    message: z.string().min(1, 'Message is required'),
    followUp: z.boolean().default(false),
    followUpDate: z.date().optional().nullable()
  })
  .refine(
    (data) => {
      if (data.followUp && !data.followUpDate) {
        return false;
      }
      return true;
    },
    {
      message: 'Follow-up date is required when follow-up is checked',
      path: ['followUpDate']
    }
  );

const jobUpdateSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  description: z.string().optional(),
  url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z
    .string()
    .email('Please enter a valid email')
    .optional()
    .or(z.literal('')),
  country: z.string().min(1, 'Country is required'),
  staffId: z.array(z.string()).min(1, 'At least one staff member is required')
});

type LogFormData = z.infer<typeof logSchema>;
type JobUpdateFormData = z.infer<typeof jobUpdateSchema>;

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface Staff {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

interface Log {
  _id: string;
  staffId: Staff | string;
  message: string;
  followUp: boolean;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Job {
  _id: string;
  title: string;
  description?: string;
  url?: string;
  phone?: string;
  email?: string;
  country: string;
  staffId: Staff[] | string[];
  logs: Log[];
  status?: string;
  createdAt: string;
  updatedAt: string;
}

interface CountryOption {
  value: string;
  label: string;
}

interface StaffOption {
  value: string;
  label: string;
  name: string;
  email: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const COUNTRY_OPTIONS: CountryOption[] = countries.map((country) => ({
  value: country,
  label: country
}));

// ─── Helper Functions ───────────────────────────────────────────────────────

const formatLogDate = (isoString: string) => {
  const d = new Date(isoString);
  const datePart = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const timePart = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `${datePart} at ${timePart}`;
};

const getStaffName = (staffId: Staff | string): string => {
  if (typeof staffId === 'object' && staffId !== null) {
    return staffId.name || 'Unknown';
  }
  return 'Unknown';
};

// ─── Staff Selection Panel Component ─────────────────────────────────────────

interface StaffPanelProps {
  allStaff: Staff[];
  selected: string[];
  onChange: (staffIds: string[]) => void;
}

function StaffPanel({ allStaff, selected, onChange }: StaffPanelProps) {
  const [search, setSearch] = useState('');

  const filteredStaff = allStaff.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.role && s.role.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedStaff = allStaff.filter((s) => selected.includes(s._id));

  const handleCheck = (id: string, isChecked: boolean) => {
    if (isChecked) {
      onChange([...selected, id]);
    } else {
      onChange(selected.filter((x) => x !== id));
    }
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      const newSelected = [
        ...new Set([...selected, ...filteredStaff.map((s) => s._id)])
      ];
      onChange(newSelected);
    } else {
      const filteredIds = filteredStaff.map((s) => s._id);
      onChange(selected.filter((id) => !filteredIds.includes(id)));
    }
  };

  const isAllSelected =
    filteredStaff.length > 0 &&
    filteredStaff.every((s) => selected.includes(s._id));

  return (
    <div className="flex h-full w-full gap-5 bg-white">
      {/* Left — Available List */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-none pl-9 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          <label className="mb-2 flex cursor-pointer items-center gap-3 rounded-md border-b border-transparent p-2 pb-3 hover:bg-zinc-50">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-semibold text-zinc-900">
              Select All Employees
            </span>
          </label>

          <div className="space-y-1">
            {filteredStaff.map((s) => (
              <label
                key={s._id}
                className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-zinc-50"
              >
                <Checkbox
                  checked={selected.includes(s._id)}
                  onCheckedChange={(c) => handleCheck(s._id, c as boolean)}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-tight text-zinc-900">
                    {s.name}
                  </span>
                  <span className="mt-0.5 text-[13px] text-zinc-400">
                    {s.role || 'staff'}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Selected List */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
        <div className="border-b border-blue-100 bg-blue-50/60 px-4 py-3">
          <span className="text-sm font-semibold text-blue-600">
            Selected ({selected.length})
          </span>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-3">
          {selectedStaff.length === 0 ? (
            <div className="m-auto text-sm italic text-zinc-400">
              No recipients selected.
            </div>
          ) : (
            <div className="space-y-1">
              {selectedStaff.map((s) => (
                <div
                  key={s._id}
                  className="group flex items-center justify-between rounded-md border border-transparent p-2 transition-colors hover:border-zinc-100 hover:bg-zinc-50"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium leading-tight text-zinc-900">
                      {s.name}
                    </span>
                    <span className="mt-0.5 text-[13px] text-zinc-400">
                      {s.role || s.email}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-400 opacity-100 transition-all hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleCheck(s._id, false)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useSelector((state: any) => state.auth);
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [job, setJob] = useState<Job | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Activity log dialog state
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null); // Track which log is being edited

  // Log form
  const {
    register: registerLog,
    handleSubmit: handleSubmitLog,
    formState: { errors: logErrors },
    reset: resetLog,
    watch: watchLog,
    setValue: setLogValue,
    control: controlLog
  } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      message: '',
      followUp: false,
      followUpDate: null
    }
  });

  const watchFollowUp = watchLog('followUp');

  // Edit form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    control: controlEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
    setValue: setEditValue,
    watch: watchEdit
  } = useForm<JobUpdateFormData>({
    resolver: zodResolver(jobUpdateSchema),
    defaultValues: {
      title: '',
      description: '',
      url: '',
      phone: '',
      email: '',
      country: '',
      staffId: []
    }
  });

  // Fetch job details
  const fetchJob = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/jobs/${id}`);
      setJob(response.data.data);

      // Update edit form with job data
      const jobData = response.data.data;
      resetEdit({
        title: jobData.title || '',
        description: jobData.description || '',
        url: jobData.url || '',
        phone: jobData.phone || '',
        email: jobData.email || '',
        country: jobData.country || '',
        staffId:
          jobData.staffId?.map((s: any) =>
            typeof s === 'object' ? s._id : s
          ) || []
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to fetch job details',
        variant: 'destructive'
      });
      navigate('/job-management');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch staff list
  const fetchStaff = async () => {
    try {
      const response = await axiosInstance.get('/users?role=staff&limit=all');
      setStaff(response.data.data.result || response.data);
    } catch (error: any) {
      console.error('Failed to fetch staff:', error);
    }
  };

  useEffect(() => {
    fetchJob();
    fetchStaff();
  }, [id]);

  // Add or Update log
  const onAddLog = async (data: LogFormData) => {
    try {
      setIsAddingLog(true);

      if (editingLogId) {
        // Update existing log
        const payload = {
          message: data.message,
          followUp: data.followUp,
          followUpDate:
            data.followUp && data.followUpDate
              ? moment(data.followUpDate).format('YYYY-MM-DD')
              : undefined
        };

        await axiosInstance.patch(`/jobs/${id}/logs/${editingLogId}`, payload);

        toast({
          title: 'Success',
          description: 'Activity log updated successfully',
          className: 'bg-supperagent text-white border-none'
        });
      } else {
        // Create new log (existing behavior)
        const payload = {
          logStaffId: user?._id,
          message: data.message,
          followUp: data.followUp,
          followUpDate:
            data.followUp && data.followUpDate
              ? moment(data.followUpDate).format('YYYY-MM-DD')
              : undefined
        };

        await axiosInstance.patch(`/jobs/${id}`, payload);

        toast({
          title: 'Success',
          description: 'Activity log added successfully',
          className: 'bg-supperagent text-white border-none'
        });
      }

      resetLog({
        message: '',
        followUp: false,
        followUpDate: null
      });
      setEditingLogId(null);
      setLogDialogOpen(false);
      fetchJob(); // Refresh job data
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save log',
        variant: 'destructive'
      });
    } finally {
      setIsAddingLog(false);
    }
  };

  // Update job
  const onUpdateJob = async (data: JobUpdateFormData) => {
    try {
      setIsUpdating(true);

      const payload = {
        ...data,
        url: data.url || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined
      };

      await axiosInstance.patch(`/jobs/${id}`, payload);

      toast({
        title: 'Success',
        description: 'Job updated successfully',
        className: 'bg-supperagent text-white border-none'
      });

      setEditDialogOpen(false);
      fetchJob(); // Refresh job data
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update job',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Open log dialog for new log
  const openLogDialog = () => {
    resetLog({
      message: '',
      followUp: false,
      followUpDate: null
    });
    setEditingLogId(null);
    setLogDialogOpen(true);
  };

  // Open log dialog for editing existing log (admin only)
  const openEditLogDialog = (log: Log) => {
    resetLog({
      message: log.message || '',
      followUp: log.followUp || false,
      followUpDate: log.followUpDate ? new Date(log.followUpDate) : null
    });
    setEditingLogId(log._id);
    setLogDialogOpen(true);
  };

  // Select styles for react-select
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderColor: '#e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 1px #18181b' : 'none',
      borderRadius: '0.5rem',
      minHeight: '40px',
      fontSize: '14px',
      '&:hover': { borderColor: '#18181b' }
    }),
    option: (base: any, state: any) => ({
      ...base,
      fontSize: '14px',
      backgroundColor: state.isSelected
        ? '#18181b'
        : state.isFocused
          ? '#f4f4f5'
          : 'white',
      color: state.isSelected ? 'white' : '#18181b'
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: '#f4f4f5',
      borderRadius: '0.375rem'
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: '#18181b',
      fontSize: '13px'
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: '#71717a',
      ':hover': {
        backgroundColor: '#ef4444',
        color: 'white'
      }
    })
  };

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Job not found</p>
        <Button onClick={() => navigate('/job-management')}>
          Back to Jobs
        </Button>
      </div>
    );
  }

  // Sort logs by date (newest first)
  const sortedLogs = [...(job.logs || [])].sort((a, b) => {
    const today = moment().startOf('day');

    const aIsTodayFollowUp =
      a.followUp &&
      a.followUpDate &&
      moment(a.followUpDate).isSame(today, 'day');
    const bIsTodayFollowUp =
      b.followUp &&
      b.followUpDate &&
      moment(b.followUpDate).isSame(today, 'day');

    // Bring today's follow-ups to the top
    if (aIsTodayFollowUp && !bIsTodayFollowUp) return -1;
    if (!aIsTodayFollowUp && bIsTodayFollowUp) return 1;

    // Default sorting (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Custom date input for react-datepicker
  const DateInput = ({ value, onClick }: any) => (
    <div className="relative">
      <Input
        value={value}
        onClick={onClick}
        readOnly
        placeholder="DD-MM-YYYY"
        className="h-9 cursor-pointer pr-10 text-sm"
      />
      <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900">{job.title}</h1>
            {job.status && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700"
              >
                {job.status}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="border-none bg-supperagent hover:bg-supperagent/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {user.role === 'admin' && (
            <Button
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="border-none bg-supperagent hover:bg-supperagent/90"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Job
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
        {/* ─── Left Side: Job Details ──────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* General Info Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-900">
              <Briefcase className="h-4 w-4 text-zinc-400" />
              Job Overview
            </h2>
            <div className="prose prose-sm max-w-none text-zinc-600">
              <p>{job.description || 'No description provided.'}</p>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-base font-semibold text-zinc-900">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              {job.phone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50">
                    <Phone className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Phone</p>
                    <p className="text-sm text-zinc-900">{job.phone}</p>
                  </div>
                </div>
              )}

              {job.email && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50">
                    <Mail className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Email</p>
                    <a
                      href={`mailto:${job.email}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {job.email}
                    </a>
                  </div>
                </div>
              )}

              {job.url && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50">
                    <Globe className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Website</p>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {job.url}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50">
                  <MapPin className="h-4 w-4 text-zinc-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">Location</p>
                  <p className="text-sm text-zinc-900">{job.country}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">Created</p>
                  <p className="text-sm text-zinc-900">
                    {formatLogDate(job.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Staff Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-zinc-900">
              <Users className="h-4 w-4 text-zinc-400" />
              Assigned Staff
            </h2>
            <ul className="space-y-3">
              {job.staffId && job.staffId.length > 0 ? (
                job.staffId.map((s: any, i: number) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-2.5 text-sm text-zinc-800"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white">
                      <User className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <span className="font-medium">
                        {typeof s === 'object' ? s.name : 'Unknown'}
                      </span>
                      {typeof s === 'object' && s.email && (
                        <p className="text-xs text-zinc-500">{s.email}</p>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm text-zinc-500">No staff assigned</li>
              )}
            </ul>
          </div>
        </div>

        {/* ─── Right Side: Activity Log ────────────────────────────────────── */}
        <div className="sticky top-6 flex h-[calc(100vh-120px)] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
              <MessageSquare className="h-4 w-4 text-zinc-500" />
              Activity Log
            </h2>
            {user.role === 'admin' && (
              <Button size="sm" onClick={openLogDialog} className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Update Activity
              </Button>
            )}
          </div>

          {/* Scrollable Logs Feed */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="relative">
              {/* Timeline vertical line — sits behind nodes */}
              {sortedLogs.length > 0 && (
                <div className="absolute bottom-3 left-[11px] top-3 z-0 w-px bg-zinc-200" />
              )}

              <div className="space-y-5">
                {sortedLogs.length === 0 ? (
                  <div className="py-10 text-center text-sm text-zinc-500">
                    No activity logs yet. Add your first log above!
                  </div>
                ) : (
                  sortedLogs.map((log) => {
                    const isTodayFollowUp =
                      log.followUp &&
                      log.followUpDate &&
                      moment(log.followUpDate).isSame(moment(), 'day');

                    return (
                      <div key={log._id} className="relative flex gap-4">
                        {/* Timeline Node — always 24px wide, centered on the line */}
                        <div className="relative z-10 flex w-6 flex-shrink-0 items-start justify-center pt-1">
                          <div
                            className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${
                              isTodayFollowUp
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-zinc-300 bg-white'
                            }`}
                          >
                            {isTodayFollowUp && (
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                        </div>

                        {/* Log Card */}
                        <div className="min-w-0 flex-1 pb-2">
                          {/* Header row */}
                          <div className="mb-1.5 flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-zinc-900">
                              {getStaffName(log.staffId)}
                            </span>
                            <div className="flex flex-shrink-0 items-center gap-2">
                              <span className="flex items-center gap-1 whitespace-nowrap text-xs text-zinc-500">
                                <Clock className="h-3 w-3" />
                                {formatLogDate(log.createdAt)}
                              </span>
                              {user.role === 'admin' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditLogDialog(log)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Message bubble */}
                          <div
                            className={`relative rounded-lg p-3 ${
                              isTodayFollowUp
                                ? 'border border-blue-200 bg-blue-50'
                                : 'border border-zinc-100 bg-zinc-50'
                            }`}
                          >
                            {isTodayFollowUp && (
                              <div className="absolute -top-2.5 right-3 flex items-center gap-1 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                <Calendar className="h-3 w-3" />
                                Today's Follow-up
                              </div>
                            )}
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-800">
                              {log.message}
                            </p>

                            {(log.followUp || log.followUpDate) && (
                              <div className="mt-2.5 flex flex-wrap gap-2">
                                {log.followUp && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-amber-100 text-amber-800 hover:bg-amber-200"
                                  >
                                    Follow-up
                                  </Badge>
                                )}
                                {log.followUpDate && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  >
                                    <Calendar className="mr-1 h-3 w-3" />
                                    {format(
                                      parseISO(log.followUpDate),
                                      'dd-MM-yyyy'
                                    )}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Job Dialog - Layout matching the image */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-6xl gap-0 overflow-hidden rounded-xl p-0">
          <DialogHeader className="border-b border-zinc-100 px-7 py-5">
            <DialogTitle className="text-xl font-bold text-zinc-900">
              Edit Job
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitEdit(onUpdateJob)}>
            <div className="flex h-[75vh] overflow-hidden">
              {/* Left — Form Fields */}
              <div className="flex w-[40%] flex-col gap-5 overflow-y-auto border-r border-zinc-100 bg-white px-7 py-6">
                <div className="flex flex-col gap-1.5">
                  <Label className="font-semibold text-zinc-900">
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., Website Redesign Project"
                    {...registerEdit('title')}
                    className={`focus-visible:ring-zinc-900 ${editErrors.title ? 'border-red-500' : ''}`}
                  />
                  {editErrors.title && (
                    <span className="text-sm text-red-500">
                      {editErrors.title.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="font-semibold text-zinc-900">
                    Description
                  </Label>
                  <Textarea
                    placeholder="Describe the job, responsibilities, and goals..."
                    className="min-h-[90px] resize-none focus-visible:ring-zinc-900"
                    {...registerEdit('description')}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="font-semibold text-zinc-900">
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="country"
                    control={controlEdit}
                    render={({ field }) => (
                      <Select
                        options={COUNTRY_OPTIONS}
                        value={
                          COUNTRY_OPTIONS.find(
                            (c) => c.value === field.value
                          ) || null
                        }
                        onChange={(option) =>
                          field.onChange(option?.value || '')
                        }
                        placeholder="Select country..."
                        styles={selectStyles}
                        isClearable
                      />
                    )}
                  />
                  {editErrors.country && (
                    <span className="text-sm text-red-500">
                      {editErrors.country.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="font-semibold text-zinc-900">URL</Label>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    {...registerEdit('url')}
                    className={`focus-visible:ring-zinc-900 ${editErrors.url ? 'border-red-500' : ''}`}
                  />
                  {editErrors.url && (
                    <span className="text-sm text-red-500">
                      {editErrors.url.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="font-semibold text-zinc-900">Phone</Label>
                  <Input
                    type="tel"
                    placeholder="+880-1700-000000"
                    {...registerEdit('phone')}
                    className="focus-visible:ring-zinc-900"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="font-semibold text-zinc-900">Email</Label>
                  <Input
                    type="email"
                    placeholder="contact@email.com"
                    {...registerEdit('email')}
                    className={`focus-visible:ring-zinc-900 ${editErrors.email ? 'border-red-500' : ''}`}
                  />
                  {editErrors.email && (
                    <span className="text-sm text-red-500">
                      {editErrors.email.message}
                    </span>
                  )}
                </div>

                {editErrors.staffId && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <span className="text-sm text-red-500">
                      {editErrors.staffId.message}
                    </span>
                  </div>
                )}
              </div>

              {/* Right — Staff Selection Panel matching the image */}
              <div className="flex w-[60%] flex-col bg-zinc-50/50 p-6">
                <StaffPanel
                  allStaff={staff}
                  selected={watchEdit('staffId') || []}
                  onChange={(staffIds) =>
                    setEditValue('staffId', staffIds, { shouldValidate: true })
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2 border-t border-zinc-100 bg-white px-7 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Job'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Activity Log Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-zinc-900">
              {editingLogId ? 'Edit Activity Log' : 'Update Activity Log'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitLog(onAddLog)} className="space-y-5">
            {/* Message Field */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-semibold text-zinc-900">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Enter activity details..."
                className="min-h-[120px] resize-none"
                {...registerLog('message')}
              />
              {logErrors.message && (
                <span className="text-sm text-red-500">
                  {logErrors.message.message}
                </span>
              )}
            </div>

            {/* Follow-up Checkbox */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="followUp"
                checked={watchFollowUp}
                onCheckedChange={(checked) => {
                  setLogValue('followUp', checked as boolean);
                  if (!checked) {
                    setLogValue('followUpDate', null);
                  }
                }}
              />
              <Label
                htmlFor="followUp"
                className="cursor-pointer text-sm font-medium text-zinc-700"
              >
                Do you want to follow up?
              </Label>
            </div>

            {/* Follow-up Date Picker - Conditionally shown */}
            {watchFollowUp && (
              <div className="flex flex-col gap-1.5">
                <Label className="font-semibold text-zinc-900">
                  Follow-up Date <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="followUpDate"
                  control={controlLog}
                  render={({ field }) => (
                    <ReactDatePicker
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="DD-MM-YYYY"
                      customInput={<DateInput />}
                      className="w-full"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                  )}
                />
                {logErrors.followUpDate && (
                  <span className="text-sm text-red-500">
                    {logErrors.followUpDate.message}
                  </span>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLogDialogOpen(false);
                  setEditingLogId(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingLog}>
                {isAddingLog ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingLogId ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {editingLogId ? 'Update Activity' : 'Add Activity'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
