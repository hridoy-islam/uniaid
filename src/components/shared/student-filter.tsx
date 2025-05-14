import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { Printer, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import axiosInstance from '../../lib/axios';
import { useSelector } from 'react-redux';
import Select, { MultiValue } from 'react-select';

export default function StudentFilter({
  onSubmit,
  currentPage,
  totalPages,
  total
}) {
  const { user } = useSelector((state: any) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<any[]>([]); // Changed from null to empty array
  const [institutes, setInstitutes] = useState<any>([]);
  const [terms, setTerms] = useState<any>([]);
  const [academicYear, setAcademicYear] = useState<any>([]);
  const [agents, setAgents] = useState<any>([]);
  const [staffs, setStaffs] = useState<any>([]);
  const [dob, setDob] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<any[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<any[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [
        instituteResponse,
        termsResponse,
        academicYearResponse,
        agentResponse,
        staffResponse
      ] = await Promise.all([
        axiosInstance.get('/institutions?limit=all&status=1'),
        axiosInstance.get('/terms?limit=all&status=1'),
        axiosInstance.get('/academic-years?limit=all&status=1'),
        axiosInstance.get('/users?role=agent&status=1&limit=all'),
        axiosInstance.get('/users?role=staff&status=1&limit=all')
      ]);
      setInstitutes(instituteResponse.data.data.result);
      setTerms(termsResponse.data.data.result);
      setAcademicYear(academicYearResponse.data.data.result);
      setAgents(agentResponse.data.data.result);
      setStaffs(staffResponse.data.data.result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const filterData = {
      searchTerm,
      status: status.length > 0 ? status : null,
      dob,
      institute: selectedInstitute.map((item) => item.value) || null,
      term: selectedTerm.map((item) => item.value) || null,
      academic_year_id: selectedAcademicYear.map((item) => item.value) || null
    };
    if (user.role === 'agent') {
      filterData.agent = user.agent_id;
    } else {
      filterData.agent = selectedAgent.map((item) => item.value) || null;
      filterData.staffId = selectedStaff.map((item) => item.value) || null;
    }
    onSubmit(filterData);
  };

  return (
    <div className="flex w-full flex-col">
      <form
        onSubmit={handleSubmit}
        className="mb-3 grid gap-4 rounded-md p-4 shadow-2xl md:grid-cols-2 lg:grid-cols-4"
      >
        {/* Search Input */}
        <div>
          <label className="mb-2 block text-sm font-medium">Search</label>
          <Input
            placeholder="Ref No, Name, Email, Phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* DOB Input */}
        <div>
          <label className="mb-2 block text-sm font-medium">DOB</label>
          <Input
            placeholder="DOB"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>

        {/* Academic Year Multi-Select */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Academic Year
          </label>
          <Select
            isMulti
            options={academicYear.map((year) => ({
              value: year._id,
              label: year.academic_year
            }))}
            placeholder="Select Academic Year"
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={(
              selectedOptions: MultiValue<{ value: string; label: string }>
            ) => {
              setSelectedAcademicYear(selectedOptions as any);
            }}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Select Terms</label>
          <Select
            isMulti
            options={terms.map((item) => ({
              value: item._id,
              label: item.term
            }))}
            placeholder="Select Term"
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={(
              selectedOptions: MultiValue<{ value: string; label: string }>
            ) => {
              setSelectedTerm(selectedOptions as any);
            }}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Institute</label>
          <Select
            isMulti
            options={institutes.map((item) => ({
              value: item._id,
              label: item.name
            }))}
            placeholder="Select Institute"
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={(
              selectedOptions: MultiValue<{ value: string; label: string }>
            ) => {
              setSelectedInstitute(selectedOptions as any);
            }}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Status</label>
          <Select
            isMulti
            options={[
              { value: 'Waiting LCC Approval', label: 'Waiting LCC Approval' },
              { value: 'New', label: 'New' },
              { value: 'Processing', label: 'Processing' },
              { value: 'Application Made', label: 'Application Made' },
              { value: 'Offer Made', label: 'Offer Made' },
              { value: 'Enrolled', label: 'Enrolled' },
              { value: 'Rejected', label: 'Rejected' },
              { value: 'Hold', label: 'Hold' },
              { value: 'App made to LCC', label: 'App made to LCC' },
              { value: 'Deregister', label: 'Deregister' },
              { value: 'SLC Course Completed', label: 'SLC Course Completed' }
            ]}
            placeholder="Select Status"
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={(selectedOptions) =>
              setStatus(
                selectedOptions ? selectedOptions.map((opt) => opt.value) : []
              )
            }
            value={status.map((s: string) => ({ value: s, label: s }))}
            isClearable
          />
        </div>

        {/* Agent Multi-Select */}
        {(user.role === 'admin' || user.privileges?.student?.search?.agent) && (
          <div>
            <label className="mb-2 block text-sm font-medium">Agent</label>
            <Select
              isMulti
              options={agents.map((item) => ({
                value: item._id,
                label: item.name
              }))}
              placeholder="Select Agent"
              className="basic-multi-select"
              classNamePrefix="select"
              onChange={(
                selectedOptions: MultiValue<{ value: string; label: string }>
              ) => {
                setSelectedAgent(selectedOptions as any);
              }}
            />
          </div>
        )}

        {/* Staff Multi-Select */}
        {(user.role === 'admin' || user.privileges?.student?.search?.staff) && (
          <div>
            <label className="mb-2 block text-sm font-medium">Staffs</label>
            <Select
              isMulti
              options={staffs.map((item) => ({
                value: item._id,
                label: item.name
              }))}
              placeholder="Select Staff"
              className="basic-multi-select"
              classNamePrefix="select"
              onChange={(
                selectedOptions: MultiValue<{ value: string; label: string }>
              ) => {
                setSelectedStaff(selectedOptions as any);
              }}
            />
          </div>
        )}

        <div className="col-span-full flex justify-between gap-4">
          <div className="flex flex-row items-center text-sm text-gray-700">
            Showing&nbsp;
            <span className="font-semibold text-gray-900">{currentPage}</span>
            &nbsp;of&nbsp;
            <span className="font-semibold text-gray-900">{totalPages}</span>
            &nbsp;pages&nbsp;(
            <span className="font-medium text-gray-800">{total}</span>
            &nbsp;records)
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="bg-supperagent text-white hover:bg-supperagent/90"
            >
              <Search className="mr-3 h-4 w-4" /> Search
            </Button>
            <Button className="bg-secondary text-white hover:bg-secondary/90">
              <Printer className="mr-3 h-4 w-4" /> Export
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
