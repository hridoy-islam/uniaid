
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect } from "react"

interface StudentFilterProps {
  filterForm: any
  invoiceData?: any
  isEditing?: boolean
}

export function StudentFilter({
  filterForm,
  invoiceData,
  isEditing = true,
}: StudentFilterProps) {
  useEffect(() => {
    if (invoiceData) {
      filterForm.reset({
        term: invoiceData?.semester || "",
        institute: invoiceData?.courseRelationId?.institute?.name || "",
        courseRelationId: invoiceData?.courseRelationId?.course?.name || "" || "",
        year: invoiceData?.year || "Year 1",
        session: invoiceData?.session || "",
        paymentStatus:invoiceData?.status || ""
      })
    }
  }, [invoiceData, filterForm])


  return (
    <Card className="rounded-none shadow-md">
      <div className="px-6 py-2">
        <h1 className="font-semibold">Filter Students</h1>
        <h2 className="text-sm text-muted-foreground">
          {isEditing ? "Viewing invoice details" : "Search and filter students"}
        </h2>
      </div>
      <CardContent>
        <Form {...filterForm}>
          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              

              {/* Term Display */}
              <FormField
                control={filterForm.control}
                name="term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term</FormLabel>
                    <div className="flex h-10 w-full items-center text-gray-400 rounded-md border border-gray-200 px-3 py-2 text-sm">
                      {field.value || "No term selected"}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Institute Display */}
              <FormField
                control={filterForm.control}
                name="institute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institute</FormLabel>
                    <div className="flex h-10 w-full items-center text-gray-400 rounded-md border border-gray-200 px-3 py-2 text-sm">
                      {field.value || "No institute selected"}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Course Display */}
              <FormField
                control={filterForm.control}
                name="courseRelationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <div className="flex h-10 w-full items-center text-gray-400 rounded-md border border-gray-200 px-3 py-2 text-sm">
                      {field.value || "No course selected"}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Year Display */}
              <FormField
                control={filterForm.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <div className="flex h-10 w-full items-center text-gray-400 rounded-md border border-gray-200 px-3 py-2 text-sm">
                      {field.value || "Year 1"}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Session Display */}
              <FormField
                control={filterForm.control}
                name="session"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session</FormLabel>
                    <div className="flex h-10 w-full items-center rounded-md border text-gray-400 border-gray-200 px-3 py-2 text-sm">
                      {field.value || "No session selected"}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Status Display */}
              <FormField
                control={filterForm.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <div className="flex h-10 w-full text-gray-400 items-center rounded-md border border-gray-200 px-3 py-2 text-sm">
                      {field.value ? field.value.charAt(0).toUpperCase() + field.value.slice(1) : "due"}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* View Mode Button */}
              <div className="mt-8 flex items-center justify-start">
                <Button
                  type="button"
                  className="bg-supperagent text-white hover:bg-supperagent/90 min-w-[120px]"
                  disabled
                >
                  Search
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}