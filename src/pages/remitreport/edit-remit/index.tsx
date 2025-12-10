import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { StudentFilter } from './components/student-filter';
import { StudentSelection } from './components/StudentSelection';
import { useSelector } from 'react-redux';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { BlinkingDots } from '@/components/shared/blinking-dots';

const invoiceSchema = z.object({
  status: z.enum(['due', 'paid', 'available']),
  remitTo: z.string(),
  courseDetails: z.object({
    semester: z.string(),
    year: z.string(),
    session: z.string()
  }),
  totalAmount: z.number().optional()
});

const filterSchema = z.object({
  agent: z.string(),
  term: z.string().optional(),
  course: z.string().optional(),
  institute: z.string().optional(),
  paymentStatus: z.string().optional(),
  searchQuery: z.string().optional(),
  year: z.string().optional(),
  session: z.string().optional(),
  courseRelationId: z.string().optional()
});

export default function EditRemitPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);

  // State management
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [courses, setCourses] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [terms, setTerms] = useState([]);
  const [years, setYears] = useState([]);
  const [invoiceData, setInvoiceData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [courseRelations, setCourseRelations] = useState([]);
  const [selectedCourseRelation, setSelectedCourseRelation] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [filteredCourseRelations, setFilteredCourseRelations] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatuses, setPaymentStatuses] = useState([
    'paid',
    'due',
    'available'
  ]);
  const [subTotal, setSubTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  // --- NEW STATE FOR ADJUSTMENT ---
  const [adjustmentType, setAdjustmentType] = useState('percentage'); // 'percentage' | 'flat'
  const [adjustmentValue, setAdjustmentValue] = useState('');
  // --------------------------------

  // Form initialization
  const form = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      status: 'due',
      remitTo: '',
      courseDetails: {
        semester: '',
        year: 'Year 1',
        session: ''
      },
      totalAmount: 0
    }
  });

  const filterForm = useForm({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      agent: '',
      term: '',
      course: '',
      institute: '',
      paymentStatus: 'available',
      year: 'Year 1',
      session: '',
      searchQuery: '',
      courseRelationId: ''
    }
  });

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

    form.setValue('status', 'available');
  };

  const fetchAgents = async () => {
    try {
      const response = await axiosInstance.get(
        '/users?role=agent&limit=all&fields=name'
      );
      setAgents(response?.data?.data?.result);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchCourseRelations = async () => {
    try {
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
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchCourseRelations(), fetchAgents()]);

        if (id) {
          await fetchInvoiceData(id);
        }
      } catch (error) {
        console.error('Error in initial data fetch:', error);
        toast({
          title: 'Error',
          description: 'Failed to load initial data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);

  const fetchInvoiceData = async (invoiceId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/remit-invoice/${invoiceId}`);
      const data = response?.data?.data;
      if (!data) throw new Error('Invoice data not found');

      setInvoiceData(data);

      // Set form values
      form.reset({
        status: data.status || 'due',
        remitTo: data.remitTo?._id || data.remitTo || '',
        courseDetails: {
          semester: data.semester || '',
          year: data.year || 'Year 1',
          session: data.session || ''
        },
        totalAmount: data.totalAmount || 0
      });

      // Set Adjustment States from existing data
      if (data.adjustmentType) setAdjustmentType(data.adjustmentType);
      if (data.adjustmentBalance)
        setAdjustmentValue(data.adjustmentBalance.toString());

      // Pre-fill filter form to match invoice details for easier searching
      filterForm.reset({
        agent: data.remitTo?._id || data.remitTo || '',
        year: data.year,
        session: data.session,
        paymentStatus: 'available',
        term: '', // These would need to be derived if needed
        course: '',
        institute: ''
      });

      if (data.courseRelationId) {
        await fetchStudentsForInvoice(
          data.remitTo._id,
          data.courseRelationId,
          data.year,
          data.session,
          'available'
        );
      }
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invoice data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentCourse = async (
    agentId: string,
    courseRelationId: string
  ) => {
    try {
      const response = await axiosInstance.get(
        `/agent-courses?agentId=${agentId}&courseRelationId=${courseRelationId}`
      );
      return response?.data?.data?.result[0] || null;
    } catch (error) {
      console.error('Error fetching agent course:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch agent course details',
        variant: 'destructive'
      });
      return null;
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
      setHasSearched(false);

      const relationResponse = await axiosInstance.get(
        `/course-relations/${courseRelationId._id || courseRelationId}`
      );
      const relationData = relationResponse?.data?.data;
      if (!relationData) throw new Error('Course relation not found');

      setSelectedCourseRelation(relationData);

      const [studentsResponse, invoiceResponse] = await Promise.all([
        axiosInstance.get('/students', {
          params: {
            agentid: agent,
            agentCourseRelationId: relationData._id,
            agentYear: year,
            agentSession: session,
            agentPaymentStatus: paymentStatus,
            limit: 10000
          }
        }),
        id
          ? axiosInstance.get(`/remit-invoice/${id}`)
          : Promise.resolve({ data: { data: { students: [] } } })
      ]);

      const allStudents = studentsResponse?.data?.data?.result || [];
      const invoiceStudents = invoiceResponse?.data?.data?.students || [];

      const yearObj = relationData.years.find((y) => y.year === year);
      const sessionObj = yearObj?.sessions.find(
        (s) => s.sessionName === session
      );

      const selectedStudentsWithFees = invoiceStudents.map((student) => {
        const originalStudent =
          allStudents.find((s) => s.refId === student.refId) || {};
        const studentChoice = originalStudent?.choice || 'Local';

        const studentAmount =
          studentChoice === 'Local'
            ? Number.parseFloat(relationData.local_amount || 0)
            : Number.parseFloat(relationData.international_amount || 0);

        const sessionFee =
          student.amount ||
          (sessionObj ? calculateSessionFee(sessionObj, studentAmount) : 0);

        return {
          ...originalStudent,
          ...student,
          selected: true,
          sessionFee,
          courseRelationId: relationData._id,
          year: year,
          session: session,
          semester: relationData.term?.term || ''
        };
      });

      setSelectedStudents(selectedStudentsWithFees);

      const selectedIds = new Set(selectedStudentsWithFees.map((s) => s.refId));
      const availableStudents = allStudents.filter(
        (student) => !selectedIds.has(student.refId)
      );
      setFilteredStudents(availableStudents);
      setHasSearched(true);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSessionFee = (session, amount) => {
    if (!session || session.rate == null) return 0;
    const rate = Number(session.rate) || 0;
    const validAmount = Number(amount) || 0;

    switch (session.type) {
      case 'flat':
        return rate;
      case 'percentage':
        return validAmount * (rate / 100);
      default:
        return 0;
    }
  };

  const handleAddStudent = async (student) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const isAlreadySelected = selectedStudents.some(
      (s) => s._id === student?._id
    );

    if (!isAlreadySelected) {
      const filterValues = filterForm.getValues();

      try {
        const agentCourse = await fetchAgentCourse(
          invoiceData.remitTo?._id || filterValues.agent,
          selectedCourseRelation?._id
        );

        if (!agentCourse) {
          toast({
            title: 'Error',
            description: 'Agent course configuration not found',
            variant: 'destructive'
          });
          return;
        }

        const agentYear = agentCourse.year.find(
          (y) => y.sessionName === filterValues.session
        );

        if (!agentYear) {
          toast({
            title: 'Error',
            description: 'Session configuration not found for this year',
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

        const studentAmount =
          application.choice === 'Local'
            ? Number.parseFloat(selectedCourseRelation.local_amount)
            : Number.parseFloat(selectedCourseRelation.international_amount);

        const sessionFee = calculateSessionFee(agentYear, studentAmount);

        const studentWithFee = {
          ...student,
          collegeRoll: student.collegeRoll,
          refId: student.refId,
          firstName: student.firstName,
          lastName: student.lastName,
          course: selectedCourseRelation?.course?.name || '',
          amount: sessionFee,
          sessionFee,
          selected: true,
          courseRelationId: selectedCourseRelation?._id,
          Year: filterValues.year,
          Session: filterValues.session,
          semester: filterValues.term,
          status: 'due'
        };

        setSelectedStudents((prev) => [...prev, studentWithFee]);
        setFilteredStudents((prev) =>
          prev.filter((s) => s._id !== student._id)
        );

        if (selectedCourseRelation) {
          updateFormWithCourseDetails(
            selectedCourseRelation,
            filterValues.year,
            filterValues.session
          );
        }
      } catch (error) {
        console.error('Error adding student:', error);
        toast({
          title: 'Error',
          description: 'Failed to add student',
          variant: 'destructive'
        });
      }
    } else {
      toast({
        title: 'Student already added',
        description: 'This student is already in your selection.',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveStudent = (studentId) => {
    const studentToRemove = selectedStudents.find((s) => s._id === studentId);

    if (studentToRemove) {
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

  // --- UPDATED useEffect for Total Amount Calculation with Adjustment ---
  useEffect(() => {
    // 1. Calculate Sum of Students (Subtotal)
    const calculatedSubTotal = selectedStudents
      .filter((student) => student.selected)
      .reduce((sum, student) => sum + (student.amount || 0), 0);

    // 2. Calculate Discount Amount
    let calculatedDiscount = 0;
    const val = parseFloat(adjustmentValue) || 0;

    if (adjustmentType === 'percentage') {
      calculatedDiscount = calculatedSubTotal * (val / 100);
    } else {
      calculatedDiscount = val;
    }

    // 3. Calculate Final Total (ensure it doesn't go below 0)
    const finalTotal = Math.max(0, calculatedSubTotal - calculatedDiscount);

    // 4. Update States
    setSubTotal(calculatedSubTotal);
    setDiscountAmount(calculatedDiscount);
    setTotalAmount(finalTotal);

    // Update form's total amount
    form.setValue('totalAmount', finalTotal);
  }, [selectedStudents, form, adjustmentType, adjustmentValue]);
  // -------------------------------------------------------------------

  // Handlers for Filters (copied from Create page structure if needed for search)
  const onFilterSubmit = (data) => {
    setHasSearched(true);
    // Since we are in edit mode, we might need a modified fetchStudents logic
    // or simply rely on fetchStudentsForInvoice which handles the main load.
    // However, if the user changes filters in edit mode to find MORE students:
    fetchStudentsForInvoice(
      data.agent,
      selectedCourseRelation._id,
      data.year,
      data.session,
      data.paymentStatus
    );
  };

  const handleYearChange = (value) => {
    filterForm.setValue('year', value);
    if (selectedCourseRelation) {
      const yearObj = selectedCourseRelation.years.find(
        (y) => y.year === value
      );
      if (yearObj && yearObj.sessions) {
        const yearSessions = yearObj.sessions.map((s) => s.sessionName);
        setSessions(yearSessions);
        const currentSession = filterForm.getValues('session');
        if (currentSession && !yearSessions.includes(currentSession)) {
          filterForm.setValue('session', '');
        }
      }
    }
  };

  const handleSessionChange = (value) => filterForm.setValue('session', value);

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

    const uniqueInstitutes = filteredInsts.filter(
      (institute, index, self) =>
        index === self.findIndex((i) => i._id === institute._id)
    );

    setFilteredInstitutes(uniqueInstitutes);
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
        name: `${item.course.name} `,
        courseRelation: item
      }));

    setFilteredCourseRelations(filtered);
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

  const currentPaymentStatus = filterForm.watch('paymentStatus');

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...values,
        students: selectedStudents
          .filter((student) => student.selected)
          .map((student) => ({
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
        totalAmount,
        noOfStudents: selectedStudents.length,
        courseRelationId: selectedCourseRelation?._id,
        year: values.courseDetails.year,
        session: values.courseDetails.session,
        semester: values.courseDetails.semester,
        status: 'due',

        // Adjustment Fields
        adjustmentType: adjustmentType,
        adjustmentBalance: Number(adjustmentValue) || 0
      };

      await axiosInstance.patch(`/remit-invoice/${id}`, payload);

      toast({
        description: 'Remit Report updated successfully',
        className: 'bg-supperagent text-white border-none'
      });

      navigate('/admin/remit');
    } catch (error) {
      console.error('Error updating remit Report:', error);
      toast({
        description: 'Failed to update remit Report',
        className: 'bg-destructive border-none text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-1">
      {loading && !invoiceData ? (
        <div className="flex justify-center">
          <BlinkingDots size="large" color="bg-supperagent" />
        </div>
      ) : (
        <div>
          <div className="flex flex-row items-center justify-between">
            <h1 className="mb-2 text-2xl font-bold">Regenerate Remit</h1>
            <Button
              className="mb-2 bg-supperagent text-white hover:bg-supperagent/90"
              size={'sm'}
              onClick={() => navigate('/admin/remit')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back To Remit List
            </Button>
          </div>

          <div className="grid gap-2">
            <Card>
              <form id="invoice-form" onSubmit={form.handleSubmit(onSubmit)}>
                {/* Replaced logic with StudentFilter similar to create page */}
                <StudentFilter
                  filterForm={filterForm}
                  terms={terms}
                  institutes={institutes}
                  sessions={sessions}
                  agents={agents}
                  paymentStatuses={paymentStatuses}
                  onFilterSubmit={onFilterSubmit}
                  handleYearChange={handleYearChange}
                  handleSessionChange={handleSessionChange}
                  handleTermChange={handleTermChange}
                  handleInstituteChange={handleInstituteChange}
                  handleCourseRelationChange={handleCourseRelationChange}
                  filteredInstitutes={filteredInstitutes}
                  filteredCourseRelations={filteredCourseRelations}
                  hasSearched={hasSearched}
                  // Allow filter to be populated initially if needed
                  invoiceData={invoiceData}
                />

                <StudentSelection
                  filteredStudents={filteredStudents}
                  selectedStudents={selectedStudents}
                  loading={loading}
                  handleAddStudent={handleAddStudent}
                  handleRemoveStudent={handleRemoveStudent}
                  hasSearched={hasSearched}
                />

                <CardFooter className="flex flex-col gap-4 p-4">
                  {/* --- Adjustment Section --- */}
                  <div className="flex w-full items-center justify-between">
                    <div className="mb-2 flex items-center">
                      <span className="mr-4 w-28 font-medium">Adjustment</span>
                      <div className="flex w-full items-center gap-2">
                        <Select
                          onValueChange={setAdjustmentType}
                          value={adjustmentType}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="percentage">
                              Percentage
                            </SelectItem>
                            <SelectItem value="flat">Flat</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="ml-auto">
                          <Input
                            type="text"
                            min="0"
                            value={adjustmentValue}
                            placeholder="0"
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /[^0-9.]/g,
                                ''
                              );
                              if ((value.match(/\./g) || []).length <= 1) {
                                setAdjustmentValue(value);
                              }
                            }}
                            className="w-32 text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* --- UPDATED TOTAL DISPLAY LOGIC --- */}
                    <div className="flex flex-col items-end gap-1">
                      {discountAmount > 0 && (
                        <>
                          <div className=" ">
                            Subtotal:{' '}
                            <span className="font-semibold ">
                              {subTotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="">
                            Adjustment: -
                            <span className="font-semibold">
                              {discountAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="my-1 h-[1px] w-full bg-border"></div>
                        </>
                      )}
                      <div className="text-lg font-bold">
                        Total Amount:{' '}
                        <span className="text-xl ">
                          {totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* ------------------------- */}

                  <div className="flex w-full items-center justify-end">
                    <Button
                      type="submit"
                      form="invoice-form"
                      className="bg-supperagent text-white hover:bg-supperagent"
                      disabled={
                        selectedStudents.filter((s) => s.selected).length ===
                          0 ||
                        currentPaymentStatus === 'paid' ||
                        currentPaymentStatus === 'due' ||
                        isSubmitting
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Remit Report'
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
