// export default function CourseRelationDetails() {
//     const { id } = useParams();
//     const [course, setCourse] = useState();
//     const [initialLoading, setInitialLoading] = useState(true);
//     const { toast } = useToast();
//     const yearForm = useForm<z.infer<typeof yearSessionSchema>>({
//         resolver: zodResolver(yearSessionSchema),
//         defaultValues: {
//             years: [],
//         },
//     });

//     const { fields: years, append: appendYear, remove: removeYear } = useFieldArray({
//         control: yearForm.control,
//         name: "years",
//     });

//     const fetchData = async () => {
//         try {
//             if (initialLoading) setInitialLoading(true);
//             const response = await axiosInstance.get(`/course-relations/${id}`);
//             const courseData = response.data.data;
//             setCourse(courseData);
//             const formattedYears = courseData.years.map((year) => ({
//                 id: year.id || `year-${Date.now()}`,
//                 year: year.year,
//                 sessions: year.sessions.map((session) => ({
//                     id: session.id || `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Use existing ID or generate a temporary one
//                     invoiceDate: new Date(session.invoice_date),
//                     rate: Number(session.rate),
//                     type: session.type as "flat" | "percentage",
//                 })),
//             }));

//             console.log(formattedYears)
//             yearForm.reset({ years: formattedYears });
//         } catch (error) {
//             console.error("Error fetching institutions:", error);
//         } finally {
//             setInitialLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchData();
//     }, []);

//     const onSubmit = async (data) => {
//         console.log(data)
//         const formattedYears = data.years.map((year, yearIndex) => {
//             // Include the year's ID only if it exists and is not a temporary ID (starts with 'year-')
//             const yearData = {
//                 ...(year.id && !year.id.startsWith('year-') ? { id: year.id } : {}),
//                 year: `Year ${yearIndex + 1}`,
//                 sessions: year.sessions.map((session, sessionIndex) => {
//                     // Include the session's ID only if it exists and is not a temporary ID (starts with 'session-')
//                     const sessionData = {
//                         ...(session.id && !session.id.startsWith('session-') ? { id: session.id } : {}),
//                         session: `Session ${sessionIndex + 1}`,
//                         invoice_date: moment(session.invoiceDate).format('YYYY-MM-DD'),
//                         rate: session.rate,
//                         type: session.type,
//                     };
//                     return sessionData;
//                 }),
//             };
//             return yearData;
//         });

//         const payload = {
//             years: formattedYears,
//         };

//         console.log(payload)

//         try {
//             const response = await axiosInstance.patch(`/course-relations/${id}`, payload);
//             if (response.data && response.data.success === true) {
//                 toast({
//                     title: "Record updated successfully",
//                     className: "bg-green-500 border-none text-white",
//                 });
//             } else if (response.data && response.data.success === false) {
//                 toast({
//                     title: "Operation failed",
//                     className: "bg-red-500 border-none text-white",
//                 });
//             }
//         } catch (error) {
//             console.error("Error updating course relation:", error);
//         }
//     };

//     const handleAddYear = () => {
//         if (years.length < 4) {
//             appendYear({
//                 id: `year-${Date.now()}`, // Generate a unique ID using timestamp
//                 year: `Year ${years.length + 1}`,
//                 sessions: Array(3).fill(null).map(() => ({
//                     id: `session-${Date.now()}`,
//                     invoiceDate: new Date(),
//                     rate: 0,
//                     type: "flat",
//                 })),
//             });
//         }
//     };

