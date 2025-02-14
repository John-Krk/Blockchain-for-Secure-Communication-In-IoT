import React, { useState } from 'react';
import Home from './Home';
import DeviceList from './devices';
import DeviceManagement from './DeviceManagement';
import MonitoringDashboard from './monitor';
// import DeviceManagement from './DeviceManagement';
// import DeviceList from './DeviceList';
// import MonitoringDashboard from './MonitoringDashboard';

const Dashboard = () => {
  // Set the default view to "Home"
  const [activeSection, setActiveSection] = useState('home');

  // Helper function to render the selected section
  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return <Home />;
      case 'deviceManagement':
        return <DeviceManagement />;
      case 'deviceList':
        return <DeviceList />;
      case 'monitoring':
        return <MonitoringDashboard />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-blue-600 shadow p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-white text-2xl font-bold">IoT Dashboard</div>
          <ul className="flex space-x-6">
            <li
              className={`cursor-pointer text-white ${
                activeSection === 'home' ? 'underline' : ''
              }`}
              onClick={() => setActiveSection('home')}
            >
              Home
            </li>
            <li
              className={`cursor-pointer text-white ${
                activeSection === 'deviceManagement' ? 'underline' : ''
              }`}
              onClick={() => setActiveSection('deviceManagement')}
            >
              Device Management
            </li>
            <li
              className={`cursor-pointer text-white ${
                activeSection === 'deviceList' ? 'underline' : ''
              }`}
              onClick={() => setActiveSection('deviceList')}
            >
              Device List
            </li>
            <li
              className={`cursor-pointer text-white ${
                activeSection === 'monitoring' ? 'underline' : ''
              }`}
              onClick={() => setActiveSection('monitoring')}
            >
              Monitoring
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        {renderSection()}
      </div>
    </div>
  );
};

export default Dashboard;
