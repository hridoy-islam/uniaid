"use client"

import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2 } from "lucide-react"

interface Student {
  _id: string
  firstName: string
  lastName: string
  collageRoll: string
  email: string
  refId?: string
  sessionFee?: number
  selected?: boolean
}

interface StudentSelectionProps {
  filteredStudents: Student[]
  selectedStudents: Student[]
  loading: boolean
  handleAddStudent: (student: Student) => void
  handleStudentSelect: (studentId: string) => void
  handleRemoveStudent: (studentId: string) => void
}

export function StudentSelection({
  filteredStudents,
  selectedStudents,
  loading,
  handleAddStudent,
  handleStudentSelect,
  handleRemoveStudent,
}: StudentSelectionProps) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-0 lg:grid-cols-2">
      {/* Available Students */}
      <div>
        <CardHeader>
          <CardTitle>Available Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            {loading ? (
              <div className="flex justify-center py-8">Loading students...</div>
            ) : (
              <div className="max-h-[300px] w-auto overflow-y-auto rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-32">Reference No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>College Roll</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
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
                          <TableCell>{student.collageRoll}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleAddStudent(student)}>
                              Add
                            </Button>
                          </TableCell>
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

      {/* Selected Students */}
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
                {selectedStudents.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>
                      <Checkbox checked={student.selected} onCheckedChange={() => handleStudentSelect(student._id)} />
                    </TableCell>
                    <TableCell>
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.collageRoll}</TableCell>
                    <TableCell className="text-right">${student.sessionFee?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveStudent(student._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {selectedStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-4 text-center">
                      No students selected
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

