import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Pen } from 'lucide-react';
import CourseDetailsDialog from './components/CourseDetailsDialog';
import axiosInstance from '@/lib/axios';
import { useParams } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import { DataTablePagination } from '@/pages/students/view/components/data-table-pagination';
import { Input } from '@/components/ui/input'; // Import Input component for search
import AddCourseDialog from './components/AddCourseDialog ';
import { BlinkingDots } from '@/components/shared/blinking-dots';

const AgentDetailsPage = () => {
  // State for managing courses
  const [agentCourses, setAgentCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [acourse, setACourse] = useState([]);
  const [institution, setInstitution] = useState([]);
  const [term, setTerm] = useState([]);
  const [loading, setLoading] = useState(false);
  // State for dialog
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { id } = useParams();
  const [coursesUpdated, setCoursesUpdated] = useState(false);
  const [agent, setAgent] = useState([]);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // State for search
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async (page, entriesPerPage) => {
    setLoading(true);
    try {
      // Fetch course relations
      // Fetch institutions
      const institutionResponse = await axiosInstance.get('/institutions');
      setInstitution(institutionResponse?.data?.data?.result || []);

      const agent = await axiosInstance.get(`/users/${id}`);
      setAgent(agent?.data?.data || []);

      // Fetch terms
      const termResponse = await axiosInstance.get('/terms');
      setTerm(termResponse?.data?.data?.result || []);

      // Fetch courses
      const courseResponse = await axiosInstance.get('/courses');
      setACourse(courseResponse?.data?.data?.result || []);

      const response = await axiosInstance.get('/course-relations');
      setCourses(response.data?.data?.result || []);

      // Fetch agent courses with pagination
      const agentCourseResponse = await axiosInstance.get(`/agent-courses`, {
        params: {
          page,
          limit: entriesPerPage
        }
      });
      const filteredAgentCourses =
        agentCourseResponse?.data?.data?.result.filter(
          (course) => course.agentId === id
        ) || [];
      setAgentCourses(filteredAgentCourses);
      setTotalPages(agentCourseResponse?.data?.data?.meta?.totalPage || 1);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setAgentCourses([]); // Ensure it's always an array
    }finally{
      setLoading(false);
    }
  };

  const handleCoursesAdded = (newCourses) => {
    setCoursesUpdated((prev) => !prev);
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [id, coursesUpdated, currentPage, entriesPerPage]);

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter courses based on search query
  const filteredCourses = agentCourses.filter((course) => {
    const institutionName =
      institution.find(
        (inst) => inst._id === course.courseRelationId?.institute
      )?.name || '';
    const courseName =
      acourse.find((c) => c._id === course.courseRelationId?.course)?.name ||
      '';

    return (
      institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courseName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Handle row click
  const handleRowClick = (course) => {
    setSelectedCourse(course);
    setDialogOpen(true);
    setIsEditing(false);
  };

  // Handle edit button click
  const handleEditClick = (e, course) => {
    e.stopPropagation(); // Prevent row click event
    setSelectedCourse(course);
    setDialogOpen(true);
    setIsEditing(true);
  };

  // Handle course update
  const handleUpdateCourse = (updatedCourse) => {
    setAgentCourses((prevCourses) =>
      prevCourses.map((course) =>
        course._id === updatedCourse._id ? updatedCourse : course
      )
    );
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCourse(null);
    setIsEditing(false);
  };

  return (
    <div className="px-6 ">
      <div className="w-full  rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          Agent Name: {agent.name}
        </h1>

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
          value={searchQuery}
          onChange={handleSearch}
          className="w-1/3"
        />
        <AddCourseDialog
          coursesList={courses}
          onAddCourses={handleCoursesAdded}
        />
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
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                          <BlinkingDots size="large" color="bg-supperagent" />
                
              </TableCell>
            </TableRow>
          ) : 
            filteredCourses.length > 0 ? (
              filteredCourses.map((course) => {
                // Find institution name
                // const institutionName =
                //   institution.find(
                //     (inst) => inst._id === course.courseRelationId?.institute
                //   )?.name || 'N/A';

                // // Find course name
                // const courseName =
                //   acourse.find((c) => c._id === course.courseRelationId?.course)
                //     ?.name || 'N/A';

                // // Find term name
                // const termName =
                //   term.find((t) => t._id === course.courseRelationId?.term)
                //     ?.term || 'N/A';

                return (
                  <TableRow
                    key={course._id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(course)}
                  >
                    <TableCell>{course?.courseRelationId?.institute.name}</TableCell>
                    <TableCell>{course?.courseRelationId?.course.name}</TableCell>
                    <TableCell>{course?.courseRelationId?.term.term}</TableCell>
                    <TableCell className="flex flex-row items-center justify-end gap-4">
                      <Button
                        variant="outline"
                        className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                        size="icon"
                        onClick={(e) => handleEditClick(e, course)}
                      >
                        <Pen className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                      >
                        <Eye />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
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
      <div className='mt-4'>
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
          institution={institution}
          term={term}
          acourse={acourse}
        />
      )}
    </div>
  );
};

export default AgentDetailsPage;
