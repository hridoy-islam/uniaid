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
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      agentName: "",
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
        const response = await axiosInstance.get('/staffs?limit=all');
        const options = response.data.data.result.map((staff) => ({
          value: staff.id,
          label: `${staff.firstName} ${staff.lastName}`,
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
        agentName: initialData.agentName ?? "",
        organization: initialData.organization ?? "",
        contactPerson: initialData.contactPerson ?? "",
        phone: initialData.phone ?? "",
        email: initialData.email ?? "",
        location: initialData.location ?? "",
        nominatedStaffs: initialData.nominatedStaffs?.map(staff => ({
          value: staff.id,
          label: `${staff.firstName} ${staff.lastName}`,
        })) ?? [], // Map initial data to react-select format
        password: initialData.password ?? "",
      });
    }
  }, [initialData, reset]);

  const onSubmitForm = (data) => {
    if (!data.password) {
      delete data.password; // Remove password field if it's empty
    }
    // Extract only the IDs from nominatedStaff
    data.nominatedStaffs = data.nominatedStaffs?.map(staff => staff.value) || [];
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
                {...register("agentName", { required: "Agent Name is required" })}
                placeholder="Agent Name"
              />
              <ErrorMessage message={errors.agentName?.message?.toString()} />
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
              {/*               
              <Controller
                name="nominatedStaff"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  >
                    <option value="" disabled>
                      Select a staff member
                    </option>
                    {staffOptions.map((staff) => (
                      <option key={staff.value} value={staff.value}>
                        {staff.label}
                      </option>
                    ))}
                  </select>
                )}
              /> */}

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
              <label className="block text-sm font-medium">Password</label>
              <Input type="password" {...register("password")} />
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
