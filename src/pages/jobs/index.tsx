// JobManagement.tsx
// Dependencies: react, react-select, tailwindcss, shadcn/ui, lucide-react, zod, react-hook-form, @hookform/resolvers
// Install: npm install react-select zod react-hook-form @hookform/resolvers
// shadcn: npx shadcn@latest add dialog button input textarea badge label table pagination checkbox alert-dialog

import { useState, useEffect, useMemo, useCallback } from 'react';
import Select from 'react-select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  ArrowLeft,
  RotateCcw,
  Bell
} from 'lucide-react';
import { DataTablePagination } from '../students/view/components/data-table-pagination';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useSelector } from 'react-redux';
import { countries } from '@/types';

// ─── Zod Validation Schema ────────────────────────────────────────────────────

const jobSchema = z.object({
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

type JobFormData = z.infer<typeof jobSchema>;

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Staff {
  _id: string;
  name: string;
  email: string;
  role?: string;
  dept?: string;
}

interface StaffMember {
  _id: string;
  name: string;
  email: string;
}

interface Job {
  _id: string;
  title: string;
  description?: string;
  url?: string;
  phone?: string;
  email?: string;
  country: string;
  staffId: StaffMember[] | string[];
  staffDetails?: Staff[];
  logs?: any[];
  status?: string;
  todayFollowup?: boolean;
  createdAt: string;
  updatedAt?: string;
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

const COUNTRY_OPTIONS: CountryOption[] = countries.map((country) => ({
  value: country,
  label: country
}));

interface StaffPanelProps {
  allStaff: Staff[];
  selected: string[];
  onChange: (staffIds: string[]) => void;
}

function StaffPanel({ allStaff, selected, onChange }: StaffPanelProps) {
  const [search, setSearch] = useState('');

  const filteredStaff = useMemo(
    () =>
      allStaff.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          (s.role && s.role.toLowerCase().includes(search.toLowerCase()))
      ),
    [allStaff, search]
  );

  const selectedStaff = useMemo(
    () => allStaff.filter((s) => selected.includes(s._id)),
    [allStaff, selected]
  );

  const handleCheck = useCallback(
    (id: string, isChecked: boolean) => {
      if (isChecked) {
        onChange([...selected, id]);
      } else {
        onChange(selected.filter((x) => x !== id));
      }
    },
    [selected, onChange]
  );

  const handleSelectAll = useCallback(
    (isChecked: boolean) => {
      if (isChecked) {
        const newSelected = [
          ...new Set([...selected, ...filteredStaff.map((s) => s._id)])
        ];
        onChange(newSelected);
      } else {
        const filteredIds = filteredStaff.map((s) => s._id);
        onChange(selected.filter((id) => !filteredIds.includes(id)));
      }
    },
    [filteredStaff, selected, onChange]
  );

  const isAllSelected =
    filteredStaff.length > 0 &&
    filteredStaff.every((s) => selected.includes(s._id));

  return (
    <div className="flex h-full w-full gap-5 bg-white">
      {/* Middle — Available List */}
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
                    {s.role || s.email}
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

// ─── Create Job Dialog ────────────────────────────────────────────────────────

interface JobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: JobFormData) => void;
  staff: Staff[];
  isLoading?: boolean;
}

function JobDialog({
  open,
  onOpenChange,
  onSave,
  staff,
  isLoading
}: JobDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
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

  const selectedStaff = watch('staffId');

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = (data: JobFormData) => {
    onSave(data);
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderColor: errors.country
        ? '#ef4444'
        : state.isFocused
          ? '#18181b'
          : '#e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 1px #18181b' : 'none',
      borderRadius: '0.5rem',
      minHeight: '40px',
      fontSize: '14px',
      '&:hover': { borderColor: errors.country ? '#ef4444' : '#18181b' }
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
    })
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl gap-0 overflow-hidden rounded-xl p-0">
        <DialogHeader className="border-b border-zinc-100 px-7 py-5">
          <DialogTitle className="text-xl font-bold text-zinc-900">
            Create New Job
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex h-[75vh] overflow-hidden">
            {/* Left — Form Fields */}
            <div className="flex w-[40%] flex-col gap-5 overflow-y-auto border-r border-zinc-100 bg-white px-7 py-6">
              <div className="flex flex-col gap-1.5">
                <Label className="font-semibold text-zinc-900">
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g., Website Redesign Project"
                  {...register('title')}
                  className={`focus-visible:ring-zinc-900 ${errors.title ? 'border-red-500' : ''}`}
                />
                {errors.title && (
                  <span className="text-sm text-red-500">
                    {errors.title.message}
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
                  {...register('description')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="font-semibold text-zinc-900">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={COUNTRY_OPTIONS}
                      value={
                        COUNTRY_OPTIONS.find((c) => c.value === field.value) ||
                        null
                      }
                      onChange={(option) => field.onChange(option?.value || '')}
                      placeholder="Select country..."
                      styles={selectStyles}
                      isClearable
                    />
                  )}
                />
                {errors.country && (
                  <span className="text-sm text-red-500">
                    {errors.country.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="font-semibold text-zinc-900">URL</Label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  {...register('url')}
                  className={`focus-visible:ring-zinc-900 ${errors.url ? 'border-red-500' : ''}`}
                />
                {errors.url && (
                  <span className="text-sm text-red-500">
                    {errors.url.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="font-semibold text-zinc-900">Phone</Label>
                <Input
                  type="tel"
                  placeholder="+880-1700-000000"
                  {...register('phone')}
                  className="focus-visible:ring-zinc-900"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="font-semibold text-zinc-900">Email</Label>
                <Input
                  type="email"
                  placeholder="contact@email.com"
                  {...register('email')}
                  className={`focus-visible:ring-zinc-900 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && (
                  <span className="text-sm text-red-500">
                    {errors.email.message}
                  </span>
                )}
              </div>

              {errors.staffId && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <span className="text-sm text-red-500">
                    {errors.staffId.message}
                  </span>
                </div>
              )}
            </div>

            {/* Right — Staff Selection */}
            <div className="flex w-[60%] flex-col bg-zinc-50/50 p-6">
              <StaffPanel
                allStaff={staff}
                selected={selectedStaff || []}
                onChange={(staffIds) =>
                  setValue('staffId', staffIds, { shouldValidate: true })
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-zinc-100 bg-white px-7 py-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Filter Component ─────────────────────────────────────────────────────────

interface FilterValues {
  search: string;
  country: string;
  staffIds: string[];
}

interface JobFilterProps {
  user: any;
  staff: Staff[];
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onSearch: (filters: FilterValues) => void;
  onReset: () => void;
}

function JobFilter({
  user,
  staff,
  filters,
  onFiltersChange,
  onSearch,
  onReset
}: JobFilterProps) {
  const staffOptions: StaffOption[] = useMemo(
    () =>
      staff.map((s) => ({
        value: s._id,
        label: s.name,
        name: s.name,
        email: s.email
      })),
    [staff]
  );

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    onReset();
  };

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

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 ">
        {/* Search Input */}
        <div className="md:col-span-4">
          <Label className="mb-1.5 block text-sm font-medium text-black">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search by title, email, phone..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="h-10 pl-9 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>
        </div>

        {/* Country Filter */}
        <div className="md:col-span-3">
          <Label className="mb-1.5 block text-sm font-medium text-black">
            Country
          </Label>
          <Select
            options={COUNTRY_OPTIONS}
            value={
              COUNTRY_OPTIONS.find((c) => c.value === filters.country) || null
            }
            onChange={(option) =>
              onFiltersChange({ ...filters, country: option?.value || '' })
            }
            placeholder="All Countries"
            styles={selectStyles}
            isClearable
          />
        </div>

        {user.role === 'admin' && (
          <div className="md:col-span-3">
            <Label className="mb-1.5 block text-sm font-medium text-black">
              Staff
            </Label>
            <Select
              options={staffOptions}
              value={staffOptions.filter((option) =>
                filters.staffIds.includes(option.value)
              )}
              onChange={(selectedOptions) => {
                const ids = selectedOptions
                  ? (selectedOptions as StaffOption[]).map(
                      (option) => option.value
                    )
                  : [];
                onFiltersChange({ ...filters, staffIds: ids });
              }}
              placeholder="All Staff"
              styles={selectStyles}
              isMulti
              isClearable
              closeMenuOnSelect={false}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-end gap-2 pb-1 md:col-span-2">
          <Button onClick={handleSearch} className="h-9 flex-1 ">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="h-9 flex-1"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JobListingsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useSelector((state: any) => state.auth);

  // Filter state
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    country: '',
    staffIds: []
  });

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Jobs with filters
  const fetchJobs = async (
    page: number,
    entriesPerPage: number,
    currentFilters: FilterValues
  ) => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: entriesPerPage
      };

      // Add search term if exists
      if (currentFilters.search) {
        params.searchTerm = currentFilters.search;
      }

      // Add country filter if selected
      if (currentFilters.country) {
        params.country = currentFilters.country;
      }

      // Add staff filter if selected
      if (currentFilters.staffIds && currentFilters.staffIds.length > 0) {
        params.staffIds = currentFilters.staffIds.join(',');
      }
      if (user.role === 'staff') {
        params.userId = user._id;
      }
      const response = await axiosInstance.get('/jobs', { params });
      const responseData = response.data;

      // Handle the triple-nested structure
      let jobData;

      if (responseData.data?.data?.result) {
        // Triple nested: response.data.data.data.result
        jobData = responseData.data.data;
      } else if (responseData.data?.result) {
        // Double nested: response.data.data.result
        jobData = responseData.data;
      } else if (Array.isArray(responseData.data)) {
        // If data is directly an array
        setJobs(responseData.data);
        setTotalPages(1);
        return;
      } else {
        setJobs([]);
        setTotalPages(1);
        return;
      }

      // Set the data
      setJobs(jobData.result || []);
      setTotalPages(jobData.meta?.totalPage || 1);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch jobs',
        variant: 'destructive'
      });
      setJobs([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Staff
  const fetchStaff = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/users?role=staff&limit=all');
      setStaff(response.data.data.result || response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch staff',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    fetchJobs(currentPage, entriesPerPage, filters);
    fetchStaff();
  }, []); // Only run on mount

  // Handle page change
  useEffect(() => {
    if (currentPage > 1 || jobs.length > 0) {
      fetchJobs(currentPage, entriesPerPage, filters);
    }
  }, [currentPage, entriesPerPage]);

  // Handle search
  const handleSearch = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when searching
    fetchJobs(1, entriesPerPage, newFilters);
  };

  // Handle reset
  const handleReset = () => {
    const resetFilters: FilterValues = {
      search: '',
      country: '',
      staffIds: []
    };
    setFilters(resetFilters);
    setCurrentPage(1); // Reset to first page
    fetchJobs(1, entriesPerPage, resetFilters);
  };

  const handleSave = async (formData: JobFormData) => {
    setIsCreating(true);
    try {
      const payload = {
        ...formData,
        url: formData.url || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined
      };

      await axiosInstance.post('/jobs', payload);

      toast({
        title: 'Success',
        description: 'Job created successfully',
        className: 'bg-supperagent text-white border-none'
      });

      setDialogOpen(false);
      fetchJobs(currentPage, entriesPerPage, filters);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create job',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (job: Job) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  // Confirm and execute delete
  const confirmDelete = async () => {
    if (!jobToDelete) return;

    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/jobs/${jobToDelete._id}`);

      toast({
        title: 'Success',
        description: `Job "${jobToDelete.title}" has been deleted successfully`,
        className: 'bg-supperagent text-white border-none'
      });

      setDeleteDialogOpen(false);
      setJobToDelete(null);
      fetchJobs(currentPage, entriesPerPage, filters);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete job',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get staff names from job
  const getStaffNamesFromJob = (job: Job) => {
    if (!job.staffId || job.staffId.length === 0) return 'None';

    return job.staffId
      .map((item) => {
        if (typeof item === 'object' && item !== null && 'name' in item) {
          return item.name;
        }
        if (typeof item === 'string') {
          const staffMember = staff.find((s) => s._id === item);
          return staffMember ? staffMember.name : item;
        }
        return '';
      })
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="w-full px-0 py-0">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Job Management</h1>
        </div>
        <div className="flex flex-row items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-none bg-supperagent hover:bg-supperagent/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {user.role === 'admin' && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Button>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <JobFilter
        user={user}
        staff={staff}
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      {/* Table Card */}
      <div className="rounded-lg border border-zinc-200 bg-white p-2 shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : jobs?.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-zinc-400">
            <Search className="h-12 w-12 text-zinc-300" />
            <p>
              No jobs found. Try adjusting your filters or create a new job!
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Job Title</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Assigned Staff</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs?.map((job) => (
                  <TableRow key={job._id}>
                    <TableCell
                      onClick={() => navigate(job._id)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-zinc-900">
                            {job.title}
                          </p>
                        </div>
                        <p className="max-w-[200px] truncate text-xs text-zinc-400">
                          {job.url}
                        </p>
                        {job.todayFollowup && (
                          <span className="inline-flex items-center gap-1  text-[11px] font-semibold text-amber-700">
                            Follow-up Today
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      onClick={() => navigate(job._id)}
                      className="cursor-pointer"
                    >
                      <p className="text-sm text-black">{job.email}</p>
                      <p className="mt-0.5 text-xs text-black">{job.phone}</p>
                    </TableCell>
                    <TableCell
                      onClick={() => navigate(job._id)}
                      className="cursor-pointer"
                    >
                      {job.country}
                    </TableCell>
                    <TableCell
                      onClick={() => navigate(job._id)}
                      className="cursor-pointer"
                    >
                      <span className="text-sm text-black">
                        {getStaffNamesFromJob(job)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => navigate(job._id)}
                          className="cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {user.role === 'admin' && (
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDeleteClick(job)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="py-2">
                <DataTablePagination
                  pageSize={entriesPerPage}
                  setPageSize={setEntriesPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Job Dialog */}
      <JobDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        staff={staff}
        isLoading={isCreating}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job
              {jobToDelete && (
                <span className="font-semibold"> "{jobToDelete.title}"</span>
              )}
              {jobToDelete?.staffId && jobToDelete.staffId.length > 0 && (
                <span>
                  {' '}
                  and remove all {jobToDelete.staffId.length} assigned staff
                  member(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete Job'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
