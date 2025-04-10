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
import { CourseDialog } from "./components/course-dialog"
import axiosInstance from '../../lib/axios';
import { useToast } from "@/components/ui/use-toast";
import { BlinkingDots } from "@/components/shared/blinking-dots";
import { DataTablePagination } from "../students/view/components/data-table-pagination"
import { Input } from "@/components/ui/input"

export default function CoursesPage() {
  const [courses, setCourses] = useState<any>([])
  const [initialLoading, setInitialLoading] = useState(true); 
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any>()
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const fetchData = async (page, entriesPerPage,searchTerm="") => {
    try {
      
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/courses`, {
        params: {
          page,
          limit: entriesPerPage,
          ...(searchTerm ? { searchTerm } : {}),
        },
      });
      setCourses(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error("Error fetching institutions:", error);
    } finally {
      setInitialLoading(false); // Disable initial loading after the first fetch
    }
  };


  const handleSubmit = async (data) => {
    try {
      let response;
      if (editingCourse) {
        // Update course relation
        response = await axiosInstance.patch(`/courses/${editingCourse?._id}`, data);
      } else {
        // Create new course relation
        response = await axiosInstance.post(`/courses`, data);
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
      setEditingCourse(undefined) // Reset editing state

    } catch (error) {
      // Display an error toast if the request fails
      toast({
        title:  "An error occurred. Please try again.",
        className: "bg-red-500 border-none text-white",
      });
    }
  };


  const handleSearch = () => {
    fetchData(currentPage, entriesPerPage, searchTerm); 
  };


  const handleStatusChange = async (id, status) => {
    try {
      const updatedStatus = status ? "1" : "0";
      await axiosInstance.patch(`/courses/${id}`, { status: updatedStatus });
      toast({ title: "Record updated successfully", className: "bg-supperagent border-none text-white", });
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course)
    setDialogOpen(true)
  }

  useEffect(() => {
    fetchData(currentPage, entriesPerPage); // Refresh data

  }, [currentPage, entriesPerPage]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">All Courses</h1>
        <Button className="bg-supperagent text-white hover:bg-supperagent/90 border-none" size={'sm'} onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Course
        </Button>
      </div>


      <div className="flex items-center space-x-4">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Search by Course Name"
          className='max-w-[400px] h-8'
        />
        <Button
          onClick={handleSearch} 
          size="sm"
          className="border-none bg-supperagent min-w-[100px] text-white hover:bg-supperagent/90"
        >
          Search
        </Button>
      </div>
      
      <div className="rounded-md bg-white shadow-2xl p-4">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                
                <TableHead>Course</TableHead>
                <TableHead className="w-32 text-center">Status</TableHead>
                <TableHead className="w-32 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  
                  <TableCell>{course.name}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={course.status == 1}
                      onCheckedChange={(checked) => handleStatusChange(course._id, checked)}
                      className="mx-auto"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      className="bg-supperagent text-white hover:bg-supperagent/90 border-none"
                      size="icon"
                      onClick={() => handleEdit(course)}
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
      <CourseDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingCourse(undefined)
        }}
        onSubmit={handleSubmit}
        initialData={editingCourse}
      />
    </div>
  )
}
