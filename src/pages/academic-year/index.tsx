import { useEffect, useState } from "react"
import { Pen, Plus } from 'lucide-react'
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
import { AcademicYearDialog } from "./components/academic-year-dialog"
import { useToast } from "@/components/ui/use-toast"
import axiosInstance from '../../lib/axios';
import { BlinkingDots } from "@/components/shared/blinking-dots"
import { DataTablePagination } from "../students/view/components/data-table-pagination"

export default function AcademicYearPage() {

  const [academicYears, setAcademicYears] = useState<any>([])
  const [initialLoading, setInitialLoading] = useState(true); // New state for initial loading
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAcademicYear, setEditingAcademicYear] = useState<any>()
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);


  const fetchData = async (page, entriesPerPage) => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/academic-years`, {
        params: {
          page,
          limit: entriesPerPage,
        },
      });
      setAcademicYears(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error("Error fetching institutions:", error);
    } finally {
      setInitialLoading(false); // Disable initial loading after the first fetch
    }
  };

  // const handleSubmit = async (data) => {
  //   if (editingAcademicYear) {
  //     await axiosInstance.put(`/academic-years/${editingAcademicYear?.id}`, data);
  //     toast({ title: "Record Updated successfully", className: "bg-supperagent border-none text-white", });
  //     fetchData(currentPage, entriesPerPage);
  //     setEditingAcademicYear(undefined)
  //   } else {
  //     await axiosInstance.post(`/academic-years`, data);
  //     toast({ title: "Record Created successfully", className: "bg-supperagent border-none text-white", });
  //     fetchData(currentPage, entriesPerPage);
  //   }
  // }

  const handleSubmit = async (data) => {
    try {
      let response;
      if (editingAcademicYear) {
        // Update course relation
        response = await axiosInstance.patch(`/academic-years/${editingAcademicYear?._id}`, data);

         // Check if the API response indicates success
      if (response.data && response.data.success === true) {
        toast({
          title: "Academic Year Updated successfully",
          className: "bg-supperagent border-none text-white",
        });
      } else if (response.data && response.data.success === false) {
        toast({
          title:  "Operation failed",
          className: "bg-red-500 border-none text-white",
        });
      } else {
        toast({
          title: "Unexpected response. Please try again.",
          className: "bg-red-500 border-none text-white",
        });
      }
      } else {
        // Create new course relation
        response = await axiosInstance.post(`/academic-years`, data);
         // Check if the API response indicates success
      if (response.data && response.data.success === true) {
        toast({
          title: "Academic Year Created successfully",
          className: "bg-supperagent border-none text-white",
        });
      } else if (response.data && response.data.success === false) {
        toast({
          title:  "Operation failed",
          className: "bg-red-500 border-none text-white",
        });
      } else {
        toast({
          title: "Unexpected response. Please try again.",
          className: "bg-red-500 border-none text-white",
        });
      }
      }

      // Check if the API response indicates success
      if (response.data && response.data.success === true) {
        toast({
          title: "Record Updated successfully",
          className: "bg-supperagent border-none text-white",
        });
      } else if (response.data && response.data.success === false) {
        toast({
          title:  "Operation failed",
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
      setEditingAcademicYear(undefined) // Reset editing state

    } catch (error) {
      console.error("Error saving Course Relation:", error);
      // Display an error toast if the request fails
      toast({
        title: error.response.data.message || "An error occurred. Please try again.",
        className: "bg-red-500 border-none text-white",
      });
    }
  };


  const handleStatusChange = async (id, status) => {
    try {
      const updatedStatus = status ? "1" : "0";
      await axiosInstance.patch(`/academic-years/${id}`, { status: updatedStatus });
      toast({ title: "Record updated successfully", className: "bg-supperagent border-none text-white", });
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleEdit = (academicYear) => {
    setEditingAcademicYear(academicYear)
    setDialogOpen(true)
  }

  useEffect(() => {
    fetchData(currentPage, entriesPerPage); // Refresh data
  }, [currentPage, entriesPerPage]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">All Academic Years</h1>
        <Button className="bg-supperagent text-white hover:bg-supperagent/90" size={'sm'} onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Academic Year
        </Button>
      </div>
      <div className="rounded-md bg-white shadow-2xl p-4">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : academicYears.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Academic Year</TableHead>
                <TableHead className="w-32 text-center">Status</TableHead>
                <TableHead className="w-32 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {academicYears.map((year) => (
                <TableRow key={year.id}>
                  <TableCell>{year.academic_year}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={year.status == 1}
                      onCheckedChange={(checked) => handleStatusChange(year._id, checked)}
                      className="mx-auto"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-supperagent text-white hover:bg-supperagent/90"
                      onClick={() => handleEdit(year)}
                    >
                      <Pen className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <DataTablePagination
                  pageSize={entriesPerPage}
                  setPageSize={setEntriesPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
      </div>
      <AcademicYearDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingAcademicYear(undefined)
        }}
        onSubmit={handleSubmit}
        initialData={editingAcademicYear}
      />
    </div>
  )
}
