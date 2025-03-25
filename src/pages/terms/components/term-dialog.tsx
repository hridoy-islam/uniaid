import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "../../../lib/axios";
import AsyncSelect from "react-select/async";

export function TermDialog({ open, onOpenChange, onSubmit, initialData }) {
  const [name, setName] = useState(""); // State for term name
  const [academicYear, setAcademicYear] = useState<any>(null); // State for selected academic year

  // Fetch options for academic year dropdown
  const loadOptions = async (inputValue) => {
    try {
      const response = await axiosInstance.get(`/academic-years?limit=all`);
      const data = response.data.data.result;

      return data
        .filter((year) =>
          year.academic_year.toLowerCase().includes(inputValue.toLowerCase())
        )
        .map((year) => ({
          label: year.academic_year,
          value: year._id,
        }));
    } catch (error) {
      console.error("Error fetching academic years:", error);
      return [];
    }
  };

  // Populate form fields when `initialData` changes (for editing mode)
  useEffect(() => {
    if (initialData?.academic_year_id) {
      setName(initialData.term || ""); // Populate term name
      setAcademicYear({
        label: initialData.academic_year, // Populate academic year dropdown
        value: initialData.academic_year_id?._id,
      });
    } else {
      // Reset form for adding a new term
      setName("");
      setAcademicYear(null);
    }
  }, [initialData]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!academicYear) {
      alert("Please select an academic year.");
      return;
    }

    // Submit form data
    onSubmit({
      term: name,
      academic_year_id: academicYear.value,
    });

    // Close dialog and reset fields
    onOpenChange(false);
    setName("");
    setAcademicYear(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit" : "Add"} Term</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Term Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Term Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter term name"
            />
          </div>

          {/* Academic Year Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="academicYear">
              Academic Year <span className="text-red-500">*</span>
            </Label>
            <AsyncSelect
              id="academicYear"
              cacheOptions
              defaultOptions
              loadOptions={loadOptions}
              value={academicYear}
              onChange={setAcademicYear}
              placeholder="Select Academic Year"
              isClearable
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-supperagent text-white hover:bg-supperagent/90"
              type="submit"
            >
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
