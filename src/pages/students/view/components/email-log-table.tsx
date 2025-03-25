import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import moment from "moment-timezone";
import { useState } from "react";

export function EmailLogTable({ logs }) {
  const [selectedLog, setSelectedLog] = useState(null);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Sent At</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(logs) && logs.length > 0 ? (
            logs.map((log) => (
              <TableRow key={log._id} onClick={() => setSelectedLog(log)} className="cursor-pointer hover:bg-gray-100">
                <TableCell>{log.emailConfigId.email}</TableCell>
                <TableCell>{log.studentId.email}</TableCell>
                <TableCell>{log.subject}</TableCell>
                <TableCell>
                  {moment(log.sent_at).tz("Europe/London").format("MMM D, YYYY, h:mm A")}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      log.status === "sent"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {log.status}
                  </span>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5}>No logs available</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Dialog for Email Details */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-2">
              <p><strong>From:</strong> {selectedLog?.emailConfigId.email}</p>
              <p><strong>To:</strong> {selectedLog?.studentId.email}</p>
              <p><strong>Subject:</strong> {selectedLog?.subject}</p>
             
              <p><strong>Body:</strong> {selectedLog?.body}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
