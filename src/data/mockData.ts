export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface SubjectAttendance {
  subject: string;
  attendance: number;
  marks: number;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  course: string;
  semester: number;
  attendance: number;
  cgpa: number;
  previousGpa: number;
  failedSubjects: number;
  assignmentCompletion: number;
  internalMarks: number;
  lmsActivity: number;
  participation: number;
  libraryUsage: number;
  financialStress: number;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  riskFactors: { factor: string; weight: number }[];
  mentor: string;
  mentorId: string;
  lastActivity: string;
  subjects: SubjectAttendance[];
  gpaHistory: { term: string; gpa: number }[];
}

export const DEPARTMENTS = [
  "Computer Science",
  "AI & ML",
  "Information Technology",
  "Electronics",
  "Mechanical",
];

export const DEPT_SHORT: Record<string, string> = {
  "Computer Science": "CSE",
  "AI & ML": "AI&ML",
  "Information Technology": "IT",
  Electronics: "ECE",
  Mechanical: "MECH",
};

export interface Practitioner {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  studentsAssigned: number;
  atRisk: number;
  interventions: number;
  status: "Active" | "On Leave";
  avgAttendance: number;
}

export const practitioners: Practitioner[] = [
  { id: "FAC101", name: "Dr. Anil Sharma", email: "anil.sharma@edupredict.ai", department: "Computer Science", designation: "Associate Professor", studentsAssigned: 128, atRisk: 17, interventions: 34, status: "Active", avgAttendance: 81 },
  { id: "FAC102", name: "Dr. Meera Iyer", email: "meera.iyer@edupredict.ai", department: "AI & ML", designation: "Professor", studentsAssigned: 112, atRisk: 12, interventions: 28, status: "Active", avgAttendance: 84 },
  { id: "FAC103", name: "Prof. Rakesh Nair", email: "rakesh.nair@edupredict.ai", department: "Information Technology", designation: "Assistant Professor", studentsAssigned: 96, atRisk: 21, interventions: 40, status: "Active", avgAttendance: 78 },
  { id: "FAC104", name: "Dr. Kavita Deshmukh", email: "kavita.d@edupredict.ai", department: "Electronics", designation: "Associate Professor", studentsAssigned: 104, atRisk: 24, interventions: 31, status: "Active", avgAttendance: 76 },
  { id: "FAC105", name: "Prof. Sandeep Rao", email: "sandeep.rao@edupredict.ai", department: "Mechanical", designation: "Assistant Professor", studentsAssigned: 118, atRisk: 29, interventions: 22, status: "On Leave", avgAttendance: 74 },
  { id: "FAC106", name: "Dr. Neha Kulkarni", email: "neha.k@edupredict.ai", department: "Computer Science", designation: "Professor", studentsAssigned: 134, atRisk: 15, interventions: 37, status: "Active", avgAttendance: 83 },
  { id: "FAC107", name: "Prof. Vivek Menon", email: "vivek.menon@edupredict.ai", department: "AI & ML", designation: "Assistant Professor", studentsAssigned: 88, atRisk: 9, interventions: 19, status: "Active", avgAttendance: 86 },
  { id: "FAC108", name: "Dr. Shalini Bose", email: "shalini.bose@edupredict.ai", department: "Information Technology", designation: "Associate Professor", studentsAssigned: 102, atRisk: 18, interventions: 26, status: "Active", avgAttendance: 79 },
  { id: "FAC109", name: "Prof. Arun Prakash", email: "arun.prakash@edupredict.ai", department: "Electronics", designation: "Assistant Professor", studentsAssigned: 91, atRisk: 20, interventions: 24, status: "Active", avgAttendance: 77 },
  { id: "FAC110", name: "Dr. Pooja Bhatt", email: "pooja.bhatt@edupredict.ai", department: "Mechanical", designation: "Professor", studentsAssigned: 110, atRisk: 26, interventions: 30, status: "Active", avgAttendance: 75 },
];

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "Critical";
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

