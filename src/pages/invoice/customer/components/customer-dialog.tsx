import { Controller, useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ErrorMessage from '@/components/shared/error-message';
import { useEffect } from 'react';

export function CustomerDialog({ open, onOpenChange, onSubmit, initialData }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      address: ''
    }
  });

  useEffect(() => {
    if (open) {
      // Reset form when dialog is opened
      reset();
    }

    return () => {
      if (!open) {
        reset();
      }
    };
  }, [open, reset]);

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name ?? '',
        email: initialData.email ?? '',
        address: initialData.address ?? ''
      });
    }
  }, [initialData, reset]);

  const onSubmitForm = (data) => {
    // Send data to the parent component (or server)
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            {/* <div>
              <label className="block text-sm font-medium">Logo</label>
              <Input
                {...register("logo")}
                placeholder="Logo URL"
              />
              <ErrorMessage message={errors.logo?.message?.toString()} />
            </div> */}

            <div>
              <label className="block text-sm font-medium">
                Customer Name *
              </label>
              <Input
                {...register('name', { required: 'Agent Name is required' })}
                placeholder="Customer Name"
              />
              <ErrorMessage message={errors.name?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Email</label>
              <Input
                {...register('email', {
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email format'
                  }
                })}
                placeholder="Email"
              />
              <ErrorMessage message={errors.email?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Address</label>
              <Input {...register('address')} placeholder="Address" />
              <ErrorMessage message={errors.address?.message?.toString()} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-supperagent text-white hover:bg-supperagent/90"
            >
              {initialData ? 'Save Changes' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
