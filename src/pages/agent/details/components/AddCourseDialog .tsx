import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  termId: z.string().min(1, "Term is required"),
  instituteId: z.string().min(1, "Institution is required"),
  courseId: z.string().min(1, "Course is required"),
});

const AddCourseDialog = ({ onAddCourses }) => {
  const [courseRelations, setCourseRelations] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseRelation, setSelectedCourseRelation] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { id } = useParams();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      termId: "",
      instituteId: "",
      courseId: "",
    },
  });

  useEffect(() => {
    const fetchCourseRelations = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get("/course-relations?limit=all");
        setCourseRelations(response.data.data.result || []);
      } catch (error) {
        console.error("Error fetching course relations:", error);
        toast({
          title: "Error",
          description: "Failed to fetch courses",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchCourseRelations();
    }
  }, [isOpen]);

  const handleTermChange = (termId) => {
    form.reset({ 
      ...form.getValues(),
      instituteId: "",
      courseId: ""
    });
    setSelectedCourseRelation(null);

    if (!termId) {
      setInstitutions([]);
      setCourses([]);
      return;
    }

    // Get unique institutions for selected term
    const filteredInstitutions = courseRelations
      .filter((item) => item.term._id === termId)
      .map((item) => ({
        value: item.institute._id,
        label: item.institute.name,
      }))
      .filter((item, index, self) => 
        index === self.findIndex((i) => i.value === item.value)
      );

    setInstitutions(filteredInstitutions);
  };

  const handleInstitutionChange = (institutionId) => {
    form.setValue("courseId", "");
    setSelectedCourseRelation(null);

    if (!institutionId) {
      setCourses([]);
      return;
    }

    const termId = form.getValues("termId");
    const filteredCourses = courseRelations
      .filter(
        (item) => 
          item.institute._id === institutionId && 
          item.term._id === termId
      )
      .map((item) => ({
        value: item._id,
        label: `${item.course.name} (${item.term.term})`,
        courseRelation: item,
      }));

    setCourses(filteredCourses);
  };

  const handleCourseChange = (courseRelationId) => {
    const selectedCourse = courseRelations.find(
      (item) => item._id === courseRelationId
    );
    setSelectedCourseRelation(selectedCourse);
  };

  const handleSubmit = async () => {
    if (!selectedCourseRelation) {
      toast({
        title: "Error",
        description: "Please select a valid course",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await axiosInstance.post(`/agent-courses`, {
        courseRelationId: selectedCourseRelation._id,
        agentId: id,
      });

      toast({
        title: "Success",
        description: "Course added successfully",
        className: "bg-supperagent border-none text-white",
      });

      if (onAddCourses) {
        onAddCourses(selectedCourseRelation);
      }

      // Reset form and close dialog
      form.reset();
      setSelectedCourseRelation(null);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to add course:", error);
      const errorMessage = error.response?.data?.message || "Failed to add course";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="border-none bg-supperagent text-white hover:bg-supperagent/90">
          + Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <h2 className="text-lg font-semibold mb-4">Add Course</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Term Selection */}
            <FormField
              control={form.control}
              name="termId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term</FormLabel>
                  <select
                    {...field}
                    disabled={isLoading}
                    onChange={(e) => {
                      field.onChange(e);
                      handleTermChange(e.target.value);
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  >
                    <option value="">Select term</option>
                    {courseRelations
                      .map((item) => ({
                        value: item.term._id,
                        label: item.term.term,
                      }))
                      .filter(
                        (value, index, self) =>
                          index === self.findIndex((t) => t.value === value.value)
                      )
                      .map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Institution Selection */}
            <FormField
              control={form.control}
              name="instituteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <select
                    {...field}
                    disabled={isLoading || !form.getValues("termId")}
                    onChange={(e) => {
                      field.onChange(e);
                      handleInstitutionChange(e.target.value);
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  >
                    <option value="">Select institution</option>
                    {institutions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Course Selection */}
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <select
                    {...field}
                    disabled={isLoading || !form.getValues("instituteId")}
                    onChange={(e) => {
                      field.onChange(e);
                      handleCourseChange(e.target.value);
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  >
                    <option value="">Select course</option>
                    {courses.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-supperagent text-white hover:bg-supperagent"
                disabled={isLoading || !selectedCourseRelation}
              >
                {isLoading ? "Adding..." : "Add Course"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseDialog;