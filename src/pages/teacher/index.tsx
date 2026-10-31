import { useEffect, useState } from 'react';
import { Plus, Pen } from 'lucide-react';
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
import { TeacherDialog } from './components/teacher-dialog';
import axiosInstance from '../../lib/axios';
import { toast } from '@/components/ui/use-toast';
import { DataTablePagination } from '../students/view/components/data-table-pagination';
import { Input } from '@/components/ui/input';

export default function TeacherPage() {
  const [teachers, setTeachers] = useState<any>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [designations, setDesignations] = useState<any[]>([]);

  useEffect(() => {
    axiosInstance
      .get('/designations')
      .then((res) => setDesignations(res.data?.data || []))
      .catch((error) => console.error('Error fetching designations:', error));
  }, []);

  const designationNames = (teacher) =>
    designations
      .filter((d) => (teacher.designationId || []).map(String).includes(d._id))
      .map((d) => d.name)
      .join(', ');
  

  const fetchData = async (page, entriesPerPage,searchTerm="") => {
    try {
      
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/users?role=teacher`, {
        params: {
          page,
          limit: entriesPerPage,
          ...(searchTerm ? { searchTerm } : {}),
        },
      });
      setTeachers(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setInitialLoading(false); 
    }
  };

  const handleSubmit = async (data) => {
    try {
      let response;

      const updateData = {
        ...data,
        role: "teacher"
      };
      if (editingTeacher) {
        // Update teacher
        response = await axiosInstance.patch(`/users/${editingTeacher?._id}`, updateData);

        if (response.data && response.data.success === true) {
          toast({
            title: 'Teacher Updated successfully',
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
            className: 'bg-red-500 border-none text-white'
          });
        }
      } else {
        // Create new teacher. Signup does not take designations, so an
        // admin gives them straight after.
        const { designationId, ...signupData } = updateData;
        response = await axiosInstance.post(`/auth/signup`, signupData);
        const newId = response.data?.data?._id;
        if (response.data?.success === true && newId && designationId?.length) {
          await axiosInstance.patch(`/users/${newId}`, { designationId });
        }
        if (response.data && response.data.success === true) {
          toast({
            title: 'Teacher Created successfully',
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
            className: 'bg-red-500 border-none text-white'
          });
        }
      }

      // Check if the API response indicates success
      

      // Refresh data
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      toast({
        title:
       
          'An error occurred. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setEditingTeacher(null); // Ensure editing state is reset after completion
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const updatedStatus = status ? '1' : '0';
      await axiosInstance.patch(`/users/${id}`, { status: updatedStatus });
      toast({
        title: 'Record updated successfully',
        className: 'bg-supperagent border-none text-white'
      });
      fetchData(currentPage, entriesPerPage); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setDialogOpen(true);
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage, searchTerm);
  }, [currentPage, entriesPerPage]);

  useEffect(() => {
    if (!dialogOpen) {
      setEditingTeacher(null);
    }
  }, [dialogOpen]);
  // A new search starts from page 1, or a search made from a later page
  // would report "no teachers" while the matches sit on page 1.
  const handleSearch = () => {
    if (currentPage !== 1) setCurrentPage(1);
    else fetchData(1, entriesPerPage, searchTerm);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Teachers</h1>
        <Button
          className="bg-supperagent text-white hover:bg-supperagent/90"
          size={'sm'}
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Teacher
        </Button>
      </div>
      <div className="flex items-center space-x-4">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Search by Name, Email"
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
      <div className="rounded-md bg-white p-4 shadow-2xl">
        {initialLoading ? null : !teachers?.length ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-black">No teachers found</p>
            <p className="mt-1 text-xs text-black">
              {searchTerm
                ? 'No teachers match your search. Try a different name or email.'
                : 'Add your first teacher with the New Teacher button.'}
            </p>
          </div>
        ) : (
        <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Designations</TableHead>
              <TableHead className="w-32 text-center">Status</TableHead>
              <TableHead className="w-32 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher._id}>
                <TableCell>{`${teacher.name} `}</TableCell>
                <TableCell>{teacher.email}</TableCell>
                <TableCell>{teacher.phone}</TableCell>
                <TableCell>{designationNames(teacher) || '—'}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Switch
                      checked={teacher.status == 1}
                      onCheckedChange={(checked) =>
                        handleStatusChange(teacher._id, checked)
                      }
                    />
                    <span className="w-14 text-left text-xs font-medium text-black">
                      {teacher.status == 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="space-x-1 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-supperagent text-white hover:bg-supperagent/90"
                    onClick={() => handleEdit(teacher)}
                  >
                    <Pen className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages>1 && (
 <DataTablePagination
          pageSize={entriesPerPage}
          setPageSize={setEntriesPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
        )}
        </>
        )}
      </div>
      <TeacherDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTeacher(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingTeacher}
        designations={designations}
      />
    </div>
  );
}
