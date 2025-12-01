import { useEffect, useState } from 'react';
import { Link2, Pen, Plus, Search, X } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
export default function CourseRelationPage() {
  const [courseRelations, setCourseRelations] = useState<any>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourseRelation, setEditingCourseRelation] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // --- FILTER STATES ---
  // 1. Options for the dropdowns
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // 2. Selected inputs (What the user sees in the box)
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  // 3. Applied filters (What is actually sent to the API)
  const [appliedFilters, setAppliedFilters] = useState({
    instituteId: '',
    termId: '',
    courseId: ''
  });

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [institutesResponse, termsResponse, coursesResponse] =
          await Promise.all([
            axiosInstance.get('/institutions?limit=all&status=1'),
            axiosInstance.get('/terms?limit=all&status=1'),
            axiosInstance.get('/courses?limit=all&status=1')
          ]);

        setInstitutes(
          institutesResponse.data.data.result.map((institute: any) => ({
            value: institute._id,
            label: institute.name
          }))
        );
        setTerms(
          termsResponse.data.data.result.map((term: any) => ({
            value: term._id,
            label: term.term
          }))
        );
        setCourses(
          coursesResponse.data.data.result.map((course: any) => ({
            value: course._id,
            label: course.name
          }))
        );
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  const fetchData = async (page, entriesPerPage) => {
    try {
      if (initialLoading) setInitialLoading(true);
      const params: any = {
        page,
        limit: entriesPerPage
      };

      if (appliedFilters.instituteId)
        params.institute = appliedFilters.instituteId;
      if (appliedFilters.termId) params.term = appliedFilters.termId;
      if (appliedFilters.courseId) params.course = appliedFilters.courseId;

      const response = await axiosInstance.get(`/course-relations`, {
        params
      });
      setCourseRelations(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching course relations:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);

    setAppliedFilters({
      instituteId: selectedInstitute,
      termId: selectedTerm,
      courseId: selectedCourse
    });
  };

  const handleClear = () => {
    setSelectedInstitute('');
    setSelectedTerm('');
    setSelectedCourse('');
    setCurrentPage(1);
    setAppliedFilters({ instituteId: '', termId: '', courseId: '' });
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage, appliedFilters]);

  const handleSubmit = async (data) => {
    try {
      let response;
      if (editingCourseRelation) {
        response = await axiosInstance.patch(
          `/course-relations/${editingCourseRelation?._id}`,
          data
        );
      } else {
        response = await axiosInstance.post(`/course-relations`, data);
      }

      if (response.data && response.data.success === true) {
        toast({
          title: editingCourseRelation
            ? 'Record Updated successfully'
            : 'Record Created successfully',
          className: 'bg-supperagent border-none text-white'
        });
      } else if (response.data && response.data.success === false) {
        toast({
          title: 'Operation failed',
          className: 'bg-red-500 border-none text-white'
        });
      } else {
        toast({
          title: 'Unexpected response. Please try again.',
          className: 'bg-destructive border-none text-white'
        });
      }

      // Reset form and close dialog
      setEditingCourseRelation(null);
      setDialogOpen(false);
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      console.error('Error saving Course Relation:', error);
      toast({
        title: 'This course is already Exist',
        className: 'bg-destructive border-none text-white'
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

  const handleDialogOpenChange = (open) => {
    if (!open) {
      // Reset editing state when dialog closes
      setEditingCourseRelation(null);
    }
    setDialogOpen(open);
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Course Relations</h1>
        <Button
          className="bg-supperagent text-white hover:bg-supperagent/90"
          size={'sm'}
          onClick={() => {
            setEditingCourseRelation(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 rounded-md bg-white p-4 shadow-sm md:grid-cols-4">
        <Select value={selectedInstitute} onValueChange={setSelectedInstitute}>
          <SelectTrigger>
            <SelectValue placeholder="Select Institute" />
          </SelectTrigger>
          <SelectContent>
            {institutes.map((inst) => (
              <SelectItem key={inst.value} value={inst.value}>
                {inst.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger>
            <SelectValue placeholder="Select Course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.value} value={course.value}>
                {course.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
          <SelectTrigger>
            <SelectValue placeholder="Select Term" />
          </SelectTrigger>
          <SelectContent>
            {terms.map((term) => (
              <SelectItem key={term.value} value={term.value}>
                {term.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            onClick={handleSearch}
            className=" bg-supperagent hover:bg-supperagent/90 text-white w-full"
          >
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
          <Button onClick={handleClear} variant="outline" className="px-3 w-full">
            Clear Filter
          </Button>
        </div>
      </div>
      <div className="rounded-md shadow-sm bg-white p-4 ">
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
                      className="border-none bg-blue-500 text-white hover:bg-blue-500"
                      size="icon"
                    >
                      <Link2 className="h-4 w-4" />
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
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmit}
        initialData={editingCourseRelation}
      />
    </div>
  );
}
