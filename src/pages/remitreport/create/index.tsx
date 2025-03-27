"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardFooter } from "@/components/ui/card"
import axiosInstance from "@/lib/axios"
import { useToast } from "@/components/ui/use-toast"
import { StudentFilter } from "./components/student-filter"
import { StudentSelection } from "./components/StudentSelection"
import { useSelector } from "react-redux"
import { ArrowLeft } from "lucide-react"

// Updated Zod schema to include remitTo, paymentInfo, and course details
const invoiceSchema = z.object({
  status: z.enum(["due", "paid", "available"]),
  remitTo: z.string(),
  courseDetails: z.object({
    semester: z.string(),
    year: z.string(),
    session: z.string(),
  }),
})

const filterSchema = z.object({
  agent: z.string(),
  term: z.string().optional(),
  course: z.string().optional(),
  institute: z.string().optional(), // Changed from university to institute
  paymentStatus: z.string().optional(),
  searchQuery: z.string().optional(),
  year: z.string().optional(),
  session: z.string().optional(),
  courseRelationId: z.string().optional(), // Add courseRelationId to schema
})

export default function RemitCreatePage() {
  const navigate = useNavigate()
  const [selectedStudents, setSelectedStudents] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [courses, setCourses] = useState([])
  const [institutes, setInstitutes] = useState([])
  const [terms, setTerms] = useState([])
  const [years, setYears] = useState([])
  const [InvoiceData, setInvoiceData] = useState([])
  const [sessions, setSessions] = useState([])
  const [courseRelations, setCourseRelations] = useState([])
  const [selectedCourseRelation, setSelectedCourseRelation] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [agent, setAgent] = useState("")
  const [filteredInstitutes, setFilteredInstitutes] = useState([])
  const [filteredCourseRelations, setFilteredCourseRelations] = useState([])

  const [paymentStatuses, setPaymentStatuses] = useState(["paid", "due", "available"])
  const { user } = useSelector((state: any) => state.auth)
  const { id } = useParams()
  const { toast } = useToast()
  const [agents, setAgents] = useState([])
  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      status: "due",

      remitTo: "",

      courseDetails: {
        semester: "",
        year: "Year 1",
        session: "",
      },
    },
  })

  const filterForm = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      term: "",
      course: "",
      institute: "",
      paymentStatus: "available",
      year: "Year 1",
      session: "",
      searchQuery: "",
      courseRelationId: "", // Add default value for courseRelationId
    },
  })

  const fetchAgents = async () => {
    try {
      const response = await axiosInstance.get("/users?role=agent&limit=all&fields=name")
      setAgents(response?.data?.data?.result) // Assuming the response contains an array of remits
    } catch (error) {
      console.error("Error fetching agents:", error)
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])



  

  
  const fetchInvoiceData = async (invoiceId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/remit-invoice/${invoiceId}`);
      const invoiceData = response?.data?.data;
  
      if (invoiceData) {
        setInvoiceData(invoiceData);
  
        // Set agent/remitTo data
        form.setValue("remitTo", invoiceData.remitTo?._id || invoiceData.remitTo || "");
        filterForm.setValue("agent", invoiceData.remitTo?._id || invoiceData.remitTo || "");
  
        // Set course details
        form.setValue("courseDetails", {
          semester: invoiceData.semester || "",
          year: invoiceData.year || "Year 1",
          session: invoiceData.session || "",
        });
  
        // Set course relation data
        if (invoiceData.courseRelationId) {
          const courseRelationId = invoiceData.courseRelationId._id || invoiceData.courseRelationId;
          const termId = invoiceData.courseRelationId.term?._id || "";
          const instituteId = invoiceData.courseRelationId.institute?._id || "";
          const courseId = invoiceData.courseRelationId.course?._id || "";
  
          // First set the term and institute to ensure proper filtering
          filterForm.setValue("term", termId);
          filterForm.setValue("institute", instituteId);
          filterForm.setValue("course", courseId);
  
          // Get the full course relation data immediately
          const relationResponse = await axiosInstance.get(`/course-relations/${courseRelationId}`);
          const fullCourseRelation = relationResponse?.data?.data;
          
          if (fullCourseRelation) {
            setSelectedCourseRelation(fullCourseRelation);
            filterForm.setValue("courseRelationId", courseRelationId);
            
            // Filter course relations based on term and institute
            const filtered = courseRelations
              .filter((item) => item.term._id === termId && item.institute._id === instituteId)
              .map((item) => ({
                _id: item._id,
                name: `${item.course.name} (${item.term.term})`,
                courseRelation: item,
              }));
  
            setFilteredCourseRelations(filtered);
          }
        }
  
        setTotalAmount(invoiceData.totalAmount || 0);
  
       
          if (invoiceData.courseRelationId && invoiceData.year && invoiceData.session) {
            fetchStudentsForInvoice(
              invoiceData.courseRelationId,
              invoiceData.year,
              invoiceData.session,
              invoiceData.status
            );
          }

      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch invoice data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForInvoice = async (courseRelationId, year, session, agentPaymentStatus) => {
    try {
      setLoading(true);
  
  
      // Get the agent ID
      const agentId = filterForm.getValues("agent") || InvoiceData.remitTo?._id || InvoiceData.remitTo;
    
  
      // Fetch course relation data
      const relationId = courseRelationId._id || courseRelationId;
      const relationResponse = await axiosInstance.get(`/course-relations/${relationId}`);
      const relationData = relationResponse?.data?.data;
  
      if (!relationData) {
        throw new Error("No course relation data found");
      }
  
     
  
      // Update form with relation data
      setSelectedCourseRelation(relationData);
      filterForm.setValue("term", relationData.term?._id || "");
      filterForm.setValue("course", relationData.course?._id || "");
      filterForm.setValue("institute", relationData.institute?._id || "");
      filterForm.setValue("year", year || "");
      filterForm.setValue("session", session || "");
  
      // Determine payment status filter
      const paymentStatus = agentPaymentStatus === "due" ? "available" : agentPaymentStatus;
      
  
      // Fetch all eligible students
      const studentsResponse = await axiosInstance.get("/students", {
        params: {
          agentid: agentId,
          agentCourseRelationId: relationId,
          agentPaymentStatus: paymentStatus,
          agentYear: year,
          agentSession: session,
        },
      });
  
      const allStudents = studentsResponse?.data?.data.result || [];
   
  
      // Fetch invoice students if editing
      let invoiceStudents = [];
      if (id) {
        const invoiceResponse = await axiosInstance.get(`/remit-invoice/${id}`);
        invoiceStudents = invoiceResponse?.data?.data.students || [];
        
     
      }
  
      // Process selected students (from invoice)
      const selectedStudentsWithFees = invoiceStudents.map((student) => {
        const originalStudent = allStudents.find((s) => s.refId === student.refId) || student;
        const studentChoice = originalStudent?.choice || "Local";
  
        const studentAmount = studentChoice === "Local"
          ? Number.parseFloat(relationData.local_amount || 0)
          : Number.parseFloat(relationData.international_amount || 0);
  
        let sessionFee = student.amount || 0;
        const yearObj = relationData.years.find((y) => y.year === year);
        const sessionObj = yearObj?.sessions.find((s) => s.sessionName === session);
        
        if ((!sessionFee || sessionFee === 0) && sessionObj) {
          sessionFee = calculateSessionFee(sessionObj, studentAmount);
        }
  
        return {
          ...originalStudent,
          collageroll: student.collageroll || originalStudent.collageroll,
          refId: student.refId || originalStudent.refId,
          firstName: student.firstName || originalStudent.firstName,
          lastName: student.lastName || originalStudent.lastName,
          course: relationData.course?.name || student.course || "",
          amount: student.amount || sessionFee,
          selected: true,
          sessionFee: sessionFee,
          courseRelationId: relationData._id,
          Year: year,
          Session: session,
          semester: relationData.term.term,
        };
      });
  
    
  
      // Determine available students (not in invoice)
      const selectedIds = new Set(selectedStudentsWithFees.map((s) => s.refId));
      const availableStudents = allStudents.filter((student) => !selectedIds.has(student.refId));
      
  
      setSelectedStudents(selectedStudentsWithFees);
      setFilteredStudents(availableStudents);
      setLoading(false);

  
    } catch (error) {
      console.error("Error fetching students for invoice:", error);
      toast({
        title: "Error",
        description: "Failed to fetch students for this invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (id) {
      setIsEditing(true)
      fetchInvoiceData(id)
    }
  }, [id])

  // Fetch course relations
  const fetchCourseRelations = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get("/course-relations?limit=all")
      const courseRelationsData = response?.data?.data?.result || []
      setCourseRelations(courseRelationsData)

      const uniqueTerms = [...new Set(courseRelationsData.map((cr) => cr.term))]
      const uniqueCourses = [...new Set(courseRelationsData.map((cr) => cr.course))]
      const uniqueInstitutes = [...new Set(courseRelationsData.map((cr) => cr.institute))]

      const uniqueSessions = [
        ...new Set(
          courseRelationsData.flatMap((cr) =>
            cr.years.flatMap((year) => year.sessions.map((session) => session.sessionName)),
          ),
        ),
      ]

      setTerms(uniqueTerms.map((term) => ({ _id: term._id, name: term.term })))
      setCourses(uniqueCourses.map((course) => ({ _id: course._id, name: course.name })))
      setInstitutes(
        uniqueInstitutes.map((institute) => ({
          _id: institute._id,
          name: institute.name,
        })),
      )
      setSessions(uniqueSessions)

      const agentResponse = await axiosInstance.get("/users?role=agent")

      setAgent(agentResponse.data?.data?.result)
    } catch (error) {
      console.error("Error fetching course relations:", error)
      toast({
        title: "Error",
        description: "Failed to fetch course relations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async (filters: z.infer<typeof filterSchema>) => {
    try {
      setLoading(true)

      const { agent, courseRelationId, paymentStatus, year, session } = filters

      const params: Record<string, unknown> = {}

      // Build the query parameters to match backend expectations
      if (agent) {
        params["agentid"] = agent
      }

      if (courseRelationId) {
        params["agentCourseRelationId"] = courseRelationId
      }

      if (paymentStatus) {
        params["agentPaymentStatus"] = paymentStatus
      }

      if (year) {
        params["agentYear"] = year
      }

      if (session) {
        params["agentSession"] = session
      }

      // Make the request to the backend with the filters as params
      const response = await axiosInstance.get("/students", { params })

      const studentsData = response?.data?.data.result || []

      // Now filter the students based on the query you built above

      setStudents(studentsData)
      setFilteredStudents(studentsData)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateFormWithCourseDetails = (courseRelation, selectedYear = null, selectedSession = null) => {
    if (!courseRelation) return

    form.setValue("courseDetails.semester", courseRelation.term.term)

    const yearToUse =
      selectedYear || (courseRelation.years && courseRelation.years.length > 0 ? courseRelation.years[0].year : "")
    form.setValue("courseDetails.year", yearToUse)

    const yearObj = courseRelation.years.find((y) => y.year === yearToUse)

    const sessionToUse =
      selectedSession ||
      (yearObj && yearObj.sessions && yearObj.sessions.length > 0 ? yearObj.sessions[0].sessionName : "")
    form.setValue("courseDetails.session", sessionToUse)

    form.setValue("status", "available")
  }

  const onFilterSubmit = (data) => {
    fetchStudents(data)
  }

  // Update filter form when year or session is selected
  const handleYearChange = (value) => {
    filterForm.setValue("year", value)

    // If we have a selected course relation, update the available sessions for this year
    if (selectedCourseRelation) {
      const yearObj = selectedCourseRelation.years.find((y) => y.year === value)
      if (yearObj && yearObj.sessions) {
        const yearSessions = yearObj.sessions.map((s) => s.sessionName)
        setSessions(yearSessions)

        // Reset session if the current one isn't available for this year
        const currentSession = filterForm.getValues("session")
        if (currentSession && !yearSessions.includes(currentSession)) {
          filterForm.setValue("session", "")
        }
      }
    }
  }



  const handleSessionChange = (value) => {
    filterForm.setValue("session", value)
  }
  const calculateSessionFee = (session, amount) => {
    if (!session || session.rate == null) {
      console.error("Session data is invalid:", session)
      return 0
    }

    const rate = Number(session.rate) || 0
    const validAmount = Number(amount) || 0
    if (session.type === "flat") {
      return rate
    } else if (session.type === "percentage") {
      return validAmount * (rate / 100)
    }
    return 0
  }

  const handleInstituteChange = (instituteId) => {
    filterForm.setValue("course", "");
    filterForm.setValue("courseRelationId", "");
    setSelectedCourseRelation(null);
  
    if (!instituteId) {
      setFilteredCourseRelations([]);
      return;
    }
  
    const termId = filterForm.getValues("term");
    const filtered = courseRelations
      .filter((item) => item.term._id === termId && item.institute._id === instituteId)
      .map((item) => ({
        _id: item._id,
        name: `${item.course.name} `, // More descriptive name
        courseRelation: item,
      }));
  
    setFilteredCourseRelations(filtered);
  };

  const handleCourseRelationChange = (courseRelationId) => {
    const courseRelation = courseRelations.find((item) => item._id === courseRelationId)
    setSelectedCourseRelation(courseRelation)

    if (courseRelation && courseRelation.years && courseRelation.years.length > 0) {
      filterForm.setValue("year", "Year 1")

      handleYearChange("Year 1")
    }
  }

  const handleAddStudent = (student) => {
    const isAlreadySelected = selectedStudents.some((s) => s._id === student._id)

    if (!isAlreadySelected) {
      const filterValues = filterForm.getValues()
      setLoading(true);
      // Find the session details from the selected course relation
      const yearObj = selectedCourseRelation.years.find((y) => y.year === filterValues.year)
      const sessionObj = yearObj.sessions.find((s) => s.sessionName === filterValues.session)


      const application = student.applications.find((app) => app.courseRelationId === selectedCourseRelation._id)

     

      // Now use the student's choice from the application (either "Local" or "International")
      const studentAmount =
        application.choice === "Local"
          ? Number.parseFloat(selectedCourseRelation.local_amount)
          : Number.parseFloat(selectedCourseRelation.international_amount)

      // console.log('Selected Amount:', studentAmount); // Log the amount for debugging

      const sessionFee = calculateSessionFee(sessionObj, studentAmount)

      const studentWithFee = {
        ...student,
        collageroll: student.collageRoll,
        refId: student.refId,
        firstName: student.firstName,
        lastName: student.lastName,
        course: selectedCourseRelation?.course?.name || "",
        amount: sessionFee,
        sessionFee, // Keep this for internal calculations
        selected: true,
        courseRelationId: selectedCourseRelation?._id,
        Year: filterValues.year,
        Session: filterValues.session,
        semester: filterValues.term,
      }

      
      setSelectedStudents((prev) => [...prev, studentWithFee])


      setFilteredStudents((prev) => prev.filter((s) => s._id !== student._id))

      setLoading(false); 
      // Update form values based on the selected course relation and filter values
      if (selectedCourseRelation) {
        updateFormWithCourseDetails(selectedCourseRelation, filterValues.year, filterValues.session)
      }
    } else {
      toast({
        title: "Student already added",
        description: "This student is already in your selection.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchCourseRelations()

    setPaymentStatuses(["paid", "due", "available"])
    setSelectedStudents([])
  }, [])

  useEffect(() => {
    // This will trigger UI updates when form values change
    const subscription = filterForm.watch(() => {
      // Force re-render when filter form values change
    })

    return () => subscription.unsubscribe()
  }, [filterForm])

  useEffect(() => {
    const total = selectedStudents
      .filter((student) => student.selected)
      .reduce((sum, student) => sum + (student.amount || 0), 0)
    setTotalAmount(total)

    // Update form's total amount
    form.setValue("totalAmount", total)
  }, [selectedStudents, form])

  const handleStudentSelect = (studentId) => {
    setSelectedStudents((prev) =>
      prev.map((student) => (student._id === studentId ? { ...student, selected: !student.selected } : student)),
    )
  }

  const handleRemoveStudent = (studentId) => {
    const studentToRemove = selectedStudents.find((s) => s._id === studentId)

    if (studentToRemove) {
      // Remove the student from the selected list
      setSelectedStudents((prev) => prev.filter((student) => student._id !== studentId))

      setLoading(true);

      setFilteredStudents((prev) => {
        const isAlreadyInList = prev.some((s) => s._id === studentToRemove._id)
        if (!isAlreadyInList) {
          const updatedStudent = {
            ...studentToRemove,
            selected: false,
          }
          return [...prev, updatedStudent]
        }
        return prev
      })
      setLoading(false);
    }
  }

  const onSubmit = async (data: z.infer<typeof invoiceSchema>) => {
    const selectedStudentsWithRelation = selectedStudents.filter((student) => student.selected)

    if (selectedStudentsWithRelation.length === 0) {
      alert("No students selected.")
      return
    }

    // Get agent ID from filterForm instead of main form
    const agentId = filterForm.getValues("agent")
    if (!agentId) {
      toast({
        title: "Error",
        description: "Please select an agent",
        variant: "destructive",
      })
      return
    }

    const courseRelationId = selectedStudentsWithRelation[0].courseRelationId
    const { courseDetails, ...restData } = data

    const formattedStudents = selectedStudentsWithRelation.map((student) => ({
      collageroll: student.collageRoll,
      refId: student.refId,
      firstName: student.firstName,
      lastName: student.lastName,
      course: student.course || selectedCourseRelation?.course?.name || "",
      amount: student.amount || student.sessionFee || 0,
    }))

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
      status: "due",
    }

    try {
      await axiosInstance.post("/remit-invoice", invoiceData)
      navigate("/admin/remit")
      toast({
        title: "Remit Report created successfully",
        className: "bg-supperagent border-none text-white",
      })
    } catch (error) {
      console.error("Remit submission error:", error)
      toast({
        title: "Error",
        description: "Failed to generate Remit",
        variant: "destructive",
      })
    }
  }

  const handleTermChange = (termId) => {
    filterForm.setValue("institute", "")
    filterForm.setValue("course", "")
    filterForm.setValue("courseRelationId", "")
    setSelectedCourseRelation(null)

    const filteredInsts = courseRelations
      .filter((item) => item.term._id === termId)
      .map((item) => ({
        _id: item.institute._id,
        name: item.institute.name,
      }))

    // Remove duplicates
    const uniqueInstitutes = filteredInsts.filter(
      (institute, index, self) => index === self.findIndex((i) => i._id === institute._id),
    )

    setFilteredInstitutes(uniqueInstitutes)
  }

  const handleUpdateInvoice = async () => {
    if (!id) {
      toast({
        title: "Error",
        description: "Invoice ID is missing",
        variant: "destructive",
      })
      return
    }

    const selectedStudentsWithRelation = selectedStudents.filter((student) => student.selected)

    if (selectedStudentsWithRelation.length === 0) {
      toast({
        title: "Error",
        description: "No students selected.",
        variant: "destructive",
      })
      return
    }

    // Get agent ID from filterForm
    const agentId = filterForm.getValues("agent")
    if (!agentId) {
      toast({
        title: "Error",
        description: "Please select an agent",
        variant: "destructive",
      })
      return
    }

    try {
      const formattedStudents = selectedStudentsWithRelation.map((student) => ({
        collageroll: student.collageRoll,
        refId: student.refId,
        firstName: student.firstName,
        lastName: student.lastName,
        course: selectedCourseRelation?.course?.name || "",
        amount: student.amount,
      }))

      const calculatedTotalAmount = formattedStudents.reduce((sum, student) => sum + (student.amount || 0), 0)

      const updateData = {
        remitTo: agentId, // Use the agentId from filterForm
        students: formattedStudents,
        noOfStudents: formattedStudents.length,
        totalAmount: calculatedTotalAmount,
      }

      await axiosInstance.patch(`/remit-invoice/${id}`, updateData)
      toast({
        title: "Remit updated successfully",
        className: "bg-supperagent border-none text-white",
      })
      navigate("/admin/remit")
    } catch (error) {
      console.error("Error updating Remit:", error)
      toast({
        title: "Error",
        description: "Failed to update Remit Report",
        variant: "destructive",
      })
    }
  }
  return (
    <div className="py-1">
      <div className="flex flex-row items-center justify-between">
        {isEditing ? (
          <h1 className="mb-2 text-2xl font-bold">Regenerate Remit</h1>
        ) : (
          <h1 className="mb-2 text-2xl font-bold">Generate Remit</h1>
        )}
        <Button
          className="mb-2 bg-supperagent text-white hover:bg-supperagent/90"
          size={"sm"}
          onClick={() => navigate("/admin/remit")}
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
            agents={agents} // Change from agent to agents
            paymentStatuses={paymentStatuses}
            onFilterSubmit={onFilterSubmit}
            handleYearChange={handleYearChange}
            handleSessionChange={handleSessionChange}
            handleTermChange={handleTermChange}
            handleInstituteChange={handleInstituteChange}
            handleCourseRelationChange={handleCourseRelationChange}
            filteredInstitutes={filteredInstitutes}
            filteredCourseRelations={filteredCourseRelations}
            isEditing={isEditing}
            selectedCourseRelation={selectedCourseRelation}
          />

          {/* Student Selection Component */}
          <StudentSelection
            filteredStudents={filteredStudents}
            selectedStudents={selectedStudents}
            loading={loading}
            handleAddStudent={handleAddStudent}
            handleStudentSelect={handleStudentSelect}
            handleRemoveStudent={handleRemoveStudent}
          />

          <CardFooter className="flex justify-between p-4">
            <div className="text-lg font-semibold">
              Total Amount: <span className="text-xl">{totalAmount.toFixed(2)}</span>
            </div>

            {isEditing ? (
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate("/admin/invoice")}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-supperagent text-white hover:bg-supperagent"
                  disabled={selectedStudents.filter((s) => s.selected).length === 0}
                  onClick={handleUpdateInvoice}
                >
                  Update Remit Report
                </Button>
              </div>
            ) : (
              <Button
                type="submit"
                form="invoice-form"
                className="bg-supperagent text-white hover:bg-supperagent"
                disabled={selectedStudents.filter((s) => s.selected).length === 0}
                onClick={form.handleSubmit(onSubmit)}
              >
                Generate Remit Report
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

