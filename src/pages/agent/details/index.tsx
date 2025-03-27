import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Pen } from 'lucide-react';
import CourseDetailsDialog from './components/CourseDetailsDialog';
import axiosInstance from '@/lib/axios';
import { Link, useParams } from 'react-router-dom';
import { DataTablePagination } from '@/pages/students/view/components/data-table-pagination';
import { Input } from '@/components/ui/input'; // Import Input component for search
import AddCourseDialog from './components/AddCourseDialog ';
import { BlinkingDots } from '@/components/shared/blinking-dots';

const AgentDetailsPage = () => {
  const { id } = useParams();
  const [agentCourses, setAgentCourses] = useState([]);
  const [agent, setAgent] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const response = await axiosInstance.get(`/users/${id}`);
        setAgent(response?.data?.data || {});
      } catch (error) {
        console.error('Error fetching agent data:', error);
      }
    };
    fetchAgentData();
  }, [id]);
  const fetchData = async (page, entriesPerPage, searchTerm = '') => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/agent-courses?agentId=${id}`, {
        params: {
          page,
          limit: entriesPerPage,
          ...(searchTerm ? { searchTerm } : {})
        }
      });
      setAgentCourses(response?.data?.data?.result || []);
      setTotalPages(response?.data?.data?.meta?.totalPage || 1);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [id, currentPage, entriesPerPage]);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleCoursesAdded = () => fetchData(currentPage, entriesPerPage);

  const handleRowClick = (course) => {
    setSelectedCourse(course);
    setDialogOpen(true);
    setIsEditing(false);
  };

  const handleEditClick = (e, course) => {
    e.stopPropagation();
    setSelectedCourse(course);
    setDialogOpen(true);
    setIsEditing(true);
  };

  const handleUpdateCourse = (updatedCourse) => {
    setAgentCourses((prevCourses) =>
      prevCourses.map((course) =>
        course._id === updatedCourse._id ? updatedCourse : course
      )
    );
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCourse(null);
    setIsEditing(false);
  };

  const filteredCourses = agentCourses.filter((course) => {
    const institutionName =
      course?.courseRelationId?.institute?.name?.toLowerCase() || '';
    const courseName =
      course?.courseRelationId?.course?.name?.toLowerCase() || '';
    return (
      institutionName.includes(searchTerm.toLowerCase()) ||
      courseName.includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="px-6 ">
      <div className="w-full rounded-lg bg-white p-6 shadow-sm">
        <div className="flex justify-between">
          <h1 className="mb-4 text-lg font-semibold text-gray-900">
            {agent.name}
          </h1>
          <Link to="/admin/agents">
            <Button
              className="bg-supperagent text-white hover:bg-supperagent/90"
              size={'sm'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back To Agents
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-5">
          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-600">Email:</span>
            <span className="text-gray-800">{agent.email}</span>
          </div>

          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-600">Phone:</span>
            <span className="text-gray-800">{agent.phone}</span>
          </div>

          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-600">Location:</span>
            <span className="text-gray-800">{agent.location}</span>
          </div>

          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-600">Organization:</span>
            <span className="text-gray-800">{agent.organization}</span>
          </div>

          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-600">Contact Person:</span>
            <span className="text-gray-800">{agent.contactPerson}</span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="my-4 flex w-full flex-row justify-between pb-4">
        <Input
          type="text"
          placeholder="Search by institution or course name..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-1/3"
        />
        <AddCourseDialog onAddCourses={handleCoursesAdded} />
      </div>
      <div className="rounded-lg bg-white p-2 shadow-sm ">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Institution</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Term</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <BlinkingDots size="large" color="bg-supperagent" />
                </TableCell>
              </TableRow>
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <TableRow
                  key={course._id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(course)}
                >
                  <TableCell>
                    {course?.courseRelationId?.institute?.name}
                  </TableCell>
                  <TableCell>
                    {course?.courseRelationId?.course?.name}
                  </TableCell>
                  <TableCell>{course?.courseRelationId?.term?.term}</TableCell>
                  <TableCell className="flex flex-row items-center justify-end gap-4">
                    <Button
                      variant="outline"
                      className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                      size="icon"
                      onClick={(e) => handleEditClick(e, course)}
                    >
                      <Pen className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="icon">
                      <Eye />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No courses available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4">
        <DataTablePagination
          pageSize={entriesPerPage}
          setPageSize={setEntriesPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Details/Edit Dialog */}
      {selectedCourse && (
        <CourseDetailsDialog
          isOpen={dialogOpen}
          onClose={handleCloseDialog}
          courseData={selectedCourse}
          isEditing={isEditing}
          onSave={handleUpdateCourse}
        />
      )}
    </div>
  );
};

export default AgentDetailsPage;
