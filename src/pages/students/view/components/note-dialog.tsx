// import { useEffect, useState } from 'react';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useForm } from 'react-hook-form';
// import * as z from 'zod';

// import { Button } from '@/components/ui/button';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle
// } from '@/components/ui/dialog';
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage
// } from '@/components/ui/form';
// import Select from 'react-select';
// import { Switch } from '@/components/ui/switch';
// import { Textarea } from '@/components/ui/textarea';
// import axiosInstance from '@/lib/axios';
// const formSchema = z.object({
//   course: z.string().min(1, 'Course is required'),
//   notes: z.string().min(1, 'Note is required'),
//   followUp: z.boolean().default(false),
//   followUpBy: z.any().optional()
// });

// export function AddNoteDialog({ open, onOpenChange, onSubmit }) {
//   const [isFollowUp, setIsFollowUp] = useState(false);
//   const [initialLoading, setInitialLoading] = useState(true);
//   const [staffs, setStaffs] = useState<any>([]);
//   const form = useForm({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       notes: '',
//       followUp: false,
//       followUpBy: [] //
//     }
//   });

//   const handleSubmits = (values) => {
//     onSubmit(values);
//     console.log(values);
//     form.reset();
//     setIsFollowUp(false);
//   };

//   const fetchData = async () => {
//     try {
//       if (initialLoading) setInitialLoading(true);
//       const response = await axiosInstance.get(`/staffs?limit=all`);
//       setStaffs(response.data.data.result);
//     } catch (error) {
//       console.error('Error fetching institutions:', error);
//     } finally {
//       setInitialLoading(false); // Disable initial loading after the first fetch
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle>Add Note</DialogTitle>
//         </DialogHeader>
//         <Form {...form}>
//           <form
//             onSubmit={form.handleSubmit(handleSubmits)}
//             className="space-y-4"
//           >
//             <FormField
//               control={form.control}
//               name="notes"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Note</FormLabel>
//                   <FormControl>
//                     <Textarea
//                       placeholder="Enter your note here"
//                       className="min-h-[100px]"
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="followUp"
//               render={({ field }) => (
//                 <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                   <div className="space-y-0.5">
//                     <FormLabel className="text-base">Is Follow Up</FormLabel>
//                   </div>
//                   <FormControl>
//                     <Switch
//                       checked={field.value}
//                       onCheckedChange={(checked) => {
//                         field.onChange(checked);
//                         setIsFollowUp(checked);
//                       }}
//                     />
//                   </FormControl>
//                 </FormItem>
//               )}
//             />
//             {isFollowUp && (
//               <FormField
//                 control={form.control}
//                 name="followUpBy"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Follow Up By</FormLabel>
//                     <Select
//                       isMulti
//                       name="followUpBy"
//                       options={staffs.map((staff) => ({
//                         value: staff.id,
//                         label: `${staff.firstName} ${staff.lastName}`
//                       }))}
//                       onChange={(selectedOptions) => {
//                         // Update form value with selected staff IDs
//                         const selectedIds = selectedOptions
//                           ? selectedOptions.map((option) => option.value)
//                           : [];
//                         field.onChange(selectedIds);
//                       }}
//                       value={staffs
//                         .filter((staff) => field.value?.includes(staff?.id))
//                         .map((staff) => ({
//                           value: staff.id,
//                           label: `${staff.firstName} ${staff.lastName}`
//                         }))}
//                       placeholder="Select staff members"
//                     />
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             )}
//             <div className="flex justify-end space-x-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => onOpenChange(false)}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 className="bg-supperagent text-white hover:bg-supperagent"
//               >
//                 Submit
//               </Button>
//             </div>
//           </form>
//         </Form>
//       </DialogContent>
//     </Dialog>
//   );
// }

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
import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import Select from 'react-select';

const formSchema = z.object({
  note: z.string().min(1, 'Note is required'),
  isFollowUp: z.boolean().default(false),
  followUpBy: z.array(z.string()).optional()
});

export function AddNoteDialog({ open, onOpenChange, onSubmit }) {
  const [followUp, setFollowUp] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [staffs, setStaffs] = useState<any>([]);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: '',
      isFollowUp: false,
      followUpBy: []
    }
  });

  const fetchData = async () => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/users?role=staff&limit=all`);
      setStaffs(response.data.data.result);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    } finally {
      setInitialLoading(false); // Disable initial loading after the first fetch
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
      form.reset({
        note: '',
        isFollowUp: false,
        followUpBy: []
      }); // Reset to blank default values for a new entry
    }
  }, [open, form]);

  const options = staffs.map(({ _id, name }) => ({
    value: _id, // Ensuring ID is a string
    label: `${name}`
  }));

  const handleSubmit = (values) => {
    console.log(values);
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your note here"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isFollowUp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Is Follow Up</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setFollowUp(checked);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Follow Up Select Field */}
            {form.watch('isFollowUp') && (
              <FormField
                control={form.control}
                name="followUpBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow Up By</FormLabel>
                    <FormControl>
                      <Select
                        isMulti
                        name="followUpBy"
                        options={options}
                        value={options.filter(({ value }) =>
                          field.value?.includes(value)
                        )}
                        onChange={(selected) =>
                          field.onChange(selected.map(({ value }) => value))
                        }
                        className="basic-multi-select"
                        classNamePrefix="select"
                        placeholder="Select staff members"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                Submit
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
