import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardFooter } from '@/components/ui/card';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { StudentFilter } from './components/student-filter';
import { StudentSelection } from './components/StudentSelection';
import { useSelector } from 'react-redux';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const filterSchema = z.object({
  term: z.string().optional(),
  course: z.string().optional(),
  institute: z.string().optional(), // Changed from university to institute
  paymentStatus: z.string().optional(),
  searchQuery: z.string().optional(),
  year: z.string().optional(),
  session: z.string().optional(),
  discountType: z.enum(['percentage', 'flat']).optional(),
  discountMsg: z.string().optional()
});

export default function InvoiceGeneratePage() {
  const navigate = useNavigate();
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [courses, setCourses] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [terms, setTerms] = useState([]);

  const [sessions, setSessions] = useState([]);
  const [courseRelations, setCourseRelations] = useState([]);
  const [selectedCourseRelation, setSelectedCourseRelation] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentStatuses, setPaymentStatuses] = useState(['paid', 'due']);
  const { user } = useSelector((state: any) => state.auth);
  const { toast } = useToast();
  const [customers, setcustomers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [filteredCourseRelations, setFilteredCourseRelations] = useState([]);

  const invoiceSchema = z.object({
    status: z.enum(['due', 'paid']),
    customer: z.string().min(1, { message: 'customer is required' }),
    bank: z.string().min(1, { message: 'Bank is required' }),
    courseDetails: z.object({
      semester: z.string(),
      year: z.string(),
      session: z.string()
    }),
    discountAmount: z
      .union([z.string(), z.number()])
      .transform((val) => Number(val)),
    discountType: z.enum(['percentage', 'flat']).optional(),
    vat: z.union([z.string(), z.number()]).transform((val) => Number(val)),
    discountMsg: z.string().optional()
  });

  const form = useForm<z.infer<typeof invoiceSchema>>({
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

  const filterForm = useForm<z.infer<typeof filterSchema>>({
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

  useEffect(() => {
    const subscription = filterForm.watch(() => {
      setHasSearched(false);
      setSelectedStudents([]);
    });
    return () => subscription.unsubscribe();
  }, [filterForm.watch]);

  const fetchcustomers = async () => {
    try {
      const response = await axiosInstance.get('/customer?limit=all');
      setcustomers(response?.data?.data?.result); // Assuming the response contains an array of customers
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch customers',
        variant: 'destructive'
      });
    }
  };
  const fetchBanks = async () => {
    try {
      const response = await axiosInstance.get('/bank?limit=all');
      setBanks(response?.data?.data?.result);
    } catch (error) {
      console.error('Error fetching banks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch banks',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchcustomers();
    fetchBanks();
  }, []);

  const fetchCourseRelations = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/course-relations?limit=all');
      const courseRelationsData = response?.data?.data?.result || [];
      setCourseRelations(courseRelationsData);

      const uniqueTerms = [
        ...new Set(courseRelationsData.map((cr) => cr.term))
      ];
      const uniqueCourses = [
        ...new Set(courseRelationsData.map((cr) => cr.course))
      ];
      const uniqueInstitutes = [
        ...new Set(courseRelationsData.map((cr) => cr.institute))
      ];

      const uniqueSessions = [
        ...new Set(
          courseRelationsData.flatMap((cr) =>
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
      console.error('Error fetching course relations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch course relations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (filters: z.infer<typeof filterSchema>) => {
    try {
      setLoading(true);

      const {
        term,
        course,
        institute,
        paymentStatus,
        year,
        session,
        searchQuery
      } = filters;

      // 1. Find matching course relation (optional)
      let courseRelationId;
      if (term && course && institute) {
        const matchingRelation = courseRelations.find(
          (cr) =>
            cr.term._id === term &&
            cr.course._id === course &&
            cr.institute._id === institute
        );

        if (matchingRelation) {
          courseRelationId = matchingRelation._id;
          setSelectedCourseRelation(matchingRelation);
          updateFormWithCourseDetails(matchingRelation, year, session);
        }
      }

      // 2. Construct the API params object
      const params: Record<string, any> = {
        paymentStatus: paymentStatus || 'due',
        applicationCourse: selectedCourseRelation?._id,
        ...(year && { year }),
        ...(session && { session }),
        ...(searchQuery && { searchQuery }),
        limit: 10000
      };

      const response = await axiosInstance.get('/students', { params });
      const studentsData = response?.data?.data?.result || [];

      // 4. Client-side filtering
      const filteredStudentsData = studentsData.filter((student) => {
        // Verify course relation match if we filtered by it
        if (courseRelationId) {
          const hasMatchingAccount = student.accounts?.some(
            (account) => account.courseRelationId?._id === courseRelationId
          );
          if (!hasMatchingAccount) return false;
        }

        // Exclude student if the matched year+session has invoice === true
        const isInvoicedForMatchedPeriod = student.accounts?.some((account) =>
          account.years?.some(
            (y) =>
              (!year || y.year === year) &&
              y.sessions?.some(
                (s) =>
                  (!session || s.sessionName === session) && s.invoice === true
              )
          )
        );
        if (isInvoicedForMatchedPeriod) return false;

        // Verify year and session matches if we filtered by them
        if (year || session) {
          return student.accounts?.some((account) =>
            account.years?.some(
              (y) =>
                (!year || y.year === year) &&
                (!session || y.sessions?.some((s) => s.sessionName === session))
            )
          );
        }

        return true;
      });

      setStudents(filteredStudentsData);
      setFilteredStudents(filteredStudentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch students',
        variant: 'destructive'
      });
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFormWithCourseDetails = (
    courseRelation,
    selectedYear = null,
    selectedSession = null
  ) => {
    if (!courseRelation) return;

    form.setValue('courseDetails.semester', courseRelation.term.term);

    const yearToUse =
      selectedYear ||
      (courseRelation.years && courseRelation.years.length > 0
        ? courseRelation.years[0].year
        : '');
    form.setValue('courseDetails.year', yearToUse);

    const yearObj = courseRelation.years.find((y) => y.year === yearToUse);

    const sessionToUse =
      selectedSession ||
      (yearObj && yearObj.sessions && yearObj.sessions.length > 0
        ? yearObj.sessions[0].sessionName
        : '');
    form.setValue('courseDetails.session', sessionToUse);

    form.setValue('status', 'due');
  };

  const onFilterSubmit = (data) => {
    setHasSearched(true);
    fetchStudents(data);
  };

  // Update filter form when year or session is selected
  const handleYearChange = (value) => {
    filterForm.setValue('year', value);

    // If we have a selected course relation, update the available sessions for this year
    if (selectedCourseRelation) {
      const yearObj = selectedCourseRelation.years.find(
        (y) => y.year === value
      );
      if (yearObj && yearObj.sessions) {
        const yearSessions = yearObj.sessions.map((s) => s.sessionName);
        setSessions(yearSessions);

        // Reset session if the current one isn't available for this year
        const currentSession = filterForm.getValues('session');
        if (currentSession && !yearSessions.includes(currentSession)) {
          filterForm.setValue('session', '');
        }
      }
    }
  };

  const handleSessionChange = (value) => {
    filterForm.setValue('session', value);
  };
  // const calculateSessionFee = (session, amount) => {
  //   if (!session || session.rate == null) {
  //     console.error('Session data is invalid:', session);
  //     return 0;
  //   }

  //   const rate = Number(session.rate) || 0;
  //   const validAmount = Number(amount) || 0;
  //   if (session.type === 'flat') {
  //     return rate;
  //   } else if (session.type === 'percentage') {
  //     return validAmount * (rate / 100);
  //   }
  //   return 0;
  // };

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

  const calculateFinalAmount = () => {
    const subtotal = totalAmount;
    const discountType = form.watch('discountType');
    // Convert string to number when calculating
    const discountAmount = Number(form.watch('discountAmount') || 0);
    const vat = Number(form.watch('vat') || 0);

    let discountValue = 0;
    if (discountType === 'percentage') {
      discountValue = subtotal * (discountAmount / 100);
    } else {
      discountValue = discountAmount;
    }

    const amountAfterDiscount = subtotal - discountValue;
    const vatAmount = subtotal * (vat / 100);
    const finalAmount = amountAfterDiscount + vatAmount;

    return {
      subtotal,
      discountValue,
      vatAmount,
      finalAmount
    };
  };
  const handleInstituteChange = (instituteId) => {
    filterForm.setValue('course', '');
    filterForm.setValue('courseRelationId', '');
    setSelectedCourseRelation(null);

    if (!instituteId) {
      setFilteredCourseRelations([]);
      return;
    }

    const termId = filterForm.getValues('term');
    const filtered = courseRelations
      .filter(
        (item) => item.term._id === termId && item.institute._id === instituteId
      )
      .map((item) => ({
        _id: item._id,
        name: `${item.course.name} `, // More descriptive name
        courseRelation: item
      }));

    setFilteredCourseRelations(filtered);
  };

  const handleTermChange = (termId) => {
    filterForm.setValue('institute', '');
    filterForm.setValue('course', '');
    filterForm.setValue('courseRelationId', '');
    setSelectedCourseRelation(null);

    const filteredInsts = courseRelations
      .filter((item) => item.term._id === termId)
      .map((item) => ({
        _id: item.institute._id,
        name: item.institute.name
      }));

    // Remove duplicates
    const uniqueInstitutes = filteredInsts.filter(
      (institute, index, self) =>
        index === self.findIndex((i) => i._id === institute._id)
    );

    setFilteredInstitutes(uniqueInstitutes);
  };

  const handleCourseRelationChange = (courseRelationId) => {
    const courseRelation = courseRelations.find(
      (item) => item._id === courseRelationId
    );
    setSelectedCourseRelation(courseRelation);

    if (
      courseRelation &&
      courseRelation.years &&
      courseRelation.years.length > 0
    ) {
      filterForm.setValue('year', 'Year 1');

      handleYearChange('Year 1');
    }
  };

  const handleAddStudent = (student) => {
    const isAlreadySelected = selectedStudents.some(
      (s) => s._id === student._id
    );

    if (!isAlreadySelected) {
      const filterValues = filterForm.getValues();

      // Find the session details from the selected course relation
      const yearObj = selectedCourseRelation.years.find(
        (y) => y.year === filterValues.year
      );
      const sessionObj = yearObj.sessions.find(
        (s) => s.sessionName === filterValues.session
      );

      if (!sessionObj) {
        toast({
          title: 'Error',
          description: 'Session details not found.',
          variant: 'destructive'
        });
        return;
      }

      const application = student.applications.find(
        (app) => app.courseRelationId._id === selectedCourseRelation._id
      );
      if (!application) {
        toast({
          title: 'Application Not Found',
          description:
            'This student has no application for the selected course.',
          variant: 'destructive'
        });
        return;
      }
      // Now use the student's choice from the application (either "Local" or "International")
      const studentAmount =
        application.choice === 'Local'
          ? Number.parseFloat(selectedCourseRelation.local_amount)
          : Number.parseFloat(selectedCourseRelation.international_amount);

      const sessionFee = calculateSessionFee(sessionObj, studentAmount);

      const studentWithFee = {
        ...student,
        collegeRoll: student.collegeRoll,
        refId: student.refId,
        firstName: student.firstName,
        lastName: student.lastName,
        course: selectedCourseRelation?.course?.name || '',
        amount: sessionFee,
        sessionFee, // Keep this for internal calculations
        selected: true,
        courseRelationId: selectedCourseRelation?._id,
        Year: filterValues.year,
        Session: filterValues.session,
        semester: filterValues.term
      };

      // Update selected students
      setSelectedStudents((prev) => [...prev, studentWithFee]);

      // Remove from available students
      setFilteredStudents((prev) => prev.filter((s) => s._id !== student._id));

      // Update form values based on the selected course relation and filter values
      if (selectedCourseRelation) {
        updateFormWithCourseDetails(
          selectedCourseRelation,
          filterValues.year,
          filterValues.session
        );
      }
    } else {
      toast({
        title: 'Student already added',
        description: 'This student is already in your selection.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchCourseRelations();

    setPaymentStatuses(['paid', 'due']);
    setSelectedStudents([]);
  }, []);

  useEffect(() => {
    const total = selectedStudents
      .filter((student) => student.selected)
      .reduce((sum, student) => sum + (student.amount || 0), 0);
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
    const studentToRemove = selectedStudents.find((s) => s._id === studentId);

    if (studentToRemove) {
      // Remove the student from the selected list
      setSelectedStudents((prev) =>
        prev.filter((student) => student._id !== studentId)
      );

      setLoading(true);

      setFilteredStudents((prev) => {
        const isAlreadyInList = prev.some((s) => s._id === studentToRemove._id);
        if (!isAlreadyInList) {
          const updatedStudent = {
            ...studentToRemove,
            selected: false
          };
          return [...prev, updatedStudent];
        }
        return prev;
      });
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    try {
      setLoading(true);

      const selectedStudentsWithRelation = selectedStudents.filter(
        (student) => student.selected
      );

      if (selectedStudentsWithRelation.length === 0) {
        toast({
          title: 'Error',
          description: 'No students selected',
          variant: 'destructive'
        });
        return;
      }

      if (!selectedCourseRelation) {
        toast({
          title: 'Error',
          description: 'No course relation selected',
          variant: 'destructive'
        });
        return;
      }

      const filterValues = filterForm.getValues();
      const { finalAmount } = calculateFinalAmount();

      const payload = {
        status: filterValues.paymentStatus,
        customer: form.getValues('customer'),
        bank: form.getValues('bank'),
        students: selectedStudentsWithRelation.map((student) => ({
          collegeRoll: student.collegeRoll,
          refId: student.refId,
          firstName: student.firstName,
          lastName: student.lastName,
          course: selectedCourseRelation?.course?.name || '',
          amount: student.sessionFee || 0
        })),
        noOfStudents: selectedStudentsWithRelation.length,
        courseRelationId: selectedCourseRelation._id,
        totalAmount: finalAmount,
        createdBy: user._id,
        year: filterValues.year,
        session: filterValues.session,
        semester: selectedCourseRelation?.term?.term,
        institute: filterValues.institute,
        discountType: form.getValues('discountType'),
        discountAmount: form.getValues('discountAmount'),
        discountMsg: form.getValues('discountMsg'),
        vat: form.getValues('vat')
      };

      await axiosInstance.post('/invoice', payload);

      toast({
        description: 'Invoice created successfully',
        className: 'bg-supperagent border-none text-white'
      });
      navigate('/admin/invoice');
    } catch (error) {
      console.error('Invoice submission error:', error);
      toast({
        description: 'Failed to generate invoice',
        className: 'bg-destructive border-none text-white'
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="py-1">
      <div className="flex flex-row items-center justify-between">
        <h1 className="mb-2 text-2xl font-bold">Generate Invoice</h1>

        <Button
          className="mb-2 bg-supperagent text-white hover:bg-supperagent/90"
          size={'sm'}
          onClick={() => navigate('/admin/invoice')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back To Invoice List
        </Button>
      </div>

      <div className="grid gap-2">
        <Card>
          <div className="flex flex-row items-center justify-start gap-4">
            <div className="p-4">
              <label
                htmlFor="customer"
                className="block text-sm font-medium text-gray-700"
              >
                Select customer
              </label>
              <Select
                onValueChange={(value) => form.setValue('customer', value)}
                value={form.watch('customer') || ''}
              >
                <SelectTrigger className="min-w-[250px]">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.customer && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.customer.message}
                </p>
              )}
            </div>
            <div className="p-4">
              <label
                htmlFor="bank"
                className="block text-sm font-medium text-gray-700"
              >
                Select Bank
              </label>
              <Select
                onValueChange={(value) => form.setValue('bank', value)}
                value={form.watch('bank') || ''}
              >
                <SelectTrigger className="min-w-[250px]">
                  <SelectValue placeholder="Select a Bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks?.map((bank) => (
                    <SelectItem key={bank._id} value={bank._id}>
                      {bank?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.bank && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.bank.message}
                </p>
              )}
            </div>
          </div>
          <StudentFilter
            filterForm={filterForm}
            terms={terms}
            institutes={institutes}
            sessions={sessions}
            paymentStatuses={paymentStatuses}
            onFilterSubmit={onFilterSubmit}
            handleYearChange={handleYearChange}
            handleSessionChange={handleSessionChange}
            handleTermChange={handleTermChange}
            handleInstituteChange={handleInstituteChange}
            handleCourseRelationChange={handleCourseRelationChange}
            filteredInstitutes={filteredInstitutes}
            filteredCourseRelations={filteredCourseRelations}
            selectedCourseRelation={selectedCourseRelation}
            hasSearched={hasSearched}
          />

          <StudentSelection
            filteredStudents={filteredStudents}
            selectedStudents={selectedStudents}
            loading={loading}
            handleAddStudent={handleAddStudent}
            handleStudentSelect={handleStudentSelect}
            handleRemoveStudent={handleRemoveStudent}
          />

          <div className="grid grid-cols-1 gap-4  p-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Discount Type
              </label>
              <Select
                onValueChange={(value) =>
                  form.setValue('discountType', value as 'percentage' | 'flat')
                }
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
              <label className="block text-sm font-medium text-gray-700">
                Discount{' '}
                {form.watch('discountType') === 'percentage'
                  ? '(%)'
                  : '(Amount)'}
              </label>
              <input
                type="text"
                className="flex h-9 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.watch('discountAmount')}
                onChange={(e) => {
                  // Allow only numbers and decimal point
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  form.setValue('discountAmount', value);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                VAT (%)
              </label>
              <input
                type="text"
                className="flex h-9 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.watch('vat')}
                onChange={(e) => {
                  // Allow only numbers and decimal point
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  form.setValue('vat', value);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Discount Message
              </label>
              <Textarea
                className="flex h-10 w-full rounded-md  border-gray-300  px-3 py-2 text-sm "
                value={form.watch('discountMsg')}
                onChange={(e) => form.setValue('discountMsg', e.target.value)}
              />
            </div>
          </div>

          <CardFooter className="flex flex-col gap-2 p-4">
            <div className="flex w-full justify-between">
              <span className="text-sm">Subtotal:</span>
              <span className="text-sm">
                {calculateFinalAmount().subtotal.toFixed(2)}
              </span>
            </div>
            {form.watch('discountAmount') > 0 && (
              <div className="flex w-full justify-between">
                <span className="text-sm">Discount:</span>
                <span className="text-sm">
                  -{calculateFinalAmount().discountValue.toFixed(2)}
                </span>
              </div>
            )}
            {form.watch('vat') > 0 && (
              <div className="flex w-full justify-between">
                <span className="text-sm">VAT ({form.watch('vat')}%):</span>
                <span className="text-sm">
                  {calculateFinalAmount().vatAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex w-full justify-between border-t pt-2 text-lg font-semibold">
              <span>Total Amount:</span>
              <span>{calculateFinalAmount().finalAmount.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex w-full justify-end">
              <Button
                type="submit"
                className="bg-supperagent text-white hover:bg-supperagent"
                disabled={
                  selectedStudents.filter((s) => s.selected).length === 0 ||
                  loading ||
                  !form.watch('customer') ||
                  !form.watch('bank')
                }
                onClick={onSubmit}
              >
                {loading ? 'Processing...' : 'Generate Invoice'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