const NAMES = [
  "Rahul Sharma", "Priya Verma", "Arjun Singh", "Ananya Gupta", "Vikram Patel",
  "Sneha Reddy", "Aditya Joshi", "Kavya Nair", "Rohan Mehta", "Ishita Rao",
  "Karthik Iyer", "Neha Bansal", "Siddharth Kulkarni", "Meenakshi Pillai", "Aman Chauhan",
  "Divya Krishnan", "Nikhil Bhardwaj", "Pooja Shetty", "Harshita Jain", "Manav Kapoor",
  "Ritika Sen", "Yash Agarwal", "Sanjana Menon", "Devendra Yadav", "Tanvi Desai",
  "Aakash Tiwari", "Shruti Chatterjee", "Varun Malhotra", "Lakshmi Subramanian", "Imran Qureshi",
];

const COURSES: Record<string, string> = {
  "Computer Science": "B.Tech Computer Science & Engineering",
  "AI & ML": "B.Tech Artificial Intelligence & Machine Learning",
  "Information Technology": "B.Tech Information Technology",
  Electronics: "B.Tech Electronics & Communication",
  Mechanical: "B.Tech Mechanical Engineering",
};

const SUBJECTS: Record<string, string[]> = {
  "Computer Science": ["Data Structures", "Operating Systems", "DBMS", "Computer Networks", "Mathematics III"],
  "AI & ML": ["Machine Learning", "Neural Networks", "Python for AI", "Linear Algebra", "Data Mining"],
  "Information Technology": ["Web Technologies", "Cloud Computing", "Software Engineering", "DBMS", "Discrete Maths"],
  Electronics: ["Digital Electronics", "Signals & Systems", "Microprocessors", "Control Systems", "EM Theory"],
  Mechanical: ["Thermodynamics", "Fluid Mechanics", "Machine Design", "Manufacturing", "Engineering Maths"],
};

const ACTIVITY = ["Today", "1 day ago", "2 days ago", "3 days ago", "5 days ago", "1 week ago"];

// Deterministic pseudo-random so the mock dataset is stable between renders/SSR.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function buildStudents(): Student[] {
  const rand = seeded(42);
  return NAMES.map((name, i) => {
    const department = DEPARTMENTS[i % DEPARTMENTS.length]!;
    const attendance = Math.round(55 + rand() * 42);
    const cgpa = Number((5.4 + rand() * 4.2).toFixed(1));
    const failedSubjects = attendance < 68 ? Math.round(rand() * 2) + 1 : rand() > 0.85 ? 1 : 0;
    const assignmentCompletion = Math.round(Math.min(100, attendance + rand() * 22 - 6));
    const lmsActivity = Math.round(Math.min(100, attendance + rand() * 26 - 12));
    const participation = Math.round(Math.min(100, 40 + rand() * 58));
    const libraryUsage = Math.round(20 + rand() * 75);
    const financialStress = Math.round(rand() * 90);
    const previousGpa = Number(Math.max(4.5, Math.min(9.8, cgpa + (rand() * 1.2 - 0.5))).toFixed(1));

    // Mock "model" scoring: weighted deficits.
    const raw =
      (100 - attendance) * 0.34 +
      (10 - cgpa) * 10 * 0.24 +
      failedSubjects * 11 +
      (100 - assignmentCompletion) * 0.16 +
      (100 - lmsActivity) * 0.07 +
      (100 - participation) * 0.05 +
      financialStress * 0.08;
    const riskScore = Math.max(6, Math.min(96, Math.round(raw)));
    const riskLevel = riskLevelFromScore(riskScore);
    const mentor = practitioners[i % practitioners.length]!;

    const factors = [
      { factor: "Attendance", weight: Math.round(100 - attendance) },
      { factor: "Academic Performance", weight: Math.round((10 - cgpa) * 10) },
      { factor: "Failed Subjects", weight: failedSubjects * 30 },
      { factor: "Assignment Completion", weight: 100 - assignmentCompletion },
      { factor: "Financial Stress", weight: financialStress },
      { factor: "Engagement", weight: 100 - lmsActivity },
    ]
      .map((f) => ({ ...f, weight: Math.max(6, Math.min(96, f.weight)) }))
      .sort((a, b) => b.weight - a.weight);

    const subjectList = SUBJECTS[department]!;
    const subjects = subjectList.map((subject: string, si: number) => ({
      subject,
      attendance: Math.max(38, Math.min(99, attendance + Math.round(rand() * 24 - 12 + si))),
      marks: Math.max(28, Math.min(98, Math.round(cgpa * 9 + rand() * 16 - 8))),
    }));

    const semester = 3 + (i % 4);
    const gpaHistory = Array.from({ length: semester }, (_, k) => ({
      term: `Sem ${k + 1}`,
      gpa: Number(Math.max(4.4, Math.min(9.9, cgpa + (semester - 1 - k) * 0.22 + (rand() * 0.5 - 0.25))).toFixed(1)),
    }));

    return {
      id: `STU${1024 + i * 4}`,
      name,
      email: `${name.toLowerCase().split(" ").join(".")}@student.edupredict.ai`,
      phone: `+91 9${Math.round(100000000 + rand() * 899999999)}`.slice(0, 14),
      department,
      course: COURSES[department]!,
      semester,
      attendance,
      cgpa,
      previousGpa,
      failedSubjects,
      assignmentCompletion,
      internalMarks: Math.round(cgpa * 8.5 + rand() * 10),
      lmsActivity,
      participation,
      libraryUsage,
      financialStress,
      riskScore,
      riskLevel,
      confidence: Math.round(84 + rand() * 13),
      riskFactors: factors,
      mentor: mentor.name,
      mentorId: mentor.id,
      lastActivity: ACTIVITY[i % ACTIVITY.length]!,
      subjects,
      gpaHistory,
    };
  });
}

