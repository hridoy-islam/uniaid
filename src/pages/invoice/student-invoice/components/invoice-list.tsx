"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import type { Invoice } from "@/types/invoice"
import { getInvoices, saveInvoices, generatePDF } from "@/lib/invoice-utils"
import { InvoiceDialog } from "./invoice-dialog"

export function InvoiceList() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    setInvoices(getInvoices())
  }, [])

  const handleDelete = (id: string) => {
    const updatedInvoices = invoices.filter((invoice) => invoice.id !== id)
    saveInvoices(updatedInvoices)
    setInvoices(updatedInvoices)
  }

  const handleEdit = (id: string) => {
    router.push(`/invoice/form?id=${id}`)
  }

  const handleDownload = (invoice: Invoice) => {
    const pdfUrl = generatePDF(invoice)

    // Create a temporary link element and trigger download
    const link = document.createElement("a")
    link.href = pdfUrl
    link.download = `Invoice-${invoice.invoiceNumber}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 100)
  }

  const handleMarkAsPaid = (invoice: Invoice) => {
    if (invoice.status === "Paid") return

    setSelectedInvoice(invoice)
    setDialogOpen(true)
  }

  const confirmPayment = () => {
    if (!selectedInvoice) return

    const updatedInvoices = invoices.map((inv) => (inv.id === selectedInvoice.id ? { ...inv, status: "Paid" } : inv))

    saveInvoices(updatedInvoices)
    setInvoices(updatedInvoices)
    setDialogOpen(false)
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoices</CardTitle>
          <Button onClick={() => router.push("/invoice/form")}>
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Billed From</TableHead>
                  <TableHead>Billed To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      No invoices found. Create your first invoice!
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{new Date(invoice.transactionDate).toLocaleDateString()}</TableCell>
                      <TableCell>{invoice.billedFrom}</TableCell>
                      <TableCell>{invoice.billedTo}</TableCell>
                      <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === "Paid" ? "success" : "default"}>{invoice.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoice.transactionType === "inflow" ? "outline" : "secondary"}>
                          {invoice.transactionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(invoice.id)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                              <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                            {invoice.status === "Due" && (
                              <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice)}>
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(invoice.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InvoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invoice={selectedInvoice}
        onConfirm={confirmPayment}
      />
    </>
  )
}

