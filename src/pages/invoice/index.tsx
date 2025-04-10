import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import moment from 'moment';
import { Send } from 'lucide-react';
import InvoicePDF from './generate';
import { Link, useNavigate } from 'react-router-dom';
import { DataTablePagination } from '../students/view/components/data-table-pagination';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { AlertModal } from '@/components/shared/alert-modal';

import axios from 'axios';
import { pdf } from '@react-pdf/renderer';
import { BlinkingDots } from '@/components/shared/blinking-dots';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [customerOptions, setcustomerOptions] = useState([]);
  const [customer, setcustomer] = useState('');
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceToMark, setInvoiceToMark] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [invoiceToExport, setInvoiceToExport] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [loading, setLoading] = useState(true)

  const fetchInvoices = async (page, entriesPerPage) => {
    try {

      setLoading(true)
      const params: any = {
        page,
        limit: entriesPerPage
      };

      if (status) params.status = status;
      if (customer) params.customer = customer;
      if (searchTerm) params.searchTerm = searchTerm;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const response = await axiosInstance.get('/invoice', {
        params
      });
      setInvoices(response.data?.data?.result || []);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false)
    }

  };

  // Function to fetch customer options
  const fetchcustomers = async () => {
    try {
      const response = await axiosInstance.get('/customer?limit=all');
      setcustomerOptions(response.data?.data?.result || []); // Extract the 'result' array
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  useEffect(() => {
    fetchcustomers();
    fetchInvoices(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const handleSearchClick = () => {
    fetchInvoices(currentPage, entriesPerPage);
  };

  const handleEdit = (invoiceId: string) => {
    navigate(`/admin/invoice/edit-generate/${invoiceId}`);
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      const response = await axiosInstance.get(`/invoice/${invoiceId}`);
      const invoiceData = response.data?.data;

      const MyDoc = <InvoicePDF invoice={invoiceData} />;

      const pdfBlob = await pdf(MyDoc).toBlob();

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${invoiceData.reference}.pdf`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleConfirmMarkAsPaid = async () => {
    if (!invoiceToMark) return;

    try {
      await axiosInstance.patch(`/invoice/${invoiceToMark}`, {
        status: 'paid'
      });

      setInvoices((prevInvoices) =>
        prevInvoices.map((invoice) =>
          invoice._id === invoiceToMark
            ? { ...invoice, status: 'paid' }
            : invoice
        )
      );

      toast({
        title: 'Mark as Paid successfully',
        className: 'bg-supperagent border-none text-white'
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the invoice status',
        variant: 'destructive'
      });
    }

    setIsModalOpen(false);
    setInvoiceToMark(null);
  };

  
 

  const companyId = import.meta.env.VITE_COMPANY_ID;
  const account = import.meta.env.VITE_ACCOUNTING;

  const handleExport = (invoiceId: string) => {
    setInvoiceToExport(invoiceId); // Set the invoice ID to be exported
    setIsExportModalOpen(true); // Open the confirmation modal
  };

  const handleConfirmExport = async () => {
    if (!invoiceToExport) return;

    try {
      const invoiceResponse = await axiosInstance.get(
        `/invoice/${invoiceToExport}`
      );
      const invoiceData = invoiceResponse.data?.data;

      const payload = {
        transactionType: 'inflow',
        transactionDate: new Date().toISOString(),
        invoiceDate: invoiceData.createdAt,
        invoiceNumber: invoiceData.reference,
        description: invoiceData.students
          .map((student: any) => student.refId)
          .join(', '),
        amount: invoiceData.totalAmount,
       

      };

      await axios.post(`${account}`, payload, {
        headers: {
          'x-company-token': `${companyId}`
        }
      });

      await axiosInstance.patch(`/invoice/${invoiceToExport}`, {
        exported: true
      });

      toast({
        title: 'Export successful',
        className: 'bg-supperagent border-none text-white'
      });

      fetchInvoices(currentPage, entriesPerPage);
    } catch (error) {
      console.error('Error exporting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to export the invoice',
        variant: 'destructive'
      });
    } finally {
      setIsExportModalOpen(false); // Close the modal
      setInvoiceToExport(null); // Reset the invoice ID
    }
  };

  return (
    <div className="mx-auto py-1">
      <div className="flex justify-between">
        <h1 className="mb-6 text-2xl font-bold">Invoices</h1>
        <div className="space-x-4">
          <Link to="generate">
            <Button className="bg-supperagent text-white hover:bg-supperagent">
              Create Invoice
            </Button>
          </Link>
          <Link to="status">
            <Button className="bg-supperagent text-white hover:bg-supperagent">
              Check Status
            </Button>
          </Link>
          <Link to="customer">
            <Button className="bg-supperagent text-white hover:bg-supperagent">
              Customer List
            </Button>
          </Link>
          
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex space-x-6">
            {/* Search by Reference */}
            <div className="min-w-[200px]">
              <h1 className="mb-2 block text-sm font-medium">Search</h1>
              <Input
                type="text"
                placeholder="Search by reference"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>

            {/* From Date */}
            <div className="min-w-[200px]">
              <h1 className="mb-2 block text-sm font-medium">From Date</h1>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>

            {/* To Date */}
            <div className="min-w-[200px]">
              <h1 className="mb-2 block text-sm font-medium">To Date</h1>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>

            {/* customer To Dropdown */}
            <div className="min-w-[200px]">
              <h1 className="mb-2 block text-sm font-medium">Customer</h1>
              <select
                value={customer}
                onChange={(e) => setcustomer(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                <option value="">All</option>
                {customerOptions.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[200px]">
              <h1 className="mb-2 block text-sm font-medium">Status</h1>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="due">Due</option>
              </select>
            </div>

            <div className="mt-7 flex items-center">
              <Button
                className="min-w-[120px] bg-supperagent text-white hover:bg-supperagent"
                onClick={handleSearchClick}
              >
                Search
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (<div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>) :
            (<Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created At</TableHead>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Students</TableHead>
                  {/* <TableHead>Status</TableHead> */}
                  <TableHead>Invoice Status</TableHead>
                  <TableHead>Exported</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell>
                        {moment(invoice.createdAt).format('DD MMM YYYY')}
                      </TableCell>
                      <TableCell>{invoice.reference}</TableCell>
                      <TableCell>{invoice.customer?.name}</TableCell>
                      <TableCell>{invoice.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{invoice.noOfStudents}</TableCell>
                      {/* <TableCell>{invoice.status}</TableCell> */}
                      <TableCell>
                        {invoice.status === 'due' ? (
                          <div className="flex flex-row items-center justify-start gap-2">
                            <span className="text-xs font-semibold text-red-500">
                              Due
                            </span>
                            <Button
                              size="sm"
                              className="max-w-[100px] bg-supperagent text-white hover:bg-supperagent"
                              onClick={() => {
                                setInvoiceToMark(invoice._id);
                                setIsModalOpen(true);
                              }}
                            >
                              Mark as Paid
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-green-500">
                            Paid
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-row items-center gap-2">
                          {invoice.exported ? 'Yes' : 'No'}

                          {invoice.status === 'paid' && !invoice.exported && (
                            <Button
                              size="sm"
                              className="bg-supperagent text-white hover:bg-supperagent"
                              onClick={() => handleExport(invoice._id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          {invoice.status !== 'paid' && (
                            <Button
                              className="bg-supperagent text-white hover:bg-supperagent"
                              size="sm"
                              onClick={() => handleEdit(invoice._id)}
                            >
                              Edit
                            </Button>
                          )}

                          <Button
                            size="sm"
                            className="bg-supperagent text-white hover:bg-supperagent"
                            onClick={() => handleDownload(invoice._id)}
                          >
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                )}
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
        </CardContent>

        <AlertModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmMarkAsPaid}
          loading={false}
          title="Confirm Action"
          description="Are you sure you want to mark this invoice as paid?"
        />
        <AlertModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onConfirm={handleConfirmExport}
          loading={false}
          title="Confirm Export"
          description="Are you sure you want to export this invoice?"
        />
      </Card>
    </div>
  );
}
