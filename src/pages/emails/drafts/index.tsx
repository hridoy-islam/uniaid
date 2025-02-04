import { useState, useEffect } from 'react';
import { Plus, Pen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { EmailDraftDialog } from '../components/email-draft-dialog';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { DataTablePagination } from '@/pages/students/view/components/data-table-pagination';


export function DraftsManager() {
  const [drafts, setDrafts] = useState<any>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<any>(null);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const fetchData = async (page, entriesPerPage) => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/email-drafts`, {
        params: {
          page,
          limit: entriesPerPage
        }
      });
      setDrafts(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    } finally {
      setInitialLoading(false); // Disable initial loading after the first fetch
    }
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage); // Refresh data
  }, [currentPage, entriesPerPage]);

  const handleSubmit = async (data) => {
    try {
      if (editingDraft) {
        // Update institution
        await axiosInstance.patch(`/email-drafts/${editingDraft?.id}`, data);
        toast({
          title: 'Draft Updated successfully',
          className: 'bg-supperagent border-none text-white'
        });
        fetchData(currentPage, entriesPerPage);
        setEditingDraft(null);
      } else {
        await axiosInstance.post(`/email-drafts`, data);
        toast({
          title: 'Draft Created successfully',
          className: 'bg-supperagent border-none text-white'
        });
        fetchData(currentPage, entriesPerPage);
      }
    } catch (error) {
      console.error('Error saving institution:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Email Drafts</h2>
        <Button
          className="bg-supperagent text-white hover:bg-supperagent/90"
          onClick={() => setDraftDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Draft
        </Button>
      </div>
      <div className="rounded-md bg-white p-4 shadow-2xl">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No drafts found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>

                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((draft) => (
                <TableRow key={draft.id}>
                  <TableCell>{draft.subject}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingDraft(draft);
                        setDraftDialogOpen(true);
                      }}
                    >
                      <Pen className="h-4 w-4" />
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
      <EmailDraftDialog
        open={draftDialogOpen}
        onOpenChange={(open) => {
          setDraftDialogOpen(open);
          if (!open) setEditingDraft(null); // Reset editing agent when closing dialog
        }}
        onSubmit={handleSubmit}
        initialData={editingDraft}
      />
    </div>
  );
}
