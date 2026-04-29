import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { StudentProfile } from '../students/view/components/student-profile';
import moment from 'moment';
import { ArrowLeft, Loader2 } from 'lucide-react'; // NEW: import Loader2
import { useSelector } from 'react-redux';
import { toast } from '@/components/ui/use-toast';

export default function CourseDetails() {
  const { id, courseid } = useParams();
  const [student, setStudent] = useState<any>();
  const [application, setApplication] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false); // NEW: loading state for save
  const { user } = useSelector((state: any) => state.auth);

  const fetchData = async () => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/students/${id}`);
      const data = response.data.data;
      setStudent(data);

      const selectedApplication = data.applications.find(
        (app) => app._id == courseid
      );
      setApplication(selectedApplication);
      setCurrentStatus(selectedApplication?.status || null);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleImageUpdate = (data) => {
    fetchData();
  };

  const handleSave = async () => {
    if (saving) return; // NEW: prevent double clicks
    try {
      setSaving(true); // NEW: start loading
      if (!application) {
        console.error('Application not found.');
        return;
      }

      const payload = {
        newStatus: currentStatus,
        changedBy: user._id,
      };

      const response = await axiosInstance.patch(
        `/students/${id}/application/${courseid}`,
        payload
      );

      fetchData();
      toast({
        title: 'Application Updated Successfully',
        className: 'bg-supperagent border-none text-white'
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        description: error.response?.data?.message || error.message || 'Student already enrolled',
        className: 'bg-destructive border-none text-white'
      });
    } finally {
      setSaving(false); // NEW: stop loading regardless of outcome
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, courseid]);

  const handleStatusChange = (status) => {
    setCurrentStatus(status);
  };

  return (
    <div>
      <header className="flex items-center justify-between px-6 py-3">
        <h1 className="text-2xl font-semibold"></h1>
        <div className="flex items-center gap-2">
          <Link to={`/admin/students/${id}`}>
            <Button
              variant="outline"
              size="sm"
              className="border-none bg-supperagent hover:bg-supperagent/90"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
          </Link>
        </div>
      </header>
      <StudentProfile student={student} onImageUpdate={handleImageUpdate} />

      <div className="mt-4 grid gap-6 space-y-4 rounded-md bg-white p-4 shadow-md">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Institution</Label>
            <p className="text-sm ">
              {application?.courseRelationId?.institute?.name}
            </p>
          </div>
          <div>
            <Label>Course</Label>
            <p className="text-sm">
              {application?.courseRelationId?.course?.name}
            </p>
          </div>
          <div>
            <Label>Amount</Label>
            <p className="text-sm">{application?.amount}</p>
          </div>
          <div>
            <Label>Term</Label>
            <p className="text-sm">
              {application?.courseRelationId?.term?.term}
            </p>
          </div>
          <div>
            <Label>Change Status</Label>
            <Select value={currentStatus} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Waiting LCC Approval">
                  Waiting LCC Approval
                </SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Application Made">
                  Application Made
                </SelectItem>
                <SelectItem value="Offer Made">Offer Made</SelectItem>
                <SelectItem value="Enrolled">Enrolled</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Hold">Hold</SelectItem>
                <SelectItem value="App made to LCC">App made to LCC</SelectItem>
                <SelectItem value="Deregister">Deregister</SelectItem>
                <SelectItem value="SLC Course Completed">
                  SLC Course Completed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* UPDATED: Button now shows loading state and is disabled */}
          {currentStatus !== application?.status && (
            <div className="mt-6">
              <Button
                onClick={handleSave}
                disabled={saving} // disabled while saving
                className="bg-supperagent text-white hover:bg-supperagent"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold">Status Changed Archive</h3>
          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prev Status</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>Assigned At</TableHead>
                  <TableHead>Changed To</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Changed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {application?.statusLogs.map((change) => (
                  <TableRow key={change?._id}>
                    <TableCell>{change?.prev_status || '---'}</TableCell>
                    <TableCell>{change?.assigned_by?.name || '---'}</TableCell>
                    <TableCell>
                      {change.assigned_at &&
                      moment(change.assigned_at).isValid()
                        ? moment(change.assigned_at).format('MM-DD-YYYY')
                        : '---'}
                    </TableCell>
                    <TableCell>{change?.changed_to}</TableCell>
                    <TableCell>{change?.changed_by?.name}</TableCell>
                    <TableCell>
                      {change.created_at && moment(change.created_at).isValid()
                        ? moment(change.created_at).format('MM-DD-YYYY')
                        : '---'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}