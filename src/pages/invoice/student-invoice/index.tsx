"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardFooter } from "@/components/ui/card"
import axiosInstance from "@/lib/axios"
import { useToast } from "@/components/ui/use-toast"
import { StudentFilter } from "./components/student-filter"
import { StudentSelection } from "./components/StudentSelection"
import { useSelector } from "react-redux"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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

export default function StudentListPage() {
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
  const [paymentStatuses, setPaymentStatuses] = useState(["paid", "due"])
  const { user } = useSelector((state: any) => state.auth)
  const { id } = useParams()
  const { toast } = useToast()
  const [remits, setRemits] = useState([]);

  const invoiceSchema = z.object({
    Status: z.enum(["due", "paid"]),
    remit: z.string().min(1, { message: "Remit is required" }), // Add validation for remit
    courseDetails: z.object({
      semester: z.string(),
      year: z.string(),
      session: z.string(),
    }),
  });
  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      Status: "due",
      // remitTo: {
      //   name: "",
      //   email: "",
      //   address: "",
      // },
      // paymentInfo: {
      //   sortCode: "",
      //   accountNo: "",
      //   beneficiary: "",
      // },
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


  const fetchRemits = async () => {
    try {
      const response = await axiosInstance.get("/remit");
      setRemits(response?.data?.data?.result); // Assuming the response contains an array of remits
    } catch (error) {
      console.error("Error fetching remits:", error);
      toast({
        title: "Error",
        description: "Failed to fetch remits",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRemits();
  }, []);
  const fetchInvoiceData = async (invoiceId) => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(`/invoice/${invoiceId}`)
      const invoiceData = response?.data?.data

      if (invoiceData) {
        setInvoiceData(invoiceData)
        console.log("Invoice Remit:", invoiceData.remit);
        // // Populate the form fields with the stored values
        // form.setValue("remitTo", invoiceData.remitTo)
        // form.setValue("paymentInfo", invoiceData.paymentInfo)
   

        form.setValue("remit", invoiceData.remit._id || "");
        form.setValue("courseDetails", {
          semester: invoiceData.semester || "",
          year: invoiceData.year || "",
          session: invoiceData.session || "",
        })
        console.log("Form Remit Value:", form.getValues("remit")); 
        setTotalAmount(invoiceData.totalAmount)

        if (invoiceData.courseRelationId) {
          fetchStudentsForInvoice(invoiceData.courseRelationId, invoiceData.year, invoiceData.session)
        }
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

  const remitValue = useWatch({
    control: form.control,
    name: "remit",
  });
  const fetchStudentsForInvoice = async (courseRelationId, year, session) => {
    try {
      setLoading(true);

      const relationResponse = await axiosInstance.get(`/course-relations/${courseRelationId._id}`);
      const relationData = relationResponse?.data?.data;

      if (relationData) {
        setSelectedCourseRelation(relationData);

        // Update filter form with the course relation values
        filterForm.setValue("term", relationData.term?._id || "");
        filterForm.setValue("course", relationData.course?._id || "");
        filterForm.setValue("institute", relationData.institute?._id || "");
        filterForm.setValue("year", year || "");
        filterForm.setValue("session", session || "");

        const studentsResponse = await axiosInstance.get("/students", {
          params: {
            applicationCourse: courseRelationId._id,
            year: year,
            session: session,
          },
        });

        const allStudents = studentsResponse?.data?.data.result || [];

        // Get the invoice students
        const invoiceStudentsResponse = await axiosInstance.get(`/invoice/${id}`);
        const invoiceStudents = invoiceStudentsResponse?.data?.data.students || [];


        // Find the session details from the selected course relation
        const yearObj = relationData.years.find((y) => y.year === year);
        const sessionObj = yearObj?.sessions.find((s) => s.sessionName === session);

        if (!sessionObj) {
          console.error("Session details not found for year:", year, "session:", session);
        }

        const selectedStudentsWithFees = invoiceStudents.map((student) => {
          const originalStudent = allStudents.find((s) => s.refId === student.refId);
          const studentChoice = originalStudent?.choice || "Local";

          const studentAmount =
            studentChoice === "Local"
              ? Number.parseFloat(relationData.local_amount || 0)
              : Number.parseFloat(relationData.international_amount || 0);

          // Calculate session fee if it's not already set
          let sessionFee = student.amount || 0;
          if ((!sessionFee || sessionFee === 0) && sessionObj) {
            sessionFee = calculateSessionFee(sessionObj, studentAmount);
          }

          return {
            ...originalStudent,
            collageroll: student.collageroll,
            refId: student.refId,
            firstName: student.firstName,
            lastName: student.lastName,
            course: student.course,
            amount: student.amount,
            selected: true,
            sessionFee: sessionFee,
            courseRelationId: relationData._id,
            Year: year,
            Session: session,
            semester: relationData.term.term,
          };
        });

        // Set selected students
        setSelectedStudents(selectedStudentsWithFees);

        const selectedIds = new Set(selectedStudentsWithFees.map((s) => s.refId));
        const availableStudents = allStudents.filter((student) => !selectedIds.has(student.refId));

        // Set available students
        setFilteredStudents(availableStudents);
      }
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

      // console.log("Filters:", { term, course, institute })

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
  const handleAddStudent = (student) => {
    const isAlreadySelected = selectedStudents.some((s) => s._id === student._id);


    if (!isAlreadySelected) {
      const filterValues = filterForm.getValues();

      // Find the session details from the selected course relation
      const yearObj = selectedCourseRelation.years.find((y) => y.year === filterValues.year);
      const sessionObj = yearObj.sessions.find((s) => s.sessionName === filterValues.session);

      if (!sessionObj) {
        toast({
          title: "Error",
          description: "Session details not found.",
          variant: "destructive",
        });
        return;
      }


      const application = student.applications.find((app) => app.courseRelationId === selectedCourseRelation._id);

      if (!application) {
        toast({
          title: "Error",
          description: "Application not found for this student and course relation.",
          variant: "destructive",
        });
        return;
      }

      // Now use the student's choice from the application (either "Local" or "International")
      const studentAmount =
        application.choice === "Local"
          ? Number.parseFloat(selectedCourseRelation.local_amount)
          : Number.parseFloat(selectedCourseRelation.international_amount);

      // console.log('Selected Amount:', studentAmount); // Log the amount for debugging

      const sessionFee = calculateSessionFee(sessionObj, studentAmount);

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
      };

      // Update selected students
      setSelectedStudents((prev) => [...prev, studentWithFee]);

      // Remove from available students
      setFilteredStudents((prev) => prev.filter((s) => s._id !== student._id));

      // Update form values based on the selected course relation and filter values
      if (selectedCourseRelation) {
        updateFormWithCourseDetails(selectedCourseRelation, filterValues.year, filterValues.session);
      }
    } else {
      toast({
        title: "Student already added",
        description: "This student is already in your selection.",
        variant: "destructive",
      });
    }
  };


  useEffect(() => {
    fetchCourseRelations()

    setPaymentStatuses(["paid", "due"])
  }, [])

  useEffect(() => {
    setSelectedStudents([])
  }, [])

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
    // Find the student to remove from the selected list
    const studentToRemove = selectedStudents.find((s) => s._id === studentId);

    if (studentToRemove) {
      // Remove the student from the selected list
      setSelectedStudents((prev) => prev.filter((student) => student._id !== studentId));

      // Add the student back to the filtered (available) list
      setFilteredStudents((prev) => {
        const isAlreadyInList = prev.some((s) => s._id === studentToRemove._id);
        if (!isAlreadyInList) {
          const updatedStudent = {
            ...studentToRemove,
            selected: false,
          };
          return [...prev, updatedStudent];
        }
        return prev;
      });
    }
  };


  const onSubmit = async (data: z.infer<typeof invoiceSchema>) => {
    const selectedStudentsWithRelation = selectedStudents.filter((student) => student.selected)

    if (selectedStudentsWithRelation.length === 0) {
      alert("No students selected.")
      return
    }

    const courseRelationId = selectedStudentsWithRelation[0].courseRelationId

    // Get the filter values
    const filterValues = filterForm.getValues()

    const { courseDetails, ...restData } = data

    // Format students data according to the new model structure
    const formattedStudents = selectedStudentsWithRelation.map((student) => ({
      collageroll: student.collageRoll ,
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
      totalAmount,
      createdBy: user._id,
      year: courseDetails.year,
      session: courseDetails.session,
      semester: courseDetails.semester,
      course: selectedCourseRelation?.course?.name,
      students: formattedStudents,
    }

    try {
      await axiosInstance.post("/invoice", invoiceData)
      navigate("/admin/invoice")
      toast({
        title: "Invoice Create successfully",
        className: "bg-supperagent border-none text-white",
      })
      // console.log(invoiceData);
    } catch (error) {
      console.error("Invoice submission error:", error)
      alert("Failed to generate invoice. Please try again.")
    }
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

    const remitValue = form.getValues("remit")

    if (!remitValue) {
      toast({
        title: "Error",
        description: "Please select a remit",
        variant: "destructive",
      })
      return
    }

    try {
      // Format students data according to the required structure
      const formattedStudents = selectedStudentsWithRelation.map((student) => ({
        collageroll: student.collageRoll,
        refId: student.refId,
        firstName: student.firstName,
        lastName: student.lastName,
        course:  selectedCourseRelation?.course?.name || "",
        amount: student.amount  ,
      }))

      // Calculate total amount
      const calculatedTotalAmount = formattedStudents.reduce((sum, student) => sum + (student.amount || 0), 0)

      // Prepare the data for the PATCH request
      const updateData = {
        remit: remitValue,
        students: formattedStudents,
        noOfStudents: formattedStudents.length,
        totalAmount: calculatedTotalAmount,
      }

      // Make the PATCH request
      await axiosInstance.patch(`/invoice/${id}`, updateData)

      toast({
        title: "Invoice updated successfully",
        className: "bg-supperagent border-none text-white",
      })

      navigate("/admin/invoice")
    } catch (error) {
      console.error("Error updating invoice:", error)
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="py-1">
      <div className="flex flex-row items-center justify-between">

      {isEditing ? (
        <h1 className="mb-2 text-2xl font-bold">Regenerate Invoice</h1>
      ) : (
        <h1 className="mb-2 text-2xl font-bold">Generate Invoice</h1>
      )}
       <Button
              className="bg-supperagent text-white hover:bg-supperagent/90 mb-2"
              size={'sm'}
              onClick={() => navigate('/admin/invoice')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back To Invoice List
            </Button>
      </div>

      <div className="grid gap-2">
        <Card>


        <div className="p-4">
  <label htmlFor="remit" className="block text-sm font-medium text-gray-700">
    Select Remit
  </label>
  <select
    id="remit"
    name="remit"
    value={remitValue || ""} // Use the watched value
    onChange={(e) => form.setValue("remit", e.target.value)} // Update form value on change
    className="min-w-[250px] p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Select a remit</option> {/* Placeholder option */}
    {remits?.map((remit) => (
      <option key={remit._id} value={remit._id}>
        {remit.name}
      </option>
    ))}
  </select>
  {form.formState.errors.remit && (
    <p className="text-sm text-red-500 mt-1">{form.formState.errors.remit.message}</p>
  )}
</div>



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
            isEditing={isEditing}
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
              Total Amount: <span className="text-xl">${totalAmount.toFixed(2)}</span>
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
                  Update Invoice
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
                Generate Invoice
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

