

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import axiosInstance from "@/lib/axios"
import { useToast } from "@/components/ui/use-toast"

import { ArrowLeft } from "lucide-react"
import { StudentFilter } from "./components/student-filter"
import { StudentSelection } from "./components/StudentSelection"

// Updated Zod schema to include remitTo, paymentInfo, and course details
const invoiceSchema = z.object({
  Status: z.enum(["due", "paid", "available"]),
  remit: z.string(),
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

export default function RemitStatusPage() {
  const navigate = useNavigate()

  const [courses, setCourses] = useState([])
  const [institutes, setInstitutes] = useState([])
  const [terms, setTerms] = useState([])
  const [years, setYears] = useState(["Year 1"])
  const [sessions, setSessions] = useState([])
  const [courseRelations, setCourseRelations] = useState([])
  const [selectedCourseRelation, setSelectedCourseRelation] = useState(null)
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [paymentStatuses, setPaymentStatuses] = useState(["paid", "available", "due"])
  const [agent, setAgent] = useState("")
  const { toast } = useToast()
  const [selectedCourseRelationId, setSelectedCourseRelationId] = useState("")
  // Update the state variables to include filtered options
  const [filteredInstitutes, setFilteredInstitutes] = useState([])
  const [filteredCourseRelations, setFilteredCourseRelations] = useState([])

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      Status: "available",

      remit: "",

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

  const handleInstituteChange = (instituteId) => {
    filterForm.setValue("course", "")
    filterForm.setValue("courseRelationId", "")
    setSelectedCourseRelation(null)

    // Filter course relations based on selected term and institute
    const termId = filterForm.getValues("term")
    const filtered = courseRelations
      .filter((item) => item.term._id === termId && item.institute._id === instituteId)
      .map((item) => ({
        _id: item._id,
        name: `${item.course.name}`,
        courseRelation: item,
      }))

    setFilteredCourseRelations(filtered)
  }

  // const handleCourseRelationChange = (courseRelationId) => {
  //   const courseRelation = courseRelations.find((item) => item._id === courseRelationId)
  //   setSelectedCourseRelation(courseRelation)

  //   if (courseRelation && courseRelation.years && courseRelation.years.length > 0) {
  //     // Update years based on the selected course relation
  //     const yearsList = courseRelation.years.map((y) => y.year)
  //     setYears(yearsList)

  //     // Set default year if available
  //     if (yearsList.length > 0) {
  //       filterForm.setValue("year", yearsList[0])
  //       handleYearChange(yearsList[0])
  //     }
  //   }
  // }


  const handleCourseRelationChange = (courseRelationId) => {
    const courseRelation = courseRelations.find((item) => item._id === courseRelationId);
    setSelectedCourseRelation(courseRelation);
  
    if (courseRelation && courseRelation.years && courseRelation.years.length > 0) {
      filterForm.setValue("year", "Year 1");
  
      handleYearChange("Year 1");
    }
  };

  // Update the fetchStudents function to use courseRelationId
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
      params["limit"] = 10000 

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

    form.setValue("Status", "available")
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

  useEffect(() => {
    fetchCourseRelations()

    setPaymentStatuses(["paid", "available", "due"])
  }, [])

  return (
    <div className="py-1">
      <div className="flex flex-row items-center justify-between">
        <h1 className="mb-2 text-2xl font-bold">Remit Status</h1>
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
          {/* <InvoiceDetails form={form} /> */}

          {/* Student Filter Component */}
          <StudentFilter
            filterForm={filterForm}
            terms={terms}
            institutes={institutes}
            sessions={sessions}
            agents={agent}
            paymentStatuses={paymentStatuses}
            onFilterSubmit={onFilterSubmit}
            handleYearChange={handleYearChange}
            handleSessionChange={handleSessionChange}
            handleTermChange={handleTermChange}
            handleInstituteChange={handleInstituteChange}
            handleCourseRelationChange={handleCourseRelationChange}
            filteredInstitutes={filteredInstitutes}
            filteredCourseRelations={filteredCourseRelations}
          />

          <StudentSelection filteredStudents={filteredStudents} loading={loading} />
        </Card>
      </div>
    </div>
  )
}

