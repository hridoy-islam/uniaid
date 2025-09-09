
import { BlinkingDots } from "@/components/shared/blinking-dots"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2 } from "lucide-react"

interface Student {
  _id: string
  firstName: string
  lastName: string
  collegeRoll: string
  email: string
  refId?: string
  sessionFee?: number
  selected?: boolean
}



export function StudentSelection({
  filteredStudents,
  // selectedStudents,
  loading,
  // handleAddStudent,
  // handleStudentSelect,
  // handleRemoveStudent,
}) {
  return (
    <div className=" grid grid-cols-1 gap-0">
      <div>
        <CardHeader>
          <CardTitle>Available Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            {loading ? (
               <BlinkingDots size="large" color="bg-supperagent" />
            ) : (
              <div className="max-h-[300px] w-auto overflow-y-auto rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-32">Reference No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>College Roll</TableHead>
                      <TableHead >Email</TableHead>
                      <TableHead >Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell>{student.refId}</TableCell>
                          <TableCell>
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell>{student.collegeRoll}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.phone}</TableCell>
                          {/* <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleAddStudent(student)}>
                              Add
                            </Button>
                          </TableCell> */}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-4 text-center">
                          No students found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </div>

   
    </div>
  )
}