export const students: Student[] = buildStudents();

export function getStudent(id: string) {
  return students.find((s) => s.id === id);
}

// --- Institution level aggregates -------------------------------------------

export const institutionStats = {
  totalStudents: 2548,
  atRisk: 173,
  highRisk: 42,
  avgAttendance: 82.6,
  needIntervention: 68,
  predictionAccuracy: 91.4,
  predictionsGenerated: 2548,
  modelConfidence: 89.7,
};

export const riskDistribution = [
  { name: "Low Risk", value: 1720, key: "low" },
  { name: "Medium Risk", value: 655, key: "medium" },
  { name: "High Risk", value: 131, key: "high" },
  { name: "Critical", value: 42, key: "critical" },
];

export const riskTrend = {
  Monthly: [
    { period: "Jan", high: 118, medium: 604, low: 1802 },
    { period: "Feb", high: 126, medium: 621, low: 1780 },
    { period: "Mar", high: 141, medium: 648, low: 1742 },
    { period: "Apr", high: 152, medium: 662, low: 1720 },
    { period: "May", high: 147, medium: 671, low: 1714 },
    { period: "Jun", high: 138, medium: 659, low: 1731 },
    { period: "Jul", high: 131, medium: 655, low: 1762 },
  ],
  Weekly: [
    { period: "W1", high: 136, medium: 668, low: 1738 },
    { period: "W2", high: 141, medium: 662, low: 1741 },
    { period: "W3", high: 134, medium: 657, low: 1749 },
    { period: "W4", high: 129, medium: 651, low: 1756 },
    { period: "W5", high: 133, medium: 649, low: 1758 },
    { period: "W6", high: 128, medium: 644, low: 1764 },
    { period: "W7", high: 131, medium: 655, low: 1762 },
  ],
  Semester: [
    { period: "Sem 1", high: 96, medium: 540, low: 1902 },
    { period: "Sem 2", high: 108, medium: 578, low: 1856 },
    { period: "Sem 3", high: 121, medium: 612, low: 1804 },
    { period: "Sem 4", high: 134, medium: 640, low: 1762 },
    { period: "Sem 5", high: 142, medium: 664, low: 1728 },
    { period: "Sem 6", high: 131, medium: 655, low: 1762 },
  ],
} as const;

export type TrendRange = keyof typeof riskTrend;

