import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardFooter } from '@/components/ui/card';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { StudentFilter } from './components/student-filter';
import { StudentSelection } from './components/StudentSelection';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';

// Updated Zod schema to include remitTo, paymentInfo, and course details
const invoiceSchema = z.object({
  status: z.enum(['due', 'paid', 'available']),
  remitTo: z.string(),
  courseDetails: z.object({
    semester: z.string(),
    year: z.string(),
    session: z.string()
  })
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

export default function RemitCreatePage() {
  const navigate = useNavigate();
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [courses, setCourses] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [terms, setTerms] = useState([]);
  const [years, setYears] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [courseRelations, setCourseRelations] = useState([]);
  const [selectedCourseRelation, setSelectedCourseRelation] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState('');
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [filteredCourseRelations, setFilteredCourseRelations] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [paymentStatuses, setPaymentStatuses] = useState([
    'paid',
    'due',
    'available'
  ]);
  const { user } = useSelector((state: any) => state.auth);
  const { toast } = useToast();
  const [agents, setAgents] = useState([]);
  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      status: 'available',
      remitTo: '',
      courseDetails: {
        semester: '',
        year: 'Year 1',
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
      paymentStatus: 'available',
      year: 'Year 1',
      session: '',
      searchQuery: '',
      courseRelationId: '' // Add default value for courseRelationId
    }
  });

  const fetchAgents = async () => {
    try {
      const response = await axiosInstance.get(
        '/users?role=agent&limit=all&fields=name'
      );
      setAgents(response?.data?.data?.result); // Assuming the response contains an array of remits
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch agents',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchAgents();
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

      const { agent, courseRelationId, paymentStatus, year, session } = filters;

      const params: Record<string, unknown> = {};

      // Build the query parameters to match backend expectations
      if (agent) {
        params['agentid'] = agent;
      }

      if (courseRelationId) {
        params['agentCourseRelationId'] = courseRelationId;
      }

      if (paymentStatus) {
        params['agentPaymentStatus'] = paymentStatus;
      }

      if (year) {
        params['agentYear'] = year;
      }

      if (session) {
        params['agentSession'] = session;
      }
      params['limit'] = 10000;

      // Make the request to the backend with the filters as params
      const response = await axiosInstance.get('/students', { params });

      const studentsData = response?.data?.data.result || [];
      const filteredStudentsData = studentsData.filter((student) => {
        // Verify course relation match if we filtered by it
        if (courseRelationId) {
          const hasMatchingAccount = student.agentPayments?.some(
            (agentPayment) => agentPayment.courseRelationId === courseRelationId
          );
          if (!hasMatchingAccount) return false;
        }

        // Exclude student if the matched year+session has remit === true
        const isRemitForMatchedPeriod = student.agentPayments?.some(
          (agentPayment) =>
            agentPayment.years?.some(
              (y) =>
                (!year || y.year === year) &&
                y.sessions?.some(
                  (s) =>
                    (!session || s.sessionName === session) && s.remit === true
                )
            )
        );
        if (isRemitForMatchedPeriod) return false;

        // Verify year and session matches if we filtered by them
        if (year || session) {
          return student.agentPayments?.some((agentPayment) =>
            agentPayment.years?.some(
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
        description: 'Failed to fetch students',
        variant: 'destructive'
      });
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

    form.setValue('status', 'available');
  };

  const onFilterSubmit = (data) => {
    setHasSearched(true);
    fetchStudents(data);
  };

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
  //     if (
  //       session.sessionName === 'Session 1' ||
  //       session.sessionName === 'Session 2'
  //     ) {
  //       return validAmount * 0.25 * (rate / 100);
  //     } else {
  //       return validAmount * 0.5 * (rate / 100);
  //     }
  //   }

  //   return 0;
  // };

   // Calculate session fee
  const calculateSessionFee = (session, amount) => {
    if (!session || session.rate == null) return 0
console.log(session,amount)

    const rate = Number(session.rate) || 0
    const validAmount = Number(amount) || 0

    switch (session.type) {
      case "flat":
        return rate
      case "percentage":
        return validAmount * (rate / 100)
      default:
        return 0
    }
  }

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


  const handleAddStudent = async (student) => {
     if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
    const isAlreadySelected = selectedStudents.some(
      (s) => s._id === student._id
    );

    if (!isAlreadySelected) {
      const filterValues = filterForm.getValues();
      
        // Fetch the agent course details
        const agentCourse = await fetchAgentCourse(
          filterValues.agent,
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

        // Find the correct session in the year array of agentCourse
        const agentYear = agentCourse.year.find(
          (y) => y.sessionName === filterValues.session // Assuming sessionName matches filterValues.session
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

        // Calculate the session fee
        const sessionFee = calculateSessionFee(agentYear, studentAmount);

        // Create student object with fee and session details
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
          semester: filterValues.term
        };

        // Update selected students and filtered list
        setSelectedStudents((prev) => [...prev, studentWithFee]);
        setFilteredStudents((prev) =>
          prev.filter((s) => s._id !== student._id)
        );

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

    setPaymentStatuses(['paid', 'due', 'available']);
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

  // const handleStudentSelect = (studentId) => {
  //   setSelectedStudents((prev) =>
  //     prev.map((student) =>
  //       student._id === studentId
  //         ? { ...student, selected: !student.selected }
  //         : student
  //     )
  //   );
  // };

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

  const onSubmit = async (data: z.infer<typeof invoiceSchema>) => {
    const selectedStudentsWithRelation = selectedStudents.filter(
      (student) => student.selected
    );

    if (selectedStudentsWithRelation.length === 0) {
      alert('No students selected.');
      return;
    }

    // Get agent ID from filterForm instead of main form
    const agentId = filterForm.getValues('agent');
    if (!agentId) {
      toast({
        title: 'Error',
        description: 'Please select an agent',
        variant: 'destructive'
      });
      return;
    }

    const courseRelationId = selectedStudentsWithRelation[0].courseRelationId;
    const { courseDetails, ...restData } = data;

    const formattedStudents = selectedStudentsWithRelation.map((student) => ({
      collegeRoll: student.collegeRoll,
      refId: student.refId,
      firstName: student.firstName,
      lastName: student.lastName,
      course: student.course || selectedCourseRelation?.course?.name || '',
      amount: student.amount || student.sessionFee || 0
    }));

    const invoiceData = {
      ...restData,
      noOfStudents: selectedStudentsWithRelation.length,
      courseRelationId,
      remitTo: agentId, // Use the agentId from filterForm
      totalAmount,
      createdBy: user._id,
      year: courseDetails.year,
      session: courseDetails.session,
      semester: courseDetails.semester,
      course: selectedCourseRelation?.course?.name,
      students: formattedStudents,
      status: 'due'
    };

    try {
      await axiosInstance.post('/remit-invoice', invoiceData);
      navigate('/admin/remit');
      toast({
        title: 'Remit Report created successfully',
        className: 'bg-supperagent border-none text-white'
      });
    } catch (error) {
      console.error('Remit submission error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate Remit',
        variant: 'destructive'
      });
    }
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

  useEffect(() => {
    const subscription = filterForm.watch(() => {
      setHasSearched(false);
      setSelectedStudents([]);
    });
    return () => subscription.unsubscribe();
  }, [filterForm.watch]);

  return (
    <div className="py-1">
      <div className="flex flex-row items-center justify-between">
        <h1 className="mb-2 text-2xl font-bold">Generate Remit</h1>

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
          {/* Student Filter Component */}
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
          />

          {/* Student Selection Component */}
          <StudentSelection
            filteredStudents={filteredStudents}
            selectedStudents={selectedStudents}
            loading={loading}
            handleAddStudent={handleAddStudent}
            handleRemoveStudent={handleRemoveStudent}
            hasSearched={hasSearched}
          />

          <CardFooter className="flex justify-between p-4">
            <div className="text-lg font-semibold">
              Total Amount:{' '}
              <span className="text-xl">{totalAmount.toFixed(2)}</span>
            </div>

            <Button
              type="submit"
              form="invoice-form"
              className="bg-supperagent text-white hover:bg-supperagent"
              disabled={selectedStudents.filter((s) => s.selected).length === 0}
              onClick={form.handleSubmit(onSubmit)}
            >
              Generate Remit Report
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
