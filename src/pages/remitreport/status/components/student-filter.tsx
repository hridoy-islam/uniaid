"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function StudentFilter({
  filterForm,
  terms,
  institutes,
  sessions,
  paymentStatuses,
  onFilterSubmit,
  handleYearChange,
  handleSessionChange,
  handleTermChange,
  handleInstituteChange,
  handleCourseRelationChange,
  agents,
  filteredInstitutes,
  filteredCourseRelations,
}) {
  return (
    <Card className="rounded-none shadow-md">
      <div className="px-6 py-2">
        <h1 className="font-semibold">Filter Students</h1>
        <h2>Search and filter students </h2>
      </div>
      <CardContent>
        <Form {...filterForm}>
          <form onSubmit={filterForm.handleSubmit(onFilterSubmit)} className="">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={filterForm.control}
                name="agent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Remit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(agents || []).map((agent) => (
                          <SelectItem key={agent._id} value={agent._id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {/* Term Select */}
              <FormField
                control={filterForm.control}
                name="term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        handleTermChange(value)
                      }}
                      value={field.value}
                      disabled={!filterForm.watch("agent")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {terms
                          ?.filter((term, index, self) => index === self.findIndex((t) => t._id === term._id)) // Removes duplicate terms
                          .map((term) => (
                            <SelectItem key={term._id} value={term._id}>
                              {term.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Institute Select */}
              <FormField
                control={filterForm.control}
                name="institute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institute</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        handleInstituteChange(value)
                      }}
                      value={field.value}
                      disabled={!filterForm.watch("term")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Institute" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(filteredInstitutes.length > 0 ? filteredInstitutes : institutes)
                          ?.filter((institute, index, self) => index === self.findIndex((i) => i._id === institute._id)) // Removes duplicate institutes
                          .map((institute) => (
                            <SelectItem key={institute._id} value={institute._id}>
                              {institute.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Course Relation Select */}
              <FormField
                control={filterForm.control}
                name="courseRelationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        handleCourseRelationChange(value)
                      }}
                      value={field.value}
                      disabled={!filterForm.watch("institute")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCourseRelations.map((option) => (
                          <SelectItem key={option._id} value={option._id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Year Select */}
              <FormField
                control={filterForm.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleYearChange(value);
                      }}
                      value="Year 1" // Always set the value to "Year 1"
                      disabled={true} // Disable the select field
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Year 1" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Year 1">Year 1</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />


              {/* Session Select */}
              <FormField
                control={filterForm.control}
                name="session"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        handleSessionChange(value)
                      }}
                      value={field.value}
                      disabled={!filterForm.watch("institute")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Session" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sessions?.map((session) => (
                          <SelectItem key={session} value={session}>
                            {session}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Status Select */}
              <FormField
                control={filterForm.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "available"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentStatuses?.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-8 flex items-center justify-start">
                <Button
                  className="bg-supperagent text-white hover:bg-supperagent/90 min-w-[120px]"
                  type="submit"
                  disabled={
                    !filterForm.watch("agent") ||
                    !filterForm.watch("courseRelationId") ||
                    !filterForm.watch("year") ||
                    !filterForm.watch("session")
                  }
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