export const predictionFactors = [
  { factor: "Attendance", impact: 82 },
  { factor: "Academic Performance", impact: 74 },
  { factor: "Failed Subjects", impact: 68 },
  { factor: "Assignment Completion", impact: 59 },
  { factor: "Financial Stress", impact: 47 },
  { factor: "Engagement", impact: 41 },
];

export const departmentAnalytics = [
  { department: "Computer Science", short: "CSE", risk: 8.2, students: 612, atRisk: 38, attendance: 85.4, avgCgpa: 7.9, interventions: 22 },
  { department: "AI & ML", short: "AI&ML", risk: 6.7, students: 428, atRisk: 24, attendance: 87.1, avgCgpa: 8.2, interventions: 15 },
  { department: "Information Technology", short: "IT", risk: 9.1, students: 506, atRisk: 41, attendance: 82.3, avgCgpa: 7.5, interventions: 27 },
  { department: "Electronics", short: "ECE", risk: 11.3, students: 494, atRisk: 47, attendance: 79.6, avgCgpa: 7.1, interventions: 31 },
  { department: "Mechanical", short: "MECH", risk: 13.4, students: 508, atRisk: 58, attendance: 77.2, avgCgpa: 6.8, interventions: 34 },
];

export const departmentHeatmap = [
  { department: "CSE", attendance: 12, academics: 18, assignments: 15, engagement: 9, finance: 21 },
  { department: "AI&ML", attendance: 9, academics: 13, assignments: 11, engagement: 7, finance: 18 },
  { department: "IT", attendance: 21, academics: 24, assignments: 19, engagement: 14, finance: 26 },
  { department: "ECE", attendance: 28, academics: 31, assignments: 26, engagement: 19, finance: 33 },
  { department: "MECH", attendance: 36, academics: 34, assignments: 31, engagement: 24, finance: 38 },
];

export const modelMetrics = {
  name: "Student Dropout Prediction Model",
  version: "v3.2.1",
  algorithm: "Gradient Boosted Trees (ensemble)",
  status: "Active",
  accuracy: 91.4,
  precision: 89.7,
  recall: 87.9,
  f1: 88.8,
  lastUpdated: "Today, 06:15 AM",
  trainingRecords: "48,120",
  features: 24,
};

export const modelAccuracyHistory = [
  { version: "v2.6", accuracy: 84.1 },
  { version: "v2.8", accuracy: 86.5 },
  { version: "v3.0", accuracy: 88.2 },
  { version: "v3.1", accuracy: 90.1 },
  { version: "v3.2", accuracy: 91.4 },
];

// --- Messaging ---------------------------------------------------------------

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  name: string;
  role: string;
  meta: string;
  online: boolean;
  unread: number;
  lastTime: string;
  audience: ("admin" | "practitioner" | "student")[];
  messages: ChatMessage[];
}

