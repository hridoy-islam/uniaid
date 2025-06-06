import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

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
  hasSearched
}) {
  const { user } = useSelector((state: any) => state.auth);
  useEffect(() => {
    if (user?.role === 'agent') {
      filterForm.setValue('agent', user._id);
    }
  }, [user, filterForm]);
  return (
    <Card className="rounded-none shadow-md">
      <div className="px-6 py-2">
        <h1 className="font-semibold">Filter Students</h1>
        <h2>Search and filter students</h2>
      </div>
      <CardContent>
        <Form {...filterForm}>
          <form onSubmit={filterForm.handleSubmit(onFilterSubmit)} className="">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Agent Select - Disabled when editing */}
              <FormField
                control={filterForm.control}
                name="agent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remit</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={user?.role === 'agent'} // Disable for agents
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Remit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {user?.role === 'agent' ? (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name}
                          </SelectItem>
                        ) : (
                          (agents || []).map((agent) => (
                            <SelectItem key={agent._id} value={agent._id}>
                              {agent.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Term Select - Disabled when editing */}
              <FormField
                control={filterForm.control}
                name="term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleTermChange(value);
                      }}
                      value={field.value}
                      disabled={
                        !filterForm.watch('agent') && user?.role !== 'agent'
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {terms
                          ?.filter(
                            (term, index, self) =>
                              index ===
                              self.findIndex((t) => t._id === term._id)
                          )
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

              {/* Institute Select - Disabled when editing */}
              <FormField
                control={filterForm.control}
                name="institute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institute</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleInstituteChange(value);
                      }}
                      value={field.value}
                      disabled={!filterForm.watch('term')} // Disable when editing
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Institute" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(filteredInstitutes.length > 0
                          ? filteredInstitutes
                          : institutes
                        )
                          ?.filter(
                            (institute, index, self) =>
                              index ===
                              self.findIndex((i) => i._id === institute._id)
                          )
                          .map((institute) => (
                            <SelectItem
                              key={institute._id}
                              value={institute._id}
                            >
                              {institute.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={filterForm.control}
                name="courseRelationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>

                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleCourseRelationChange(value);
                      }}
                      value={field.value || ''}
                      disabled={!filterForm.watch('institute')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Course">
                            {filteredCourseRelations.find(
                              (c) => c._id === field.value
                            )?.name || 'Select Course'}
                          </SelectValue>
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

              {/* Year Select - Always disabled as it's fixed to Year 1 */}
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
                      value={field.value || 'Year 1'}
                      disabled // Always disabled as it's fixed
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Year" />
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

              {/* Session Select - Disabled when editing */}
              <FormField
                control={filterForm.control}
                name="session"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleSessionChange(value);
                      }}
                      value={field.value}
                      disabled={!filterForm.watch('institute')}
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

              <FormField
                control={filterForm.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || 'available'}
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
                  className="min-w-[120px] bg-supperagent text-white hover:bg-supperagent/90"
                  type="submit"
                  disabled={
                    hasSearched ||
                    (user?.role !== 'agent' && !filterForm.watch('agent')) ||
                    !filterForm.watch('courseRelationId') ||
                    !filterForm.watch('year') ||
                    !filterForm.watch('session')
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
  );
}
