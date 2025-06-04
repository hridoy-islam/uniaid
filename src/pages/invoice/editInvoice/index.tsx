import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardFooter } from '@/components/ui/card';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { StudentFilter } from './components/student-filter';
import { StudentSelection } from './components/StudentSelection';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

const filterSchema = z.object({
  term: z.string().optional(),
  course: z.string().optional(),
  institute: z.string().optional(),
  paymentStatus: z.string().optional(),
  searchQuery: z.string().optional(),
  year: z.string().optional(),
  session: z.string().optional()
});

const invoiceSchema = z.object({
  status: z.enum(['due', 'paid']),
  customer: z.string().min(1, { message: 'Customer is required' }),
  bank: z.string().min(1, { message: 'Bank is required' }),
  discountType: z.enum(['percentage', 'flat']).optional(),
  discountAmount: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val)),
  discountMsg: z.string().optional(),
  vat: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  courseDetails: z.object({
    semester: z.string(),
    year: z.string(),
    session: z.string()
  })
});

export default function InvoicePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;

  // State management
  const [loading, setLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [terms, setTerms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [courseRelations, setCourseRelations] = useState([]);
  const [selectedCourseRelation, setSelectedCourseRelation] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [InvoiceData, setInvoiceData] = useState([]);

  // Form management
  const form = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      status: 'due',
      customer: '',
      bank: '',
      discountType: 'flat',
      discountAmount: '0',
      discountMsg: '',
      vat: '0',
      courseDetails: {
        semester: '',
        year: '',
        session: ''
      }
    }
  });

  const filterForm = useForm({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      term: '',
      course: '',
      institute: '',
      paymentStatus: 'due',
      year: '',
      session: '',
      searchQuery: ''
    }
  });

  // Memoized calculations
  const totalAmount = useMemo(() => {
    return selectedStudents
      .filter((student) => student.selected)
      .reduce((sum, student) => sum + (student.amount || 0), 0);
  }, [selectedStudents]);

  const finalAmountDetails = useMemo(() => {
    const subtotal = totalAmount;
    const discountType = form.watch('discountType');
    const discountAmount = Number(form.watch('discountAmount') || 0);
    const vat = Number(form.watch('vat') || 0);

    let discountValue =
      discountType === 'percentage'
        ? subtotal * (discountAmount / 100)
        : discountAmount;

    const amountAfterDiscount = subtotal - discountValue;
    const vatAmount = subtotal * (vat / 100);
    const finalAmount = amountAfterDiscount + vatAmount;

    return { subtotal, discountValue, vatAmount, finalAmount };
  }, [
    totalAmount,
    form.watch('discountType'),
    form.watch('discountAmount'),
    form.watch('vat')
  ]);

  // Data fetching
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchCustomers(),
          fetchBanks(),
          fetchCourseRelations()
        ]);

        if (isEditing) {
          await fetchInvoiceData(id);
        }
      } catch (error) {
        
        toast({title:'Failed to load initial data', variant:"destructive"});

      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);

  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get('/customer?limit=all');
      setCustomers(response?.data?.data?.result || []);
    } catch (error) {
      
      toast({title:'Failed to fetch customers', variant:"destructive"});
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await axiosInstance.get('/bank?limit=all');
      setBanks(response?.data?.data?.result || []);
    } catch (error) {
      toast({title:'Failed to fetch banks', variant:"destructive"});
    }
  };

  const fetchCourseRelations = async () => {
    try {
      const response = await axiosInstance.get('/course-relations?limit=all');
      const data = response?.data?.data?.result || [];
      setCourseRelations(data);

      // Extract unique values
      const uniqueTerms = [...new Set(data.map((cr) => cr.term))];
      const uniqueCourses = [...new Set(data.map((cr) => cr.course))];
      const uniqueInstitutes = [...new Set(data.map((cr) => cr.institute))];
      const uniqueSessions = [
        ...new Set(
          data.flatMap((cr) =>
            cr.years.flatMap((year) =>
              year.sessions.map((session) => session.sessionName)
            )
          )
        )
      ];

      setTerms(uniqueTerms.map((term) => ({ _id: term._id, name: term.term })));
      setCourses(
        uniqueCourses.map((course) => ({ _id: course._id, name: course.name }))
      );
      setInstitutes(
        uniqueInstitutes.map((institute) => ({
          _id: institute._id,
          name: institute.name
        }))
      );
      setSessions(uniqueSessions);
    } catch (error) {
      toast({title:'Failed to fetch course relations', variant:"destructive"});
    }
  };

  const fetchInvoiceData = async (invoiceId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/invoice/${invoiceId}`);
      const data = response?.data?.data;
      setInvoiceData(data);
      if (!data) throw new Error('Invoice not found');

      // Set form values
      form.reset({
        status: data.status || 'due',
        customer: data.customer?._id || '',
        bank: data.bank?._id || '',
        discountType: data.discountType || 'flat',
        discountAmount: String(data.discountAmount || 0),
        discountMsg: data.discountMsg || '',
        vat: String(data.vat || 0),
        courseDetails: {
          semester: data.semester || '',
          year: data.year || '',
          session: data.session || ''
        }
      });

      if (data.courseRelationId) {
        await fetchStudentsForInvoice(
          data.customer._id,
          data.courseRelationId,
          data.year,
          data.session,
          data.status
        );
      }
    } catch (error) {
      toast({
        title: 'Failed to fetch invoice data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForInvoice = async (
    agent,
    courseRelationId,
    year,
    session,
    paymentStatus
  ) => {
    try {
      setLoading(true);

      const [relationResponse, studentsResponse] = await Promise.all([
        axiosInstance.get(
          `/course-relations/${courseRelationId._id || courseRelationId}`
        ),
        axiosInstance.get('/students', {
          params: {
            applicationCourse: courseRelationId._id || courseRelationId,
            year,
            session,
            paymentStatus,
            limit: 10000
          }
        })
      ]);

      const relationData = relationResponse?.data?.data;
      if (!relationData) throw new Error('Course relation not found');

      setSelectedCourseRelation(relationData);
      const allStudents = studentsResponse?.data?.data?.result || [];

      // Set selected students from invoice
      const selectedStudents = allStudents.map((student) => {
        const yearObj = relationData.years.find((y) => y.year === year);
        const sessionObj = yearObj?.sessions.find(
          (s) => s.sessionName === session
        );
        const application = student.applications?.find(
          (app) => app.courseRelationId === relationData._id
        );

        const studentAmount =
          application?.choice === 'Local'
            ? Number.parseFloat(relationData.local_amount || 0)
            : Number.parseFloat(relationData.international_amount || 0);

        const sessionFee = sessionObj
          ? calculateSessionFee(sessionObj, studentAmount)
          : 0;

        return {
          ...student,
          selected: true,
          amount: sessionFee,
          sessionFee,
          courseRelationId: relationData._id,
          year,
          session,
          semester: relationData.term?.term || ''
        };
      });

      setSelectedStudents(selectedStudents);
      setHasSearched(true);
    } catch (error) {
      toast({
        title: 'Failed to fetch students',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSessionFee = (session, amount) => {
    if (!session || session.rate == null) {
      console.error('Session data is invalid:', session);
      return 0;
    }

    const rate = Number(session.rate) || 0;
    const validAmount = Number(amount) || 0;

    if (session.type === 'flat') {
      return rate;
    } else if (session.type === 'percentage') {
      if (
        session.sessionName === 'Session 1' ||
        session.sessionName === 'Session 2'
      ) {
        return validAmount * 0.25 * (rate / 100);
      } else {
        return validAmount * 0.5 * (rate / 100);
      }
    }

    return 0;
  };

  const handleAddStudent = (student) => {
    if (selectedStudents.some((s) => s._id === student._id)) {
      toast({
        title: 'This student is already selected',
        variant: 'destructive'
      });
      return;
    }

    const filterValues = filterForm.getValues();
    const yearObj = selectedCourseRelation?.years?.find(
      (y) => y.year === filterValues.year
    );
    const sessionObj = yearObj?.sessions?.find(
      (s) => s.sessionName === filterValues.session
    );
    const application = student.applications?.find(
      (app) => app.courseRelationId?._id === selectedCourseRelation?._id
    );

    if (!application) {
      toast({
        title: 'Application Not Found',
        description: 'This student has no application for the selected course.',
        variant: 'destructive'
      });
      return;
    }
    const studentAmount =
      application?.choice === 'Local'
        ? Number.parseFloat(selectedCourseRelation?.local_amount || 0)
        : Number.parseFloat(selectedCourseRelation?.international_amount || 0);

    const sessionFee = calculateSessionFee(sessionObj, studentAmount);

    const studentWithFee = {
      ...student,
      selected: true,
      amount: sessionFee,
      sessionFee,
      courseRelationId: selectedCourseRelation?._id,
      year: filterValues.year,
      session: filterValues.session,
      semester: selectedCourseRelation?.term?.term || ''
    };

    setSelectedStudents((prev) => [...prev, studentWithFee]);
    setFilteredStudents((prev) => prev.filter((s) => s._id !== student._id));
  };

  const handleRemoveStudent = (studentId) => {
    const studentToRemove = selectedStudents.find((s) => s._id === studentId);
    if (!studentToRemove) return;

    setSelectedStudents((prev) =>
      prev.filter((student) => student._id !== studentId)
    );
    setFilteredStudents((prev) => {
      const isAlreadyInList = prev.some((s) => s._id === studentToRemove._id);
      return isAlreadyInList
        ? prev
        : [...prev, { ...studentToRemove, selected: false }];
    });
  };

  const onSubmit = async () => {
    try {
      setLoading(true);

      const selectedStudentsData = selectedStudents.filter(
        (student) => student.selected
      );
      if (selectedStudentsData.length === 0) {
        toast({ title: 'No students selected', variant: 'destructive' });
        return;
      }

      if (!selectedCourseRelation) {
        toast({ title: 'No course relation selected', variant: 'destructive' });
        return;
      }

      const payload = {
        status: form.getValues('status'),
        customer: form.getValues('customer'),
        bank: form.getValues('bank'),
        students: selectedStudentsData.map((student) => ({
          refId: student.refId || student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          collegeRoll: student.collegeRoll,
          course: student.course || selectedCourseRelation?.course?.name,
          amount: student.amount,
          courseRelationId:
            student.courseRelationId || selectedCourseRelation?._id,
          year: student.year || filterForm.getValues().year,
          session: student.session || filterForm.getValues().session,
          semester: student.semester || selectedCourseRelation?.term?.term
        })),
        noOfStudents: selectedStudentsData.length,
        totalAmount: finalAmountDetails.finalAmount,
        courseRelationId: selectedCourseRelation._id,
        discountType: form.getValues('discountType'),
        discountAmount: Number(form.getValues('discountAmount')),
        discountMsg: form.getValues('discountMsg'),
        vat: Number(form.getValues('vat')),
        year: filterForm.getValues('year'),
        session: filterForm.getValues('session'),
        semester: selectedCourseRelation.term?.term
      };

      const endpoint = isEditing ? `/invoice/${id}` : '/invoice';
      const method = isEditing ? 'patch' : 'post';

      await axiosInstance[method](endpoint, payload);

      toast({
        title: 'Invoice updated successfully',
        className: 'bg-supperagent border-none text-white'
      });
      navigate('/admin/invoice');
    } catch (error) {
      toast({ title: `Failed to update invoice`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-1">
      <div className="flex flex-row items-center justify-between">
        <h1 className="mb-2 text-2xl font-bold">
          {isEditing ? 'Edit Invoice' : 'Generate Invoice'}
        </h1>
        <Button
          className="mb-2 bg-supperagent text-white hover:bg-supperagent/90"
          size="sm"
          onClick={() => navigate('/admin/invoice')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back To Invoice List
        </Button>
      </div>

      <div className="grid gap-2">
        <Card>
          <div className="flex flex-row flex-wrap items-start justify-start gap-4 p-4">
            <div className="min-w-[250px]">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Select customer
              </label>
              <Select
                onValueChange={(value) => form.setValue('customer', value)}
                value={form.watch('customer')}
             
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[250px]">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Select Bank
              </label>
              <Select
                onValueChange={(value) => form.setValue('bank', value)}
                value={form.watch('bank')}
           
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank._id} value={bank._id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Student Filter Component */}
          <StudentFilter filterForm={filterForm} invoiceData={InvoiceData} />

          {/* Student Selection Component */}
          <StudentSelection
            filteredStudents={filteredStudents}
            selectedStudents={selectedStudents}
            loading={loading}
            handleAddStudent={handleAddStudent}
            handleRemoveStudent={handleRemoveStudent}
            hasSearched={hasSearched}
          />

          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Discount Type
              </label>
              <Select
                onValueChange={(value) => form.setValue('discountType', value)}
                value={form.watch('discountType')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {form.watch('discountType') === 'percentage'
                  ? 'Discount (%)'
                  : 'Discount Amount'}
              </label>
              <Input
                type="text"
                value={form.watch('discountAmount')}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  form.setValue('discountAmount', value);
                }}
                className="flex h-9 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"

              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                VAT (%)
              </label>
              <Input
                type="text"
                value={form.watch('vat')}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  form.setValue('vat', value);
                }}
                className="flex h-9 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"

              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Discount Message
              </label>
              <Textarea
                value={form.watch('discountMsg')}
                onChange={(e) => form.setValue('discountMsg', e.target.value)}
                placeholder="discount message"
                className="flex h-9 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"

              />
            </div>
          </div>

          <CardFooter className="flex flex-col gap-2 p-4">
            <div className="flex w-full justify-between">
              <span className="text-sm">Subtotal:</span>
              <span className="text-sm">
                {finalAmountDetails.subtotal.toFixed(2)}
              </span>
            </div>

            {form.watch('discountAmount') > 0 && (
              <div className="flex w-full justify-between">
                <span className="text-sm">Discount:</span>
                <span className="text-sm">
                  -{finalAmountDetails.discountValue.toFixed(2)}
                </span>
              </div>
            )}

            {form.watch('vat') > 0 && (
              <div className="flex w-full justify-between">
                <span className="text-sm">VAT ({form.watch('vat')}%):</span>
                <span className="text-sm">
                  {finalAmountDetails.vatAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex w-full justify-between border-t pt-2 text-lg font-semibold">
              <span>Total Amount:</span>
              <span>{finalAmountDetails.finalAmount.toFixed(2)}</span>
            </div>

            <div className="mt-4 w-full flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/invoice')}
              >
                Cancel
              </Button>
              <Button
                className="bg-supperagent text-white hover:bg-supperagent"
                onClick={onSubmit}
                disabled={
                  selectedStudents.filter((s) => s.selected).length === 0 ||
                  loading 
                }
              >
                {loading
                  ? 'Processing...'
                  : isEditing
                    ? 'Update Invoice'
                    : 'Generate Invoice'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