export const conversations: Conversation[] = [
  {
    id: "c1",
    name: "Rahul Sharma",
    role: "Student · CSE",
    meta: "Risk 87% · High",
    online: true,
    unread: 2,
    lastTime: "10:24 AM",
    audience: ["practitioner", "admin"],
    messages: [
      { id: "m1", from: "me", text: "Hi Rahul, I noticed your attendance has decreased recently. Is everything okay?", time: "10:02 AM" },
      { id: "m2", from: "them", text: "Yes sir, I was having some issues but I'm trying to improve.", time: "10:11 AM" },
      { id: "m3", from: "me", text: "That's good to hear. Let's schedule a meeting tomorrow.", time: "10:14 AM" },
      { id: "m4", from: "them", text: "Sure sir, 3 PM works for me. Thank you for checking in.", time: "10:24 AM" },
    ],
  },
  {
    id: "c2",
    name: "Priya Verma",
    role: "Student · AI & ML",
    meta: "Risk 78% · High",
    online: false,
    unread: 1,
    lastTime: "Yesterday",
    audience: ["practitioner", "admin"],
    messages: [
      { id: "m1", from: "me", text: "Priya, your Data Mining assignment is still pending. Do you need extra time?", time: "4:32 PM" },
      { id: "m2", from: "them", text: "Ma'am, I'll submit it by Friday. I was unwell last week.", time: "5:01 PM" },
      { id: "m3", from: "me", text: "Noted. Please share the medical note so we can update your record.", time: "5:06 PM" },
    ],
  },
  {
    id: "c3",
    name: "Dr. Anil Sharma",
    role: "Practitioner · CSE",
    meta: "128 students assigned",
    online: true,
    unread: 0,
    lastTime: "9:40 AM",
    audience: ["admin", "student"],
    messages: [
      { id: "m1", from: "them", text: "Good morning. I've reviewed the 17 at-risk students flagged by the model this week.", time: "9:12 AM" },
      { id: "m2", from: "me", text: "Thanks. Could you prioritise the 5 critical cases for counselling first?", time: "9:25 AM" },
      { id: "m3", from: "them", text: "Already scheduled. Mentor meetings start Wednesday afternoon.", time: "9:40 AM" },
    ],
  },
  {
    id: "c4",
    name: "Arjun Singh",
    role: "Student · IT",
    meta: "Risk 61% · Medium",
    online: true,
    unread: 0,
    lastTime: "Mon",
    audience: ["practitioner", "admin"],
    messages: [
      { id: "m1", from: "them", text: "Sir, I have joined the extra Cloud Computing tutorial batch.", time: "2:10 PM" },
      { id: "m2", from: "me", text: "Excellent. Your attendance trend is already improving.", time: "2:22 PM" },
    ],
  },
  {
    id: "c5",
    name: "Dr. Meera Iyer",
    role: "Practitioner · AI & ML",
    meta: "112 students assigned",
    online: false,
    unread: 3,
    lastTime: "Mon",
    audience: ["admin", "student"],
    messages: [
      { id: "m1", from: "them", text: "The department risk report for AI & ML is ready for your review.", time: "11:04 AM" },
      { id: "m2", from: "me", text: "Great, I'll go through it before the academic council meeting.", time: "11:20 AM" },
      { id: "m3", from: "them", text: "Also requesting two additional counselling slots next week.", time: "11:22 AM" },
    ],
  },
  {
    id: "c6",
    name: "Academic Support Cell",
    role: "Department · Student Welfare",
    meta: "Institutional channel",
    online: true,
    unread: 0,
    lastTime: "Sun",
    audience: ["admin", "practitioner", "student"],
    messages: [
      { id: "m1", from: "them", text: "Remedial classes for Mathematics III begin next Monday at 8 AM.", time: "3:15 PM" },
      { id: "m2", from: "me", text: "Noted, I'll inform the flagged students in my batch.", time: "3:40 PM" },
    ],
  },
];

// --- Notifications ----------------------------------------------------------

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "ai" | "message" | "alert" | "deadline";
  unread: boolean;
}

export const notifications: Notification[] = [
  { id: "n1", title: "AI risk assessment updated", body: "Your AI risk assessment has been updated with this week's attendance data.", time: "12 min ago", type: "ai", unread: true },
  { id: "n2", title: "New message from Dr. Sharma", body: "\"Let's schedule a meeting tomorrow at 3 PM.\"", time: "1 hour ago", type: "message", unread: true },
  { id: "n3", title: "Attendance dropped below 75%", body: "Mathematics III attendance is now 71%. Two more classes will restore eligibility.", time: "4 hours ago", type: "alert", unread: true },
  { id: "n4", title: "Assignment deadline tomorrow", body: "Data Structures Assignment 4 is due tomorrow at 11:59 PM.", time: "Yesterday", type: "deadline", unread: false },
  { id: "n5", title: "Mentoring session confirmed", body: "Mentor meeting with Dr. Anil Sharma confirmed for Wednesday, 3:00 PM.", time: "2 days ago", type: "message", unread: false },
];

// --- Student (self) view -----------------------------------------------------

