'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

// Updated Zod schema to include remitTo, paymentInfo, and course details
const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
  totalAmount: z.number().min(0, 'Total amount is required'),
  Status: z.enum(['due', 'paid']),
  remitTo: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    address: z.string().min(1, 'Address is required')
  }),
  paymentInfo: z.object({
    sortCode: z.string().min(1, 'Sort code is required'),
    accountNo: z.string().min(1, 'Account number is required'),
    beneficiary: z.string().optional()
  }),
  courseDetails: z.object({
    course: z.string().min(1, 'Course is required'),
    institute: z.string().min(1, 'Institute is required'),
    semester: z.string().min(1, 'Semester is required'),
    year: z.string().min(1, 'Year is required'),
    session: z.string().min(1, 'Session is required')
  }),
  students: z.array(
    z.object({
      collageroll: z.number().min(1, 'College Roll is required'),
      refId: z.string().min(1, 'Reference ID is required'),
      name: z.string().min(1, 'Name is required'),
      course: z.string().min(1, 'Course is required'),
      amount: z.number().min(0, 'Amount is required')
    })
  )
});

export default function GenerateInvoicePage() {
  const navigate = useNavigate();
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [courses, setCourses] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [semesters, setSemesters] = useState([
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8'
  ]);
  const [years, setYears] = useState(['2023', '2024', '2025', '2026']);
  const [sessions, setSessions] = useState([
    'Spring',
    'Summer',
    'Fall',
    'Winter'
  ]);

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      invoiceDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      ),
      paymentMethod: '',
      notes: '',
      Status: 'due',
      remitTo: {
        name: '',
        email: '',
        address: ''
      },
      paymentInfo: {
        sortCode: '',
        accountNo: '',
        beneficiary: ''
      },
      courseDetails: {
        course: '',
        institute: '',
        semester: '',
        year: '',
        session: ''
      }
    }
  });

  useEffect(() => {
    // Fetch courses, institutes and other data (simulated here)
    const fetchCourseData = async () => {
      try {
        // In a real implementation, you would fetch this data from your API
        // For demonstration, using hardcoded data
        setCourses([
          { id: 'cs101', name: 'Computer Science' },
          { id: 'eng101', name: 'Engineering' },
          { id: 'bus101', name: 'Business Administration' },
          { id: 'med101', name: 'Medical Sciences' }
        ]);

        setInstitutes([
          { id: 'inst1', name: 'University of Technology' },
          { id: 'inst2', name: 'State College' },
          { id: 'inst3', name: 'Metropolitan University' },
          { id: 'inst4', name: 'Technical Institute' }
        ]);
      } catch (error) {
        console.error('Error fetching course data:', error);
      }
    };

    fetchCourseData();
  }, []);

  useEffect(() => {
    // Retrieve selected students from localStorage
    const storedStudents = localStorage.getItem('selectedStudents');
    if (storedStudents) {
      try {
        const parsedStudents = JSON.parse(storedStudents);
        // Add a sessionFee property to each student for demo purposes
        const studentsWithFees = parsedStudents.map((student) => ({
          ...student,
          sessionFee:
            student.sessionFee || Math.floor(Math.random() * 500) + 500, // Random fee between 500-1000 for demo
          selected: true
        }));
        setSelectedStudents(studentsWithFees);
      } catch (error) {
        console.error('Error parsing stored students:', error);
        navigate('/');
      }
    } else {
      // Redirect back if no students were selected
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    // Calculate total amount whenever selected students change
    const total = selectedStudents
      .filter((student) => student.selected)
      .reduce((sum, student) => sum + (student.sessionFee || 0), 0);
    setTotalAmount(total);

    // Update form's total amount
    form.setValue('totalAmount', total);
  }, [selectedStudents, form]);

  const handleStudentSelect = (studentId) => {
    setSelectedStudents((prev) =>
      prev.map((student) =>
        student._id === studentId
          ? { ...student, selected: !student.selected }
          : student
      )
    );
  };

  const handleRemoveStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.filter((student) => student._id !== studentId)
    );
  };

  const onSubmit = (data: z.infer<typeof invoiceSchema>) => {
    const finalStudents = selectedStudents
      .filter((student) => student.selected)
      .map((student) => ({
        collageroll: student.collageRoll,
        refId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        course: data.courseDetails.course,
        amount: student.sessionFee
      }));

    const invoiceData = {
      ...data,
      students: finalStudents,
      totalAmount
    };

    console.log('Invoice data:', invoiceData);
    // Here you would typically send this data to your backend
    // For now, we'll just show an alert
    alert('Invoice generated successfully!');
    // Clear localStorage and redirect back to student list
    localStorage.removeItem('selectedStudents');
    navigate('/admin/invoice');
  };

  const goBack = () => {
    navigate('/admin/invoice/students');
  };

  return (
    <div className="mx-auto py-1">
      <Button variant="ghost" onClick={goBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Student List
      </Button>

      <h1 className="mb-6 text-2xl font-bold">Generate Invoice</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>Enter the invoice information</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                id="invoice-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Remit To Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Remit To</h3>
                    <FormField
                      control={form.control}
                      name="remitTo.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="remitTo.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="remitTo.address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentInfo.sortCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sort Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentInfo.accountNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentInfo.beneficiary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beneficiary</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Course Details Section */}
                  <div className="space-y-4">
  <h3 className="text-lg font-semibold">Course Details</h3>

  <FormField
    control={form.control}
    name="courseDetails.course"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Course</FormLabel>
        <FormControl>
          <Input
            {...field}
            value={
              courses.find(
                (course) =>
                  course._id === form.watch('courseDetails.course')
              )?.name || 'No course selected'
            }
            readOnly
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />

  <FormField
    control={form.control}
    name="courseDetails.institute"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Institute</FormLabel>
        <FormControl>
          <Input
            {...field}
            value={
              institutes.find(
                (institute) =>
                  institute._id === form.watch('courseDetails.institute')
              )?.name || 'No institute selected'
            }
            readOnly
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />

  <FormField
    control={form.control}
    name="courseDetails.semester"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Semester</FormLabel>
        <FormControl>
          <Input
            {...field}
            value={form.watch('courseDetails.semester') || 'No semester selected'}
            readOnly
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />

  <FormField
    control={form.control}
    name="courseDetails.year"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Year</FormLabel>
        <FormControl>
          <Input
            {...field}
            value={form.watch('courseDetails.year') || 'No year selected'}
            readOnly
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />

  <FormField
    control={form.control}
    name="courseDetails.session"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Session</FormLabel>
        <FormControl>
          <Input
            {...field}
            value={form.watch('courseDetails.session') || 'No session selected'}
            readOnly
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />

  <FormField
    control={form.control}
    name="Status"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Status</FormLabel>
        <FormControl>
          <Input
            {...field}
            value={form.watch('Status') === 'due' ? 'Due' : 'Paid'}
            readOnly
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>

                </div>

                {/* Students Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Include</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>College Roll</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Session Fee</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>
                          <Checkbox
                            checked={student.selected}
                            onCheckedChange={() =>
                              handleStudentSelect(student._id)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.collageRoll}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell className="text-right">
                          ${student.sessionFee.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveStudent(student._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {selectedStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-4 text-center">
                          No students selected
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-lg font-semibold">
              Total Amount:{' '}
              <span className="text-xl">${totalAmount.toFixed(2)}</span>
            </div>
            <Button
              type="submit"
              form="invoice-form"
              className="bg-supperagent text-white hover:bg-supperagent"
              disabled={selectedStudents.filter((s) => s.selected).length === 0}
            >
              Generate Invoice
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
