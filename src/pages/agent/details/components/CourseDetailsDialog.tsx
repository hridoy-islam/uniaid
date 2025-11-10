import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import axiosInstance from '@/lib/axios';
import { toast } from '@/components/ui/use-toast';
import moment from 'moment';

const CourseDetailsDialog = ({
  isOpen,
  onClose,
  courseData,
  isEditing,
  onSave,
}) => {
  const [editedData, setEditedData] = useState({
    session: [],
    courseRelationId: {},
    year: []
  });

  // ✅ Deep clone to avoid shared object references
  useEffect(() => {
    if (courseData) {
      setEditedData({
        ...courseData,
        session: courseData.session ? [...courseData.session] : [],
        year: courseData.year
          ? courseData.year.map((s) => ({
              ...s,
              // Ensure invoiceDate is always a Date object
              invoiceDate: s.invoiceDate ? new Date(s.invoiceDate) : null
            }))
          : []
      });
    }
  }, [courseData]);

  // ✅ Update one session at a time by index
  const handleSessionChange = (sessionIndex, field, value) => {
    setEditedData((prevData) => ({
      ...prevData,
      year: prevData.year.map((session, index) =>
        index === sessionIndex ? { ...session, [field]: value } : session
      )
    }));
  };

  // ✅ Ensure invoiceDate is serialized correctly before saving
  const handleSave = async () => {
    try {
      const formattedYear = editedData.year.map((session) => ({
        ...session,
        // Convert Date objects back to ISO strings for API
        invoiceDate: session.invoiceDate
          ? new Date(session.invoiceDate).toISOString()
          : null
      }));

      const response = await axiosInstance.patch(
        `/agent-courses/${editedData._id}`,
        { year: formattedYear }
      );

      if (response.status === 200) {
        onSave(editedData);
        onClose();
        toast({
          title: "Course details updated successfully",
          className: "bg-supperagent border-none text-white",
        });
      } else {
        toast({
          title: "Operation failed",
          className: "bg-destructive border-none text-white",
        });
      }
    } catch (error) {
      toast({
        title: "Operation failed",
        className: "bg-destructive border-none text-white",
      });
      console.error("Save error:", error);
    }
  };

  if (!courseData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {courseData.courseRelationId.course.name} -{" "}
            {courseData.courseRelationId.institute.name} - (
            {courseData.courseRelationId.term.term})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-0">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Sessions</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Agent Rate</TableHead>
                  <TableHead>Rate Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editedData?.year?.length > 0 ? (
                  editedData.year.map((session, index) => (
                    <TableRow key={index}>
                      <TableCell>{session?.sessionName || "N/A"}</TableCell>
                      <TableCell>
                        {session?.invoiceDate
                          ? moment(session.invoiceDate).format("DD MMM yyyy")
                          : "N/A"}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={session?.rate || ""}
                            onChange={(e) =>
                              handleSessionChange(index, "rate", e.target.value)
                            }
                          />
                        ) : session?.rate ? (
                          parseFloat(session.rate).toFixed(2)
                        ) : (
                          "0"
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={session?.type || ""}
                            onValueChange={(value) =>
                              handleSessionChange(index, "type", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="flat">Flat</SelectItem>
                              <SelectItem value="percentage">
                                Percentage
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="capitalize">
                            {session?.type || "N/A"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-gray-500"
                    >
                      No sessions available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isEditing ? "Cancel" : "Close"}
          </Button>
          {isEditing && (
            <Button
              onClick={handleSave}
              className="border-none bg-supperagent text-white hover:bg-supperagent/90"
            >
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailsDialog;
