import { Injectable } from '@angular/core';
import { 
  SchoolClass, 
  Student, 
  Teacher, 
  AttendanceRecord, 
  AttendanceStatus, 
  LeaveApplication, 
  LeaveStatus, 
  Grade 
} from './models';

const STORAGE_KEYS = {
  CLASSES: 'edutrack_classes_v1',
  STUDENTS: 'edutrack_students_v1',
  TEACHERS: 'edutrack_teachers_v1',
  ATTENDANCE: 'edutrack_attendance_v1',
  LEAVES: 'edutrack_leaves_v1'
};

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    // We keep it empty initially as requested ("first it should be empty")
    if (localStorage.getItem(STORAGE_KEYS.CLASSES) === null) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify([]));
    }
    if (localStorage.getItem(STORAGE_KEYS.STUDENTS) === null) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    }
    if (localStorage.getItem(STORAGE_KEYS.TEACHERS) === null) {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify([]));
    }
    if (localStorage.getItem(STORAGE_KEYS.ATTENDANCE) === null) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    }
    if (localStorage.getItem(STORAGE_KEYS.LEAVES) === null) {
      localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify([]));
    }
  }

  // --- Classes ---
  getClasses(): SchoolClass[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveClasses(classes: SchoolClass[]): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }

  addClass(cls: Omit<SchoolClass, 'id' | 'createdAt'>): SchoolClass {
    const classes = this.getClasses();
    const newClass: SchoolClass = {
      ...cls,
      id: 'cls_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString()
    };
    classes.push(newClass);
    this.saveClasses(classes);
    return newClass;
  }

  deleteClass(classId: string): void {
    const classes = this.getClasses().filter(c => c.id !== classId);
    this.saveClasses(classes);

    // Also remove students of this class
    const students = this.getStudents().filter(s => s.classId !== classId);
    this.saveStudents(students);

    // Also remove attendance of this class
    const attendance = this.getAllAttendance().filter(a => a.classId !== classId);
    this.saveAllAttendance(attendance);

    // Also remove leaves of this class
    const leaves = this.getAllLeaves().filter(l => l.classId !== classId);
    this.saveAllLeaves(leaves);
  }

  // --- Students ---
  getStudents(classId?: string): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      const students: Student[] = data ? JSON.parse(data) : [];
      if (classId) {
        return students.filter(s => s.classId === classId);
      }
      return students;
    } catch {
      return [];
    }
  }

  saveStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  addStudent(student: Omit<Student, 'id' | 'createdAt'>): Student {
    const students = this.getStudents();
    const newStudent: Student = {
      ...student,
      id: 'stu_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString()
    };
    students.push(newStudent);
    this.saveStudents(students);
    return newStudent;
  }

  bulkAddStudents(classId: string, names: string[]): number {
    const students = this.getStudents();
    const existingInClass = students.filter(s => s.classId === classId);
    let startRoll = existingInClass.length + 1;
    let addedCount = 0;

    for (const rawName of names) {
      const name = rawName.trim();
      if (!name) continue;

      const rollStr = String(startRoll).padStart(2, '0');
      const newStudent: Student = {
        id: 'stu_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_' + startRoll,
        classId,
        rollNo: rollStr,
        name,
        gender: 'Male',
        parentName: 'Guardian of ' + name,
        phone: '',
        createdAt: new Date().toISOString()
      };
      students.push(newStudent);
      startRoll++;
      addedCount++;
    }

    this.saveStudents(students);
    return addedCount;
  }

  deleteStudent(studentId: string): void {
    const students = this.getStudents().filter(s => s.id !== studentId);
    this.saveStudents(students);

    const attendance = this.getAllAttendance().filter(a => a.targetId !== studentId);
    this.saveAllAttendance(attendance);

    const leaves = this.getAllLeaves().filter(l => l.studentId !== studentId);
    this.saveAllLeaves(leaves);
  }

  // --- Teachers ---
  getTeachers(): Teacher[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEACHERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveTeachers(teachers: Teacher[]): void {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  }

  addTeacher(teacher: Omit<Teacher, 'id' | 'createdAt'>): Teacher {
    const teachers = this.getTeachers();
    const newTeacher: Teacher = {
      ...teacher,
      id: 'tch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString()
    };
    teachers.push(newTeacher);
    this.saveTeachers(teachers);
    return newTeacher;
  }

  deleteTeacher(teacherId: string): void {
    const teachers = this.getTeachers().filter(t => t.id !== teacherId);
    this.saveTeachers(teachers);

    const attendance = this.getAllAttendance().filter(a => a.targetId !== teacherId);
    this.saveAllAttendance(attendance);
  }

  // --- Attendance ---
  getAllAttendance(): AttendanceRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveAllAttendance(records: AttendanceRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  }

  getAttendanceForDate(date: string, classId?: string, targetType: 'student' | 'teacher' = 'student'): Record<string, AttendanceRecord> {
    const all = this.getAllAttendance();
    const map: Record<string, AttendanceRecord> = {};
    for (const rec of all) {
      if (rec.date === date && rec.targetType === targetType) {
        if (!classId || rec.classId === classId) {
          map[rec.targetId] = rec;
        }
      }
    }
    return map;
  }

  saveDailyAttendance(records: AttendanceRecord[]): void {
    const all = this.getAllAttendance();
    const map = new Map<string, AttendanceRecord>();

    for (const r of all) {
      const key = `${r.targetType}_${r.targetId}_${r.date}`;
      map.set(key, r);
    }

    for (const r of records) {
      const key = `${r.targetType}_${r.targetId}_${r.date}`;
      map.set(key, { ...r, updatedAt: new Date().toISOString() });
    }

    this.saveAllAttendance(Array.from(map.values()));
  }

  // --- Leaves ---
  getAllLeaves(): LeaveApplication[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEAVES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveAllLeaves(leaves: LeaveApplication[]): void {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
  }

  applyLeave(application: Omit<LeaveApplication, 'id' | 'status' | 'appliedDate'>): LeaveApplication {
    const leaves = this.getAllLeaves();
    const newLeave: LeaveApplication = {
      ...application,
      id: 'leave_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      status: 'pending',
      appliedDate: new Date().toISOString()
    };
    leaves.unshift(newLeave); // latest first
    this.saveAllLeaves(leaves);
    return newLeave;
  }

  updateLeaveStatus(leaveId: string, status: LeaveStatus, teacherRemarks?: string): void {
    const leaves = this.getAllLeaves();
    const target = leaves.find(l => l.id === leaveId);
    if (!target) return;

    target.status = status;
    if (teacherRemarks !== undefined) {
      target.teacherRemarks = teacherRemarks;
    }
    target.reviewedDate = new Date().toISOString();
    this.saveAllLeaves(leaves);

    // If approved, automatically mark 'leave' for this student for the date range!
    if (status === 'approved') {
      this.syncApprovedLeaveToAttendance(target);
    }
  }

  private syncApprovedLeaveToAttendance(leave: LeaveApplication): void {
    const from = new Date(leave.fromDate);
    const to = new Date(leave.toDate);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return;

    const datesToMark: string[] = [];
    const current = new Date(from);
    while (current <= to) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      datesToMark.push(`${yyyy}-${mm}-${dd}`);
      current.setDate(current.getDate() + 1);
    }

    const records: AttendanceRecord[] = datesToMark.map(dateStr => ({
      id: `student_${leave.studentId}_${dateStr}`,
      targetType: 'student',
      targetId: leave.studentId,
      classId: leave.classId,
      date: dateStr,
      status: 'leave',
      remarks: `Approved Leave: ${leave.leaveType}`,
      updatedAt: new Date().toISOString()
    }));

    this.saveDailyAttendance(records);
  }

  // Get active approved leave for a student on a specific date
  getApprovedLeaveForStudentOnDate(studentId: string, dateStr: string): LeaveApplication | undefined {
    const leaves = this.getAllLeaves().filter(l => l.studentId === studentId && l.status === 'approved');
    return leaves.find(l => {
      return dateStr >= l.fromDate && dateStr <= l.toDate;
    });
  }

  // --- Monthly Register Calculations ---
  getMonthlyMatrix(
    targetType: 'student' | 'teacher', 
    classId: string | null, 
    year: number, 
    month: number // 1-12
  ) {
    // Days in month
    const totalDays = new Date(year, month, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const days: { 
      day: number; 
      dateStr: string; 
      dayName: string; 
      isSunday: boolean; 
      isToday: boolean; 
    }[] = [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay();
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        dayName: dayNames[dayOfWeek],
        isSunday: dayOfWeek === 0,
        isToday: dateStr === todayStr
      });
    }

    // Targets (Students or Teachers)
    const targets: (Student | Teacher)[] = targetType === 'student' 
      ? this.getStudents(classId || undefined)
      : this.getTeachers();

    const allAttendance = this.getAllAttendance();
    const attendanceMap = new Map<string, AttendanceStatus>();

    for (const rec of allAttendance) {
      if (rec.targetType === targetType) {
        if (!classId || rec.classId === classId) {
          const key = `${rec.targetId}_${rec.date}`;
          attendanceMap.set(key, rec.status);
        }
      }
    }

    let overallPresent = 0;
    let overallAbsent = 0;
    let overallLate = 0;
    let overallLeave = 0;
    let overallWorkingDaysMarked = 0;

    const rows = targets.map(target => {
      let pCount = 0;
      let aCount = 0;
      let lCount = 0;
      let leaveCount = 0;
      const statuses: Record<number, AttendanceStatus | ''> = {};

      for (const day of days) {
        const key = `${target.id}_${day.dateStr}`;
        const status = attendanceMap.get(key) || '';
        statuses[day.day] = status;

        if (status === 'present') pCount++;
        else if (status === 'absent') aCount++;
        else if (status === 'late') { lCount++; pCount += 0.5; } // late counts as 0.5 or present
        else if (status === 'leave') leaveCount++;
      }

      const totalMarkedDays = pCount + aCount + (lCount > 0 ? lCount * 0.5 : 0) + leaveCount;
      const attendancePercentage = totalMarkedDays > 0 
        ? Math.round((pCount / (pCount + aCount)) * 100) || 0
        : 0;

      overallPresent += pCount;
      overallAbsent += aCount;
      overallLate += lCount;
      overallLeave += leaveCount;

      return {
        target,
        statuses,
        pCount,
        aCount,
        lCount,
        leaveCount,
        totalMarkedDays,
        percentage: attendancePercentage
      };
    });

    const totalStudentsOrTeachers = targets.length;
    const avgPercentage = rows.length > 0
      ? Math.round(rows.reduce((acc, r) => acc + r.percentage, 0) / rows.length)
      : 0;

    return {
      days,
      rows,
      summary: {
        totalEnrolled: totalStudentsOrTeachers,
        overallPresent,
        overallAbsent,
        overallLate,
        overallLeave,
        avgPercentage
      }
    };
  }

  // --- Demo Data Seeder ---
  seedDemoData(): void {
    const grades: Grade[] = ['LKG', 'UKG', '1st', '5th', '10th', '12th'];
    const demoClasses: SchoolClass[] = [
      { id: 'cls_lkg_a', grade: 'LKG', section: 'A - Sunshine', name: 'LKG - Sunshine', room: 'Room 101', teacherName: 'Ms. Anita Sharma', createdAt: new Date().toISOString() },
      { id: 'cls_ukg_b', grade: 'UKG', section: 'B - Rainbow', name: 'UKG - Rainbow', room: 'Room 102', teacherName: 'Mrs. Priya Roy', createdAt: new Date().toISOString() },
      { id: 'cls_1st_a', grade: '1st', section: 'A - Explorers', name: '1st - Section A', room: 'Room 201', teacherName: 'Mr. David Miller', createdAt: new Date().toISOString() },
      { id: 'cls_5th_b', grade: '5th', section: 'B', name: '5th - Section B', room: 'Room 304', teacherName: 'Mrs. Sarah Jenkins', createdAt: new Date().toISOString() },
      { id: 'cls_10th_a', grade: '10th', section: 'A', name: '10th - Section A', room: 'Room 402', teacherName: 'Mr. Rajesh Verma', createdAt: new Date().toISOString() },
      { id: 'cls_12th_sci', grade: '12th', section: 'Science', name: '12th - Science', room: 'Lab 2', teacherName: 'Dr. Evelyn Carter', createdAt: new Date().toISOString() }
    ];

    const studentNamesByClass: Record<string, string[]> = {
      'cls_lkg_a': ['Aarav Patel', 'Ananya Gupta', 'Ishaan Kumar', 'Kiara Sen', 'Rohan Mehta'],
      'cls_ukg_b': ['Advait Deshmukh', 'Diya Joshi', 'Kabir Bose', 'Myra Nair', 'Reyansh Rao'],
      'cls_1st_a': ['Aryan Singhania', 'Devika Pillai', 'Hardik Pandya', 'Ira Saxena', 'Kavya Menon', 'Vivaan Malhotra'],
      'cls_5th_b': ['Aditya Kulkarni', 'Bhavya Jain', 'Chinmayee R', 'Dhruv Chopra', 'Gauri Pathak', 'Harsh V'],
      'cls_10th_a': ['Arjun Kapoor', 'Meera Nambiar', 'Nikhil Reddy', 'Pooja Bhatt', 'Rishi Sundaram', 'Sanya Mir', 'Tanya Thomas', 'Varun Dhawan'],
      'cls_12th_sci': ['Abhimanyu Das', 'Fatima Zahra', 'Gaurav Gill', 'Jahnvi Anand', 'Kunal Goswami', 'Neha Subramaniam', 'Siddharth Roy']
    };

    const demoStudents: Student[] = [];
    for (const [classId, names] of Object.entries(studentNamesByClass)) {
      names.forEach((name, idx) => {
        const rollStr = String(idx + 1).padStart(2, '0');
        demoStudents.push({
          id: `stu_${classId}_${idx + 1}`,
          classId,
          rollNo: rollStr,
          name,
          gender: idx % 2 === 0 ? 'Male' : 'Female',
          parentName: 'Parent of ' + name.split(' ')[0],
          phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
          createdAt: new Date().toISOString()
        });
      });
    }

    const demoTeachers: Teacher[] = [
      { id: 'tch_01', empId: 'TCH-101', name: 'Ms. Anita Sharma', department: 'Pre-Primary Education', phone: '+91 9876543210', email: 'anita.s@edutrack.edu', createdAt: new Date().toISOString() },
      { id: 'tch_02', empId: 'TCH-102', name: 'Mr. Rajesh Verma', department: 'Mathematics (Secondary)', phone: '+91 9876543211', email: 'rajesh.v@edutrack.edu', createdAt: new Date().toISOString() },
      { id: 'tch_03', empId: 'TCH-103', name: 'Dr. Evelyn Carter', department: 'Physics (Senior Sec.)', phone: '+91 9876543212', email: 'evelyn.c@edutrack.edu', createdAt: new Date().toISOString() },
      { id: 'tch_04', empId: 'TCH-104', name: 'Mrs. Sarah Jenkins', department: 'English & Social Studies', phone: '+91 9876543213', email: 'sarah.j@edutrack.edu', createdAt: new Date().toISOString() },
      { id: 'tch_05', empId: 'TCH-105', name: 'Mr. David Miller', department: 'Science & Computer', phone: '+91 9876543214', email: 'david.m@edutrack.edu', createdAt: new Date().toISOString() }
    ];

    // Seed recent attendance records (last 5 days)
    const demoAttendance: AttendanceRecord[] = [];
    const today = new Date();
    const statusesList: AttendanceStatus[] = ['present', 'present', 'present', 'present', 'absent', 'late'];

    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0) continue; // skip Sunday
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Student attendance
      for (const st of demoStudents) {
        // pseudo-random deterministic status
        const randSeed = (st.name.length + d.getDate() * 3 + i) % statusesList.length;
        const status = statusesList[randSeed];
        demoAttendance.push({
          id: `student_${st.id}_${dateStr}`,
          targetType: 'student',
          targetId: st.id,
          classId: st.classId,
          date: dateStr,
          status,
          remarks: status === 'late' ? 'Bus delayed' : '',
          updatedAt: new Date().toISOString()
        });
      }

      // Teacher attendance
      for (const tch of demoTeachers) {
        const tchStatus: AttendanceStatus = (tch.name.length + i) % 7 === 0 ? 'leave' : 'present';
        demoAttendance.push({
          id: `teacher_${tch.id}_${dateStr}`,
          targetType: 'teacher',
          targetId: tch.id,
          date: dateStr,
          status: tchStatus,
          remarks: tchStatus === 'leave' ? 'Casual Leave' : '',
          updatedAt: new Date().toISOString()
        });
      }
    }

    // Seed leave applications
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 2);
    const nextDayStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;

    const demoLeaves: LeaveApplication[] = [
      {
        id: 'leave_demo_1',
        classId: 'cls_10th_a',
        className: '10th - Section A',
        studentId: 'stu_cls_10th_a_1',
        studentName: 'Arjun Kapoor',
        rollNo: '01',
        leaveType: 'Sick / Medical',
        fromDate: todayStr,
        toDate: nextDayStr,
        reason: 'Suffering from high fever and severe throat infection. Doctor advised 3 days complete rest.',
        parentContact: '+91 9820192831',
        status: 'pending',
        appliedDate: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'leave_demo_2',
        classId: 'cls_12th_sci',
        className: '12th - Science',
        studentId: 'stu_cls_12th_sci_2',
        studentName: 'Fatima Zahra',
        rollNo: '02',
        leaveType: 'Academic / Sports',
        fromDate: todayStr,
        toDate: todayStr,
        reason: 'Selected to represent our school at the State Level Science Olympiad finals.',
        parentContact: '+91 9831920194',
        status: 'pending',
        appliedDate: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'leave_demo_3',
        classId: 'cls_5th_b',
        className: '5th - Section B',
        studentId: 'stu_cls_5th_b_2',
        studentName: 'Bhavya Jain',
        rollNo: '02',
        leaveType: 'Family Function',
        fromDate: todayStr,
        toDate: nextDayStr,
        reason: 'Attending elder sister wedding ceremony in hometown.',
        parentContact: '+91 9811223344',
        status: 'approved',
        appliedDate: new Date(Date.now() - 3600000 * 24).toISOString(),
        teacherRemarks: 'Approved by Mrs. Sarah Jenkins. Please submit homework upon return.',
        reviewedDate: new Date(Date.now() - 3600000 * 20).toISOString()
      }
    ];

    this.saveClasses(demoClasses);
    this.saveStudents(demoStudents);
    this.saveTeachers(demoTeachers);
    this.saveAllAttendance(demoAttendance);
    this.saveAllLeaves(demoLeaves);
  }

  // --- Clear / Reset All Data ---
  clearAllData(): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify([]));
  }
}
