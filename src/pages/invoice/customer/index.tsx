import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { toast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { DataTablePagination } from '@/pages/students/view/components/data-table-pagination';
import { CustomerDialog } from './components/customer-dialog';

export default function CustomerPage() {
  const [customers, setcustomers] = useState<any>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const fetchData = async (page, entriesPerPage) => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/customer?limit=all`, {
        params: {
          page,
          limit: entriesPerPage
        }
      });
      setcustomers(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    try {
      let response;

      // Create new customer (POST request)
      response = await axiosInstance.post('/customer', data);

      // Check if the API response indicates success
      if (response.data && response.data.success === true) {
        toast({
          title: 'customer Created successfully',
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

      // Refresh data
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      // Display an error toast if the request fails
      toast({
        title: 'An error occurred. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage); // Refresh data
  }, [currentPage, entriesPerPage]);

  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All customers</h1>

        <div className="space-x-4">
          <Button
            className="bg-supperagent text-white hover:bg-supperagent/90"
            size={'sm'}
            onClick={() => {
              navigate('/admin/invoice'); // Navigate to the desired route
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back To Invoice
          </Button>
          <Button
            className="bg-supperagent text-white hover:bg-supperagent/90"
            size={'sm'}
            onClick={() => {
              setDialogOpen(true); // Open dialog to create a new customer
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New customer
          </Button>
        </div>
      </div>
      <div className="rounded-md bg-white p-4 shadow-2xl">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>

                <TableHead className="w-32 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell>
                    <Link to={`${customer._id}`}>{customer?.name}</Link>
                  </TableCell>
                  <TableCell>
                    <Link to={`${customer._id}`}>{customer?.email}</Link>
                  </TableCell>
                  <TableCell>
                    <Link to={`${customer._id}`}>{customer?.address}</Link>
                  </TableCell>

                  <TableCell className="space-x-1 text-center">
                    <Link to={`${customer._id}`}>
                      <Button variant="outline" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
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
      <CustomerDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
        }}
        onSubmit={handleSubmit}
        initialData={null}
      />
    </div>
  );
}
