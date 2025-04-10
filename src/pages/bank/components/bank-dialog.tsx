import { useForm } from 'react-hook-form';
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

export function BankDialog({ open, onOpenChange, onSubmit, initialData }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      accountNo: '',
      sortCode: '',
      beneficiary:''
    }
  });

  useEffect(() => {
    if (open) {
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
        accountNo: initialData.accountNo ?? '',
        sortCode: initialData.sortCode ?? '',
        beneficiary: initialData.beneficiary ?? ''
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
            {initialData ? 'Edit Bank' : 'Add New Bank'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Bank Name *</label>
              <Input
                {...register('name', { required: 'Bank Name is required' })}
                placeholder="Bank Name"
              />
              <ErrorMessage message={errors.name?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Account Number *</label>
              <Input
                {...register('accountNo', { required: 'Account Number is required' })}
                placeholder="Account Number"
              />
              <ErrorMessage message={errors.accountNo?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Sort Code *</label>
              <Input
                {...register('sortCode', { required: 'Sort Code is required' })}
                placeholder="Sort Code"
              />
              <ErrorMessage message={errors.sortCode?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Beneficiary *</label>
              <Input
                {...register('beneficiary', { required: 'Beneficiary is required' })}
                placeholder="Beneficiary"
              />
              <ErrorMessage message={errors.beneficiary?.message?.toString()} />
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
              {initialData ? 'Save Changes' : 'Add Bank'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
