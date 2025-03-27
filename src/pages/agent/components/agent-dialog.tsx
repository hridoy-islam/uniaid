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
import Select from 'react-select'; // Import react-select

export function AgentDialog({ open, onOpenChange, onSubmit, initialData }) {
  const [staffOptions, setStaffOptions] = useState<any>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      organization: "",
      contactPerson: "",
      phone: "",
      email: "",
      location: "",
      nominatedStaffs: [],
      password: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/users?role=staff&limit=all');
        const options = response.data.data.result.map((staff) => ({
          value: staff._id,
          label: `${staff.name}`,
        }));
        setStaffOptions(options);
      } catch (error) {
        console.error("Error fetching staff options:", error);
      }
    };

    if (open) {
      fetchData();
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
        name: initialData.name ?? "",
        organization: initialData.organization ?? "",
        contactPerson: initialData.contactPerson ?? "",
        phone: initialData.phone ?? "",
        email: initialData.email ?? "",
        location: initialData.location ?? "",
        nominatedStaffs: initialData.nominatedStaffs?.map(staff => ({
          value: staff._id,
          label: `${staff.name}`,
        })) ?? [], // Map initial data to react-select format
        password: "", // Clear password field for editing
      });
    }
  }, [initialData, reset]);

  const onSubmitForm = (data) => {
    // Check if password is required (for new agents) and missing
    if (!initialData && !data.password) {
      // Set an error for the password field
      errors.password = { message: "Password is required for new agents" };
      return; // Stop form submission
    }

    // Remove password field if it's empty (for editing)
    if (!data.password) {
      delete data.password;
    }

    // Ensure email is lowercase
    data.email = data.email.toLowerCase();

    // Extract only the IDs from nominatedStaff
    data.nominatedStaffs = data.nominatedStaffs?.map(staff => staff.value) || [];

    // Submit the form data
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Agent" : "Add New Agent"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Agent Name *</label>
              <Input
                {...register("name", { required: "Agent Name is required" })}
                placeholder="Agent Name"
              />
              <ErrorMessage message={errors.name?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Organization</label>
              <Input {...register("organization")} placeholder="Organization" />
              <ErrorMessage message={errors.organization?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Contact Person *</label>
              <Input
                {...register("contactPerson", { required: "Contact Person is required" })}
                placeholder="Contact Person"
              />
              <ErrorMessage message={errors.contactPerson?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Phone</label>
              <Input {...register("phone")} placeholder="Phone" />
              <ErrorMessage message={errors.phone?.message?.toString()} />
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
              <label className="block text-sm font-medium">Location *</label>
              <Input
                {...register("location", { required: "Location is required" })}
                placeholder="Location"
              />
              <ErrorMessage message={errors.location?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Nominated Staff</label>
              <Controller
                name="nominatedStaffs"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={staffOptions}
                    isMulti // Enable multiple selection
                    className="w-full"
                    classNamePrefix="select"
                    placeholder="Select staff members"
                  />
                )}
              />
              <ErrorMessage message={errors.nominatedStaffs?.message?.toString()} />
            </div>

            <div>
              <label className="block text-sm font-medium">Password {!initialData && "*"}</label>
              <Input
                type="password"
                {...register("password", {
                  required: !initialData ? "Password is required for new agents" : false, // Conditional validation
                })}
              />
              <ErrorMessage message={errors.password?.message?.toString()} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-supperagent text-white hover:bg-supperagent/90">
              {initialData ? "Save Changes" : "Add Agent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}