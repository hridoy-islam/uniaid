import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'; // Import dialog components
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

export default function AgentPaymentPage({ student }) {
  const [enrolledCourses, setEnrolledCourses] = useState<any>(
    student?.agentPayments || []
  );
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (Array.isArray(student)) {
      setEnrolledCourses(student);
    }
  }, [student?.agentPayments]);

  const toggleCourseExpansion = (courseId: string) => {
    setExpandedCourseId(expandedCourseId === courseId ? null : courseId);
  };

  const selectedCourse = enrolledCourses.find(
    (course) => course._id === expandedCourseId
  );

  return (
    <div className="mx-auto py-1">
      <h2 className="mb-4 text-xl font-bold">Agent Payment</h2>

      <Table className="mb-6 w-full">
        <TableHeader>
          <TableRow className="text-left text-gray-500">
            <TableHead className="pb-2">Course</TableHead>
            <TableHead className="pb-2">Institution</TableHead>
            <TableHead className="pb-2">Term</TableHead>
            <TableHead className="pb-2">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrolledCourses?.length > 0 ? (
            enrolledCourses.map((course) => (
              <TableRow
                key={course._id}
                className="cursor-pointer border-t hover:bg-gray-100"
                onClick={() => toggleCourseExpansion(course._id)}
              >
                <TableCell className="py-2">
                  {course?.courseRelationId?.course?.name || 'N/A'}
                </TableCell>
                <TableCell className="py-2">
                  {course?.courseRelationId?.institute?.name || 'N/A'}
                </TableCell>
                <TableCell className="py-2">
                  {course?.courseRelationId?.term?.term || 'N/A'}
                </TableCell>
                <TableCell className="py-2">
                  <Button variant="outline" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="py-4 text-center text-gray-500">
                No courses available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Dialog for expanded course details */}
      <Dialog
        open={!!expandedCourseId} // Open dialog if expandedCourseId is not null
        onOpenChange={(isOpen) => {
          if (!isOpen) setExpandedCourseId(null); // Close dialog and reset expandedCourseId
        }}
      >
        <DialogContent className="h-[50vh] max-w-full overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Agent Payment Details</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div>
              <div className="pb-2">
                <div>
                  <span className="text-3xl">
                    {selectedCourse?.courseRelationId?.institute?.name}
                  </span>
                </div>
                <div>
                  <span className="text-xl">
                    {selectedCourse?.courseRelationId?.course?.name} ({' '}
                    {selectedCourse?.courseRelationId?.term?.term})
                  </span>
                </div>
              </div>
              <div>
                {selectedCourse.years
                  .sort((a, b) => {
                    const yearA = parseInt(a.year.split(' ')[1], 10);
                    const yearB = parseInt(b.year.split(' ')[1], 10);
                    return yearA - yearB;
                  })
                  .map((year) => (
                    <div key={year?._id} className="mb-4">
                      <h3 className="mb-2 font-semibold">{year?.year}</h3>
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-gray-500">
                            <th className="pb-2">Session</th>
                            <th className="pb-2">Invoice Date</th>
                            <th className="pb-2">Payment Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {year.sessions.map((session) => (
                            <tr key={session?._id} className="border-t">
                              <td className="py-2">{session.sessionName}</td>
                              <td className="py-2">
                                {format(session?.invoiceDate, 'MMM d, yyyy')}
                              </td>
                              <td className="py-2">
                                <Badge
                                  className={
                                    session.status === 'paid'
                                      ? 'bg-green-500 text-white hover:bg-green-500/90'
                                      : session.status === 'due'
                                        ? 'bg-red-500 text-white hover:bg-red-500/90'
                                        : session.status === 'available'
                                          ? 'bg-blue-500 text-white hover:bg-blue-500/90'
                                          : 'bg-gray-500 text-white hover:bg-gray-500/90'
                                  }
                                >
                                  {session.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
