import { useEffect, useState } from 'react';
import { Link2, Pen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { CourseRelationDialog } from './components/course-relation-dialog';
import axiosInstance from '../../lib/axios';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { DataTablePagination } from '../students/view/components/data-table-pagination';
import { Link } from 'react-router-dom';

export default function CourseRelationPage() {
  const [courseRelations, setCourseRelations] = useState<any>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourseRelation, setEditingCourseRelation] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const fetchData = async (page, entriesPerPage) => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/course-relations`, {
        params: {
          page,
          limit: entriesPerPage
        }
      });
      setCourseRelations(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    } finally {
      setInitialLoading(false); // Disable initial loading after the first fetch
    }
  };

  // const handleSubmit = async (data) => {

  //   try {
  //     if (editingCourseRelation) {
  //       // Update institution
  //       await axiosInstance.patch(`/course-relations/${editingCourseRelation?.id}`, data);
  //       toast({ title: "Record Updated successfully", className: "bg-supperagent border-none text-white", });
  //       fetchData(currentPage, entriesPerPage);
  //       setEditingCourseRelation(null);
  //     } else {
  //       await axiosInstance.post(`/course-relations`, data);
  //       toast({ title: "Record Created successfully", className: "bg-supperagent border-none text-white", });
  //       fetchData(currentPage, entriesPerPage);
  //     }
  //   } catch (error) {
  //     console.error("Error saving Course Relation:", error);
  //   }
  // };

  const handleSubmit = async (data) => {
    try {
      let response;
      if (editingCourseRelation) {
        // Update course relation
        response = await axiosInstance.patch(
          `/course-relations/${editingCourseRelation?._id}`,
          data
        );
      } else {
        // Create new course relation
        response = await axiosInstance.post(`/course-relations`, data);
      }

      // Check if the API response indicates success
      if (response.data && response.data.success === true) {
        toast({
          title: response.data.message || 'Record Updated successfully',
          className: 'bg-supperagent border-none text-white'
        });
      } else if (response.data && response.data.success === false) {
        toast({
          title: response.data.message || 'Operation failed',
          className: 'bg-red-500 border-none text-white'
        });
      } else {
        toast({
          title: 'Unexpected response. Please try again.',
          className: 'bg-red-500 border-none text-white'
        });
      }
      // Refresh data
      fetchData(currentPage, entriesPerPage);
      setEditingCourseRelation(null); // Reset editing state
    } catch (error) {
      console.error('Error saving Course Relation:', error);
      // Display an error toast if the request fails
      toast({
        title:
          error.response.data.message || 'An error occurred. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  const handleEdit = (relation) => {
    setEditingCourseRelation(relation);
    setDialogOpen(true);
  };

  const handleStatusChange = async (id, status) => {
    try {
      const updatedStatus = status ? '1' : '0';
      await axiosInstance.patch(`/course-relations/${id}`, {
        status: updatedStatus
      });
      toast({
        title: 'Record updated successfully',
        className: 'bg-supperagent border-none text-white'
      });
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage); // Refresh data
  }, [currentPage, entriesPerPage]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Course Relations</h1>
        <Button
          className="bg-supperagent text-white hover:bg-supperagent/90"
          size={'sm'}
          onClick={() => {
            setEditingCourseRelation(null); // Clear editing course relation when creating a new one
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Button>
      </div>
      <div className="rounded-md bg-white p-4 shadow-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Institution</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Course Available To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courseRelations.map((relation) => (
              <TableRow key={relation?._id}>
                <TableCell>{relation?.institute?.name}</TableCell>
                <TableCell>{relation?.course?.name}</TableCell>
                <TableCell>{relation?.term?.term}</TableCell>
                <TableCell>
                  {relation?.local && (
                    <Badge className="bg-green-300 hover:bg-green-300">
                      {relation?.local ? 'Local' : ''} £{' '}
                      {relation?.local_amount}
                    </Badge>
                  )}
                  <br />
                  <br />
                  {relation?.international && (
                    <Badge className="bg-blue-300 hover:bg-blue-300">
                      {relation?.international ? 'International' : ''} £{' '}
                      {relation?.international_amount}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={relation?.status == 1}
                    onCheckedChange={(checked) =>
                      handleStatusChange(relation?._id, checked)
                    }
                    className="mx-auto"
                  />
                </TableCell>
                <TableCell className="space-x-1 text-center">
                  <Link to={`${relation._id}`}>
                    <Button
                      variant="ghost"
                      className="bg-blue-500 text-white hover:bg-blue-500 border-none"
                      size="icon"
                    >
                      <Link2 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                    size="icon"
                    onClick={() => handleEdit(relation)}
                  >
                    <Pen className="h-4 w-4" />
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
      <CourseRelationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingCourseRelation}
      />
    </div>
  );
}
