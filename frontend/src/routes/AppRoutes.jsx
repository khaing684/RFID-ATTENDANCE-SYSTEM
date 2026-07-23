import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from '../layout/MainLayout';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/dashboard/Dashboard';
import Tags from '../pages/tags/Tags';
import Devices from '../pages/devices/Devices';
import ScanLogs from '../pages/scanlogs/ScanLogs';
import Users from '../pages/users/Users';
import Settings from '../pages/settings/Settings';
import Reports from '../pages/reports/Reports';
import Classes from '../pages/classes/Classes';
import NotFound from '../pages/errors/NotFound';
import Timetable from '../pages/timetable/Timetable';

/** Token ရှိမှသာ protected page တွေကိုပြမယ် */
function PrivateRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
  return token ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root → Login ကို အမြဲပြမယ် (token ရှိရှိမရှိရှိ) */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public - login/register ကို အမြဲပြမယ် */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected - token လိုအပ် */}
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tags" element={<Tags />} />
        <Route path="devices" element={<Devices />} />
        <Route path="scanlogs" element={<ScanLogs />} />
        <Route path="users" element={<Users />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="classes" element={<Classes />} />
        <Route path="timetable" element={<Timetable/>} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}