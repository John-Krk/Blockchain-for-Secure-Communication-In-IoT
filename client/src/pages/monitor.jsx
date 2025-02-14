import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const MonitoringDashboard = () => {
  // State for sensor data from WS, stored as a dictionary keyed by deviceId
  const [sensorDataMap, setSensorDataMap] = useState({});
  // Registered devices from blockchain (an array of device objects)
  const [registeredDevices, setRegisteredDevices] = useState([]);
  // UI controls
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyRegistered, setShowOnlyRegistered] = useState(true);
  // Updated sort options include 'humidity' and 'battery'
  const [sortField, setSortField] = useState('lastActive'); // Options: 'deviceId', 'temperature', 'humidity', 'battery', 'lastActive'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'
  
  const wsRef = useRef(null);

  // Fetch registered devices from blockchain REST endpoint
  const fetchRegisteredDevices = async () => {
    try {
      const { data } = await axios.get('http://localhost:3000/get-devices');
      // Expecting data to be an array of device objects with a deviceId property
      setRegisteredDevices(data);
    } catch (error) {
      console.error('Error fetching registered devices:', error.message);
    }
  };

  // Fetch the registered devices on component mount
  useEffect(() => {
    fetchRegisteredDevices();
  }, []);

  // Setup WebSocket connection to advanced simulation server
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Update sensorDataMap: one record per deviceId
        setSensorDataMap(prev => ({
          ...prev,
          [data.deviceId]: data
        }));
      } catch (error) {
        console.error('Error parsing WS message:', error.message);
      }
    };

    socket.onclose = () => console.log('WebSocket disconnected');

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  // Merge registered devices with sensor data (from simulation)
  const mergedDevices = registeredDevices.map(device => {
    const sensor = sensorDataMap[device.deviceId] || {};
    return { ...device, ...sensor };
  });

  // If "Show only registered" is off, also include unregistered devices from sensor data
  let combinedDevices = [];
  if (showOnlyRegistered) {
    combinedDevices = mergedDevices;
  } else {
    const registeredIds = registeredDevices.map(d => d.deviceId);
    const unregisteredDevices = Object.values(sensorDataMap).filter(
      d => !registeredIds.includes(d.deviceId)
    );
    combinedDevices = [...mergedDevices, ...unregisteredDevices];
  }

  // Apply search filter (by deviceId)
  const filteredDevices = combinedDevices.filter(device =>
    device.deviceId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorting logic based on the selected field and direction
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    let valA, valB;
    if (sortField === 'deviceId') {
      valA = a.deviceId.toLowerCase();
      valB = b.deviceId.toLowerCase();
    } else if (sortField === 'temperature') {
      valA = parseFloat(a.temperature) || 0;
      valB = parseFloat(b.temperature) || 0;
    } else if (sortField === 'humidity') {
      valA = parseFloat(a.humidity) || 0;
      valB = parseFloat(b.humidity) || 0;
    } else if (sortField === 'battery') {
      valA = parseFloat(a.battery) || 0;
      valB = parseFloat(b.battery) || 0;
    } else if (sortField === 'lastActive') {
      // Use sensor's lastActive if available; otherwise fallback to blockchain info
      valA = new Date(a.lastActive || a.lastActiveTimestamp || 0);
      valB = new Date(b.lastActive || b.lastActiveTimestamp || 0);
    }
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto p-5">
      <h1 className="text-2xl font-bold text-center mb-6">Real-Time Monitoring Dashboard</h1>

      {/* Controls: Search, Toggle, and Sorting Options */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by Device ID..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="border p-2 rounded w-full sm:w-1/3 mb-2 sm:mb-0"
        />
        <div className="flex items-center mb-2 sm:mb-0">
          <label className="mr-2">
            <input
              type="checkbox"
              checked={showOnlyRegistered}
              onChange={e => setShowOnlyRegistered(e.target.checked)}
            />
            <span className="ml-1">Show only registered devices</span>
          </label>
        </div>
        <div className="flex items-center">
          <label className="mr-2 font-medium">Sort By:</label>
          <select
            value={sortField}
            onChange={e => setSortField(e.target.value)}
            className="border p-2 rounded mr-2"
          >
            <option value="deviceId">Device ID</option>
            <option value="temperature">Temperature</option>
            <option value="humidity">Humidity</option>
            <option value="battery">Battery</option>
            <option value="lastActive">Last Active</option>
          </select>
          <button
            onClick={() => setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            className="border p-2 rounded"
          >
            {sortDirection === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>
      </div>

      {sortedDevices.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 shadow rounded">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature (°C)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Humidity (%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Battery (%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motion Detected</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fault</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedDevices.map((device, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{device.deviceId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {device.temperature !== undefined ? device.temperature : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {device.humidity !== undefined ? device.humidity : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {device.battery !== undefined ? device.battery : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {device.motionDetected !== undefined
                      ? device.motionDetected
                        ? 'Yes'
                        : 'No'
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {device.fault !== undefined
                      ? device.fault
                        ? 'Yes'
                        : 'No'
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {device.lastActive
                      ? new Date(device.lastActive).toLocaleString()
                      : device.lastActiveTimestamp
                      ? new Date(device.lastActiveTimestamp * 1000).toLocaleString()
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {device.location ? device.location : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {device.deviceType ? device.deviceType : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No device data available.</p>
      )}
    </div>
  );
};

export default MonitoringDashboard;