//     return (
//         <div className="mx-auto py-2">
//             <div className="grid md:grid-cols-1 gap-6">
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Course Details</CardTitle>
//                     </CardHeader>
//                     <CardContent className="space-y-2">
//                         <p>
//                             <strong>Institute:</strong> {course?.institute?.name}
//                         </p>
//                         <p>
//                             <strong>Course:</strong> {course?.course?.name}
//                         </p>
//                         <p>
//                             <strong>Term:</strong> {course?.term?.term}
//                         </p>
//                         <p>
//                             <strong>Academic Year:</strong> {course?.term?.academic_year}
//                         </p>
//                         {course?.international_amount !== null && (
//                             <p>
//                                 <strong>International Amount:</strong> {course?.international_amount}
//                             </p>
//                         )}
//                         {course?.local_amount !== null && (
//                             <p>
//                                 <strong>Local Amount:</strong> {course?.local_amount}
//                             </p>
//                         )}
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Year Sessions</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <Form {...yearForm}>
//                             <Button
//                                 type="button"
//                                 onClick={handleAddYear}
//                                 disabled={years.length >= 4}
//                                 className="bg-supperagent text-white hover:bg-supperagent"
//                             >
//                                 <Plus className="h-4 w-4 mr-2" />
//                                 Add Year
//                             </Button>
//                             <form onSubmit={yearForm.handleSubmit(onSubmit)} className="space-y-2">
//                                 <div className="flex justify-end gap-4">

//                                     <Button type="submit" className="bg-supperagent text-white hover:bg-supperagent">Save</Button>
//                                 </div>

//                                 {years.map((year, yearIndex) => (
//                                     <div key={year.id} className="mb-4 p-4 border rounded">
//                                         <h3 className="text-lg font-bold">{year.year} </h3>
//                                         <input type="text" value={year.id} />
//                                         {year.sessions.map((session, sessionIndex) => (
//                                             <div key={sessionIndex} className="mb-4 gap-3 grid grid-cols-3">
//                                                 <div className="space-y-2">
//                                                     <Label>Session {sessionIndex + 1} - Invoice Date</Label>
//                                                     <Input
//                                                         type="date"
//                                                         value={moment(session.invoiceDate).format('YYYY-MM-DD')}
//                                                         onChange={(e) => yearForm.setValue(`years.${yearIndex}.sessions.${sessionIndex}.invoiceDate`, new Date(e.target.value))}
//                                                     />
//                                                 </div>

//                                                 <FormField
//                                                     control={yearForm.control}
//                                                     name={`years.${yearIndex}.sessions.${sessionIndex}.rate`}
//                                                     render={({ field }) => (
//                                                         <FormItem>
//                                                             <FormLabel>Rate</FormLabel>
//                                                             <FormControl>
//                                                                 <Input
//                                                                     type="number"
//                                                                     {...field}
//                                                                     onChange={(e) => field.onChange(Number(e.target.value))}
//                                                                 />
//                                                             </FormControl>
//                                                             <FormMessage />
//                                                         </FormItem>
//                                                     )}
//                                                 />

//                                                 <FormField
//                                                     control={yearForm.control}
//                                                     name={`years.${yearIndex}.sessions.${sessionIndex}.type`}
//                                                     render={({ field }) => (
//                                                         <FormItem>
//                                                             <FormLabel>Type</FormLabel>
//                                                             <Select onValueChange={field.onChange} defaultValue={field.value}>
//                                                                 <FormControl>
//                                                                     <SelectTrigger>
//                                                                         <SelectValue placeholder="Select fee type" />
//                                                                     </SelectTrigger>
//                                                                 </FormControl>
//                                                                 <SelectContent>
//                                                                     <SelectItem value="flat">Flat</SelectItem>
//                                                                     <SelectItem value="percentage">Percentage</SelectItem>
//                                                                 </SelectContent>
//                                                             </Select>
//                                                             <FormMessage />
//                                                         </FormItem>
//                                                     )}
//                                                 />
//                                             </div>
//                                         ))}
//                                         <Button
//                                             type="button"
//                                             onClick={() => removeYear(yearIndex)}
//                                             className="mt-2 bg-red-500 text-white hover:bg-red-600"
//                                         >
//                                             <Trash2 className="h-4 w-4 mr-2" />
//                                             Remove Year
//                                         </Button>
//                                     </div>
//                                 ))}
//                             </form>
//                         </Form>
//                     </CardContent>
//                 </Card>
//             </div>
//         </div>
//     );
// }

