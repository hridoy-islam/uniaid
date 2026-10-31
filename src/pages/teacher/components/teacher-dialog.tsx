import { useForm } from "react-hook-form";
import Select from "react-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorMessage from "@/components/shared/error-message";
import { useEffect, useState } from "react";

const designationSelectStyles = {
  control: (base: any) => ({
    ...base,
    minHeight: "36px",
    borderColor: "rgba(0,0,0,0.2)",
    boxShadow: "none",
    fontSize: "0.875rem",
    "&:hover": { borderColor: "#000" },
  }),
  placeholder: (base: any) => ({ ...base, color: "#000" }),
  menu: (base: any) => ({ ...base, zIndex: 50 }),
};

export function TeacherDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  designations = [] as any[],
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });
  // A teacher may have several designations
  const [designationIds, setDesignationIds] = useState<string[]>([]);

   // Reset form when initialData changes
   useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name ?? "",
        email: initialData.email ?? "",
        phone: initialData.phone ?? "",
        password: initialData.password ?? "",
      });
      setDesignationIds((initialData.designationId || []).map(String));
    } else {
      reset(); // Reset to default values if no initialData is provided
      setDesignationIds([]);
    }
  }, [initialData, reset]);

  useEffect(() => {
    if (!open) {
      reset(); // Reset form data when dialog closes
      setDesignationIds([]);
    }
  }, [open, reset]);

  const designationOptions = designations.map((d: any) => ({
    value: d._id,
    label: d.name,
  }));

  const onSubmitForm = (data) => {
    if (!data.password) {
      delete data.password;
    }
    onSubmit({ ...data, designationId: designationIds });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit" : "Add"} Teacher</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name", { required: "Last Name is required" })}
              />
              <ErrorMessage message={errors.name?.message?.toString()} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" },
                })}
              />
              <ErrorMessage message={errors.email?.message?.toString()} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...register("phone")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
              />
              <ErrorMessage message={errors.password?.message?.toString()} />
            </div>

            <div className="space-y-2">
              <Label>Designations</Label>
              <Select
                isMulti
                options={designationOptions}
                value={designationOptions.filter((o) =>
                  designationIds.includes(o.value)
                )}
                onChange={(selected: any) =>
                  setDesignationIds(selected.map((o: any) => o.value))
                }
                placeholder="Choose designations"
                noOptionsMessage={() => "No designations, add them in Settings → Designations"}
                styles={designationSelectStyles}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="bg-supperagent text-white hover:bg-supperagent/90" type="submit">
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
