import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { WorkExperienceDialog } from './work-experience-dialog';
import moment from 'moment';

export function WorkExperienceSection({ student, onSave }) {
  const [noExperience, setNoExperience] = useState(false);
  const [workExperiences, setWorkExperiences] = useState<any>(
    student.workDetails || []
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkDetail, setEditingWorkDetail] = useState<any>(null);

  useEffect(() => {
    if (Array.isArray(student.workDetails)) {
      setWorkExperiences(student.workDetails);
    }
  }, [student.workDetails]);

  const handleAddWorkDetail = async (data) => {
    if (editingWorkDetail && !editingWorkDetail._id) {
      console.error('Invalid ID: editingWorkDetail does not have a valid _id');
      return; // Prevent the update if there is no valid _id
    }

    let updatedWorkExperiences;

    if (editingWorkDetail) {
      // Ensure the _id exists before proceeding
      updatedWorkExperiences = workExperiences.map((experience) =>
        experience._id === editingWorkDetail._id
          ? { ...experience, ...data }
          : experience
      );
    } else {
      updatedWorkExperiences = [...workExperiences, data];
    }

    // Update local state
    setWorkExperiences(updatedWorkExperiences);

    // Persist changes using onSave
    onSave({ workDetails: updatedWorkExperiences });

    setEditingWorkDetail(null);
    setDialogOpen(false);
  };

  const handleEdit = (experience) => {
    setEditingWorkDetail(experience);
    setDialogOpen(true);
  };

  const handleWorkExperience = (checked) => {
    const isChecked = !!checked; // Convert to boolean explicitly
    setNoExperience(isChecked);
    onSave({ workExperience: isChecked });
  };

  const handleStatusChange = (_id, currentStatus) => {
    // Toggle the status
    const newStatus = currentStatus === 1 ? 0 : 1;

    // Update the work experience's status in the local state
    const updatedWorkExperiences = workExperiences.map((experience) =>
      experience._id === _id ? { ...experience, status: newStatus } : experience
    );

    // Update local state
    setWorkExperiences(updatedWorkExperiences);

    // Persist the change using onSave
    onSave({ workDetails: updatedWorkExperiences });
  };

  // Reset editingWorkDetail to default blank values when opening the dialog for a new work experience
  const handleOpenDialog = () => {
    setEditingWorkDetail(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4 rounded-md p-4 shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Work Details</h2>
        {!noExperience && student.workExperience !== true && (
          <Button
            className="bg-supperagent text-white hover:bg-supperagent/90"
            onClick={handleOpenDialog} // Use handleOpenDialog instead of directly setting dialogOpen
          >
            <Plus className="mr-2 h-4 w-4" />
            New Work
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="noExperience"
          checked={student.workExperience || false} // Ensure it's always a boolean
          onCheckedChange={(checked) => handleWorkExperience(!!checked)} // Convert checked to boolean explicitly
        />

        <label htmlFor="noExperience">No work Experiences.</label>
      </div>

      {!noExperience && student.workExperience !== true &&(
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Name of Org.</TableHead>
                <TableHead>Org. Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-center">Currently Working</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workExperiences?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    No matching records found
                  </TableCell>
                </TableRow>
              ) : (
                workExperiences.map((experience) => (
                  <TableRow key={experience._id}>
                    <TableCell>{experience.jobTitle}</TableCell>
                    <TableCell>{experience.organization}</TableCell>
                    <TableCell>{experience.address}</TableCell>
                    <TableCell>{experience.phone}</TableCell>
                    <TableCell>
                      {moment(experience.fromDate).format('DD-MM-YYYY')}
                    </TableCell>
                    <TableCell>
                      {experience.toDate !== null &&
                        moment(experience.toDate).format('DD-MM-YYYY')}
                    </TableCell>
                    <TableCell className="text-center">
                      {experience.currentlyWorking == 1 && 'Yes'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={parseInt(experience.status) === 1}
                        onCheckedChange={(checked) =>
                          handleStatusChange(experience._id, checked ? 0 : 1)
                        }
                        className="mx-auto"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                        size="icon"
                        onClick={() => handleEdit(experience)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </>
      )}

      <WorkExperienceDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingWorkDetail(null); // Reset editingWorkDetail when dialog is closed
        }}
        onSubmit={handleAddWorkDetail}
        initialData={editingWorkDetail} // Pass the editingWorkDetail as initialData
      />
    </div>
  );
}
