import { Component, OnInit } from '@angular/core';
import { 
  SchoolClass, 
  Student, 
  Teacher, 
  AttendanceRecord, 
  AttendanceStatus, 
  LeaveApplication, 
  LeaveStatus, 
  LeaveType, 
  Grade 
} from './models';
import { AttendanceService } from './attendance.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App implements OnInit {
  // --- View State ---
  activePortal: 'teacher' | 'student' = 'teacher';
  teacherTab: 'dashboard' | 'record' | 'monthly' | 'classes' | 'leaves' = 'dashboard';
  studentTab: 'apply-leave' | 'my-leaves' | 'my-attendance' = 'apply-leave';

  // --- Core Data ---
  classes: SchoolClass[] = [];
  students: Student[] = [];
  teachers: Teacher[] = [];
  leaves: LeaveApplication[] = [];

  // Available grades list LKG to 12th
  readonly availableGrades: Grade[] = [
    'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', 
    '6th', '7th', '8th', '9th', '10th', '11th', '12th'
  ];

  readonly leaveTypes: LeaveType[] = [
    'Sick / Medical',
    'Casual / Personal',
    'Family Function',
    'Academic / Sports',
    'Other'
  ];

  // --- Teacher Dashboard & Daily Record State ---
  selectedDate: string = '';
  selectedClassId: string = '';
  recordTargetType: 'student' | 'teacher' = 'student';

  // Current marking state: targetId -> { status, remarks }
  currentAttendanceMap: Record<string, AttendanceStatus> = {};
  currentRemarksMap: Record<string, string> = {};

  // --- Monthly Register State ---
  monthlyTargetType: 'student' | 'teacher' = 'student';
  monthlyClassId: string = '';
  monthlyYear: number = 2026;
  monthlyMonth: number = 10; // 1-12
  monthlySearchTerm: string = '';
  monthlyOnlyLowAttendance: boolean = false;
  monthlyMatrixData: any = null;

  // --- Modals State ---
  showAddClassModal: boolean = false;
  showAddStudentModal: boolean = false;
  showBulkStudentModal: boolean = false;
  showAddTeacherModal: boolean = false;
  showReviewLeaveModal: boolean = false;

  // Forms
  newClass: { grade: Grade; section: string; room: string; teacherName: string } = {
    grade: '10th',
    section: 'A',
    room: '',
    teacherName: ''
  };

  newStudent: { classId: string; rollNo: string; name: string; gender: 'Male' | 'Female' | 'Other'; parentName: string; phone: string } = {
    classId: '',
    rollNo: '',
    name: '',
    gender: 'Male',
    parentName: '',
    phone: ''
  };

  bulkStudentInput: { classId: string; namesText: string } = {
    classId: '',
    namesText: ''
  };

  newTeacher: { empId: string; name: string; department: string; phone: string; email: string } = {
    empId: '',
    name: '',
    department: '',
    phone: '',
    email: ''
  };

  reviewingLeave: LeaveApplication | null = null;
  reviewRemarksInput: string = '';

  // --- Student View State ---
  studentApplyForm: {
    classId: string;
    studentId: string;
    studentName: string;
    rollNo: string;
    leaveType: LeaveType;
    fromDate: string;
    toDate: string;
    reason: string;
    parentContact: string;
  } = {
    classId: '',
    studentId: '',
    studentName: '',
    rollNo: '',
    leaveType: 'Sick / Medical',
    fromDate: '',
    toDate: '',
    reason: '',
    parentContact: ''
  };

  studentAttendanceCheck: {
    classId: string;
    studentId: string;
    result: any;
  } = {
    classId: '',
    studentId: '',
    result: null
  };

  // --- Toast Notification ---
  toast: { message: string; type: 'success' | 'error' | 'info'; visible: boolean } = {
    message: '',
    type: 'success',
    visible: false
  };
  private toastTimer: any = null;

  constructor(public attendanceService: AttendanceService) {}

  ngOnInit(): void {
    const today = new Date();
    this.selectedDate = this.formatDate(today);
    this.monthlyYear = today.getFullYear();
    this.monthlyMonth = today.getMonth() + 1;

    // Student form default dates
    this.studentApplyForm.fromDate = this.selectedDate;
    this.studentApplyForm.toDate = this.selectedDate;

    this.refreshAllData();
  }

  // --- Utility ---
  formatDate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  showToastNotification(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toast = { message, type, visible: true };
    this.toastTimer = setTimeout(() => {
      this.toast.visible = false;
      this.toastTimer = null;
    }, 4000);
  }

  dismissToast(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.toast.visible = false;
  }

  refreshAllData(): void {
    this.classes = this.attendanceService.getClasses();
    this.students = this.attendanceService.getStudents();
    this.teachers = this.attendanceService.getTeachers();
    this.leaves = this.attendanceService.getAllLeaves();

    // Default class selection if none
    if (this.classes.length > 0) {
      if (!this.selectedClassId || !this.classes.find(c => c.id === this.selectedClassId)) {
        this.selectedClassId = this.classes[0].id;
      }
      if (!this.monthlyClassId || !this.classes.find(c => c.id === this.monthlyClassId)) {
        this.monthlyClassId = this.classes[0].id;
      }
      if (!this.studentApplyForm.classId) {
        this.studentApplyForm.classId = this.classes[0].id;
        this.onStudentFormClassChange();
      }
      if (!this.newStudent.classId) {
        this.newStudent.classId = this.classes[0].id;
      }
      if (!this.bulkStudentInput.classId) {
        this.bulkStudentInput.classId = this.classes[0].id;
      }
    }

    this.loadAttendanceForRecording();
    this.calculateMonthlyMatrix();
  }

  // --- Portal Switcher ---
  switchPortal(portal: 'teacher' | 'student'): void {
    this.activePortal = portal;
    if (portal === 'student' && this.classes.length > 0 && !this.studentApplyForm.classId) {
      this.studentApplyForm.classId = this.classes[0].id;
      this.onStudentFormClassChange();
    }
  }

  setTeacherTab(tab: 'dashboard' | 'record' | 'monthly' | 'classes' | 'leaves'): void {
    this.teacherTab = tab;
    if (tab === 'monthly') {
      this.calculateMonthlyMatrix();
    } else if (tab === 'record') {
      this.loadAttendanceForRecording();
    }
  }

  // --- Dashboard Tiles Calculations ---
  get pendingLeavesCount(): number {
    return this.leaves.filter(l => l.status === 'pending').length;
  }

  get todayAttendanceStats() {
    const all = this.attendanceService.getAllAttendance().filter(a => a.date === this.selectedDate);
    const studentRecords = all.filter(a => a.targetType === 'student');
    const teacherRecords = all.filter(a => a.targetType === 'teacher');

    const totalMarkedStudents = studentRecords.length;
    const presentStudents = studentRecords.filter(s => s.status === 'present').length;
    const absentStudents = studentRecords.filter(s => s.status === 'absent').length;
    const lateStudents = studentRecords.filter(s => s.status === 'late').length;
    const leaveStudents = studentRecords.filter(s => s.status === 'leave').length;

    const studentPercentage = totalMarkedStudents > 0 
      ? Math.round(((presentStudents + (lateStudents * 0.5)) / totalMarkedStudents) * 100) 
      : 0;

    const totalMarkedTeachers = teacherRecords.length;
    const presentTeachers = teacherRecords.filter(t => t.status === 'present').length;
    const absentTeachers = teacherRecords.filter(t => t.status === 'absent').length;
    const leaveTeachers = teacherRecords.filter(t => t.status === 'leave').length;

    return {
      hasRecords: all.length > 0,
      totalStudentsEnrolled: this.students.length,
      totalMarkedStudents,
      presentStudents,
      absentStudents,
      lateStudents,
      leaveStudents,
      studentPercentage,
      totalTeachersCount: this.teachers.length,
      totalMarkedTeachers,
      presentTeachers,
      absentTeachers,
      leaveTeachers
    };
  }

  getClassAttendanceCardStats(cls: SchoolClass) {
    const classStudents = this.students.filter(s => s.classId === cls.id);
    const records = this.attendanceService.getAllAttendance().filter(
      a => a.classId === cls.id && a.date === this.selectedDate && a.targetType === 'student'
    );
    const markedCount = records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const leaveCount = records.filter(r => r.status === 'leave').length;
    const lateCount = records.filter(r => r.status === 'late').length;

    const isMarked = markedCount > 0;
    const percentage = markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : 0;

    return {
      total: classStudents.length,
      markedCount,
      presentCount,
      absentCount,
      leaveCount,
      lateCount,
      isMarked,
      percentage
    };
  }

  quickTakeClassAttendance(cls: SchoolClass): void {
    this.selectedClassId = cls.id;
    this.recordTargetType = 'student';
    this.teacherTab = 'record';
    this.loadAttendanceForRecording();
  }

  quickTakeTeacherAttendance(): void {
    this.recordTargetType = 'teacher';
    this.teacherTab = 'record';
    this.loadAttendanceForRecording();
  }

  // --- Daily Attendance Recording ---
  changeSelectedDate(offsetDays: number): void {
    const cur = new Date(this.selectedDate);
    cur.setDate(cur.getDate() + offsetDays);
    this.selectedDate = this.formatDate(cur);
    this.loadAttendanceForRecording();
  }

  onRecordConfigChange(): void {
    this.loadAttendanceForRecording();
  }

  loadAttendanceForRecording(): void {
    this.currentAttendanceMap = {};
    this.currentRemarksMap = {};

    const savedRecords = this.attendanceService.getAttendanceForDate(
      this.selectedDate,
      this.recordTargetType === 'student' ? this.selectedClassId : undefined,
      this.recordTargetType
    );

    const targets: (Student | Teacher)[] = this.recordTargetType === 'student'
      ? this.students.filter(s => s.classId === this.selectedClassId)
      : this.teachers;

    for (const t of targets) {
      if (savedRecords[t.id]) {
        this.currentAttendanceMap[t.id] = savedRecords[t.id].status;
        this.currentRemarksMap[t.id] = savedRecords[t.id].remarks || '';
      } else {
        // Check if student has an approved leave for this date!
        if (this.recordTargetType === 'student') {
          const approvedLeave = this.attendanceService.getApprovedLeaveForStudentOnDate(t.id, this.selectedDate);
          if (approvedLeave) {
            this.currentAttendanceMap[t.id] = 'leave';
            this.currentRemarksMap[t.id] = `Approved Leave: ${approvedLeave.leaveType}`;
            continue;
          }
        }
        // Default to empty or unselected
        this.currentAttendanceMap[t.id] = 'present';
        this.currentRemarksMap[t.id] = '';
      }
    }
  }

  getApprovedLeaveNotice(studentId: string): string | null {
    const leave = this.attendanceService.getApprovedLeaveForStudentOnDate(studentId, this.selectedDate);
    return leave ? `Approved Leave (${leave.leaveType})` : null;
  }

  setAttendanceStatus(targetId: string, status: AttendanceStatus): void {
    this.currentAttendanceMap[targetId] = status;
  }

  markAll(status: AttendanceStatus): void {
    const targets = this.recordTargetType === 'student'
      ? this.students.filter(s => s.classId === this.selectedClassId)
      : this.teachers;

    for (const t of targets) {
      // Don't overwrite if student has approved leave
      if (this.recordTargetType === 'student') {
        const leave = this.attendanceService.getApprovedLeaveForStudentOnDate(t.id, this.selectedDate);
        if (leave && status !== 'leave') {
          continue; // keep approved leave
        }
      }
      this.currentAttendanceMap[t.id] = status;
    }
    this.showToastNotification(`Marked all as ${status.toUpperCase()}`, 'info');
  }

  saveAttendance(): void {
    const targets = this.recordTargetType === 'student'
      ? this.students.filter(s => s.classId === this.selectedClassId)
      : this.teachers;

    if (targets.length === 0) {
      this.showToastNotification('No students or teachers found to record attendance.', 'error');
      return;
    }

    const records: AttendanceRecord[] = targets.map(t => ({
      id: `${this.recordTargetType}_${t.id}_${this.selectedDate}`,
      targetType: this.recordTargetType,
      targetId: t.id,
      classId: this.recordTargetType === 'student' ? this.selectedClassId : undefined,
      date: this.selectedDate,
      status: this.currentAttendanceMap[t.id] || 'present',
      remarks: this.currentRemarksMap[t.id] || '',
      updatedAt: new Date().toISOString()
    }));

    this.attendanceService.saveDailyAttendance(records);

    const targetDesc = this.recordTargetType === 'student' 
      ? (this.classes.find(c => c.id === this.selectedClassId)?.name || 'Class')
      : 'Faculty Staff';

    this.showToastNotification(`Attendance recorded successfully for ${targetDesc} on ${this.selectedDate}!`, 'success');
    this.calculateMonthlyMatrix();
  }

  get currentRecordingTargets(): (Student | Teacher)[] {
    return this.recordTargetType === 'student'
      ? this.students.filter(s => s.classId === this.selectedClassId)
      : this.teachers;
  }

  get currentRecordingStats() {
    const targets = this.currentRecordingTargets;
    let p = 0, a = 0, l = 0, lv = 0;
    for (const t of targets) {
      const st = this.currentAttendanceMap[t.id];
      if (st === 'present') p++;
      else if (st === 'absent') a++;
      else if (st === 'late') l++;
      else if (st === 'leave') lv++;
    }
    return { total: targets.length, p, a, l, lv };
  }

  // --- Monthly Register ---
  calculateMonthlyMatrix(): void {
    this.monthlyMatrixData = this.attendanceService.getMonthlyMatrix(
      this.monthlyTargetType,
      this.monthlyTargetType === 'student' ? (this.monthlyClassId || null) : null,
      Number(this.monthlyYear),
      Number(this.monthlyMonth)
    );
  }

  get filteredMonthlyRows() {
    if (!this.monthlyMatrixData || !this.monthlyMatrixData.rows) return [];
    let rows = this.monthlyMatrixData.rows;

    if (this.monthlySearchTerm.trim()) {
      const term = this.monthlySearchTerm.toLowerCase();
      rows = rows.filter((r: any) => 
        r.target.name.toLowerCase().includes(term) ||
        (r.target.rollNo && r.target.rollNo.includes(term)) ||
        (r.target.empId && r.target.empId.toLowerCase().includes(term))
      );
    }

    if (this.monthlyOnlyLowAttendance) {
      rows = rows.filter((r: any) => r.percentage < 75);
    }

    return rows;
  }

  printRegister(): void {
    window.print();
  }

  exportRegisterCSV(): void {
    if (!this.monthlyMatrixData) return;
    const { days, rows } = this.monthlyMatrixData;
    let csv = `Target ID,Roll/Emp No,Name,${days.map((d: any) => d.day).join(',')},Total P,Total A,Total L,Total Leave,Attendance %\n`;

    for (const r of rows) {
      const id = r.target.id;
      const roll = r.target.rollNo || r.target.empId || '';
      const name = `"${r.target.name}"`;
      const dayStatuses = days.map((d: any) => {
        const s = r.statuses[d.day];
        return s ? s.charAt(0).toUpperCase() : '-';
      }).join(',');

      csv += `${id},${roll},${name},${dayStatuses},${r.pCount},${r.aCount},${r.lCount},${r.leaveCount},${r.percentage}%\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Attendance_Register_${this.monthlyYear}_${this.monthlyMonth}.csv`;
    link.click();
  }

  // --- Class & Student Management ---
  openAddClassModal(): void {
    this.newClass = { grade: '10th', section: 'A', room: '', teacherName: '' };
    this.showAddClassModal = true;
  }

  saveNewClass(): void {
    if (!this.newClass.grade || !this.newClass.section.trim()) {
      this.showToastNotification('Please enter grade and section name.', 'error');
      return;
    }
    const name = `${this.newClass.grade} - ${this.newClass.section.trim()}`;
    const created = this.attendanceService.addClass({
      grade: this.newClass.grade,
      section: this.newClass.section.trim(),
      name,
      room: this.newClass.room.trim(),
      teacherName: this.newClass.teacherName.trim()
    });

    this.showAddClassModal = false;
    this.showToastNotification(`Class "${name}" created successfully!`, 'success');
    this.refreshAllData();
    this.selectedClassId = created.id;
  }

  deleteClass(cls: SchoolClass): void {
    if (confirm(`Are you sure you want to delete "${cls.name}" and all its enrolled students and records?`)) {
      this.attendanceService.deleteClass(cls.id);
      this.showToastNotification(`Class "${cls.name}" deleted.`, 'info');
      this.refreshAllData();
    }
  }

  openAddStudentModal(classId?: string): void {
    this.newStudent = {
      classId: classId || this.selectedClassId || (this.classes[0]?.id || ''),
      rollNo: '',
      name: '',
      gender: 'Male',
      parentName: '',
      phone: ''
    };
    // Auto calculate next roll number
    const inClass = this.students.filter(s => s.classId === this.newStudent.classId);
    this.newStudent.rollNo = String(inClass.length + 1).padStart(2, '0');
    this.showAddStudentModal = true;
  }

  onStudentModalClassChange(): void {
    const inClass = this.students.filter(s => s.classId === this.newStudent.classId);
    this.newStudent.rollNo = String(inClass.length + 1).padStart(2, '0');
  }

  saveNewStudent(): void {
    if (!this.newStudent.classId) {
      this.showToastNotification('Please select a class for the student.', 'error');
      return;
    }
    if (!this.newStudent.name.trim()) {
      this.showToastNotification('Please enter the student\'s name.', 'error');
      return;
    }

    this.attendanceService.addStudent({
      classId: this.newStudent.classId,
      rollNo: this.newStudent.rollNo.trim() || '01',
      name: this.newStudent.name.trim(),
      gender: this.newStudent.gender,
      parentName: this.newStudent.parentName.trim(),
      phone: this.newStudent.phone.trim()
    });

    this.showAddStudentModal = false;
    this.showToastNotification(`Student "${this.newStudent.name}" enrolled successfully!`, 'success');
    this.refreshAllData();
  }

  openBulkStudentModal(classId?: string): void {
    this.bulkStudentInput = {
      classId: classId || this.selectedClassId || (this.classes[0]?.id || ''),
      namesText: ''
    };
    this.showBulkStudentModal = true;
  }

  saveBulkStudents(): void {
    if (!this.bulkStudentInput.classId) {
      this.showToastNotification('Please select a class.', 'error');
      return;
    }
    const lines = this.bulkStudentInput.namesText.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      this.showToastNotification('Please enter at least one student name.', 'error');
      return;
    }

    const count = this.attendanceService.bulkAddStudents(this.bulkStudentInput.classId, lines);
    this.showBulkStudentModal = false;
    this.showToastNotification(`Added ${count} students successfully!`, 'success');
    this.refreshAllData();
  }

  deleteStudent(student: Student): void {
    if (confirm(`Remove student "${student.name}" (Roll No ${student.rollNo})?`)) {
      this.attendanceService.deleteStudent(student.id);
      this.showToastNotification(`Removed student ${student.name}.`, 'info');
      this.refreshAllData();
    }
  }

  // --- Teacher Management ---
  openAddTeacherModal(): void {
    const nextNum = this.teachers.length + 1;
    this.newTeacher = {
      empId: `TCH-${100 + nextNum}`,
      name: '',
      department: '',
      phone: '',
      email: ''
    };
    this.showAddTeacherModal = true;
  }

  saveNewTeacher(): void {
    if (!this.newTeacher.name.trim()) {
      this.showToastNotification('Please enter teacher name.', 'error');
      return;
    }
    this.attendanceService.addTeacher({
      empId: this.newTeacher.empId.trim() || `TCH-${Date.now().toString().slice(-4)}`,
      name: this.newTeacher.name.trim(),
      department: this.newTeacher.department.trim() || 'General',
      phone: this.newTeacher.phone.trim(),
      email: this.newTeacher.email.trim()
    });

    this.showAddTeacherModal = false;
    this.showToastNotification(`Faculty member "${this.newTeacher.name}" added!`, 'success');
    this.refreshAllData();
  }

  deleteTeacher(t: Teacher): void {
    if (confirm(`Remove faculty member "${t.name}"?`)) {
      this.attendanceService.deleteTeacher(t.id);
      this.showToastNotification(`Removed teacher ${t.name}.`, 'info');
      this.refreshAllData();
    }
  }

  // --- Leave Management (Teacher Desk) ---
  leaveFilterStatus: 'all' | LeaveStatus = 'all';
  leaveFilterClassId: string = 'all';

  get filteredLeaves(): LeaveApplication[] {
    return this.leaves.filter(l => {
      const matchStatus = this.leaveFilterStatus === 'all' || l.status === this.leaveFilterStatus;
      const matchClass = this.leaveFilterClassId === 'all' || l.classId === this.leaveFilterClassId;
      return matchStatus && matchClass;
    });
  }

  openReviewLeaveModal(leave: LeaveApplication): void {
    this.reviewingLeave = leave;
    this.reviewRemarksInput = leave.teacherRemarks || '';
    this.showReviewLeaveModal = true;
  }

  submitLeaveDecision(status: LeaveStatus): void {
    if (!this.reviewingLeave) return;
    this.attendanceService.updateLeaveStatus(this.reviewingLeave.id, status, this.reviewRemarksInput.trim());
    this.showReviewLeaveModal = false;
    this.showToastNotification(
      `Leave request marked as ${status.toUpperCase()}! ${status === 'approved' ? 'Daily attendance updated.' : ''}`,
      'success'
    );
    this.refreshAllData();
  }

  // --- Student View Handlers ---
  onStudentFormClassChange(): void {
    const classStudents = this.students.filter(s => s.classId === this.studentApplyForm.classId);
    if (classStudents.length > 0) {
      this.studentApplyForm.studentId = classStudents[0].id;
      this.studentApplyForm.studentName = classStudents[0].name;
      this.studentApplyForm.rollNo = classStudents[0].rollNo;
    } else {
      this.studentApplyForm.studentId = '';
      this.studentApplyForm.studentName = '';
      this.studentApplyForm.rollNo = '';
    }
  }

  onStudentSelectChange(): void {
    const found = this.students.find(s => s.id === this.studentApplyForm.studentId);
    if (found) {
      this.studentApplyForm.studentName = found.name;
      this.studentApplyForm.rollNo = found.rollNo;
    }
  }

  get calculatedLeaveDuration(): number {
    if (!this.studentApplyForm.fromDate || !this.studentApplyForm.toDate) return 0;
    const f = new Date(this.studentApplyForm.fromDate);
    const t = new Date(this.studentApplyForm.toDate);
    if (t < f) return 0;
    const diff = Math.round((t.getTime() - f.getTime()) / (1000 * 3600 * 24)) + 1;
    return diff;
  }

  submitStudentLeave(): void {
    if (!this.studentApplyForm.classId) {
      this.showToastNotification('Please select your class.', 'error');
      return;
    }
    if (!this.studentApplyForm.studentName.trim()) {
      this.showToastNotification('Please select or enter your name.', 'error');
      return;
    }
    if (!this.studentApplyForm.fromDate || !this.studentApplyForm.toDate) {
      this.showToastNotification('Please specify start and end dates.', 'error');
      return;
    }
    if (this.studentApplyForm.toDate < this.studentApplyForm.fromDate) {
      this.showToastNotification('End date cannot be earlier than start date.', 'error');
      return;
    }
    if (!this.studentApplyForm.reason.trim()) {
      this.showToastNotification('Please provide a reason for the leave.', 'error');
      return;
    }

    const cls = this.classes.find(c => c.id === this.studentApplyForm.classId);
    const className = cls ? cls.name : 'Unknown Class';

    this.attendanceService.applyLeave({
      classId: this.studentApplyForm.classId,
      className,
      studentId: this.studentApplyForm.studentId || 'stu_' + Date.now(),
      studentName: this.studentApplyForm.studentName.trim(),
      rollNo: this.studentApplyForm.rollNo || '00',
      leaveType: this.studentApplyForm.leaveType,
      fromDate: this.studentApplyForm.fromDate,
      toDate: this.studentApplyForm.toDate,
      reason: this.studentApplyForm.reason.trim(),
      parentContact: this.studentApplyForm.parentContact.trim()
    });

    this.showToastNotification('Leave application submitted successfully! Your teacher can now review it.', 'success');
    this.refreshAllData();
    this.studentTab = 'my-leaves';
  }

  // --- Student Attendance Check ---
  onStudentCheckClassChange(): void {
    const classStudents = this.students.filter(s => s.classId === this.studentAttendanceCheck.classId);
    if (classStudents.length > 0) {
      this.studentAttendanceCheck.studentId = classStudents[0].id;
      this.runStudentAttendanceCheck();
    } else {
      this.studentAttendanceCheck.studentId = '';
      this.studentAttendanceCheck.result = null;
    }
  }

  runStudentAttendanceCheck(): void {
    if (!this.studentAttendanceCheck.studentId) {
      this.studentAttendanceCheck.result = null;
      return;
    }

    const all = this.attendanceService.getAllAttendance().filter(
      a => a.targetId === this.studentAttendanceCheck.studentId && a.targetType === 'student'
    );

    const totalDays = all.length;
    const present = all.filter(a => a.status === 'present').length;
    const absent = all.filter(a => a.status === 'absent').length;
    const late = all.filter(a => a.status === 'late').length;
    const leave = all.filter(a => a.status === 'leave').length;

    const percentage = totalDays > 0 
      ? Math.round(((present + (late * 0.5)) / totalDays) * 100) 
      : 100;

    const st = this.students.find(s => s.id === this.studentAttendanceCheck.studentId);

    this.studentAttendanceCheck.result = {
      student: st,
      totalDays,
      present,
      absent,
      late,
      leave,
      percentage,
      isGood: percentage >= 75,
      records: all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15)
    };
  }

  // --- Demo Seeder & Reset ---
  seedDemo(): void {
    this.attendanceService.seedDemoData();
    this.refreshAllData();
    this.showToastNotification('Demo School data seeded with LKG to 12th classes, students & staff!', 'success');
  }

  clearAll(): void {
    if (confirm('Are you sure you want to clear all data? This will empty all attendance tiles, classes, students, and leaves.')) {
      this.attendanceService.clearAllData();
      this.refreshAllData();
      this.showToastNotification('All data cleared. Tiles are now empty.', 'info');
    }
  }

  // Helper for student class name
  getClassName(classId: string): string {
    const cls = this.classes.find(c => c.id === classId);
    return cls ? cls.name : 'Unknown';
  }

  // Template Type Helpers
  getTargetRollOrEmpId(item: any): string {
    if (!item) return '-';
    return item.rollNo || item.empId || '-';
  }

  getTargetSubtitle(item: any): string {
    if (!item) return '';
    if ('rollNo' in item) {
      const parts: string[] = [];
      if (item.gender) parts.push(item.gender);
      if (item.parentName) parts.push(`Guardian: ${item.parentName}`);
      return parts.join(' • ');
    }
    if ('empId' in item) {
      return item.department || 'Faculty Member';
    }
    return '';
  }

  isStudent(item: any): boolean {
    return item && 'rollNo' in item;
  }
}