export const studentSelf = {
  id: "STU1024",
  name: "Rahul Sharma",
  firstName: "Rahul",
  email: "student@edupredict.ai",
  phone: "+91 98204 41027",
  department: "Computer Science",
  course: "B.Tech Computer Science & Engineering",
  semester: 5,
  mentor: "Dr. Anil Sharma",
  cgpa: 7.2,
  attendance: 78,
  assignments: 84,
  riskScore: 23,
  riskLevel: "Low" as RiskLevel,
  confidence: 91,
  gpaTrend: [
    { term: "Semester 1", gpa: 6.8, attendance: 82, assignments: 78 },
    { term: "Semester 2", gpa: 7.0, attendance: 80, assignments: 81 },
    { term: "Semester 3", gpa: 6.9, attendance: 74, assignments: 76 },
    { term: "Semester 4", gpa: 7.2, attendance: 78, assignments: 84 },
  ],
  subjects: [
    { subject: "Data Structures", attendance: 74, marks: 68, target: 75 },
    { subject: "Operating Systems", attendance: 81, marks: 76, target: 75 },
    { subject: "DBMS", attendance: 86, marks: 82, target: 75 },
    { subject: "Computer Networks", attendance: 79, marks: 71, target: 75 },
    { subject: "Mathematics III", attendance: 71, marks: 58, target: 75 },
  ],
  monthlyAttendance: [
    { month: "Jan", attendance: 84 },
    { month: "Feb", attendance: 80 },
    { month: "Mar", attendance: 75 },
    { month: "Apr", attendance: 72 },
    { month: "May", attendance: 76 },
    { month: "Jun", attendance: 78 },
    { month: "Jul", attendance: 81 },
  ],
  improvements: [
    "Maintain attendance above 75%",
    "Complete pending assignments",
    "Improve Mathematics performance",
    "Attend upcoming mentoring session",
  ],
  recommendations: [
    { icon: "📚", category: "Academic", text: "Spend 3 additional hours per week on Data Structures." },
    { icon: "📅", category: "Attendance", text: "Your attendance in Mathematics is below your target." },
    { icon: "🎯", category: "Performance", text: "Your programming scores have improved 12% this semester." },
    { icon: "💬", category: "Mentorship", text: "Your mentor has suggested a follow-up meeting." },
  ],
};

export const interventionQueue = [
  { id: "iv1", studentId: "STU1024", student: "Rahul Sharma", risk: 87, mainRisk: "Low Attendance", lastInteraction: "2 days ago", recommendation: "Schedule a one-on-one meeting within 3 days." },
  { id: "iv2", studentId: "STU1040", student: "Ananya Gupta", risk: 81, mainRisk: "Assignment Backlog", lastInteraction: "4 days ago", recommendation: "Assign a peer study partner and review pending submissions." },
  { id: "iv3", studentId: "STU1028", student: "Priya Verma", risk: 78, mainRisk: "Failed Subjects", lastInteraction: "1 day ago", recommendation: "Enroll in remedial classes before internal assessment 2." },
  { id: "iv4", studentId: "STU1044", student: "Vikram Patel", risk: 74, mainRisk: "Low Engagement", lastInteraction: "1 week ago", recommendation: "Invite to project mentoring circle to rebuild engagement." },
  { id: "iv5", studentId: "STU1032", student: "Arjun Singh", risk: 61, mainRisk: "Declining GPA", lastInteraction: "Today", recommendation: "Monitor next assessment and share revision plan." },
];

export const reportTemplates = [
  { id: "r1", title: "Student Risk Report", description: "Individual dropout risk scores, contributing factors and AI confidence for every enrolled student.", records: 2548, updated: "Today, 07:10 AM" },
  { id: "r2", title: "Department Risk Report", description: "Department-wise comparison of dropout probability, attendance and academic performance.", records: 5, updated: "Today, 06:55 AM" },
  { id: "r3", title: "Attendance Report", description: "Subject-wise and monthly attendance trends with eligibility warnings below 75%.", records: 2548, updated: "Yesterday, 09:20 PM" },
  { id: "r4", title: "Academic Performance Report", description: "CGPA distribution, failed subject analysis and internal assessment summaries.", records: 2548, updated: "Yesterday, 08:05 PM" },
  { id: "r5", title: "Intervention Report", description: "Logged interventions, mentor meetings and measured outcome of each action.", records: 342, updated: "2 days ago" },
];
