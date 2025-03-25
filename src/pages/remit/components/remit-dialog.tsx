import { Controller, useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ErrorMessage from "@/components/shared/error-message";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";

export function RemitDialog({ open, onOpenChange, onSubmit, initialData }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      logo: "", 
      name: "", 
      email: "", 
      address: "", 
      sortCode: "", 
      accountNo: "", 
      beneficiary: "", 
    },
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
        logo: initialData.logo ?? "",
        name: initialData.name ?? "",
        email: initialData.email ?? "",
        address: initialData.address ?? "",
        sortCode: initialData.sortCode ?? "",
        accountNo: initialData.accountNo ?? "",
        beneficiary: initialData.beneficiary ?? "",
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
          <DialogTitle>{initialData ? "Edit Remit" : "Add New Remit"}</DialogTitle>
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
              <label className="block text-sm font-medium">Remit Name *</label>
              <Input
                {...register("name", { required: "Agent Name is required" })}
                placeholder="Remit Name"
              />
              <ErrorMessage message={errors.name?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Email</label>
              <Input
                {...register("email", {
                  pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" },
                })}
                placeholder="Email"
              />
              <ErrorMessage message={errors.email?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Address</label>
              <Input {...register("address")} placeholder="Address" />
              <ErrorMessage message={errors.address?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Sort Code</label>
              <Input {...register("sortCode")} placeholder="Sort Code" />
              <ErrorMessage message={errors.sortCode?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Account No</label>
              <Input {...register("accountNo")} placeholder="Account No" />
              <ErrorMessage message={errors.accountNo?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Beneficiary</label>
              <Input {...register("beneficiary")} placeholder="Beneficiary" />
              <ErrorMessage message={errors.beneficiary?.message?.toString()} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-supperagent text-white hover:bg-supperagent/90">
              {initialData ? "Save Changes" : "Add Remit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
