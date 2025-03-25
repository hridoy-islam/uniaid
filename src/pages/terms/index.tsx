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
import { TermDialog } from "./components/term-dialog"
import { useToast } from "@/components/ui/use-toast"
import axiosInstance from '../../lib/axios';
import { BlinkingDots } from "@/components/shared/blinking-dots";
import { DataTablePagination } from "../students/view/components/data-table-pagination"


export default function TermsPage() {
  const [terms, setTerms] = useState<any>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<any>()
  const [initialLoading, setInitialLoading] = useState(true); // New state for initial loading

  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const fetchData = async (page, entriesPerPage) => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/terms`, {
        params: {
          page,
          limit: entriesPerPage,
        },
      });
      setTerms(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error("Error fetching institutions:", error);
    } finally {
      setInitialLoading(false); // Disable initial loading after the first fetch
    }
  };

  // const handleSubmit = async (data) => {
  //   if (editingTerm) {
  //     await axiosInstance.patch(`/terms/${editingTerm?.id}`, data);
  //     toast({ title: "Record Updated successfully", className: "bg-supperagent border-none text-white", });
  //     fetchData(currentPage, entriesPerPage);
  //     setEditingTerm(undefined)
  //   } else {
  //     await axiosInstance.post(`/terms`, data);
  //     toast({ title: "Record Created successfully", className: "bg-supperagent border-none text-white", });
  //     fetchData(currentPage, entriesPerPage);
  //   }
  // }

  const handleSubmit = async (data) => {
      try {
        let response;
        if (editingTerm) {
          // Update course relation
          response = await axiosInstance.patch(`/terms/${editingTerm?._id}`, data);
        } else {
          // Create new course relation
          response = await axiosInstance.post(`/terms`, data);
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
        setEditingTerm(undefined) // Reset editing state
  
      } catch (error) {
        // Display an error toast if the request fails
        toast({
          title: error|| "An error occurred. Please try again.",
          className: "bg-red-500 border-none text-white",
        });
      }
    };


  const handleStatusChange = async (id, status) => {
    try {
      const updatedStatus = status ? "1" : "0";
      await axiosInstance.patch(`/terms/${id}`, { status: updatedStatus });
      toast({ title: "Record updated successfully", className: "bg-supperagent border-none text-white", });
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleEdit = (term) => {
    setEditingTerm(term)
    setDialogOpen(true)
  }

  useEffect(() => {
    fetchData(currentPage, entriesPerPage); // Refresh data

  }, [currentPage, entriesPerPage]);



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">All Terms</h1>
        <Button className="bg-supperagent text-white hover:bg-supperagent/90" size={'sm'} onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Term
        </Button>
      </div>
      <div className="rounded-md bg-white shadow-2xl p-4">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : terms.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                
                <TableHead>Term</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead className="w-32 text-center">Status</TableHead>
                <TableHead className="w-32 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell>{term.term}</TableCell>
                  <TableCell>{term?.academic_year_id.academic_year}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={term.status == 1}
                      onCheckedChange={(checked) => handleStatusChange(term._id, checked)}
                      className="mx-auto"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-supperagent text-white hover:bg-supperagent/90"
                      onClick={() => handleEdit(term)}
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
      <TermDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingTerm(undefined)
        }}
        onSubmit={handleSubmit}
        initialData={editingTerm}
      />
    </div>
  )
}
