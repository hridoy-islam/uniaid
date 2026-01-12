import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from '../generate';
import { Download, X } from 'lucide-react'; // Ensure X is imported

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: any;
}

export const InvoicePreviewModal = ({
  isOpen,
  onClose,
  invoiceData
}: InvoicePreviewModalProps) => {
  if (!invoiceData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* [&>button]:hidden -> This removes the default absolute positioned close button 
         provided by the Shadcn DialogContent component 
      */}
      <DialogContent className="flex h-[95vh] w-full max-w-[95vw] flex-col gap-0 bg-gray-100 p-0 [&>button]:hidden">
        {/* Modal Header with Actions */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <DialogTitle className="text-lg font-semibold text-gray-800">
            Invoice Preview: {invoiceData.reference}
          </DialogTitle>

          <div className="flex items-center gap-2">
            {/* Download Button */}
            <PDFDownloadLink
              document={<InvoicePDF invoice={invoiceData} />}
              fileName={`invoice_${invoiceData.reference}.pdf`}
            >
              {({ loading }) => (
                <Button
                  disabled={loading}
                  className="gap-2 bg-supperagent text-white hover:bg-supperagent/90"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                  {loading ? 'Preparing...' : 'Download PDF'}
                </Button>
              )}
            </PDFDownloadLink>

            {/* Custom Shadcn Close Button */}
            <Button variant="outline" onClick={onClose} size="sm">
              Close
            </Button>
          </div>
        </div>

        {/* PDF Viewer Content */}
        <div className="h-full w-full flex-1 overflow-hidden bg-gray-500/10 p-4">
          <PDFViewer
            className="h-full w-full rounded-md border border-gray-200 shadow-lg"
            showToolbar={false}
          >
            <InvoicePDF invoice={invoiceData} />
          </PDFViewer>
        </div>
      </DialogContent>
    </Dialog>
  );
};
