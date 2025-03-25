import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { StaffDialog } from "./assign-staff-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Switch } from "@/components/ui/switch"

export function AssignStaff({ student, onSave }) {
  const [staffs, setStaffs] = useState<any>(student.assignStaff || [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)

  const handleStatusChange = (_id, currentStatus) => {
    // Toggle the status
    const newStatus = currentStatus === 1 ? 0 : 1;
  
    // Update the status in the local state
    const updatedStaffs = staffs.map((staff) =>
      staff._id === _id ? { ...staff, status: newStatus } : staff
    );
    
    setStaffs(updatedStaffs);  // Update local state
  
    // Persist the change using onSave
    const updatedStaffWithStatus = { _id, status: newStatus };
    onSave({ assignStaff: [updatedStaffWithStatus] });
  };
  



  useEffect(() => {
    if (Array.isArray(student.assignStaff)) {
      setStaffs(student.assignStaff);
    }
  }, [student.assignStaff]);

  const handleSubmit = (data) => {
    const updatedStaffs = [...staffs, data];
    setStaffs(updatedStaffs);
    onSave({ assignStaff: updatedStaffs });  
  };
  

 

  return (
    <div className="space-y-4 rounded-md shadow-md p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Assigned Staffs</h2>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-supperagent text-white hover:bg-supperagent"
        >
          Add Staff
        </Button>
      </div>

      <div className="rounded-md ">
        <Table>
          <TableHeader>
            <TableRow>

              <TableHead>Staff</TableHead>
              <TableHead>Email</TableHead>
              {/* <TableHead className="text-right">Actions</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No matching records found
                </TableCell>
              </TableRow>
            ) : (
              staffs.map((staff) => (
                <TableRow key={staff._id}>

                  <TableCell>{staff.name}</TableCell>
                  <TableCell>{staff.email} </TableCell>
                  {/* <TableCell className="text-right">
                  <Switch
  checked={staff.status === 1} // Ensure the status is correctly evaluated
  onCheckedChange={(checked) => handleStatusChange(staff._id, checked ? 1 : 0)} // Correctly toggle status
  className="mx-auto"
/>

                  </TableCell> */}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StaffDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-supperagent text-white hover:bg-supperagent" onClick={() => deleteDialog && handleDelete(deleteDialog)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

