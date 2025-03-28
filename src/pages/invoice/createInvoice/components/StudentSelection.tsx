"use client"

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
  selectedStudents,
  loading,
  handleAddStudent,
  handleStudentSelect,
  handleRemoveStudent,
}) {
  return (
    <div className=" grid grid-cols-1 gap-0 lg:grid-cols-2">
      <div>
        <CardHeader>
          <CardTitle>Available Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            {loading ? (
            <BlinkingDots size="large" color="bg-supperagent" />
            ) : (
              <div className="max-h-[300px] w-auto overflow-y-auto border-gray-200 rounded border">
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
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell>{student.refId}</TableCell>
                          <TableCell>
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell>{student.collegeRoll}</TableCell>
                          <TableCell>
                            <Button  size="sm" className="bg-supperagent text-white hover:bg-supperagent/90" onClick={() => handleAddStudent(student)}>
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
          <div className="max-h-[500px] border-gray-200 overflow-y-auto rounded border">
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
                      {student.refId}
                    </TableCell>
                    <TableCell>
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.collegeRoll}</TableCell>
                    <TableCell className="text-right">{student.sessionFee?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button  className="bg-destructive text-white hover:bg-destructive/90" size="icon" onClick={() => handleRemoveStudent(student._id)}>
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

