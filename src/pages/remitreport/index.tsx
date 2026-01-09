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
import { RefreshCcw, Send, Loader2, MoreVertical } from 'lucide-react'; // Added Loader2
import InvoicePDF from './generate';
import { Link, useNavigate } from 'react-router-dom';
import { DataTablePagination } from '../students/view/components/data-table-pagination';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { AlertModal } from '@/components/shared/alert-modal';

import axios from 'axios';
import { pdf } from '@react-pdf/renderer';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { useSelector } from 'react-redux';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { InvoicePreviewModal } from './components/invoice-preview-modal';

export default function RemitReportPage() {
  const [invoices, setInvoices] = useState([]);
  const [agents, setAgents] = useState([]);
  const [remit, setRemit] = useState('');
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
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState();
  const { user } = useSelector((state: any) => state.auth);
  
  // Preview States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewInvoiceData, setPreviewInvoiceData] = useState<any>(null);
  
  // CHANGED: Track specific ID instead of boolean
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  const fetchInvoices = async (page, entriesPerPage) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: entriesPerPage
      };
      if (status) params.status = status;
      if (remit) params.remitTo = remit;
      if (searchTerm) params.searchTerm = searchTerm;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      if (user?.role === 'agent') {
        const response = await axiosInstance.get(
          `/remit-invoice?remitTo=${user._id}`,
          {
            params
          }
        );
        setInvoices(response.data?.data?.result || []);
        setTotalPages(response.data.data.meta.totalPage);
        setTotal(response.data.data.meta.total);
      } else {
        const response = await axiosInstance.get('/remit-invoice', {
          params
        });
        setInvoices(response.data?.data?.result || []);
        setTotalPages(response.data.data.meta.totalPage);
        setTotal(response.data.data.meta.total);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch remit options
  const fetchAgents = async () => {
    try {
      const response = await axiosInstance.get(
        '/users?role=agent&limit=all&fields=name'
      );
      setAgents(response.data?.data?.result || []); // Extract the 'result' array
    } catch (error) {
      console.error('Error fetching remit data:', error);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchInvoices(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const handleSearchClick = () => {
    fetchInvoices(currentPage, entriesPerPage);
  };

  const handleEdit = (invoiceId: string) => {
    navigate(`/admin/remit/edit-generate/${invoiceId}`);
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      // Fetch invoice data from backend
      const response = await axiosInstance.get(`/remit-invoice/${invoiceId}`);
      const invoiceData = response.data?.data;

      // Create a PDF document using InvoicePDF component
      const MyDoc = <InvoicePDF invoice={invoiceData} />;

      // Generate PDF and trigger download
      const pdfBlob = await pdf(MyDoc).toBlob();

      // Create a download link and trigger the download
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${invoiceData.reference}.pdf`;
      link.click();

      // Clean up the object URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleConfirmMarkAsPaid = async () => {
    if (!invoiceToMark) return;

    try {
      await axiosInstance.patch(`/remit-invoice/${invoiceToMark}`, {
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
      console.error('Error updating remit report status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the remit report status',
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
        `/remit-invoice/${invoiceToExport}`
      );
      const invoiceData = invoiceResponse.data?.data;

      const payload = {
        transactionType: 'outflow',
        transactionDate: new Date().toISOString(),
        invoiceDate: invoiceData.createdAt,
        invoiceNumber: invoiceData.reference,
        description: `Students: ${invoiceData.students
          .map((student: any) => student.refId)
          .join(', ')} |
Year: ${invoiceData.year} |
Session: ${invoiceData.session} |
Term: ${invoiceData.semester} |
Institute: ${invoiceData.courseRelationId?.institute?.name} |
Course: ${invoiceData.courseRelationId?.course?.name} |
${invoiceData.discountMsg ? `Additional Note: ${invoiceData.discountMsg}` : ''}`,
        amount: invoiceData.totalAmount
      };

      await axios.post(`${account}`, payload, {
        headers: {
          'x-company-token': `${companyId}`
        }
      });

      await axiosInstance.patch(`/remit-invoice/${invoiceToExport}`, {
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

  useEffect(() => {
    if (user?.role === 'agent') {
      setRemit(user._id);
    }
  }, [user]);

  // --- UPDATED PREVIEW FUNCTION ---
  const handlePreview = async (invoiceId: string) => {
      try {
        setPreviewLoadingId(invoiceId); // Set specific ID
        
        const response = await axiosInstance.get(`/remit-invoice/${invoiceId}`);
        
        if(response.data?.data) {
            setPreviewInvoiceData(response.data.data);
            setIsPreviewOpen(true);
        } else {
            throw new Error("No data received");
        }
  
      } catch (error) {
        console.error('Error fetching invoice for preview:', error);
        toast({
          title: 'Error',
          description: 'Failed to load invoice preview',
          variant: 'destructive'
        });
      } finally {
        setPreviewLoadingId(null); // Reset ID
      }
    };
  

  return (
    <div className="mx-auto py-1">
      <div className="flex justify-between">
        <h1 className="mb-6 text-2xl font-bold">Remit Reports</h1>
        <div className="flex flex-row items-center space-x-4">
          <Button
            className="gap-2 bg-supperagent text-white hover:bg-supperagent/90"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="w-4" />
            Refresh
          </Button>
          <Link to="generate">
            <Button className="bg-supperagent text-white hover:bg-supperagent">
              Create Remit
            </Button>
          </Link>
          <Link to="status">
            <Button className="bg-supperagent text-white hover:bg-supperagent">
              Check Status
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

            {/* Remit To Dropdown */}
            <div className="min-w-[200px]">
              <h1 className="mb-2 block text-sm font-medium">Agent</h1>
              <select
                value={remit}
                onChange={(e) => setRemit(e.target.value)}
                disabled={user?.role === 'agent'} // ⛔ Prevent changing if agent
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                <option value="">All</option>
                {user?.role === 'agent'
                  ? agents
                      .filter((a) => a._id === user._id)
                      .map((agent) => (
                        <option key={agent._id} value={agent._id}>
                          {agent.name}
                        </option>
                      ))
                  : agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name}
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
          <div className="flex flex-row items-center text-sm text-gray-700">
            Showing{'  '}
            {total}
            &nbsp;records
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <BlinkingDots size="large" color="bg-supperagent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created At</TableHead>
                  <TableHead>Remit To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Institute</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Remit Status</TableHead>
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
                      <TableCell>{invoice.remitTo?.name}</TableCell>
                      <TableCell>{invoice.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        {invoice.courseRelationId?.institute?.name}
                      </TableCell>
                      <TableCell>{invoice.semester}</TableCell>
                      <TableCell>{invoice.session}</TableCell>
                      <TableCell>
                        {invoice.courseRelationId?.course?.name}
                      </TableCell>
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
                        <div className="flex justify-end gap-4">
                          
                          {/* --- UPDATED PREVIEW BUTTON WITH LOADING STATE --- */}
                          <Button 
                            className='bg-supperagent text-white hover:bg-supperagent/90 min-w-[90px]'
                            onClick={() => handlePreview(invoice._id)}
                            disabled={previewLoadingId === invoice._id}
                          >   
                             {previewLoadingId === invoice._id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Wait
                                </>
                            ) : (
                                'Preview'
                            )}
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="border border-gray-200 hover:bg-supperagent"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="border-gray-300 bg-white text-black "
                            >
                              {invoice?.status !== 'paid' && (
                                <DropdownMenuItem
                                  onClick={() => handleEdit(invoice._id)}
                                  className="hover:bg-supperagent focus:bg-supperagent"
                                >
                                  Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDownload(invoice._id)}
                                className="hover:bg-supperagent focus:bg-supperagent"
                              >
                                Download
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
          description="Are you sure you want to mark this remit report as paid?"
        />
        <AlertModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onConfirm={handleConfirmExport}
          loading={false}
          title="Confirm Export"
          description="Are you sure you want to export this remit report?"
        />

        <InvoicePreviewModal 
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          invoiceData={previewInvoiceData}
        />
      </Card>
    </div>
  );
}