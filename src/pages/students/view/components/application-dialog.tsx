import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axiosInstance from '@/lib/axios'; // Adjust the path as needed
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useSelector } from 'react-redux';

const formSchema = z.object({
  termId: z.string().min(1, 'Term is required'),
  instituteId: z.string().min(1, 'Institution is required'),
  courseId: z.string().min(1, 'Course is required'),
  choice: z.string().min(1, 'Choice is required'),
  amount: z.string().min(1, 'Amount is required') // New field for amount
});

export function ApplicationDialog({ open, onOpenChange, onSubmit }) {
  const [data, setData] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const { user } = useSelector((state: any) => state.auth);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      termId: '',
      instituteId: '',
      courseId: '',
      choice: '',
      amount: '' // Initialize amount
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/course-relations?limit=all');
        setData(response.data.data.result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  const handleTermChange = (termId) => {
    form.setValue('instituteId', '');
    form.setValue('courseId', '');
    form.setValue('choice', '');
    form.setValue('amount', ''); // Reset amount
    setSelectedCourse(null);

    const filteredInstitutions = data
      .filter((item) => item.term._id === termId)
      .map((item) => ({
        value: item.institute._id,
        label: item.institute.name
      }));
    setInstitutions(filteredInstitutions);
  };

  const handleInstitutionChange = (institutionId) => {
    form.setValue('course', '');
    form.setValue('choice', '');
    form.setValue('amount', ''); // Reset amount
    setSelectedCourse(null);

    const filteredCourses = data
      .filter((item) => item.institute._id === institutionId)
      .map((item) => ({
        value: item.course._id,
        label: item.course.name
      }));
    setCourses(filteredCourses);
  };

  const handleCourseChange = (courseId) => {
    const courseData = data.find((item) => item.course._id === courseId);
    setSelectedCourse(courseData);
    form.setValue('choice', '');
    form.setValue('amount', ''); // Reset amount
  };

  const handleChoiceChange = (value) => {
    form.setValue('choice', value);
    const amount =
      value === 'Local'
        ? selectedCourse.local_amount
        : selectedCourse.international_amount;
    form.setValue('amount', amount || ''); // Set amount based on choice
  };

  const handleSubmit = (formData) => {
    const statusLog = {
      prev_status: null,
      changed_to: 'New',
      assigned_by: user._id,
      changed_by: null,
      assigned_at: new Date(),
      created_at: null
    };
    // Constructing the payload
    const payload = {
      courseRelationId: selectedCourse._id,
      choice: formData.choice,
      amount: formData.amount,
      status: 'New', // Default status
      statusLogs: [statusLog], // Default empty status logs
      created_at: new Date() // Set current date as created_at
    };

    onSubmit(payload); // Pass the constructed payload to the parent onSubmit handler
    onOpenChange(false); // Close the dialog after submission
  };

  const handleDialogClose = (isOpen) => {
    if (!isOpen) {
      form.reset(); // Reset the form when the dialog is closed
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Interested Course</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
          
         {/* Term Selection */}
<FormField
  control={form.control}
  name="termId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Term</FormLabel>
      <select
        {...field}
        onChange={(e) => {
          field.onChange(e);
          handleTermChange(e.target.value);
        }}
        className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
      >
        <option value="">Select term</option>
        {data
          .map((item) => ({
            value: item.term._id,
            label: item.term.term,
          }))
          .filter(
            (value, index, self) =>
              index === self.findIndex((t) => t.value === value.value)
          ) // Filter out duplicates based on 'value'
          .map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </select>
      <FormMessage />
    </FormItem>
  )}
/>

{/* Institution Selection */}
<FormField
  control={form.control}
  name="instituteId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Institution</FormLabel>
      <select
        {...field}
        onChange={(e) => {
          field.onChange(e);
          handleInstitutionChange(e.target.value);
        }}
        className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
      >
        <option value="">Select institution</option>
        {institutions
          .filter(
            (option, index, self) =>
              index === self.findIndex((t) => t.value === option.value)
          ) // Filter duplicates based on 'value'
          .map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </select>
      <FormMessage />
    </FormItem>
  )}
/>

{/* Course Selection */}
<FormField
  control={form.control}
  name="courseId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Course</FormLabel>
      <select
        {...field}
        onChange={(e) => {
          field.onChange(e);
          handleCourseChange(e.target.value);
        }}
        className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
      >
        <option value="">Select course</option>
        {courses
          .filter(
            (option, index, self) =>
              index === self.findIndex((t) => t.value === option.value)
          ) // Filter duplicates based on 'value'
          .map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </select>
      <FormMessage />
    </FormItem>
  )}
/>

            {/* Choice (Local/International) Selection */}
            {selectedCourse && (
              <FormField
                control={form.control}
                name="choice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Choose Option</FormLabel>
                    {selectedCourse.local && (
                      <div>
                        <input
                          type="radio"
                          value="Local"
                          id="local"
                          checked={field.value === 'Local'}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            handleChoiceChange(e.target.value);
                          }}
                        />
                        <label htmlFor="local">
                          Local - {selectedCourse.local_amount}
                        </label>
                      </div>
                    )}
                    {selectedCourse.international && (
                      <div>
                        <input
                          type="radio"
                          value="International"
                          id="international"
                          checked={field.value === 'International'}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            handleChoiceChange(e.target.value);
                          }}
                        />
                        <label htmlFor="international">
                          International - {selectedCourse.international_amount}
                        </label>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {/* Submit Button */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-supperagent text-white hover:bg-supperagent"
              >
                Add Course
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
