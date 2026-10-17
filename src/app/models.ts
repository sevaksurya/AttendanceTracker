export type Grade = 
  | 'LKG' 
  | 'UKG' 
  | '1st' 
  | '2nd' 
  | '3rd' 
  | '4th' 
  | '5th' 
  | '6th' 
  | '7th' 
  | '8th' 
  | '9th' 
  | '10th' 
  | '11th' 
  | '12th';

export interface SchoolClass {
  id: string;
  grade: Grade;
  section: string; // e.g. "A", "B", "C", "Science", "Commerce"
  name: string; // e.g. "Class 10-A", "LKG-A"
  room?: string;
  teacherName?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  classId: string;
  rollNo: string;
  name: string;
  gender?: 'Male' | 'Female' | 'Other';
  parentName?: string;
  phone?: string;
  createdAt: string;
}

export interface Teacher {
  id: string;
  empId: string;
  name: string;
  department: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface AttendanceRecord {
  id: string; // `${targetType}_${targetId}_${date}`
  targetType: 'student' | 'teacher';
  targetId: string;
  classId?: string; // only for student
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  remarks?: string;
  updatedAt: string;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type LeaveType = 'Sick / Medical' | 'Casual / Personal' | 'Family Function' | 'Academic / Sports' | 'Other';

export interface LeaveApplication {
  id: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  leaveType: LeaveType;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  reason: string;
  parentContact: string;
  status: LeaveStatus;
  appliedDate: string;
  teacherRemarks?: string;
  reviewedDate?: string;
}
