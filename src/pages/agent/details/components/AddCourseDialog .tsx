import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Select from "react-select";
import { useParams } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

const AddCourseDialog = ({ coursesList = [], onAddCourses }) => {
  const [selectedCourse, setSelectedCourse] = useState(null); // State for a single selected course
  const { id } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Map courses to options for the Select component
  const courseOptions = coursesList.map((course) => ({
    value: course?._id,
    label: `${course?.institute?.name} - ${course?.course?.name} (${course?.term?.term})`,
  }));

  // Handle course selection change
  const handleSelectChange = (selected) => {
    setSelectedCourse(selected); // Set the single selected course
  };

  // Submit the selected course
  const handleAddCourse = async () => {
    if (!selectedCourse) {
      toast({
        title: "No course selected",
        className: "bg-destructive border-none text-white",
      });
      return;
    }

    try {
      // Use axiosInstance for the POST request
      await axiosInstance.post(`/agent-courses`, {
        courseRelationId: selectedCourse.value, // Send the single course ID
        agentId: id,
      });

      // Show success toast
      toast({
        title: "Course added successfully",
        className: "bg-supperagent border-none text-white",
      });

      // Pass the selected course to the parent component
      if (onAddCourses) {
        onAddCourses(selectedCourse);
      }

      setSelectedCourse(null); // Clear selection after adding
      setIsOpen(false); // Close the dialog
    } catch (error) {
      console.error("Failed to add course:", error);
      toast({
        title: "Failed to add course",
        className: "bg-destructive border-none text-white",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setIsOpen(true)}
          className="border-none bg-supperagent text-white hover:bg-supperagent/90"
        >
          + Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Add Course</h2>

        {/* Single-course Select component */}
        <Select
          name="courses"
          options={courseOptions}
          className="mb-4 max-w-2xl"
          classNamePrefix="select"
          placeholder="Search and select a course..."
          value={selectedCourse} // Single object, not an array
          onChange={handleSelectChange}
          isClearable
          isSearchable
        />

        <div className="flex justify-end">
          <Button
            onClick={handleAddCourse}
            disabled={!selectedCourse} // Disable if no course is selected
            className="border-none bg-supperagent text-white hover:bg-supperagent/90"
          >
            Add Course
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseDialog;