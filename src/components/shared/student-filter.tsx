import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { Printer, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import Select, { MultiValue } from 'react-select';
import * as XLSX from 'xlsx';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
export default function StudentFilter({ onSubmit, total }) {
  const { user } = useSelector((state: any) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<any[]>([]);
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
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: [],
    dob: '',
    agentSearch: [],
    staffId: [],
    institute: [],
    term: [],
    academic_year_id: []
  });
  const [entriesPerPage, setEntriesPerPage] = useState(10000);

  const fetchSearchData = async () => {
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
    fetchSearchData();
  }, []);

  const fetchAllStudentsForExport = async (filters) => {
    try {
      const {
        searchTerm,
        status,
        dob,
        agentSearch,
        staffId,
        institute,
        term,
        academic_year_id
      } = filters;

      const params = {
        limit: entriesPerPage,
        ...(searchTerm ? { searchTerm } : {}),
        ...(dob ? { dob } : {}),
        ...(agentSearch ? { agentSearch } : {}),
        ...(staffId ? { staffId } : {}),
        ...(status ? { status } : {}),
        ...(institute ? { institute } : {}),
        ...(term ? { term } : {}),
        ...(academic_year_id ? { academic_year_id } : {})
      };

      // Role-based filtering
      if (user.role === 'agent' && !agent) {
        params.agent = user._id;
      }

      // Only use user.staff_id if neither staffId nor agentId is provided
      if (user.role === 'staff' && !staffId && !agent) {
        params.staffId = user._id;
        params.createdBy = user._id;
      }

      const response = await axiosInstance.get(`/students?sort=-refId`, {
        params
      });

      return response.data.data.result;
    } catch (error) {
      console.error('Error fetching students for export:', error);
      return [];
    }
  };

  const handleSubmit = async (e) => {
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
      filterData.agentSearch = selectedAgent.map((item) => item.value) || null;
      filterData.staffId = selectedStaff.map((item) => item.value) || null;
    }
    onSubmit(filterData);
  };

  const exportToExcel = async (e) => {
    e.preventDefault();

    setIsExporting(true);
    try {
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
        filterData.agentSearch =
          selectedAgent.map((item) => item.value) || null;
        filterData.staffId = selectedStaff.map((item) => item.value) || null;
      }
      const studentsForExport = await fetchAllStudentsForExport(filterData);

      const exportData = studentsForExport?.map((student) => {
        const baseFields = {
          'Reference No': student.refId || '',
          'Student Name':
            `${student?.title || ''} ${student?.firstName || ''} ${student?.lastName || ''}`.trim(),
          Email: student.email || '',
          Phone: student.phone || '',
          DOB: student.dob ? new Date(student.dob).toLocaleDateString() : '',
          'Marital Status':
            student.maritalStatus || student.maritualStatus || '',
          Gender: student.gender || '',
          Nationality: student.nationality || '',
          Residence: student.countryResidence || '',
          'Birth Country': student.countryBirth || '',
          'Native Language': student.nativeLanguage || '',
          'Passport Name': student.passportName || '',
          'Passport Country': student.passportIssueLocation || '',
          'Passport Number': student.passportNumber || '',
          'Passport Issue Date': student.passportIssueDate
            ? new Date(student.passportIssueDate).toLocaleDateString()
            : '',
          'Passport Expiry Date': student.passportExpiryDate
            ? new Date(student.passportExpiryDate).toLocaleDateString()
            : '',
          'Address Line 1': student.addressLine1 || '',
          'Address Line 2': student.addressLine2 || '',
          City: student.townCity || '',
          State: student.state || '',
          'Post Code': student.postCode || '',
          Country: student.country || '',
          Agent: student.agent?.name || '',
          Staff: Array.isArray(student.assignStaff)
            ? student.assignStaff?.map((staff) => staff?.name || '').join(', ')
            : '',
          Type: '',
          Status: ''
        };

        const courseFields = {};

        if (Array.isArray(student?.applications)) {
          const applications = student?.applications;

          applications.forEach((application, index) => {
            const courseNum = index + 1;
            courseFields[`Course ${courseNum} Institution`] =
              application.courseRelationId?.institute?.name || '';
            courseFields[`Course ${courseNum}`] =
              application.courseRelationId?.course?.name || '';
            courseFields[`Course ${courseNum} Status`] =
              application.status || '';
            courseFields[`Course ${courseNum} Terms`] =
              application.courseRelationId?.term?.term || '';
            courseFields[`Course ${courseNum} Commission`] =
              application?.amount || '';
          });

          // Populate Status and Type based on your logic
          const activeApp = applications.find((app) => app.isActive === true);
          const singleApp = applications.length === 1 ? applications[0] : null;

          if (activeApp) {
            baseFields.Status = activeApp.status || '';
            baseFields.Type = activeApp.choice || '';
          } else if (singleApp) {
            baseFields.Status = singleApp.status || '';
            baseFields.Type = singleApp.choice || '';
          }
        }

        return { ...baseFields, ...courseFields };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      XLSX.writeFile(
        wb,
        `Students_Export_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } catch (error) {
      console.error('Error during export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex w-full flex-col">
      <form
        onSubmit={handleSubmit}
        className="mb-3 grid gap-4 rounded-sm p-4 shadow-lg md:grid-cols-2 lg:grid-cols-4"
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
        <div className="flex w-full flex-col">
          <label className="mb-2 text-sm font-medium">DOB</label>
          <DatePicker
            selected={dob ? new Date(dob) : null} // parse ISO string directly
            onChange={(date: Date | null) => {
              if (date) {
                const formattedDate = `${date.getFullYear()}-${(
                  date.getMonth() + 1
                )
                  .toString()
                  .padStart(
                    2,
                    '0'
                  )}-${date.getDate().toString().padStart(2, '0')}`;
                setDob(formattedDate); // stored as YYYY-MM-DD
              } else {
                setDob('');
              }
            }}
            placeholderText="DD-MM-YYYY"
            isClearable
            showYearDropdown
            showMonthDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={100}
            className="w-full rounded-md border border-gray-300 bg-transparent px-4 py-1.5"
            dateFormat="dd-MM-yyyy"
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
            Showing{'  '}
            {total}
            &nbsp;records
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="bg-supperagent text-white hover:bg-supperagent/90"
            >
              <Search className="mr-3 h-4 w-4" /> Search
            </Button>
            <Button
              className="bg-secondary text-white hover:bg-secondary/90"
              onClick={exportToExcel}
              disabled={isExporting}
            >
              <Printer className="mr-3 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
