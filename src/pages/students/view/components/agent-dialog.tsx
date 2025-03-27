import { useEffect, useState } from "react";
import * as z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axiosInstance from "@/lib/axios"; // Adjust the path as needed
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";

const schema = z.object({
  agentId : z.string().nonempty("Please select an agent"),
});

export function AgentDialog({ open, onOpenChange, onSubmit, initialData }) {
  const [staffOptions, setStaffOptions] = useState<any>([]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      agentId : initialData ? initialData.id : "",
    },
  });

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axiosInstance.get('/agents?limit=all');
        const options = response.data.data.result.map((agent) => ({
          value: agent.id,
          label: agent.agentName,
        }));
        setStaffOptions(options);
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };

    if (open) {
      fetchAgents();
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      form.reset({ agentId : initialData.id }); // Ensure agentId is correctly set
    }
  }, [initialData, form]);

  const handleSubmit = (data) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Agent" : "Add Agent"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <Controller
                name="agentId"
                control={form.control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  >
                    <option value="" disabled>
                      Select an Agent
                    </option>
                    {staffOptions.map((agent) => (
                      <option key={agent.value} value={agent.value}>
                        {agent.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-supperagent text-white hover:bg-supperagent">
                Submit
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
