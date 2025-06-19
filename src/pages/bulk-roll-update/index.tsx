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
  Email?: string;
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
  const [count, setCount] = useState(0);

  const counter = () => {
    setCount((prev) => prev + 1);
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
            Mobile: item.phone,
            Email: item.email || ''
          },
          studentData: item.studentId ? {
            _id: item.studentId._id,
            title: item.studentId.title,
            firstName: item.studentId.firstName,
            lastName: item.studentId.lastName,
            email: item.studentId.email,
            phone: item.studentId.phone,
            dob: item.studentId.dob,
            refId: item.studentId.refId
          } : undefined,
          status:
            isPhoneDuplicate || isEmailDuplicate
              ? 'duplicate'
              : item.studentId
                ? 'found'
                : 'error',
          error:
            isPhoneDuplicate || isEmailDuplicate
              ? 'Duplicate Found'
              : !item.studentId
                ? 'Student data not found'
                : undefined
        };
      });

      setCsvData(processed);
      setHasActiveUpload(true);
    } catch (error) {
      console.error('Failed to fetch CSV:', error);
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
          tempId: row.id
        }))
      });
      setParentCsvId(response.data.data._id);
      const savedStudentData = response.data.data.studentData || [];
      setCsvData((prevData) =>
        prevData.map((row) => {
          const savedStudent = savedStudentData.find(
            (saved: any) => saved.tempId === row.id
          );
          if (savedStudent) {
            return {
              ...row,
              originalId: savedStudent._id
            };
          }
          return row;
        })
      );
      return response.data.data._id;
    } catch (error) {
      console.error('Error saving CSV:', error);
      throw error;
    }
  };

  const removeFromCsvDatabase = async (csvId: string, row: ProcessedRow) => {
    try {
      const studentIdToRemove = row.originalId || row.id;
      const patchData = row.originalId
        ? { studentId: studentIdToRemove }
        : { tempId: row.id };
      const patchResponse = await axiosInstance.patch(
        `/csv/${csvId}`,
        patchData
      );

      if (!patchResponse.data.success) {
        throw new Error(patchResponse.data.message || 'Failed to remove student');
      }

      const isLastStudent = csvData.length === 1;
      let documentDeleted = false;

      if (isLastStudent) {
        const deleteResponse = await axiosInstance.delete(`/csv/${csvId}`);
        if (!deleteResponse.data.success) {
          throw new Error(deleteResponse.data.message || 'Failed to delete document');
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
            await saveCsvToDatabase(processedRows);
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
      return 'bg-green-50 border-red-200';
    } else if (row.status === 'error') {
      return 'bg-red-50 border-yellow-200';
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

  useEffect(() => {
    fetchCsvFromDatabase();
  }, [hasActiveUpload, count]);

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
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Student Data Processing</CardTitle>
                <CardDescription>Review and approve student data.</CardDescription>
              </div>
              <div>
                <Button
                  onClick={counter}
                  className="bg-supperagent text-white hover:bg-supperagent/90 flex flex-row gap-2"
                >
                  <RefreshCcw /> Refresh
                </Button>
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