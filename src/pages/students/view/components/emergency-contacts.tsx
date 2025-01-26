import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
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
import { EmergencyContactDialog } from './emergency-contact-dialog';

export function EmergencyContacts({ student, onSave }) {
  const [contacts, setContacts] = useState(student?.emergencyContact || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);

  useEffect(() => {
    if (Array.isArray(student?.emergencyContact)) {
      setContacts(student?.emergencyContact);
    }
  }, [student?.emergencyContact]);

  const handleAddContact = async (data) => {
    if (editingContact) {
      const updatedContacts = { ...data, id: editingContact.id };
      onSave({ emergencyContact: [updatedContacts] });
      setEditingContact(null);
    } else {
      onSave({ emergencyContact: [data] });
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setDialogOpen(true);
  };

  const handleStatusChange = (id, currentStatus) => {
    // Toggle the status
    const newStatus = currentStatus === 1 ? 0 : 1;
    // Persist the change using onSave
    const updatedContact = contacts.find((contact) => contact.id === id);
    if (updatedContact) {
      const updatedContactWithStatus = { ...updatedContact, status: newStatus };
      onSave({ emergencyContact: [updatedContactWithStatus] });
    }
  };

  // Reset editingContact to default blank values when opening the dialog for a new contact
  const handleOpenDialog = () => {
    setEditingContact(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4 rounded-md p-4 shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Emergency Contacts</h2>
        <Button
          className="bg-supperagent text-white hover:bg-supperagent/90"
          onClick={handleOpenDialog} // Use handleOpenDialog instead of directly setting dialogOpen
        >
          <Plus className="mr-2 h-4 w-4" />
          New Contact
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Relationship</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                No contacts found
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>{contact.name}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.address}</TableCell>
                <TableCell>{contact.relationship}</TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={parseInt(contact.status) === 1}
                    onCheckedChange={(checked) =>
                      handleStatusChange(contact.id, checked ? 0 : 1)
                    }
                    className="mx-auto"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                    size="icon"
                    onClick={() => handleEdit(contact)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <EmergencyContactDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingContact(null); // Reset editingContact when dialog is closed
        }}
        onSubmit={handleAddContact}
        initialData={editingContact} // Pass the editingContact as initialData
      />
    </div>
  );
}
