import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import moment from 'moment';

const formSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  course: z.string().min(1, 'Course is required'),
  studyLevel: z.string().min(1, 'Study level is required'),
  resultScore: z.string(),
  outOf: z.string(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required')
});

export function AcademicHistoryDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData
}) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      institution: '',
      course: '',
      studyLevel: '',
      resultScore: '',
      outOf: '',
      startDate: moment().format('YYYY-MM-DD'),
      endDate: moment().format('YYYY-MM-DD')
    }
  });

  useEffect(() => {
    if (initialData) {
      // Reset the form with initial data on edit
      form.reset({
        institution: initialData.institution || '',
        course: initialData.course || '',
        studyLevel: initialData.studyLevel || '',
        resultScore: initialData.resultScore || '',
        outOf: initialData.outOf || '',
        startDate: initialData.startDate
          ? moment(initialData.startDate, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD')
          : moment().format('YYYY-MM-DD'),
        endDate: initialData.endDate
          ? moment(initialData.endDate, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD')
          : moment().format('YYYY-MM-DD')
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values) => {
    onSubmit(values);  // Submit the values to the parent function
    onOpenChange(false); // Close the dialog after submission
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Academic History' : 'Add Academic History'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="course"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="studyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Study Level</FormLabel>
                  <Select
                    value={field.value} // Controlled value
                    onValueChange={field.onChange} // Update form state on change
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select study level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="resultScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Result Score</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="outOf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Out Of</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset(); // Reset the form on cancel
                  onOpenChange(false); // Close the dialog
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-supperagent text-white hover:bg-supperagent"
                type="submit"
              >
                {initialData ? 'Update History' : 'Add History'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
