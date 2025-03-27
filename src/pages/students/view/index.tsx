import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Printer, Plus, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentProfile } from './components/student-profile';
import { PersonalDetailsForm } from './components/personal-details-form';
import { AcademicRecords } from './components/academic-records';
import { WorkExperienceSection } from './components/work-experience';
import { ApplicationsSection } from './components/application-section';
import { EmergencyContacts } from './components/emergency-contacts';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../../../lib/axios';
import { DocumentsSection } from './components/documents-section';
import { SendEmailComponent } from './components/send-email-component';
import { NotesPage } from './components/notes';
import { AssignStaff } from './components/assign-staff';
import { useToast } from '@/components/ui/use-toast';
import AccountPage from './components/account';
import {
  isStudentDataComplete,
  isPersonalInfoComplete,
  isAcademicInfoComplete,
  isWorkExperienceComplete
} from '@/lib/utils';
import { useSelector } from 'react-redux';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import AgentPaymentPage from './components/agentPayment';

export default function StudentViewPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth) || {};
  const [student, setStudent] = useState<any>();

  const [initialLoading, setInitialLoading] = useState(true); // New state for initial loading
  const [hasRequiredDocuments, setHasRequiredDocuments] = useState(false);
  // const isComplete = isStudentDataComplete(student, hasRequiredDocuments);
  // const isPersonalComplete = isPersonalInfoComplete(student); // Check personal info completion
  // const isAcademicComplete = isAcademicInfoComplete(student); // check education is complete

  const isPersonalComplete = useMemo(
    () => isPersonalInfoComplete(student),
    [student]
  );
  const isAcademicComplete = useMemo(
    () => isAcademicInfoComplete(student),
    [student]
  );
  const isWorkExperience = useMemo(
    () => isWorkExperienceComplete(student),
    [student]
  );

  const isComplete = useMemo(
    () => isStudentDataComplete(student, hasRequiredDocuments), // Include hasRequiredDocuments in the isComplete check
    [student, hasRequiredDocuments]
  );

  // Fetch student and documents data
  const fetchAllData = async () => {
    try {
      // Fetch student data
      const studentResponse = await axiosInstance.get(`/students/${id}`);
      setStudent(studentResponse.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch student data.',
        variant: 'destructive'
      });
    } finally {
      setInitialLoading(false); // Disable initial loading after the first fetch
    }
  };

  useEffect(() => {
    if (student) {
      const requiredDocuments = ['work experience', 'qualification'];
      const hasDocuments = requiredDocuments.some((type) =>
        student.documents.some((doc) => doc.file_type === type)
      );

      setHasRequiredDocuments(hasDocuments || student?.noDocuments);
    }
  }, [student]);

  const handleSave = async (data) => {
    const updatedData = { ...data };

    // Remove agent field if it's empty or null
    if (!updatedData.agent) {
      delete updatedData.agent;
    }

    await axiosInstance.patch(`/students/${id}`, updatedData);
    await fetchAllData(); // Refetch data after saving
    toast({
      title: 'Student updated successfully',
      className: 'bg-supperagent border-none text-white'
    });
  };

  useEffect(() => {
    fetchAllData();
  }, [id]);

  const activeTabClass =
    'data-[state=active]:bg-supperagent data-[state=active]:text-white';

  // Define tabs dynamically
  const tabs = [
    {
      value: 'personal',
      label: 'Personal Details',
      showIcon: !isPersonalComplete
    },
    { value: 'education', label: 'Education', showIcon: !isAcademicComplete },
    { value: 'work', label: 'Work Details', showIcon: !isWorkExperience },
    { value: 'documents', label: 'Documents', showIcon: !hasRequiredDocuments }
  ];

  // Check if the user is an agent
  const isAgent = user?.role === 'agent';
  const isStaff = user?.role === 'staff';
  const isAdmin = user?.role === 'admin';

  // Add conditional tabs when `isComplete` is true
  if (isComplete) {
    tabs.push({ value: 'application', label: 'Application' });

    if (isAdmin) {
      // Admin sees all tabs
      tabs.push(
        { value: 'notes', label: 'Notes' },
        { value: 'staff', label: 'Assigned Staffs' },
        { value: 'communications', label: 'Communications' },
        { value: 'account', label: 'Account' },
        { value: 'agentPayment', label: 'Agent Payment' },
      );
    } else if (isStaff) {
      // Staff sees tabs based on privileges
      if (user.privileges?.student?.notes) {
        tabs.push({ value: 'notes', label: 'Notes' });
      }
      if (user.privileges?.student?.assignStaff) {
        tabs.push({ value: 'staff', label: 'Assigned Staffs' });
      }
      if (user.privileges?.student?.communication) {
        tabs.push({ value: 'communications', label: 'Communications' });
      }
      if (user.privileges?.student?.account) {
        tabs.push({ value: 'account', label: 'Account' });
      }
    } else if (isAgent) {
      // Agents see only what’s relevant to them (if anything)
      // tabs.push({ value: 'application', label: 'Application' });
    }
  }

  if (initialLoading) {
    return (
      <div className="flex justify-center py-6">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-3">
        <h1 className="text-2xl font-semibold">View Student</h1>
        <div className="flex items-center gap-2">
          <Link to={'/admin/students'}>
            <Button
              variant="outline"
              size="sm"
              className="border-none bg-supperagent hover:bg-supperagent/90"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Link to="/admin/students/new">
            <Button
              size="sm"
              variant="outline"
              className="border-none bg-supperagent hover:bg-supperagent/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </Link>
        </div>
      </header>

      <StudentProfile student={student} fetchStudent={fetchAllData} />

      <Tabs defaultValue="personal" className="mt-1 px-2">
        <TabsList>
          {tabs.map(({ value, label, showIcon }) => (
            <TabsTrigger key={value} value={value} className={activeTabClass}>
              {showIcon && <XCircle className="mr-2 h-4 w-4 text-red-600" />}
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="personal">
          <PersonalDetailsForm student={student} onSave={handleSave} />
          {/* <AddressForm student={student} onSave={handleSave} /> */}
          {/* <PersonalInfoForm student={student} onSave={handleSave} /> */}
          <EmergencyContacts student={student} onSave={handleSave} />
        </TabsContent>

        <TabsContent value="education">
          <AcademicRecords student={student} onSave={handleSave} />
        </TabsContent>
        <TabsContent value="work">
          <WorkExperienceSection student={student} onSave={handleSave} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsSection
            student={student}
            fetchDocuments={fetchAllData}
            onSave={handleSave}
          />
        </TabsContent>
        {isComplete && (
          <>
            <TabsContent value="application">
              <ApplicationsSection student={student} onSave={handleSave} />
            </TabsContent>

            <TabsContent value="staff">
              <AssignStaff student={student} onSave={handleSave} />
            </TabsContent>

            <TabsContent value="notes">
              <NotesPage />
            </TabsContent>

            <TabsContent value="communications">
              <SendEmailComponent student={student} />
            </TabsContent>

            <TabsContent value="account">
              <AccountPage student={student} />
            </TabsContent>
            <TabsContent value="agentPayment">
              <AgentPaymentPage student={student}  />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
