import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useEffect } from 'react';
import moment from 'moment';

const formSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  organization: z.string().min(1, 'Organization name is required'),
  address: z.string().min(1, 'Organization address is required'),
  phone: z.string(),
  fromDate: z.string().min(1, 'Start date is required'),
  toDate: z.string().nullable(),
  currentlyWorking: z.boolean()
});

export function WorkExperienceDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData
}) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobTitle: '',
      organization: '',
      address: '',
      phone: '',
      fromDate: '',
      toDate: '',
      currentlyWorking: false
    }
  });

  const currentlyWorking = form.watch('currentlyWorking');

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          ...initialData,
          fromDate: moment(initialData.fromDate).format('YYYY-MM-DD'),
          toDate: initialData.toDate
            ? moment(initialData.toDate).format('YYYY-MM-DD')
            : null,
          currentlyWorking: !!initialData.currentlyWorking
        });
      } else {
        form.reset({
          jobTitle: '',
          organization: '',
          address: '',
          phone: '',
          fromDate: '',
          toDate: '',
          currentlyWorking: false
        }); // Reset to blank default values for a new entry
      }
    }
  }, [open, initialData, form]);

  const handleSubmit = (values) => {
    const transformedData = {
      ...values,
      currentlyWorking: values.currentlyWorking ? 1 : 0
    };
    onSubmit(transformedData);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Work Experience' : 'Add Work Experience'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="toDate"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>To Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={value || ''}
                        onChange={onChange}
                        disabled={currentlyWorking}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="currentlyWorking"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Currently Working
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-supperagent text-white hover:bg-supperagent/90"
                type="submit"
              >
                {initialData ? 'Update Work Experience' : 'Add Work Experience'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
