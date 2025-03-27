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
import { format } from 'date-fns';
import axiosInstance from '@/lib/axios';
import { useParams } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

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

  useEffect(() => {
    if (courseData) {
      setEditedData({
        ...courseData,
        session: courseData.session || []
      });
    }
  }, [courseData]);

  const handleSessionChange = (sessionId, field, value) => {
    setEditedData((prevData) => ({
      ...prevData,
      year: prevData.year.map((session) =>
        session._id === sessionId ? { ...session, [field]: value } : session
      )
    }));
  };

  const handleSave = async () => {
    try {
      const response = await axiosInstance.patch(
        `/agent-courses/${editedData._id}`,
        {
          year: editedData.year 
        }
      );

      if (response.status === 200) {
        onSave(editedData); 
        onClose(); 

        toast({
          title: "Course Detail Update successfully",
          className: "bg-supperagent border-none text-white",
        })
      } else {
        console.error('Failed to update sessions');
        toast({
          title: "Operation Failed",
          className: "bg-destructive border-none text-white",
        })
      }
    } catch (error) {
      toast({
        title: "Operation Failed",
        className: "bg-destructive border-none text-white",
      })
    }
  };

  if (!courseData) return null;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {courseData.courseRelationId.course.name} - {courseData.courseRelationId.institute.name} - ({courseData.courseRelationId.term.term})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-0">
          {/* Term details section */}
          <div className="space-y-0">
            <h3 className="text-lg font-medium">Term Details</h3>
            <div className="grid grid-cols-2 gap-0">
              <div>
                <label className="text-sm font-medium">Term</label>
                <p className="text-gray-800">{courseData.courseRelationId.term.term}</p>
              </div>
              {/* <div>
                <label className="text-sm font-medium">Academic Year</label>
                <p className="text-gray-800">{editedData?.term?.academic_year || 'N/A'}</p>
              </div> */}
            </div>
          </div>

          {/* Sessions table */}
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
                  editedData.year.map((session) => (
                    <TableRow key={session._id}>
                      <TableCell>{session?.sessionName || 'N/A'}</TableCell>
                      <TableCell>
                        {session?.invoiceDate
                          ? format(new Date(session.invoiceDate), 'dd MMM yyyy') // Format the date as you need
                          : 'N/A'}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={session?.rate && parseFloat(session.rate)} // Ensures two decimal points without leading zeros
                            onChange={(e) =>
                              handleSessionChange(
                                session._id,
                                'rate',
                                parseFloat(e.target.value).toFixed(2) // Apply toFixed(2) on change as well
                              )
                            }
                          />
                        ) : session?.rate ? (
                          parseFloat(session.rate).toFixed(2)
                        ) : (
                          '0'
                        ) // Show rate with two decimal points if available, otherwise 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={session?.type || ''}
                            onValueChange={(value) =>
                              handleSessionChange(session._id, 'type', value)
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
                            {session?.type || 'N/A'}
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
            {isEditing ? 'Cancel' : 'Close'}
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
