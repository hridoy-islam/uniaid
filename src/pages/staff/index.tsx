import { useEffect, useState } from "react"
import { Plus, Pen } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StaffDialog } from "./components/staff-dialog"
import axiosInstance from '../../lib/axios';
import { toast } from "@/components/ui/use-toast"
import { DataTablePagination } from "../students/view/components/data-table-pagination"

export default function StaffPage() {
  const [staff, setStaff] = useState<any>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);


  const fetchData = async (page, entriesPerPage) => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/staffs`, {
        params: {
          page,
          limit: entriesPerPage,
        },
      });
      setStaff(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error("Error fetching institutions:", error);
    } finally {
      setInitialLoading(false); // Disable initial loading after the first fetch
    }
  };

  // const handleSubmit = async (data) => {
  //   try {
  //     if (editingStaff) {
  //       // Update institution
  //       await axiosInstance.put(`/staffs/${editingStaff?.id}`, data);
  //       toast({ title: "Record Updated successfully", className: "bg-supperagent border-none text-white", });
  //       fetchData(currentPage, entriesPerPage);
  //       setEditingStaff(null);
  //     } else {
  //       await axiosInstance.post(`/staffs`, data);
  //       toast({ title: "Record Created successfully", className: "bg-supperagent border-none text-white", });
  //       fetchData(currentPage, entriesPerPage);
  //     }
  //   } catch (error) {
  //     console.error("Error saving data:", error);
  //   }
  //   finally {
  //     setEditingStaff(null);
  //   }
  // };

  const handleSubmit = async (data) => {
    try {
      let response;
      if (editingStaff) {
        // Update staff
        response = await axiosInstance.put(`/staffs/${editingStaff?.id}`, data);
      } else {
        // Create new staff
        response = await axiosInstance.post(`/staffs`, data);
      }
  
      // Check if the API response indicates success
      if (response.data && response.data.success === true) {
        toast({
          title: response.data.message || "Record Updated successfully",
          className: "bg-supperagent border-none text-white",
        });
      } else if (response.data && response.data.success === false) {
        toast({
          title: response.data.message || "Operation failed",
          className: "bg-red-500 border-none text-white",
        });
      } else {
        toast({
          title: "Unexpected response. Please try again.",
          className: "bg-red-500 border-none text-white",
        });
      }
  
      // Refresh data
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      toast({
        title: error.response?.data?.message || "An error occurred. Please try again.",
        className: "bg-red-500 border-none text-white",
      });
    } finally {
      setEditingStaff(null); // Ensure editing state is reset after completion
    }
  };
  



  const handleStatusChange = async (id, status) => {
    try {
      const updatedStatus = status ? "1" : "0";
      await axiosInstance.patch(`/staffs/${id}`, { status: updatedStatus });
      toast({ title: "Record updated successfully", className: "bg-supperagent border-none text-white", });
      fetchData(currentPage, entriesPerPage);// Refresh data
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };


  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember)
    setDialogOpen(true)
  }

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  useEffect(() => {
    if (!dialogOpen) {
      setEditingStaff(null);
    }
  }, [dialogOpen]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">All Staff</h1>
        <Button className="bg-supperagent text-white hover:bg-supperagent/90" size={'sm'} onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Staff
        </Button>
      </div>
      <div className="rounded-md bg-white shadow-2xl p-4">
        <Table>
          <TableHeader>
            <TableRow>

              <TableHead>Staff Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-32 text-center">Status</TableHead>
              <TableHead className="w-32 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((staffMember) => (
              <TableRow key={staffMember.id}>
                <TableCell>{`${staffMember.firstName} ${staffMember.lastName}`}</TableCell>
                <TableCell>{staffMember.email}</TableCell>
                <TableCell>{staffMember.phone}</TableCell>
                <TableCell className="text-center">

                  <Switch
                    checked={staffMember.status == 1}
                    onCheckedChange={(checked) => handleStatusChange(staffMember.id, checked)}
                    className="mx-auto"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-supperagent text-white hover:bg-supperagent/90"
                    onClick={() => handleEdit(staffMember)}
                  >
                    <Pen className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DataTablePagination
          pageSize={entriesPerPage}
          setPageSize={setEntriesPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
      <StaffDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingStaff(null)
        }}
        onSubmit={handleSubmit}
        initialData={editingStaff}
      />
    </div>
  )
}
