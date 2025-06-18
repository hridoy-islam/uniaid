import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertCircle, Loader2, RefreshCcw } from 'lucide-react';
import Papa from 'papaparse';
import axiosInstance from '@/lib/axios';
import moment from 'moment';
import { BlinkingDots } from '@/components/shared/blinking-dots';

interface CSVRow {
  'Reg No': string;
  Name: string;
  Mobile: string;
  Email?: string; // Added email field to CSV structure
}

interface StudentData {
  _id: string;
  title?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob?: string;
  refId: string;
}

interface ProcessedRow {
  id: string;
  originalId?: string;
  csvData: CSVRow;
  studentData?: StudentData;
  error?: string;
  status:
    | 'pending'
    | 'found'
    | 'error'
    | 'processing'
    | 'completed'
    | 'duplicate';
  isDuplicate?: boolean;
  duplicateWith?: string;
  duplicateType?: 'phone' | 'email' | 'both';
}

export default function BulkRollPage() {
  const [csvData, setCsvData] = useState<ProcessedRow[]>([]);
  const [parentCsvId, setParentCsvId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [hasActiveUpload, setHasActiveUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const[count, setCount] =useState(0);

const counter = () => {
    setCount(prev => prev + 1);
  };

  const fetchCsvFromDatabase = async () => {
    try {
      const response = await axiosInstance.get('/csv');
      const result = response.data?.data?.result || [];
      if (result.length === 0) {
        setHasActiveUpload(false);
        return;
      }

      const csvDocument = result[0];
      setParentCsvId(csvDocument._id);
      const studentList = csvDocument?.studentData || [];

      // Track duplicates by phone and email
      const phoneMap = new Map<string, number>();
      const emailMap = new Map<string, number>();

      // First pass to count occurrences
      studentList.forEach((item: any) => {
        phoneMap.set(item.phone, (phoneMap.get(item.phone) || 0) + 1);
        if (item.email) {
          emailMap.set(item.email, (emailMap.get(item.email) || 0) + 1);
        }
      });

      const processed: ProcessedRow[] = studentList.map((item: any) => {
        const isPhoneDuplicate = phoneMap.get(item.phone) > 1;
        const isEmailDuplicate = item.email && emailMap.get(item.email) > 1;

        return {
          id: item._id,
          originalId: item._id,
          csvData: {
            'Reg No': item.regNo,
            Name: item.name,
            Mobile: item.phone
          },
          status:
            isPhoneDuplicate || isEmailDuplicate ? 'duplicate' : 'pending',
          error:
            isPhoneDuplicate || isEmailDuplicate
              ? 'Duplicate student detected based on phone or email'
              : undefined
        };
      });

      setCsvData(processed);
      setHasActiveUpload(true);
      setIsProcessing(true);

      const updatedRows = [...processed];
      for (let i = 0; i < updatedRows.length; i++) {
        const row = updatedRows[i];

        try {
          row.status = 'processing';
          setCsvData([...updatedRows]);

          // const studentData = await fetchStudentData(row.csvData.Mobile);
          // if (studentData) {
          //   row.studentData = studentData;
          //   row.status = 'found';
          // } else  {
          //   row.status = 'error';
          //   row.error = 'Student data not found in the provided CSV';
          // }

          const studentData = await fetchStudentData(row.csvData.Mobile);
          if (studentData) {
            // Re-check for duplicate using phone/email from CSV
            const isPhoneDuplicate = phoneMap.get(row.csvData.Mobile) > 1;
            const email = studentData.email;
            const isEmailDuplicate =email &&  emailMap.get(email) > 1;

            if (isPhoneDuplicate || isEmailDuplicate) {
              row.studentData = studentData;
              row.status = 'duplicate';
              row.error = 'Duplicate student detected based on phone or email';
            } else {
              row.studentData = studentData;
              row.status = 'found';
            }
          } else {
            row.status = 'error';
            row.error = 'Student data not found in the provided CSV';
          }
        } catch (error) {
          row.status = 'error';
          row.error = 'Error fetching student data';
        }

        setCsvData([...updatedRows]);
      }
    } catch (error) {
      console.error('Failed to fetch CSV:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchStudentData = async (
    mobile: string
  ): Promise<StudentData | null> => {
    try {
      const response = await axiosInstance.get(
        `/students?fields=firstName,lastName,email,phone,refId,title,dob&limit=all`,
        {
          params: { searchTerm: mobile }
        }
      );
      const students = response.data.data.result;
      return students?.find((s: StudentData) => s.phone === mobile) || null;
    } catch (error) {
      console.error('Error fetching student:', error);
      return null;
    }
  };

  const saveCsvToDatabase = async (csvRows: ProcessedRow[]) => {
    try {
      const response = await axiosInstance.post('/csv', {
        studentData: csvRows.map((row) => ({
          regNo: row.csvData['Reg No'],
          name: row.csvData['Name'],
          phone: row.csvData['Mobile'],
          email: row.csvData['Email'] || '',
          tempId: row.id // Save temporary client-generated ID
        }))
      });

      // Update the parent CSV ID
      const newParentCsvId = response.data.data._id;
      setParentCsvId(newParentCsvId);

      // Update the csvData with the actual MongoDB IDs from the response
      const savedStudentData = response.data.data.studentData || [];
      setCsvData((prevData) =>
        prevData.map((row) => {
          // Find the corresponding saved student by matching tempId
          const savedStudent = savedStudentData.find(
            (saved: any) => saved.tempId === row.id
          );
          if (savedStudent) {
            return {
              ...row,
              originalId: savedStudent._id // Set the actual MongoDB ID
            };
          }
          return row;
        })
      );

      return newParentCsvId;
    } catch (error) {
      console.error('Error saving CSV:', error);
      throw error;
    }
  };

  const removeFromCsvDatabase = async (csvId: string, row: ProcessedRow) => {
    try {
      // Use originalId if available (for rows fetched from DB), otherwise use the tempId approach
      const studentIdToRemove = row.originalId || row.id;

      // If we don't have originalId, we need to find the student by tempId
      const patchData = row.originalId
        ? { studentId: studentIdToRemove }
        : { tempId: row.id }; // Use tempId to identify the student to remove

      const patchResponse = await axiosInstance.patch(
        `/csv/${csvId}`,
        patchData
      );

      if (!patchResponse.data.success) {
        throw new Error(
          patchResponse.data.message || 'Failed to remove student'
        );
      }

      const isLastStudent = csvData.length === 1;
      let documentDeleted = false;

      if (isLastStudent) {
        const deleteResponse = await axiosInstance.delete(`/csv/${csvId}`);
        if (!deleteResponse.data.success) {
          throw new Error(
            deleteResponse.data.message || 'Failed to delete document'
          );
        }
        documentDeleted = true;
      }

      return { ...patchResponse.data, documentDeleted };
    } catch (error) {
      console.error('Error removing from CSV:', error);
      throw error;
    }
  };

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (hasActiveUpload) {
        setUploadError(
          'Please complete or clear the current upload before uploading a new file.'
        );
        return;
      }

      setIsUploading(true);
      setUploadError('');

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const csvRows = results.data as CSVRow[];
            if (csvRows.length === 0) {
              setUploadError('CSV file is empty.');
              setIsUploading(false);
              return;
            }

            const requiredColumns = ['Reg No', 'Name', 'Mobile'];
            const headers = Object.keys(csvRows[0]);
            const missingColumns = requiredColumns.filter(
              (col) => !headers.includes(col)
            );
            if (missingColumns.length > 0) {
              setUploadError(
                `Missing required columns: ${missingColumns.join(', ')}`
              );
              setIsUploading(false);
              return;
            }

            const processedRows: ProcessedRow[] = csvRows.map((row, index) => ({
              id: `csv_${Date.now()}_${index}`,
              csvData: row,
              status: 'pending'
            }));

            setCsvData(processedRows);
            setHasActiveUpload(true);

            // Save to database and update the state with actual IDs
            await saveCsvToDatabase(processedRows);

            // Process student data after saving
            await processStudentData(processedRows);
          } catch (error) {
            console.error('Error processing CSV:', error);
            setUploadError('Error processing CSV file. Please try again.');
          } finally {
            setIsUploading(false);
          }
        },
        error: (error) => {
          console.error('Papa Parse error:', error);
          setUploadError(
            'Error parsing CSV file. Please check the file format.'
          );
          setIsUploading(false);
        }
      });
    },
    [hasActiveUpload]
  );

  const processStudentData = async (rows: ProcessedRow[]) => {
    setIsProcessing(true);
    const updatedRows = [...rows];

    // First check for phone duplicates in the CSV
    const phoneToRows: Record<string, ProcessedRow[]> = {};

    // Build map of phone to rows
    updatedRows.forEach((row) => {
      const phone = row.csvData.Mobile.trim();
      if (!phoneToRows[phone]) {
        phoneToRows[phone] = [];
      }
      phoneToRows[phone].push(row);
    });

    // Mark phone duplicates in CSV and check if emails also match
    updatedRows.forEach((row) => {
      const phone = row.csvData.Mobile.trim();
      const phoneDuplicates = phoneToRows[phone] || [];

      // Check if this row is a phone duplicate (not the first occurrence)
      const isPhoneDuplicate =
        phoneDuplicates.length > 1 && phoneDuplicates[0].id !== row.id;

      if (isPhoneDuplicate) {
        // Now check if emails also match
        const email = row.csvData.Email
          ? row.csvData.Email.trim().toLowerCase()
          : '';
        const firstDuplicateEmail = phoneDuplicates[0].csvData.Email
          ? phoneDuplicates[0].csvData.Email.trim().toLowerCase()
          : '';

        row.isDuplicate = true;
        row.status = 'error';

        if (email && firstDuplicateEmail && email === firstDuplicateEmail) {
          // Both phone and email match
          row.duplicateType = 'both';
          row.error = `Duplicate phone (${phone}) and email (${email}) in CSV`;
        } else {
          // Only phone matches
          row.duplicateType = 'phone';
          row.error = `Duplicate phone number in CSV: ${phone}`;
        }
      }
    });

    // Then check for email duplicates (only for rows not already marked as phone duplicates)
    const emailToRows: Record<string, ProcessedRow[]> = {};

    updatedRows
      .filter((row) => !row.isDuplicate)
      .forEach((row) => {
        if (row.csvData.Email && row.csvData.Email.trim()) {
          const email = row.csvData.Email.trim().toLowerCase();
          if (!emailToRows[email]) {
            emailToRows[email] = [];
          }
          emailToRows[email].push(row);
        }
      });

    // Mark email duplicates in CSV
    updatedRows.forEach((row) => {
      if (row.isDuplicate) return; // Skip already marked duplicates

      const email = row.csvData.Email
        ? row.csvData.Email.trim().toLowerCase()
        : '';
      if (!email) return; // Skip if no email

      const emailDuplicates = emailToRows[email] || [];
      const isEmailDuplicate =
        emailDuplicates.length > 1 && emailDuplicates[0].id !== row.id;

      if (isEmailDuplicate) {
        row.isDuplicate = true;
        row.duplicateType = 'email';
        row.status = 'error';
        row.error = `Duplicate email in CSV: ${email}`;
      }
    });

    // Now check against database
    try {
      // Get all unique mobile numbers and emails from non-duplicate rows
      const mobilesToCheck = updatedRows
        .filter((row) => !row.isDuplicate)
        .map((row) => row.csvData.Mobile);

      const emailsToCheck = updatedRows
        .filter(
          (row) =>
            !row.isDuplicate && row.csvData.Email && row.csvData.Email.trim()
        )
        .map((row) => row.csvData.Email!.trim());

      if (mobilesToCheck.length > 0 || emailsToCheck.length > 0) {
        // Search by phone numbers
        let phoneResults: StudentData[] = [];
        if (mobilesToCheck.length > 0) {
          const phoneResponse = await axiosInstance.get(
            `/students?fields=firstName,lastName,email,phone,refId,title,dob&limit=all`,
            {
              params: {
                searchTerm: mobilesToCheck.join(','),
                searchFields: 'phone'
              }
            }
          );
          phoneResults = phoneResponse.data.data.result || [];
        }

        // Search by email addresses
        let emailResults: StudentData[] = [];
        if (emailsToCheck.length > 0) {
          const emailResponse = await axiosInstance.get(
            `/students?fields=firstName,lastName,email,phone,refId,title,dob&limit=all`,
            {
              params: {
                searchTerm: emailsToCheck.join(','),
                searchFields: 'email'
              }
            }
          );
          emailResults = emailResponse.data.data.result || [];
        }

        // Combine and deduplicate results
        const allStudents = [...phoneResults];
        emailResults.forEach((emailStudent) => {
          if (!allStudents.find((s) => s._id === emailStudent._id)) {
            allStudents.push(emailStudent);
          }
        });

        // Create maps for quick lookup
        const phoneToStudents: Record<string, StudentData[]> = {};
        const emailToStudents: Record<string, StudentData[]> = {};

        allStudents.forEach((student: StudentData) => {
          // Group by phone
          if (!phoneToStudents[student.phone]) {
            phoneToStudents[student.phone] = [];
          }
          phoneToStudents[student.phone].push(student);

          // Group by email
          const studentEmail = student.email.toLowerCase();
          if (!emailToStudents[studentEmail]) {
            emailToStudents[studentEmail] = [];
          }
          emailToStudents[studentEmail].push(student);
        });

        // Process each row
        for (const row of updatedRows) {
          if (row.isDuplicate) continue; // Skip already marked duplicates

          try {
            row.status = 'processing';
            setCsvData([...updatedRows]);

            const phoneMatches = phoneToStudents[row.csvData.Mobile] || [];
            const emailMatches =
              row.csvData.Email && row.csvData.Email.trim()
                ? emailToStudents[row.csvData.Email.trim().toLowerCase()] || []
                : [];

            // Check for duplicates by phone first
            if (phoneMatches.length > 1) {
              // Multiple phone matches - check if any email also matches
              if (row.csvData.Email && emailMatches.length > 0) {
                // Both phone and email have matches
                row.status = 'error';
                row.error = `Duplicate in database: ${phoneMatches.length} students with phone ${row.csvData.Mobile} and email also matches`;
                row.isDuplicate = true;
                row.duplicateType = 'both';
              } else {
                // Only phone has multiple matches
                row.status = 'error';
                row.error = `Duplicate in database: ${phoneMatches.length} students with phone ${row.csvData.Mobile}`;
                row.isDuplicate = true;
                row.duplicateType = 'phone';
              }
            } else if (emailMatches.length > 1) {
              // Multiple email matches
              row.status = 'error';
              row.error = `Duplicate in database: ${emailMatches.length} students with email ${row.csvData.Email}`;
              row.isDuplicate = true;
              row.duplicateType = 'email';
            } else if (phoneMatches.length === 1) {
              // Single phone match - check if email also matches the same student
              const phoneStudent = phoneMatches[0];
              if (row.csvData.Email && emailMatches.length === 1) {
                const emailStudent = emailMatches[0];
                if (phoneStudent._id === emailStudent._id) {
                  // Same student found by both phone and email
                  row.studentData = phoneStudent;
                  row.status = 'found';
                } else {
                  // Different students found by phone and email
                  row.status = 'error';
                  row.error = 'Phone and email belong to different students';
                  row.isDuplicate = true;
                  row.duplicateType = 'both';
                }
              } else {
                // Only phone match, no email to check
                row.studentData = phoneStudent;
                row.status = 'found';
              }
            } else if (emailMatches.length === 1) {
              // Only email match, no phone match
              row.studentData = emailMatches[0];
              row.status = 'found';
            } else {
              // No matches found
              row.status = 'error';
              row.error = 'Student not found in database';
            }
          } catch (error) {
            row.status = 'error';
            row.error = 'Error checking student data';
          }
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      updatedRows.forEach((row) => {
        if (row.status === 'processing') {
          row.status = 'error';
          row.error = 'Error fetching student data';
        }
      });
    } finally {
      setCsvData([...updatedRows]);
      setIsProcessing(false);
    }
  };

  const handleApproveStudent = async (row: ProcessedRow) => {
    if (!row.studentData) return;

    try {
      setCsvData((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: 'processing' } : r))
      );

      await axiosInstance.patch(`/students/${row.studentData._id}`, {
        collegeRoll: row.csvData['Reg No']
      });

      const isLastStudent = csvData.length === 1;
      const result = await removeFromCsvDatabase(parentCsvId, row);
      setCsvData((prev) => prev.filter((r) => r.id !== row.id));

      if (isLastStudent || result.documentDeleted) {
        setHasActiveUpload(false);
        setParentCsvId('');
      }
    } catch (error: any) {
      console.error('Error approving student:', error);
      setCsvData((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                status: 'error',
                error:
                  error.response?.data?.message ||
                  error.message ||
                  'Failed to approve'
              }
            : r
        )
      );
    }
  };

  const handleRejectStudent = async (row: ProcessedRow) => {
    try {
      setCsvData((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: 'processing' } : r))
      );

      const isLastStudent = csvData.length === 1;
      const result = await removeFromCsvDatabase(parentCsvId, row);
      setCsvData((prev) => prev.filter((r) => r.id !== row.id));

      if (isLastStudent || result.documentDeleted) {
        setHasActiveUpload(false);
        setParentCsvId('');
      }
    } catch (error: any) {
      console.error('Error rejecting student:', error);
      setCsvData((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                status: 'error',
                error:
                  error.response?.data?.message ||
                  error.message ||
                  'Failed to reject'
              }
            : r
        )
      );
    }
  };

  
  useEffect(() => {
    fetchCsvFromDatabase();
  }, [hasActiveUpload,count]);

  const handleRollInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    rowId: string
  ) => {
    const newRollNumber = e.target.value;
    setCsvData((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              csvData: {
                ...row.csvData,
                'Reg No': newRollNumber
              }
            }
          : row
      )
    );
  };

  const getStatusBadge = (status: ProcessedRow['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case 'found':
        return <Badge variant="default">Found</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      default:
        return null;
    }
  };

  const getRowClassName = (row: ProcessedRow) => {
    if (row.status === 'duplicate') {
      return 'bg-green-50 border-red-200'; // Prioritize duplicate styling
    } else if (row.status === 'error') {
      return 'bg-red-50 border-yellow-200'; // Fallback to error
    }
    return '';
  };

  const getDuplicateBadge = (row: ProcessedRow) => {
    if (!row.isDuplicate) return null;

    let badgeText = 'Duplicate';
    let badgeColor = 'destructive';

    if (row.duplicateType) {
      switch (row.duplicateType) {
        case 'phone':
          badgeText = 'Duplicate Phone';
          break;
        case 'email':
          badgeText = 'Duplicate Email';
          break;
        case 'both':
          badgeText = 'Duplicate Phone & Email';
          break;
      }
    }

    return (
      <Badge variant={badgeColor} className="mt-1 text-xs">
        {badgeText}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {!hasActiveUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Student Roll Assignment</CardTitle>
            <CardDescription>
              Upload a CSV file with student registration numbers, mobile
              numbers, and optionally email addresses to assign college rolls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-row items-center justify-start gap-8">
                <div>
                  <Label htmlFor="csv-upload">Upload CSV File</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isUploading || hasActiveUpload}
                    ref={fileInputRef}
                    className="mt-1"
                  />
                  {hasActiveUpload && (
                    <p className="mt-1 text-sm text-amber-600">
                      Complete or clear current upload before uploading a new
                      file.
                    </p>
                  )}
                </div>
                <div>
                  <a
                    href="/sample.csv"
                    className="mt-7 inline-flex items-center rounded bg-supperagent px-4 py-2 text-sm font-medium text-white transition hover:bg-supperagent/90"
                  >
                    Download Sample CSV
                  </a>
                </div>
              </div>

              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {isUploading && (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading and processing CSV...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {csvData.length > 0 && (
        <Card>
          <CardHeader>
            <div className='flex flex-row items-center justify-between'>
              <div>
 <CardTitle>Student Data Processing</CardTitle>
            <CardDescription>Review and approve student data.</CardDescription>
              </div>
              <div>
             
                <Button onClick={counter} className='bg-supperagent text-white hover:bg-supperagent/90 flex flex-row gap-2'>   <RefreshCcw/>Refresh</Button>
              </div>
            </div>
           
          </CardHeader>
          <CardContent>
            {isProcessing ? (
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-600">
                <BlinkingDots size="large" color="bg-supperagent" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>College Roll</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.map((row) => (
                      <TableRow key={row.id} className={getRowClassName(row)}>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(row.status)}
                            {row.error && (
                              <p className="text-xs text-red-600">
                                {row.error}
                              </p>
                            )}

                            {getDuplicateBadge(row)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {' '}
                          {row.studentData?.refId || (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.studentData ? (
                            <div>
                              {row.studentData.title && (
                                <span className="text-sm text-gray-500">
                                  {row.studentData.title}{' '}
                                </span>
                              )}
                              {row.studentData.firstName}{' '}
                              {row.studentData.lastName}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.studentData?.email || (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.studentData?.dob ? (
                            moment(row.studentData.dob).format('DD-MM-YYYY')
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.studentData?.phone || row.csvData.Mobile}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.csvData['Reg No']}
                            onChange={(e) => handleRollInputChange(e, row.id)}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {row.status === 'found' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApproveStudent(row)}
                                disabled={row.status === 'processing'}
                              >
                                {row.status === 'processing' ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectStudent(row)}
                              disabled={row.status === 'processing'}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
