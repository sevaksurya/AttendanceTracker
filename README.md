# EduTrack — School Attendance & Leave Tracker (LKG to 12th & Faculty)

EduTrack is a web application designed for school attendance and student leave management, covering grades from **LKG to 12th** as well as **Faculty/Teachers**. Built using Angular and Vanilla CSS, it runs purely on the frontend using browser `localStorage` for offline persistence.

---

## 🌟 Key Features

### 1. Dual View Architecture
- **👩‍🏫 Teacher View**: Full dashboard with metric tiles, class-by-class cards, daily attendance recorder, monthly register matrix, student/faculty roster management, and leave approval desk.
- **🎓 Student View**: Self-service student portal to submit leave applications, track approval status and teacher feedback, and check personal attendance percentage and exam eligibility.
- **Role Switcher**: Switch between Teacher and Student portals from the header. The teacher button features a live notification counter badge for pending leave requests.

### 2. Attendance Overview Tiles (Initially Empty)
- **Initial State**: First-time users see empty metric tiles (`--` / `No Attendance Recorded Yet`), accompanied by a welcome banner with quick actions to either add classes or load realistic demo data.
- **Dynamic Stats**:
  - 🟢 **Present Today** (Count & percentage)
  - 🔴 **Absent Today** (Count)
  - 🟡 **Late Arrivals** (Count)
  - 🟣 **Approved Leaves** (Count)
  - 👨‍🏫 **Faculty Attendance** (Present/Total staff count)
  - 🏫 **Class-by-Class Attendance Tiles**: Each class displays enrolled students, attendance status for the selected date, attendance percentage progress bar, and a "Mark Attendance" button.

### 3. Class & Student Management (LKG to 12th)
- **All Standard Grades Supported**: `LKG`, `UKG`, `1st`, `2nd`, `3rd`, `4th`, `5th`, `6th`, `7th`, `8th`, `9th`, `10th`, `11th`, `12th`.
- **Add Class**: Specify grade, section/stream (e.g. `A`, `B`, `Science`, `Commerce`), room number, and assigned class teacher.
- **Add Student**: Add students individually with roll number, full name, gender, and guardian contact details.
- **⚡ Bulk Add Students**: Paste a multi-line list of student names to enroll an entire class with sequential roll numbers.
- **Faculty Management**: Add and manage faculty members with employee ID, department/subject, and contact info.

### 4. Daily Attendance Recording
- **Daily Attendance Marking**: For both students and teachers across any selected date.
- **4-Way Interactive Status Buttons**:
  - `[P]` **Present** (Emerald Green)
  - `[A]` **Absent** (Crimson Red)
  - `[L]` **Late** (Amber Yellow)
  - `[O]` **Leave** (Royal Purple)
- **Approved Leave Auto-Detection**: If a student's leave request was approved by the teacher for that date, the app displays a prominent badge (`🏖️ Approved Leave: [Reason]`) and sets their status to Leave.
- **Bulk Quick Actions**: "Mark All Present", "Mark All Absent", and individual student remarks.
- **Save Feedback**: Animated checkmark and toast notifications confirm successful recording.

### 5. Monthly Attendance Register (Actual School Sheet)
- **School Register Matrix**:
  - Modeled after official school attendance registers.
  - **Sticky Student Name & Roll Column**: Frozen on the left so mobile users can swipe horizontally across dates without losing context.
  - **Days 1 to 31 Columns**: Shows day number and weekday name. Sundays are highlighted as weekends, and today is highlighted with an accent border.
  - **Summary Columns**: Totals for Present (P), Absent (A), Late (L), Leave (O), and overall Attendance % with color badges:
    - 🟢 `>= 85%` High
    - 🟡 `75% - 84%` Average
    - 🔴 `< 75%` Low (Exam warning)
  - **Filters**: Search by student name/roll number, or filter for low attendance (<75%).
  - **Export & Print**: Dedicated "🖨️ Print Sheet" (clean print-optimized stylesheet) and "📥 Export CSV" button.

### 6. Student Leave Application Flow
- **Student Form**:
  - Select class and student name from dropdown (auto-fills roll number).
  - Select leave type: *Sick / Medical, Casual / Personal, Family Function, Academic / Sports, or Other*.
  - From Date & To Date with **live day counter calculation**.
  - Detailed reason and parent contact number.
- **My Leave Status**:
  - Students track submitted applications with status badges: `🟡 Pending Review`, `🟢 Approved`, `🔴 Rejected`.
  - Displays teacher remarks and feedback.
- **Check My Attendance**:
  - Students view their personal attendance gauge (%), days present/absent/on leave, eligibility status (`Eligible for Examinations (≥75%)`), and recent attendance logs.

### 7. Teacher Leave Review Desk
- Counter badge shows pending leave applications.
- Teachers can filter requests by class or status.
- One-click **Approve** or **Reject** with optional feedback notes.
- **Automatic Attendance Sync**: When a leave application is approved, the system automatically writes `leave` records for that student for the entire date span into daily attendance.

### 8. Mobile Compatibility
- Responsive layout adapting to phones, tablets, and desktops.
- **Mobile Bottom Navigation Bar**: Fixed at the bottom on mobile devices (`< 768px`) for easy thumb reach.
- **Horizontal Swipe with Sticky First Column**: Allows smooth swiping across 31 days in the Monthly Register table.
- Touch-friendly tap targets (minimum 44x44px for buttons).
- Modals slide up as mobile bottom sheets.

### 9. Browser Local Storage
- Stores all data in `localStorage`:
  - `edutrack_classes_v1`
  - `edutrack_students_v1`
  - `edutrack_teachers_v1`
  - `edutrack_attendance_v1`
  - `edutrack_leaves_v1`
- Includes a **"✨ Load Demo Data"** button to populate sample LKG to 12th data with one click, and a **"🗑️ Reset All"** button to restore the empty state.

---

## 🚀 How to Run

### Option 1: Angular Development Server (Recommended)
From `AttendanceTracker/AttendanceTracker`:
```bash
npm install
npm start
```
Open your browser at `http://localhost:54285/` (or the port displayed in terminal).

### Option 2: Visual Studio
Open `AttendanceTracker.slnx` in Visual Studio and press **F5** or click **Start**.

### Option 3: Production Build
```bash
npm run build
```
The compiled bundle will be generated in `dist/AttendanceTracker/browser/`.
