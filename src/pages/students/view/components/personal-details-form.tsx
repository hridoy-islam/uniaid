import ErrorMessage from "@/components/shared/error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockData } from "@/types";
import { useEffect } from "react";


export function PersonalDetailsForm({ student, onSave }) {
  const {
    handleSubmit,
    register,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      firstName: "",
      lastName: "",
      phone: "",
      dob: "",
      email: "",
      gender: "",
      maritualStatus: "",
      nationality: "",
      countryResidence: "",
      countryBirth: "",
      nativeLanguage: "",
      passportName: "",
      passportIssueLocation: "",
      passportNumber: "",
      passportIssueDate: "",
      passportExpiryDate: "",
    },
  });

  // Populate form fields when `student` data is available
  useEffect(() => {
    if (student) {
      reset({
        title: student.title || "",
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        dob: student.dob || "",
        phone: student.phone || "",
        email: student.email || "",
        gender: student.gender || "",
        maritualStatus: student.maritualStatus || "",
        nationality: student.nationality || "",
        countryResidence: student.countryResidence || "",
        countryBirth: student.countryBirth || "",
        nativeLanguage: student.nativeLanguage || "",
        passportName: student.passportName || "",
        passportIssueLocation: student.passportIssueLocation || "",
        passportNumber: student.passportNumber || "",
        passportIssueDate: student.passportIssueDate || "",
        passportExpiryDate: student.passportExpiryDate || "",
      });
    }
  }, [student, reset]);

  

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 shadow-md rounded-md mb-2">
        <div className="grid grid-cols-3 gap-4">
          {/* Title Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockData.titles.map((title, index) => (
                      <SelectItem key={index} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              {...register("firstName", { required: "First Name is required" })}
            />
            <ErrorMessage message={errors.firstName?.message?.toString()} />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              {...register("lastName", { required: "Last Name is required" })}
            />
            <ErrorMessage message={errors.lastName?.message?.toString()} />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              {...register("phone")} // Register the phone field
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input id="dob" type="date" {...register("dob")} />
            
          </div>

          {/* Marital Status Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="maritualStatus">Marital Status *</Label>
            <Controller
              name="maritualStatus"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockData.maritalStatuses.map((status, index) => (
                      <SelectItem key={index} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Gender Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockData.gender.map((gender, index) => (
                      <SelectItem key={index} value={gender}>
                        {gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Nationality */}
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input id="nationality" {...register("nationality")} />
          </div>

          {/* Country of Residence */}
          <div className="space-y-2">
            <Label htmlFor="countryResidence">Country of Residence</Label>
            <Input id="countryResidence" {...register("countryResidence")} />
          </div>

          {/* Country of Birth */}
          <div className="space-y-2">
            <Label htmlFor="countryBirth">Country of Birth</Label>
            <Input id="countryBirth" {...register("countryBirth")} />
          </div>

          {/* Native Language */}
          <div className="space-y-2">
            <Label htmlFor="nativeLanguage">Native Language</Label>
            <Input id="nativeLanguage" {...register("nativeLanguage")} />
          </div>

          {/* Passport Name */}
          <div className="space-y-2">
            <Label htmlFor="passportName">Name as it appears in Passport:</Label>
            <Input id="passportName" type="text" {...register("passportName")} />
          </div>

          {/* Passport Issue Location */}
          <div className="space-y-2">
            <Label htmlFor="passportIssueLocation">Passport Issue Location:</Label>
            <Input
              id="passportIssueLocation"
              {...register("passportIssueLocation")}
            />
          </div>

          {/* Passport Number */}
          <div className="space-y-2">
            <Label htmlFor="passportNumber">Passport Number</Label>
            <Input id="passportNumber" type="text" {...register("passportNumber")} />
          </div>

          {/* Passport Issue Date */}
          <div className="space-y-2">
            <Label htmlFor="passportIssueDate">Passport Issue Date</Label>
            <Input
              id="passportIssueDate"
              type="date"
              {...register("passportIssueDate")}
            />
          </div>

          {/* Passport Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="passportExpiryDate">Passport Expiry Date</Label>
            <Input
              id="passportExpiryDate"
              type="date"
              {...register("passportExpiryDate")}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            variant={"outline"}
            className="bg-supperagent text-white hover:bg-supperagent/90 border-none"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}