// import { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue
// } from '@/components/ui/select';
// import { Card } from '@/components/ui/card';

// export default function CourseRelationDetails() {
//   const [years, setYears] = useState([]);

//   const addYear = () => {
//     if (years.length >= 4) {
//       alert('You can add a maximum of 4 years.');
//       return;
//     }

//     // Automatically name the year (e.g., "Year 1", "Year 2", etc.)
//     const yearName = `Year ${years.length + 1}`;
//     setYears([...years, { year: yearName, sessions: [] }]);
//   };

//   const deleteYear = (yearIndex) => {
//     const updatedYears = years.filter((_, index) => index !== yearIndex);
//     setYears(updatedYears);
//   };

//   const addSession = (yearIndex) => {
//     if (years[yearIndex].sessions.length >= 3) {
//       alert('You can add a maximum of 3 sessions per year.');
//       return;
//     }

//     // Automatically name the session (e.g., "Session 1", "Session 2", etc.)
//     const sessionName = `Session ${years[yearIndex].sessions.length + 1}`;
//     const updatedYears = [...years];
//     updatedYears[yearIndex].sessions.push({
//       name: sessionName, // Add a name field for the session
//       invoiceDate: '',
//       rate: '',
//       type: 'flat'
//     });
//     setYears(updatedYears);
//   };

//   const deleteSession = (yearIndex, sessionIndex) => {
//     const updatedYears = [...years];
//     updatedYears[yearIndex].sessions = updatedYears[yearIndex].sessions.filter(
//       (_, index) => index !== sessionIndex
//     );
//     setYears(updatedYears);
//   };

//   const updateSession = (yearIndex, sessionIndex, field, value) => {
//     const updatedYears = [...years];
//     updatedYears[yearIndex].sessions[sessionIndex][field] = value;
//     setYears(updatedYears);
//   };

//   const handleSubmit = async () => {
//     try {
//       // Perform a PATCH request to update the data on the server
//       const response = await fetch('https://your-api-endpoint.com/update', {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(years)
//       });

//       if (!response.ok) {
//         throw new Error('Failed to update data');
//       }

//       const result = await response.json();
//       console.log('PATCH Response:', result);
//       alert('Data updated successfully!');
//     } catch (error) {
//       console.error('Error updating data:', error);
//       alert('Failed to update data. Please try again.');
//     }
//   };

//   return (
//     <div className="mx-auto">
//       <div className="flex gap-4">
//         <Button
//           className="bg-supperagent text-white hover:bg-supperagent"
//           onClick={addYear}
//         >
//           Add Year
//         </Button>
//         <Button
//           className="bg-black text-white hover:bg-black"
//           onClick={handleSubmit}
//         >
//           Submit
//         </Button>
//       </div>

//       {years.map((yearData, yearIndex) => (
//         <Card key={yearIndex} className="my-6 rounded-lg p-4">
//           <div className="mb-4 flex items-center gap-4">
//             <span className="font-medium">{yearData.year}</span>
//             <Button
//               className="bg-supperagent text-white hover:bg-supperagent"
//               onClick={() => addSession(yearIndex)}
//             >
//               Add Session
//             </Button>
//             <Button
//               className="bg-red-500 text-white hover:bg-red-600"
//               onClick={() => deleteYear(yearIndex)}
//             >
//               Delete Year
//             </Button>
//           </div>

