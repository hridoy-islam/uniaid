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

import { ArrowLeft } from "lucide-react"


// Updated Zod schema to include remitTo, paymentInfo, and course details
const invoiceSchema = z.object({
  Status: z.enum(["due", "paid"]),
  remit: z.string(),
  courseDetails: z.object({
    semester: z.string(),
    year: z.string(),
    session: z.string(),
  }),
})

const filterSchema = z.object({
  term: z.string().optional(),
  course: z.string().optional(),
  institute: z.string().optional(), // Changed from university to institute
  paymentStatus: z.string().optional(),
  searchQuery: z.string().optional(),
  year: z.string().optional(),
  session: z.string().optional(),
})

export default function StudentStatusListPage() {
  const navigate = useNavigate()
  // const [selectedStudents, setSelectedStudents] = useState([])
  // const [totalAmount, setTotalAmount] = useState(0)
  const [courses, setCourses] = useState([])
  const [institutes, setInstitutes] = useState([])
  const [terms, setTerms] = useState([])
  const [years, setYears] = useState([])
  // const [InvoiceData, setInvoiceData] = useState([])
  const [sessions, setSessions] = useState([])
  const [courseRelations, setCourseRelations] = useState([])
  const [selectedCourseRelation, setSelectedCourseRelation] = useState(null)
  // const [isEditing, setIsEditing] = useState(false)
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [paymentStatuses, setPaymentStatuses] = useState(["paid", "due"])
  const { toast } = useToast()


  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      Status: "due",
      
      remit: "",

      courseDetails: {
        semester: "",
        year: "",
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
      paymentStatus: "",
      year: "",
      session: "",
      searchQuery: "",
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

      const uniqueYears = [...new Set(courseRelationsData.flatMap((cr) => cr.years.map((year) => year.year)))]
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
      setYears(uniqueYears) // Set the unique years
      setSessions(uniqueSessions) // Set the unique session names
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

      const { term, course, institute, paymentStatus, year, session } = filters

      console.log("Filters:", { term, course, institute })

      // Find matching course relation based on filters
      let courseRelationId = null
      if (term && course && institute) {
        const matchingRelation = courseRelations.find(
          (cr) => cr.term._id === term && cr.course._id === course && cr.institute._id === institute,
        )

        if (!matchingRelation) {
          console.warn("No matching course relation found for filters:", { term, course, institute })
        } else {
          courseRelationId = matchingRelation._id
          setSelectedCourseRelation(matchingRelation)
          updateFormWithCourseDetails(matchingRelation, year, session)
        }
      }

      const params = {
        paymentStatus,
        ...(year ? { year } : {}),
        ...(session ? { session } : {}),
      }

      if (courseRelationId) {
        params.applicationCourse = courseRelationId
      }

      const response = await axiosInstance.get("/students", { params })
      const studentsData = response?.data?.data.result || []


      const filteredStudentsData = studentsData.filter((student) => {
        if (!student.accounts || student.accounts.length === 0) {
          console.warn("Student has no accounts:", student._id)
          return false
        }

        const matchingAccount = student.accounts.find((account) => {
          return account.courseRelationId?._id === courseRelationId
        })

        if (!matchingAccount) {
          console.warn("No matching account found for student:", student._id)
          return false
        }


        const matchingYear = matchingAccount.years.find((y) => y.year === year)
        if (!matchingYear) {
          return false
        }


        return true
      })


      setStudents(filteredStudentsData)
      setFilteredStudents(filteredStudentsData)
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

    form.setValue("Status", "due")
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

    setPaymentStatuses(["paid", "due"])
  }, [])


  

  return (
    <div className="py-1">
    <div className="flex flex-row items-center justify-between">

        <h1 className="mb-2 text-2xl font-bold">Status</h1>
        <Button
                      className="bg-supperagent text-white hover:bg-supperagent/90 mb-2"
                      size={'sm'}
                      onClick={() => navigate('/admin/invoice')}
                      >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back To Invoice
                    </Button>
                      </div>
      

      <div className="grid gap-2">
        <Card>


          {/* <InvoiceDetails form={form} /> */}


          {/* Student Filter Component */}
          <StudentFilter
            filterForm={filterForm}
            terms={terms}
            courses={courses}
            institutes={institutes}
            years={years}
            sessions={sessions}
            paymentStatuses={paymentStatuses}
            onFilterSubmit={onFilterSubmit}
            handleYearChange={handleYearChange}
            handleSessionChange={handleSessionChange}

          />

     

          <StudentSelection
            filteredStudents={filteredStudents}
            loading={loading}
           
          />

         
        </Card>
      </div>
    </div>
  )
}

