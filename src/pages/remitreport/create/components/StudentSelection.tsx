

import { BlinkingDots } from "@/components/shared/blinking-dots"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface StudentSelectionProps {
  filteredStudents: Student[]
  selectedStudents: Student[]
  loading: boolean
  hasSearched: boolean
  handleAddStudent: (student: Student) => void
  handleRemoveStudent: (id: string) => void
  paymentStatus: any
}

export function StudentSelection({
  filteredStudents,
  selectedStudents,
  loading,
  hasSearched,
  handleAddStudent,
  handleRemoveStudent,
  paymentStatus
}: StudentSelectionProps) {

  return (
    <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
      {/* Available Students Section */}
      <div>
        <CardHeader>
          <CardTitle>Available Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            {loading ? (
              <div className="flex justify-center">
                <BlinkingDots size="large" color="bg-supperagent" />
              </div>
            ) : hasSearched ? (
              filteredStudents.length > 0 ? (
                <div className="max-h-[300px] w-auto overflow-y-auto rounded border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-32">Reference No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>College Roll</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell>{student.refId}</TableCell>
                          <TableCell>
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell>{student.collegeRoll}</TableCell>
                          <TableCell>
                            <Button
                              className="bg-supperagent text-white hover:bg-supperagent/90"
                              size="sm"
                              onClick={() => handleAddStudent(student)}
                              disabled={paymentStatus === 'paid'|| paymentStatus === 'due'}
                            >
                              Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-gray-500">No students found</div>
              )
            ) : (
              <div className="text-center text-gray-500">Perform a search to see students</div>
            )}
          </div>
        </CardContent>
      </div>

      {/* Selected Students Section */}
      <div>
        <CardHeader>
          <CardTitle>Selected Students</CardTitle>
        </CardHeader>
        <CardContent>
          
          <div className="max-h-[500px] overflow-y-auto rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>College Roll</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedStudents.length > 0 ? (
                  selectedStudents.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>{student.refId}</TableCell>
                      <TableCell>
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>{student.collegeRoll}</TableCell>
                      <TableCell className="text-right">
                        {student.sessionFee?.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          className="bg-destructive text-white hover:bg-destructive/90"
                          size="icon"
                          onClick={() => handleRemoveStudent(student._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      No students selected yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </div>
    </div>
  )
}