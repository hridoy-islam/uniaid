import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { UseFormReturn } from 'react-hook-form';
import axiosInstance from '@/lib/axios'; // Adjust the import based on your project structure
import { useParams } from 'react-router-dom';

export function StudentFilter({
  filterForm,
  terms,
  courses,
  institutes,
  years,
  sessions,
  paymentStatuses,
  isEditing,
  onFilterSubmit,
  handleYearChange,
  handleSessionChange,
  
}) {

  const {id} = useParams();
  useEffect(() => {
    if (isEditing && id) {
      // Fetch the invoice data when editing
      axiosInstance
        .get(`/invoice/${id}`)
        .then((response) => {
  
          const invoiceData = response.data.data;
          filterForm.reset({
            term: invoiceData.courseRelationId.term?._id ,
            institute: invoiceData.courseRelationId.institute?._id , 
            course: invoiceData.courseRelationId.course?._id ,
            year: invoiceData.year,
            session: invoiceData.session,
            paymentStatus: invoiceData.paymentStatus,
          });
    
        })
        .catch((error) => {
          console.error("Error fetching invoice data:", error);
        });
    }
  }, [isEditing, id, filterForm]);

  
  return (
    <Card className="rounded-none shadow-md">
      <div className='px-6 py-2'>
        <h1 className='font-semibold'>Filter Students</h1>
        <h2>
          Search and filter students to add to the invoice
        </h2>
      </div>
      <CardContent>
        <Form {...filterForm}>
          <form onSubmit={filterForm.handleSubmit(onFilterSubmit)} className="">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Term Select */}
              <FormField
                control={filterForm.control}
                name="term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {terms?.filter(
                            (term, index, self) =>
                              index ===
                              self.findIndex((t) => t._id === term._id)
                          ) // Removes duplicate terms
                          .map((term) => (
                            <SelectItem key={term._id} value={term._id}>
                              {term.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Institute Select */}
              <FormField
                control={filterForm.control}
                name="institute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!filterForm.watch('term') || isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select University" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {institutes?.filter(
                            (institute, index, self) =>
                              index ===
                              self.findIndex((i) => i._id === institute._id)
                          ) // Removes duplicate institutes
                          .map((institute) => (
                            <SelectItem
                              key={institute._id}
                              value={institute._id}
                            >
                              {institute.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Course Select */}
              <FormField
                control={filterForm.control}
                name="course"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!filterForm.watch('institute') || isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses?.filter(
                            (course, index, self) =>
                              index ===
                              self.findIndex((c) => c._id === course._id)
                          )?.map((course) => (
                            <SelectItem key={course._id} value={course._id}>
                              {course.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Year Select */}
              <FormField
                control={filterForm.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleYearChange(value);
                      }}
                      value={field.value}
                      disabled={!filterForm.watch('course') || isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      {years
            ?.sort((a, b) => {
              // Sort years numerically (e.g., Year 1, Year 2, etc.)
              const yearA = parseInt(a.split(' ')[1], 10);
              const yearB = parseInt(b.split(' ')[1], 10);
              return yearA - yearB;
            })
            .map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Session Select */}
              <FormField
                control={filterForm.control}
                name="session"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleSessionChange(value);
                      }}
                      value={field.value}
                      disabled={!filterForm.watch('year') || isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Session" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sessions?.map((session) => (
                          <SelectItem key={session} value={session}>
                            {session}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={filterForm.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || 'due'} // Default to "due" if no value is set
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentStatuses?.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

<div className="mt-8 flex items-center justify-start ">
              <Button
                className="bg-supperagent text-white hover:bg-supperagent/90 min-w-[120px]"
                type="submit"
                disabled={
                  !filterForm.watch('term') ||
                  !filterForm.watch('institute') ||
                  !filterForm.watch('course') ||
                  !filterForm.watch('year') ||
                  !filterForm.watch('session') ||
                  isEditing
                }
              >
                Search
              </Button>
            </div>
              
            </div>

            {/* Search Input */}
            
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}