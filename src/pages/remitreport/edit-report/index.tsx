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
import { BlinkingDots } from "@/components/shared/blinking-dots"

const invoiceSchema = z.object({
  status: z.enum(["due", "paid", "available"]),
  remitTo: z.string(),
  courseDetails: z.object({
    semester: z.string(),
    year: z.string(),
    session: z.string(),
  }),
  totalAmount: z.number().optional(),
})

const filterSchema = z.object({
  agent: z.string(),
  term: z.string().optional(),
  course: z.string().optional(),
  institute: z.string().optional(),
  paymentStatus: z.string().optional(),
  searchQuery: z.string().optional(),
  year: z.string().optional(),
  session: z.string().optional(),
  courseRelationId: z.string().optional(),
})

export default function RemitCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { toast } = useToast()
  const { user } = useSelector((state: any) => state.auth)

  // State management
  const [selectedStudents, setSelectedStudents] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [courses, setCourses] = useState([])
  const [institutes, setInstitutes] = useState([])
  const [terms, setTerms] = useState([])
  const [years, setYears] = useState([])
  const [invoiceData, setInvoiceData] = useState(null)
  const [sessions, setSessions] = useState([])
  const [courseRelations, setCourseRelations] = useState([])
  const [selectedCourseRelation, setSelectedCourseRelation] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [agents, setAgents] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [paymentStatuses] = useState(["paid", "due", "available"])

  // Form initialization
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
      totalAmount: 0,
    },
  })

  const filterForm = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      agent: "",
      term: "",
      course: "",
      institute: "",
      paymentStatus: "available",
      year: "Year 1",
      session: "",
      searchQuery: "",
      courseRelationId: "",
    },
  })

  // Fetch initial data


  // Fetch agents data
  const fetchAgents = async () => {
    try {
      const response = await axiosInstance.get("/users?role=agent&limit=all&fields=name")
      setAgents(response?.data?.data?.result || [])
    } catch (error) {
      console.error("Error fetching agents:", error)
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      })
    }
  }

  // Fetch course relations data
  const fetchCourseRelations = async () => {
    try {
      const response = await axiosInstance.get("/course-relations?limit=all")
      const courseRelationsData = response?.data?.data?.result || []
      setCourseRelations(courseRelationsData)

      // Extract unique values for filters
      const uniqueTerms = [...new Set(courseRelationsData.map(cr => cr.term))]
      const uniqueCourses = [...new Set(courseRelationsData.map(cr => cr.course))]
      const uniqueInstitutes = [...new Set(courseRelationsData.map(cr => cr.institute))]
      const uniqueSessions = [
        ...new Set(
          courseRelationsData.flatMap(cr =>
            cr.years.flatMap(year => year.sessions.map(session => session.sessionName))
          )
        )
      ]

      setTerms(uniqueTerms.map(term => ({ _id: term._id, name: term.term })))
      setCourses(uniqueCourses.map(course => ({ _id: course._id, name: course.name })))
      setInstitutes(uniqueInstitutes.map(institute => ({
        _id: institute._id,
        name: institute.name,
      })))
      setSessions(uniqueSessions)
    } catch (error) {
      console.error("Error fetching course relations:", error)
      toast({
        title: "Error",
        description: "Failed to fetch course relations",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        await Promise.all([
          fetchAgents(),
          fetchCourseRelations(),
        ])

        if (id) {
          await fetchInvoiceData(id)
          setIsEditing(true)
        }
      } catch (error) {
        console.error("Error in initial data fetch:", error)
        toast({
          title: "Error",
          description: "Failed to load initial data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [id])

  // Fetch invoice data for editing
  const fetchInvoiceData = async (invoiceId) => {
    try {
      setLoading(true)

      // Fetch invoice data
      const response = await axiosInstance.get(`/remit-invoice/${invoiceId}`)
      const data = response?.data?.data
      if (!data) throw new Error('Invoice data not found')

      setInvoiceData(data)

      // Set form values
      form.reset({
        status: data.status || "due",
        remitTo: data.remitTo?._id || data.remitTo || "",
        courseDetails: {
          semester: data.semester || "",
          year: data.year || "Year 1",
          session: data.session || "",
        },
        totalAmount: data.totalAmount || 0,
      })


      if (data.courseRelationId) {
        await fetchStudentsForInvoice(
          data.remitTo._id,
          data.courseRelationId,
          data.year,
          data.session,
          "available"
        )
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch invoice data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentsForInvoice = async (agent, courseRelationId, year, session, paymentStatus) => {
    try {
      setLoading(true)
      setHasSearched(false)

      // Fetch course relation
      const relationResponse = await axiosInstance.get(`/course-relations/${courseRelationId._id || courseRelationId}`)
      const relationData = relationResponse?.data?.data
      if (!relationData) throw new Error('Course relation not found')

      setSelectedCourseRelation(relationData)

      // Fetch students
      const [studentsResponse, invoiceResponse] = await Promise.all([
        axiosInstance.get("/students", {
          params: {
            agentid: agent,
            agentCourseRelationId: relationData._id,
            agentYear: year,
            agentSession: session,
            agentPaymentStatus: paymentStatus,
            limit:10000
          },
        }),
        id ? axiosInstance.get(`/remit-invoice/${id}`) : Promise.resolve({ data: { data: { students: [] } } })
      ])

      const allStudents = studentsResponse?.data?.data?.result || []
      const invoiceStudents = invoiceResponse?.data?.data?.students || []

      const yearObj = relationData.years.find(y => y.year === year)
      const sessionObj = yearObj?.sessions.find(s => s.sessionName === session)

      const selectedStudentsWithFees = invoiceStudents.map(student => {
        const originalStudent = allStudents.find(s => s.refId === student.refId) || {}
        const studentChoice = originalStudent?.choice || "Local"

        const studentAmount = studentChoice === "Local"
          ? Number.parseFloat(relationData.local_amount || 0)
          : Number.parseFloat(relationData.international_amount || 0)

        const sessionFee = student.amount || (sessionObj ? calculateSessionFee(sessionObj, studentAmount) : 0)

        return {
          ...originalStudent,
          ...student,
          selected: true,
          sessionFee,
          courseRelationId: relationData._id,
          year: year,
          session: session,
          semester: relationData.term?.term || "",
        }
      })


      setSelectedStudents(selectedStudentsWithFees)

      // Filter available students
      const selectedIds = new Set(selectedStudentsWithFees.map(s => s.refId))
      const availableStudents = allStudents.filter(student => !selectedIds.has(student.refId))
      setFilteredStudents(availableStudents)
      setHasSearched(true)
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

  // Calculate session fee
  const calculateSessionFee = (session, amount) => {
    if (!session || session.rate == null) return 0

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

  // Handle adding a student
  const handleAddStudent = (student) => {
    const isAlreadySelected = selectedStudents.some((s) => s._id === student._id);

    if (!isAlreadySelected) {
      const filterValues = filterForm.getValues();
      setLoading(true);

      // Find the session details from the selected course relation
      const yearObj = selectedCourseRelation?.years?.find((y) => y.year === filterValues.year);
      const sessionObj = yearObj?.sessions?.find((s) => s.sessionName === filterValues.session);

      // Find the application for this course relation
      const application = student.applications?.find((app) =>
        app.courseRelationId === selectedCourseRelation?._id
      );

      // Calculate the student amount based on their choice (Local/International)
      const studentAmount = application?.choice === "Local"
        ? Number.parseFloat(selectedCourseRelation?.local_amount || 0)
        : Number.parseFloat(selectedCourseRelation?.international_amount || 0);

      // Calculate session fee
      const sessionFee = calculateSessionFee(sessionObj, studentAmount);

      // Create the complete student object with all required fields
      const studentWithFee = {
        ...student,
        _id: student._id, // Ensure _id is included
        refId: student.refId, // Fallback to _id if refId missing
        firstName: student.firstName,
        lastName: student.lastName,
        collegeRoll: student.collegeRoll, // Handle both spellings
        course: selectedCourseRelation?.course?.name || "",
        amount: sessionFee,
        sessionFee,
        selected: true,
        courseRelationId: selectedCourseRelation?._id,
        Year: filterValues.year,
        Session: filterValues.session,
        semester: selectedCourseRelation?.term?.term || filterValues.term || "",
      };

      setSelectedStudents((prev) => [...prev, studentWithFee]);
      setFilteredStudents((prev) => prev.filter((s) => s._id !== student._id));
      setLoading(false);
    } else {
      toast({
        title: "Student already added",
        description: "This student is already in your selection.",
        variant: "destructive",
      });
    }
  };


  // Handle removing a student
  const handleRemoveStudent = (studentId) => {
    const studentToRemove = selectedStudents.find(s => s._id === studentId)
    if (!studentToRemove) return

    setSelectedStudents(prev => prev.filter(student => student._id !== studentId))
    setFilteredStudents(prev => {
      const isAlreadyInList = prev.some(s => s._id === studentToRemove._id)
      return isAlreadyInList
        ? prev
        : [...prev, { ...studentToRemove, selected: false }]
    })
  }

  // Update total amount when selected students change
  useEffect(() => {
    const total = selectedStudents
      .filter(student => student.selected)
      .reduce((sum, student) => sum + (student.amount || 0), 0)

    setTotalAmount(total)
    form.setValue("totalAmount", total)
  }, [selectedStudents, form])


  const onSubmit = async (values: z.infer<typeof invoiceSchema>) => {
    try {
      setLoading(true);

      // Prepare the data for the PATCH request
      const payload = {
        ...values,
        students: selectedStudents
          .filter(student => student.selected)
          .map(student => ({
            refId: student.refId || student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            collegeRoll: student.collegeRoll,
            course: student.course || selectedCourseRelation?.course?.name,
            amount: student.amount,
            courseRelationId: student.courseRelationId || selectedCourseRelation?._id,
            year: student.year || filterForm.getValues().year,
            session: student.session || filterForm.getValues().session,
            semester: student.semester || selectedCourseRelation?.term?.term,
          })),
        totalAmount,
        noOfStudents:selectedStudents.length,
        courseRelationId: selectedCourseRelation?._id,
        year: values.courseDetails.year,
        session: values.courseDetails.session,
        semester: values.courseDetails.semester,
      };

      await axiosInstance.patch(`/remit-invoice/${id}`, payload);

      toast({
        
        description: "Remit Report updated successfully",
        className:"bg-supperagent text-white border-none"
      });

      navigate("/admin/remit");
    } catch (error) {
      console.error("Error updating remit Report:", error);
      toast({
      
        description:  "Failed to update remit Report",
       className:"bg-destructive border-none text-white"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-1">
      {loading ? <div className="flex justify-center">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div> :
        (<div>
          <div className="flex flex-row items-center justify-between">
            <h1 className="mb-2 text-2xl font-bold">
              Regenerate Remit
            </h1>
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
              <form id="invoice-form" onSubmit={form.handleSubmit(onSubmit)}>
                <StudentFilter
                  filterForm={filterForm}
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

                <CardFooter className="flex justify-between p-4">
                  <div className="text-lg font-semibold">
                    Total Amount: <span className="text-xl">{totalAmount.toFixed(2)}</span>
                  </div>

                  <Button
                    type="submit"
                    form="invoice-form"
                    className="bg-supperagent text-white hover:bg-supperagent"
                    disabled={selectedStudents.filter(s => s.selected).length === 0}
                  >
                    Update Remit
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>)}
    </div>
  )
}