//           {yearData.sessions.map((session, sessionIndex) => (
//             <Card key={sessionIndex} className="mb-4 rounded-lg p-4">
//               <div className="mb-4 flex items-center gap-4">
//                 <span className="font-medium">{session.name}</span>
//                 <Button
//                   className="bg-red-500 text-white hover:bg-red-600"
//                   onClick={() => deleteSession(yearIndex, sessionIndex)}
//                 >
//                   Delete Session
//                 </Button>
//               </div>
//               <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//                 <Input
//                   type="date"
//                   value={session.invoiceDate}
//                   onChange={(e) =>
//                     updateSession(
//                       yearIndex,
//                       sessionIndex,
//                       'invoiceDate',
//                       e.target.value
//                     )
//                   }
//                 />
//                 <Input
//                   type="number"
//                   placeholder="Rate"
//                   value={session.rate}
//                   onChange={(e) =>
//                     updateSession(
//                       yearIndex,
//                       sessionIndex,
//                       'rate',
//                       e.target.value
//                     )
//                   }
//                 />
//                 <Select
//                   value={session.type}
//                   onValueChange={(value) =>
//                     updateSession(yearIndex, sessionIndex, 'type', value)
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Type" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="flat">Flat</SelectItem>
//                     <SelectItem value="percentage">Percentage</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </Card>
//           ))}
//         </Card>
//       ))}
//     </div>
//   );
// }

