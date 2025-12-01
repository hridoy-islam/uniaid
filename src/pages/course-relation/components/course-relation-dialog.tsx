import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import axiosInstance from '@/lib/axios';

const newEntrySchema = z.object({
  institute: z.string().min(1, "Institution is required"),
  course: z.string().min(1, "Course is required"),
  term: z.string().min(1, "Term is required"),
  local: z.boolean(),
  local_amount: z.string().optional(),
  international: z.boolean(),
  international_amount: z.string().optional(),
});

const editEntrySchema = z.object({
  institute: z.string().optional(),
  course: z.string().optional(),
  term: z.string().optional(),
  local: z.boolean(),
  local_amount: z.string().optional(),
  international: z.boolean(),
  international_amount: z.string().optional(),
});

interface CourseRelationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function CourseRelationDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData
}: CourseRelationDialogProps) {
  const [institutes, setInstitutes] = useState<any>([]);
  const [terms, setTerms] = useState<any>([]);
  const [courses, setCourses] = useState<any>([]);

  const schema = initialData ? editEntrySchema : newEntrySchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      institute: "",
      course: "",
      term: "",
      local: false,
      local_amount: "",
      international: false,
      international_amount: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [institutesResponse, termsResponse, coursesResponse] = await Promise.all([
          axiosInstance.get('/institutions?limit=all&status=1'),
          axiosInstance.get('/terms?limit=all&status=1'),
          axiosInstance.get('/courses?limit=all&status=1'),
        ]);

        setInstitutes(institutesResponse.data.data.result.map((institute: any) => ({
          value: institute._id,
          label: institute.name,
        })));
        setTerms(termsResponse.data.data.result.map((term: any) => ({
          value: term._id,
          label: term.term,
        })));
        setCourses(coursesResponse.data.data.result.map((course: any) => ({
          value: course._id,
          label: course.name,
        })));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        institute: initialData.institute?._id || "",
        course: initialData.course?._id || "",
        term: initialData.term?._id || "",
        local: initialData.local || false,
        local_amount: initialData.local_amount || "",
        international: initialData.international || false,
        international_amount: initialData.international_amount || "",
      });
    }
  }, [initialData, form]);

  useEffect(() => {
  if (open && !initialData) {
    form.reset({
      institute: "",
      course: "",
      term: "",
      local: false,
      local_amount: "",
      international: false,
      international_amount: "",
    });
  }
}, [open, initialData, form]);
  const onSubmitForm = (data: z.infer<typeof schema>) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Course Relation" : "New Course Relation"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-4">
            <Controller
              name="institute"
              control={form.control}
              render={({ field }) => (
                <select {...field} className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500">
                  <option value="" disabled>Select an institution</option>
                  {institutes.map((institute) => (
                    <option key={institute.value} value={institute.value}>
                      {institute.label}
                    </option>
                  ))}
                </select>
              )}
            />
            <Controller
              name="course"
              control={form.control}
              render={({ field }) => (
                <select {...field} className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500">
                  <option value="" disabled>Select a Course</option>
                  {courses.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              )}
            />
            <Controller
              name="term"
              control={form.control}
              render={({ field }) => (
                <select {...field} className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500">
                  <option value="" disabled>Select a Term</option>
                  {terms.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              )}
            />
            <div className="space-y-4">
              <FormLabel>Course Available To <span className="text-red-500">*</span></FormLabel>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label>Local</label>
                    <FormField
                      control={form.control}
                      name="local"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  {form.watch("local") && (
                    <FormField
                      control={form.control}
                      name="local_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2">£</span>
                              <Input className="pl-7"type="number"  placeholder="Amount" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label>International</label>
                    <FormField
                      control={form.control}
                      name="international"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  {form.watch("international") && (
                    <FormField
                      control={form.control}
                      name="international_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2">£</span>
                              <Input className="pl-7" type="number" placeholder="Amount" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-supperagent text-white hover:bg-supperagent/90">
                {initialData ? "Save Changes" : "Create Course Relation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
