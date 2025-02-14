import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DeviceManagement = () => {
  const [deviceId, setDeviceId] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [location, setLocation] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [loadingScans, setLoadingScans] = useState(false);

  // Fetch scan results from the JSON file
  useEffect(() => {
    const fetchScanResults = async () => {
      setLoadingScans(true);
      try {
        // Adjust the URL if your file is served from a different endpoint
        const response = await axios.get('http://localhost:3000/scan_results.json');
        setScanResults(response.data);
      } catch (error) {
        console.error('Error fetching scan results:', error);
      }
      setLoadingScans(false);
    };

    fetchScanResults();
  }, []);

  // When a scanned device is clicked, autofill the IP and MAC fields.
  const handleScanSelect = (device) => {
    setIpAddress(device.ip || '');
    setMacAddress(device.mac || '');
    // Optionally, you can autofill additional fields if available
  };

  const registerDevice = async () => {
    setSubmitting(true);
    try {
      const response = await axios.post('http://localhost:3000/register-device', {
        deviceId,
        deviceType,
        location,
        macAddress,
        ipAddress,
      });
      alert('Device Registered Successfully!');
      console.log(response.data);
    } catch (error) {
      alert(
        'Error registering device: ' +
          (error.response ? error.response.data : error.message)
      );
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-5">
      <h1 className="text-2xl font-bold text-center mb-6">Register New Device</h1>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Registration Form */}
        <div className="w-full md:w-1/2 bg-white p-5 rounded shadow">
          <div className="space-y-4">
            <InputField
              label="Device ID"
              value={deviceId}
              onChange={setDeviceId}
              placeholder="Enter Device ID"
            />
            <InputField
              label="Device Type"
              value={deviceType}
              onChange={setDeviceType}
              placeholder="Enter Device Type"
            />
            <InputField
              label="Location"
              value={location}
              onChange={setLocation}
              placeholder="Enter Location"
            />
            <InputField
              label="MAC Address"
              value={macAddress}
              onChange={setMacAddress}
              placeholder="Enter MAC Address"
            />
            <InputField
              label="IP Address"
              value={ipAddress}
              onChange={setIpAddress}
              placeholder="Enter IP Address"
            />
            <button
              onClick={registerDevice}
              disabled={submitting}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Device'}
            </button>
          </div>
        </div>

        {/* Scan Results Section */}
        <div className="w-full md:w-1/2 bg-white p-5 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Scanned Devices</h2>
          {loadingScans ? (
            <p>Loading scan results...</p>
          ) : scanResults && scanResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      IP Address
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      MAC Address
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scanResults.map((device, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {device.ip || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {device.mac || 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleScanSelect(device)}
                          className="bg-green-500 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No scan results available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, value, onChange, placeholder }) => (
  <label className="block">
    <span className="text-gray-700">{label}:</span>
    <input
      type="text"
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

export default DeviceManagement;
