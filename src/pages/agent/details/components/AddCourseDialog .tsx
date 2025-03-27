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
  const [data, setData] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseRelation, setSelectedCourseRelation] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
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
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/course-relations?limit=all");
        setData(response.data.data.result);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch courses",
          variant: "destructive",
        });
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleTermChange = (termId) => {
    form.setValue("instituteId", "");
    form.setValue("courseId", "");
    setSelectedCourseRelation(null);

    const filteredInstitutions = data
      .filter((item) => item.term._id === termId)
      .map((item) => ({
        value: item.institute._id,
        label: item.institute.name,
      }));
    setInstitutions(filteredInstitutions);
  };

  const handleInstitutionChange = (institutionId) => {
    form.setValue("courseId", "");
    setSelectedCourseRelation(null);

    const filteredCourses = data
      .filter((item) => item.institute._id === institutionId)
      .map((item) => ({
        value: item._id,
        label: `${item.course.name} (${item.term.term})`,
        courseRelation: item,
      }));
    setCourses(filteredCourses);
  };

  const handleCourseChange = (courseRelationId) => {
    const courseRelation = data.find((item) => item._id === courseRelationId);
    setSelectedCourseRelation(courseRelation);
  };

  const handleSubmit = async () => {
    if (!selectedCourseRelation) {
      toast({
        title: "Error",
        description: "Please select a course",
        variant: "destructive",
      });
      return;
    }

    try {
      await axiosInstance.post(`/agent-courses`, {
        courseRelationId: selectedCourseRelation._id,
        agentId: id,
      });

      toast({
        title: "Course Added successfully",
        className: "bg-supperagent border-none text-white",
      })

      if (onAddCourses) {
        onAddCourses(selectedCourseRelation);
      }

      form.reset();
      setSelectedCourseRelation(null);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to add course:", error);

      toast({
        title: "Select Another Course",
        className: "bg-destructive border-none text-white",
      })
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
                    onChange={(e) => {
                      field.onChange(e);
                      handleTermChange(e.target.value);
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  >
                    <option value="">Select term</option>
                    {data
                      .map((item) => ({
                        value: item.term._id,
                        label: item.term.term,
                      }))
                      .filter(
                        (value, index, self) =>
                          index === self.findIndex((t) => t.value === value.value)
                      )
                      .map((option) => (
                        <option key={`term-${option.value}`} value={option.value}>
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
                    onChange={(e) => {
                      field.onChange(e);
                      handleInstitutionChange(e.target.value);
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  >
                    <option value="">Select institution</option>
                    {institutions.map((option) => (
                      <option key={`institute-${option.value}`} value={option.value}>
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
                    onChange={(e) => {
                      field.onChange(e);
                      handleCourseChange(e.target.value);
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  >
                    <option value="">Select course</option>
                    {courses.map((option) => (
                      <option key={`course-${option.value}`} value={option.value}>
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-supperagent text-white hover:bg-supperagent"
              >
                Add Course
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseDialog