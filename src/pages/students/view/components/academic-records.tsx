import { useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AcademicHistoryDialog } from "./academic-history-dialog";
import { EnglishExamDialog } from "./english-exam-dialog";
import moment from "moment";
import { Switch } from "@/components/ui/switch";

export function AcademicRecords({ student, onSave }) {
  const [academicNotRequired, setAcademicNotRequired] = useState(student.academicHistoryRequired);
  const [academicHistory, setAcademicHistory] = useState<any>([]);
  const [newAcademicOpen, setNewAcademicOpen] = useState(false);
  const [editingAcademic, setEditingAcademic] = useState<any>(null);
  const [examNotRequired, setExamNotRequired] = useState(student.englishLanguageRequired);
  const [examHistory, setExamHistory] = useState<any>(student.englishLanguageExam || []);
  const [newExamOpen, setNewExamOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);

  useEffect(() => {
    if (Array.isArray(student.academicHistory)) {
      setAcademicHistory(student.academicHistory);
    }
    if (Array.isArray(student.englishLanguageExam)) {
      setExamHistory(student.englishLanguageExam);
    }
  }, [student.academicHistory, student.englishLanguageExam]);

  const handleAddAcademic = async (data) => {
    let updatedAcademicHistory;
    
    if (editingAcademic) {
      // Update the existing record with the new data
      updatedAcademicHistory = academicHistory.map((record) =>
        record._id === editingAcademic._id ? { ...record, ...data } : record
      );
    } else {
      // Append new record without removing previous ones
      updatedAcademicHistory = [...academicHistory, data];
    }
    
    // Update local state
    setAcademicHistory(updatedAcademicHistory);
    
    // Persist changes using onSave
    onSave({ academicHistory: updatedAcademicHistory });
    
    // Reset editingAcademic and close the dialog
    setEditingAcademic(null);
    setNewAcademicOpen(false);
  };

  const handleAddExam = async (data) => {
    let updatedExamHistory;
  
    if (editingExam) {
      // Update existing exam record
      updatedExamHistory = examHistory.map((exam) =>
        exam._id === editingExam._id ? { ...exam, ...data } : exam
      );
    } else {
      // Append new exam record
      updatedExamHistory = [...examHistory, data];
    }
  
    // Update local state
    setExamHistory(updatedExamHistory);
  
    // Persist changes using onSave
    onSave({ englishLanguageExam: updatedExamHistory });
  
    // Reset editingExam and close the dialog
    setEditingExam(null);
    setNewExamOpen(false);
  };

  const handleEditAcademic = (record) => {
    setEditingAcademic(record);
    setNewAcademicOpen(true);
  };

  const handleEditExam = (exam) => {
    setEditingExam(exam);
    setNewExamOpen(true);
  };

  const handleAcademicNotRequiredChange = (checked) => {
    setAcademicNotRequired(checked);
    onSave({ academicHistoryRequired: checked });
  };

  const handleExamNotRequiredChange = (checked) => {
    setExamNotRequired(checked);
    onSave({ englishLanguageRequired: checked });
  };

  const handleStatusChange = (_id, checked) => {
    // Convert boolean to number: true -> 1, false -> 0
    const newStatus = checked ? 1 : 0;
  
    // Update the academic history's status in the local state
    const updatedAcademicHistory = academicHistory.map((record) =>
      record._id === _id ? { ...record, status: newStatus } : record
    );
  
    // Update local state
    setAcademicHistory(updatedAcademicHistory);
  
    // Persist the change using onSave
    onSave({ academicHistory: updatedAcademicHistory });
  };

  const handleExamStatus = (_id, checked) => {
    // Convert boolean to number: true -> 1, false -> 0
    const newStatus = checked ? 1 : 0;
  
    // Update the exam's status in the local state
    const updatedExamHistory = examHistory.map((exam) =>
      exam._id === _id ? { ...exam, status: newStatus } : exam
    );
  
    // Update local state
    setExamHistory(updatedExamHistory);
  
    // Persist the change using onSave
    onSave({ englishLanguageExam: updatedExamHistory });
  };

  // Reset editingAcademic to default blank values when opening the dialog for a new academic history
  const handleOpenAcademicDialog = () => {
    setEditingAcademic(null);
    setNewAcademicOpen(true);
  };

  // Reset editingExam to default blank values when opening the dialog for a new exam
  const handleOpenExamDialog = () => {
    setEditingExam(null);
    setNewExamOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4 p-4 shadow-md rounded-md">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Academic History</h2>
          {!academicNotRequired && (
            <Button
              className="bg-supperagent text-white hover:bg-supperagent/90"
              onClick={handleOpenAcademicDialog}
            >
              <Plus className="w-4 h-4 mr-2" />
              New History
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="academicNotRequired"
            checked={academicNotRequired}
            onCheckedChange={handleAcademicNotRequiredChange}
          />
          <label htmlFor="academicNotRequired">
            Academic History not required for this student.
          </label>
        </div>

        {!academicNotRequired && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Institution</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Study Level</TableHead>
                  <TableHead>Result Score</TableHead>
                  <TableHead>Out Of</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {academicHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      No matching records found
                    </TableCell>
                  </TableRow>
                ) : (
                  academicHistory.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>{record.institution}</TableCell>
                      <TableCell>{record.course}</TableCell>
                      <TableCell>{record.studyLevel}</TableCell>
                      <TableCell>{record.resultScore}</TableCell>
                      <TableCell>{record.outOf}</TableCell>
                      <TableCell>{moment(record.startDate).format("DD-MM-YYYY")}</TableCell>
                      <TableCell>{moment(record.endDate).format("DD-MM-YYYY")}</TableCell>
                      <TableCell>
                        <Switch
                          checked={parseInt(record.status) === 1}
                          onCheckedChange={(checked) => handleStatusChange(record._id, checked)}
                          className="mx-auto"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          className="bg-supperagent text-white hover:bg-supperagent/90 border-none"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditAcademic(record)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </>
        )}
      </div>

      <div className="space-y-4 p-4 shadow-xl rounded-md">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">English Language Exams</h2>
          {!examNotRequired && (
            <Button
              className="bg-supperagent text-white hover:bg-supperagent/90"
              onClick={handleOpenExamDialog}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Exam
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="examNotRequired"
            checked={examNotRequired}
            onCheckedChange={handleExamNotRequiredChange}
          />
          <label htmlFor="examNotRequired">
            English exam not required for this student.
          </label>
        </div>

        {!examNotRequired && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Exam Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No matching records found
                    </TableCell>
                  </TableRow>
                ) : (
                  examHistory.map((exam) => (
                    <TableRow key={exam._id}>
                      <TableCell>{exam.exam}</TableCell>
                      <TableCell>{moment(exam.examDate).format('DD-MM-YYYY')}</TableCell>
                      <TableCell>{exam.score}</TableCell>
                      <TableCell>
                        <Switch
                          checked={parseInt(exam.status) === 1}
                          onCheckedChange={(checked) => handleExamStatus(exam._id, checked)}
                          className="mx-auto"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          className="bg-supperagent text-white hover:bg-supperagent/90 border-none"
                          size="icon"
                          onClick={() => handleEditExam(exam)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </>
        )}
      </div>

      <AcademicHistoryDialog
        open={newAcademicOpen}
        onOpenChange={(open) => {
          setNewAcademicOpen(open);
          if (!open) setEditingAcademic(null); // Reset editingAcademic when dialog is closed
        }}
        onSubmit={handleAddAcademic}
        initialData={editingAcademic} // Pass the editingAcademic as initialData
      />

      <EnglishExamDialog
        open={newExamOpen}
        onOpenChange={(open) => {
          setNewExamOpen(open);
          if (!open) setEditingExam(null); // Reset editingExam when dialog is closed
        }}
        onSubmit={handleAddExam}
        initialData={editingExam} // Pass the editingExam as initialData
      />
    </div>
  );
}