import StudentFilter from '@/components/shared/student-filter';
import { StudentsTable } from '@/components/shared/students-table';
import { Button } from '@/components/ui/button';
// import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { DataTablePagination } from './view/components/data-table-pagination';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useSelector } from 'react-redux';

export default function StudentsPage() {
  const { user } = useSelector((state: any) => state.auth);
  const [students, setStudents] = useState<any>([]);
  const [initialLoading, setInitialLoading] = useState(true); // New state for initial loading
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const [filters, setFilters] = useState({
    searchTerm: '',
    status: '',
    agent: '',
    staffId: ''
  });


  const fetchData = async (page, entriesPerPage, filters) => {
    try {
      if (!initialLoading) setInitialLoading(true);

      const {
        searchTerm,
        status,
        dob,
        agent,
        staffId,
        institute,
        term,
        academic_year_id
      } = filters;

      const params = {
        page,
        limit: entriesPerPage,
        ...(searchTerm ? { searchTerm } : {}),
        ...(dob ? { dob } : {}), // Add dob to the params if it exists
        ...(agent? {agent}:{}),
        ...(staffId? {staffId}:{}),
        ...(status? {status}:{}),
        ...(institute? {institute}:{}),
        ...(term? {term}:{}),
        ...(academic_year_id? {academic_year_id}:{})
      };


   

      // Role-based filtering
      if (user.role === 'agent' && !agent) {
        params.agent = user._id;
      }

      // Only use user.staff_id if neither staffId nor agentId is provided
      if (user.role === 'staff' && !staffId && !agent) {
        params.staffId = user._id;
        params.createdBy = user._id;
      }


    
      const response = await axiosInstance.get(
        `/students?sort=-refId&fields=firstName,lastName,email,phone,refId`,
        {
          params
        }
      );

      setStudents(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const updatedStatus = status ? '1' : '0';
      await axiosInstance.patch(`/students/${id}`, { status: updatedStatus });
      toast({
        title: 'Record updated successfully',
        className: 'bg-supperagent border-none text-white'
      });
      fetchData(currentPage, entriesPerPage, filters); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleFilterSubmit = (filters) => {
    setFilters(filters);
    setCurrentPage(1); // Reset to the first page on filter change
    fetchData(1, entriesPerPage, filters);
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage, filters); // Refresh data
  }, [currentPage, entriesPerPage]);

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Students</h1>
        <Button className="bg-supperagent text-white hover:bg-supperagent/90">
          <Link to="new">New Student</Link>
        </Button>
      </div>
      <StudentFilter onSubmit={handleFilterSubmit} />
      {initialLoading ? (
        <div className="flex justify-center py-6">
          <BlinkingDots size="large" color="bg-supperagent" />
        </div>
      ) : students.length === 0 ? (
        <div className="flex justify-center py-6 text-gray-500">
          No records found.
        </div>
      ) : (
        <div className="space-y-2 rounded-md bg-white p-4 shadow-2xl">
          <StudentsTable
            students={students}
            handleStatusChange={handleStatusChange}
          />

          <DataTablePagination
            pageSize={entriesPerPage}
            setPageSize={setEntriesPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}
