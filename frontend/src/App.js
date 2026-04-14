import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';

import SchoolDetails from './pages/admin/organisation/SchoolDetails';
import Timetable from './pages/admin/organisation/Timetable';
import AddCourse from './pages/admin/organisation/AddCourse';
import CourseList from './pages/admin/organisation/CourseList';
import CourseDetails from './pages/admin/organisation/CourseDetails';
import Calendar from './pages/admin/organisation/Calendar';

import AddStaff from './pages/admin/staff/AddStaff';
import StaffList from './pages/admin/staff/StaffList';
import StaffDetails from './pages/admin/staff/StaffDetails';

import StudentList from './pages/admin/students/StudentList';
import AddStudent from './pages/admin/students/AddStudent';
import StudentDetails from './pages/admin/students/StudentDetails';

import Finance from './pages/admin/finance/Finance';
import Payments from './pages/admin/finance/Payments';

import AddAccommodation from './pages/admin/accommodation/AddAccommodation';
import AccommodationList from './pages/admin/accommodation/AccommodationList';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  return children;
};

const Admin = ({ children }) => <ProtectedRoute role="admin">{children}</ProtectedRoute>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<Admin><Dashboard /></Admin>} />

          {/* Organisation */}
          <Route path="/admin/organisation/school-details" element={<Admin><SchoolDetails /></Admin>} />
          <Route path="/admin/organisation/timetable" element={<Admin><Timetable /></Admin>} />
          <Route path="/admin/organisation/courses/add" element={<Admin><AddCourse /></Admin>} />
          <Route path="/admin/organisation/courses/edit/:id" element={<Admin><AddCourse /></Admin>} />
          <Route path="/admin/organisation/courses/:id" element={<Admin><CourseDetails /></Admin>} />
          <Route path="/admin/organisation/courses" element={<Admin><CourseList /></Admin>} />
          <Route path="/admin/organisation/calendar" element={<Admin><Calendar /></Admin>} />

          {/* Staff */}
          <Route path="/admin/staff/add" element={<Admin><AddStaff /></Admin>} />
          <Route path="/admin/staff/edit/:id" element={<Admin><AddStaff /></Admin>} />
          <Route path="/admin/staff/:id" element={<Admin><StaffDetails /></Admin>} />
          <Route path="/admin/staff" element={<Admin><StaffList /></Admin>} />

          {/* Students */}
          <Route path="/admin/students/add" element={<Admin><AddStudent /></Admin>} />
          <Route path="/admin/students/edit/:id" element={<Admin><AddStudent /></Admin>} />
          <Route path="/admin/students/:id" element={<Admin><StudentDetails /></Admin>} />
          <Route path="/admin/students" element={<Admin><StudentList /></Admin>} />

          {/* Finance */}
          <Route path="/admin/finance" element={<Admin><Finance /></Admin>} />
          <Route path="/admin/finance/invoices" element={<Admin><Finance /></Admin>} />
          <Route path="/admin/finance/income" element={<Admin><Finance /></Admin>} />
          <Route path="/admin/finance/payments" element={<Admin><Payments /></Admin>} />

          {/* Accommodation */}
          <Route path="/admin/accommodation/add" element={<Admin><AddAccommodation /></Admin>} />
          <Route path="/admin/accommodation/edit/:id" element={<Admin><AddAccommodation /></Admin>} />
          <Route path="/admin/accommodation" element={<Admin><AccommodationList /></Admin>} />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
