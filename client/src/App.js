import React from 'react';
import './App.css';
import Home from './pages/Home';
import DeviceManagement from './pages/DeviceManagement';
import DeviceList from './pages/devices';
import MonitoringDashboard from './pages/monitor';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Signup from './pages/signup';
import Dashboard from './pages/dashboard';
import { AuthProvider } from './pages/AuthContext';
import ProtectedRoute from './pages/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
        <Route path="/home" element={
          <ProtectedRoute>
          <Home />
          </ProtectedRoute>
          } />
        <Route path="/" element={
          <ProtectedRoute>
          <Dashboard />
          </ProtectedRoute>
          } />
        <Route path="/list" element={
          <ProtectedRoute>
          <DeviceList />
          </ProtectedRoute>
          } />
        <Route path="/monitor" element={
          <ProtectedRoute>
          <MonitoringDashboard />
          </ProtectedRoute>
          } />
        
      </Routes>

      <ToastContainer />
    </Router>
    </AuthProvider>
  );
}
export default App;