import { useEffect, useState } from 'react';
import {
  Plus,
  Calendar,
  Percent,
  Euro,
  Landmark,
  BookOpenText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import moment from 'moment';
import { BlinkingDots } from '@/components/shared/blinking-dots';

interface Session {
  _id?: string;
  sessionName?: string;
  invoiceDate: string;
  rate: Number;
  type: 'flat' | 'percentage';
}

interface Year {
  _id?: string;
  year: string;
  sessions: Session[];
}

interface Institute {
  _id?: string;
  name: string;
  status: number;
  created_at: string;
}

interface Course {
  _id?: string;
  name: string;
  status: number;
  created_at: string;
}

interface Term {
  _id?: string;
  term: string;
  academic_year_id: number;
  academic_year: string;
  status: number;
  created_at: string;
}

interface CourseRelation {
  _id?: string;
  institute: Institute;
  course: Course;
  term: Term;
  local: boolean;
  local_amount: string;
  international: boolean;
  international_amount: string;
  years: Year[];
  status: number;
}

const yearSessionSchema = z.object({
  years: z.array(
    z.object({
      id: z.string().optional(),
      year: z.string(),
      sessions: z.array(
        z.object({
          id: z.string().optional(),
          sessionName: z.string(),
          invoiceDate: z.string(),
          rate: z.number(),
          type: z.enum(['flat', 'percentage'])
        })
      )
    })
  )
});

export default function CourseRelationDetails() {
  const { id } = useParams();
  const [courseRelation, setCourseRelation] = useState<CourseRelation | null>(
    null
  );
  const [years, setYears] = useState<Year[]>([]);
  const [isAddingYear, setIsAddingYear] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingSession, setEditingSession] = useState<{
    yearId: string;
    sessionId: string;
    data: Session;
  } | null>(null);
  const [isEditingSession, setIsEditingSession] = useState(false);

  // State for adding new year sessions
  const [newYearSessions, setNewYearSessions] = useState<Session[]>([
    { sessionName: 'Session 1', invoiceDate: '', rate: 0, type: 'flat' },
    { sessionName: 'Session 2', invoiceDate: '', rate: 0, type: 'flat' },
    { sessionName: 'Session 3', invoiceDate: '', rate: 0, type: 'flat' }
  ]);

  // Fetch course relations data
  const fetchCourseRelations = async () => {
    try {
      const response = await axiosInstance.get(`/course-relations/${id}`);
      if (response.data) {
        setCourseRelation(response.data.data);
        setYears(response.data.data.years || []);
      }
    } catch (error) {
      console.error('Error fetching course relations:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCourseRelations();
  }, [id]);

  // Get available years
  const getAvailableYears = () => {
    const existingYears = years.map((y) => parseInt(y.year.split(' ')[1]));
    return Array.from({ length: 4 }, (_, i) => `Year ${i + 1}`).filter(
      (year) => !existingYears.includes(parseInt(year.split(' ')[1]))
    );
  };

  // Handle updating new session data
  const handleUpdateNewSession = (
    index: number,
    field: keyof Session,
    value: string | number
  ) => {
    setNewYearSessions((prev) =>
      prev.map((session, i) =>
        i === index ? { ...session, [field]: value } : session
      )
    );
  };

  // Edit session handler
  const handleEditSession = (year: Year, session: Session) => {
    setEditingSession({
      yearId: year._id!,
      sessionId: session._id!,
      data: { ...session }
    });
    setIsEditingSession(true);
  };

  // Update existing session
  const handleUpdateSession = async () => {
    if (!editingSession) return;
    const { yearId, sessionId, data } = editingSession;

    try {
      await axiosInstance.patch(`/course-relations/${id}`, {
        years: years.map((year) =>
          year._id === yearId
            ? {
                ...year,
                sessions: year.sessions.map((session) =>
                  session._id === sessionId ? { ...session, ...data } : session
                )
              }
            : year
        )
      });

      // Update local state
      setYears((prevYears) =>
        prevYears.map((year) =>
          year._id === yearId
            ? {
                ...year,
                sessions: year.sessions.map((session) =>
                  session._id === sessionId ? { ...session, ...data } : session
                )
              }
            : year
        )
      );

      setIsEditingSession(false);
      setEditingSession(null);
      toast.success('Session updated successfully');
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure previous years are preserved
      const updatedYears = [
        ...years, // Existing years
        {
          year: selectedYear,
          sessions: newYearSessions
        }
      ];

      await axiosInstance.patch(`/course-relations/${id}`, {
        years: updatedYears // Send updated years array
      });

      setIsAddingYear(false);
      fetchCourseRelations(); // Refresh data
      setSelectedYear('');
      setNewYearSessions([
        { sessionName: 'Session 1', invoiceDate: '', rate: 0, type: 'flat' },
        { sessionName: 'Session 2', invoiceDate: '', rate: 0, type: 'flat' },
        { sessionName: 'Session 3', invoiceDate: '', rate: 0, type: 'flat' }
      ]);
      toast.success('Year added successfully');
    } catch (error) {
      console.error('Error updating course relations:', error);
      toast.error('Failed to add year');
    }
  };

  // Format date safely
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy');
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div>
    );
  }

  if (!courseRelation) {
    return (
      <div className="flex h-screen items-center justify-center">
        Course relation not found
      </div>
    );
  }
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col space-y-2 pb-3">
        <h1 className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
          <Landmark className="h-5 w-5 text-supperagent" />
          <span>{courseRelation?.institute?.name}</span>
        </h1>
        <h2 className="text-md flex items-center space-x-2 font-medium text-gray-700">
          <BookOpenText className="h-5 w-5 text-supperagent" />
          <span>{courseRelation?.course?.name}</span>
        </h2>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Years & Sessions</h1>
        <Dialog open={isAddingYear} onOpenChange={setIsAddingYear}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-none bg-supperagent hover:bg-supperagent/90"
              onClick={() => setIsAddingYear(true)}
              disabled={years.length >= 4}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Year
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Year</DialogTitle>
            </DialogHeader>

            {/* Wrap Dialog Content with Form */}
            <form onSubmit={handleSubmit} className="grid gap-6 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Year</label>
                <Select
                  value={selectedYear}
                  onValueChange={(value) => setSelectedYear(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableYears().map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show Sessions only when a valid year is selected */}
              {selectedYear && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Sessions</h3>
                  </div>

                  {newYearSessions.map((session, index) => (
                    <div
                      key={index}
                      className="space-y-4 rounded-lg border border-border p-4"
                    >
                      {/* Align Invoice Date, Rate, and Type in a single row */}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {/* Invoice Date */}
                        <div className="gap-2">
                          <label className="text-xs font-medium">
                            Invoice Date
                          </label>
                          <input
                            type="date"
                            value={
                              session.invoiceDate
                                ? moment(session.invoiceDate).format(
                                    'YYYY-MM-DD'
                                  )
                                : ''
                            }
                            onChange={(e) => {
                              const date = moment(e.target.value).toISOString();
                              handleUpdateNewSession(
                                index,
                                'invoiceDate',
                                date
                              );
                            }}
                            className="rounded-md border border-gray-300 bg-transparent p-[5px]"
                          />
                        </div>

                        {/* Rate */}
                        <div className="gap-2">
                          <label className="text-xs font-medium">Rate</label>
                          <Input
                            type="number"
                            value={session.rate}
                            onChange={(e) =>
                              handleUpdateNewSession(
                                index,
                                'rate',
                                e.target.value
                              )
                            }
                            className="rounded-md border border-gray-300 p-2"
                          />
                        </div>

                        {/* Type */}
                        <div className="gap-2">
                          <label className="text-xs font-medium">Type</label>
                          <Select
                            value={session.type}
                            onValueChange={(value: 'flat' | 'percentage') =>
                              handleUpdateNewSession(index, 'type', value)
                            }
                            className="rounded-md border border-border p-2"
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="flat">Flat</SelectItem>
                              <SelectItem value="percentage">
                                Percentage
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button
                  className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                  type="submit"
                >
                  Add Year
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Session Edit Dialog */}
      <Dialog open={isEditingSession} onOpenChange={setIsEditingSession}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <form
              onSubmit={(e) => {
                e.preventDefault(); // Prevent default form submission behavior
                handleUpdateSession();
              }}
              className="grid gap-4 py-4"
            >
              {/* <div className="grid gap-2">
                <label htmlFor="session-name" className="text-sm font-medium">
                  Session Name
                </label>
                <Input
                  id="session-name"
                  value={editingSession.data.session}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      data: { ...editingSession.data, session: e.target.value }
                    })
                  }
                />
              </div> */}

              <div className="grid gap-2">
                <label className="text-sm font-medium">Invoice Date</label>
                <input
                  type="date"
                  value={moment(editingSession.data.invoiceDate).format(
                    'YYYY-MM-DD'
                  )}
                  onChange={(e) => {
                    setEditingSession({
                      ...editingSession,
                      data: {
                        ...editingSession.data,
                        invoiceDate: moment(e.target.value).toISOString()
                      }
                    });
                  }}
                  className="w-full rounded-md border border-gray-300 bg-transparent p-2"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="rate" className="text-sm font-medium">
                  Rate
                </label>
                <Input
                  id="rate"
                  type="number"
                  value={editingSession.data.rate}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      data: { ...editingSession.data, rate: e.target.value }
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={editingSession.data.type}
                  onValueChange={(value: 'flat' | 'percentage') =>
                    setEditingSession({
                      ...editingSession,
                      data: { ...editingSession.data, type: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                type="submit"
              >
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {years.length > 0 ? (
          [...years]
            .sort((a, b) => {
              const numA = parseInt(a.year.replace('Year ', ''), 10);
              const numB = parseInt(b.year.replace('Year ', ''), 10);
              return numA - numB;
            })
            .map((year) => (
              <Card key={year._id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{year.year}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {year.sessions && year.sessions.length > 0 ? (
                      year.sessions.map((session) => (
                        <div
                          key={session.id}
                          className="cursor-pointer rounded-lg border border-border p-4 transition-colors hover:bg-muted/5"
                          onClick={() => handleEditSession(year, session)}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className="font-medium">
                              {session.sessionName}
                            </h3>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-black" />
                              <span>{formatDate(session.invoiceDate)}</span>
                            </div>
                            <div className="flex items-center">
                              {session.type === 'flat' ? (
                                <span className="px-2 font-semibold">£</span>
                              ) : (
                                <Percent className="mr-2 h-4 w-4 text-black" />
                              )}
                              <span className="font-semibold">
                                {session.rate}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="rounded-sm bg-supperagent px-2 py-1 text-xs text-white hover:bg-supperagent/90">
                                {session.type === 'flat'
                                  ? 'Flat Rate'
                                  : 'Percentage'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No sessions available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
        ) : (
          <div className="col-span-2 py-8 text-center">
            <p className="text-muted-foreground">
              No years added yet. Click "Add Year" to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
