"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Invoice } from "@/types/invoice"

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  onConfirm: () => void
}

export function InvoiceDialog({ open, onOpenChange, invoice, onConfirm }: InvoiceDialogProps) {
  if (!invoice) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogDescription>
            You are about to mark this invoice as paid. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Invoice Number:</div>
            <div>{invoice.invoiceNumber}</div>

            <div className="font-medium">Date:</div>
            <div>{new Date(invoice.transactionDate).toLocaleDateString()}</div>

            <div className="font-medium">Billed From:</div>
            <div>{invoice.billedFrom}</div>

            <div className="font-medium">Billed To:</div>
            <div>{invoice.billedTo}</div>

            <div className="font-medium">Amount:</div>
            <div>${invoice.amount.toFixed(2)}</div>

            <div className="font-medium">Transaction Type:</div>
            <div className="capitalize">{invoice.transactionType}</div>

            {invoice.description && (
              <>
                <div className="font-medium">Description:</div>
                <div>{invoice.description}</div>
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Confirm Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

