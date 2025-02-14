import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DeviceList = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDevice, setEditingDevice] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Function to fetch devices from the server
  const fetchDevices = async () => {
    try {
      const { data } = await axios.get('http://localhost:3000/get-devices');
      console.log('API Response:', data); // Log to verify data structure

      if (Array.isArray(data)) {
        const formattedDevices = data.map(item => ({
          deviceId: item.deviceId,
          deviceType: item.deviceType,
          location: item.location,
          macAddress: item.macAddress,
          ipAddress: item.ipAddress,
          isRegistered: item.isRegistered,
          owner: item.owner,
          lastActiveTimestamp: item.lastActiveTimestamp
        }));
        setDevices(formattedDevices);
      } else {
        console.error('Unexpected data format:', data);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      alert('Error fetching devices: ' + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // Set the device to be edited
  const handleEditClick = (device) => {
    setEditingDevice({ ...device });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingDevice(null);
  };

  // Handle changes to any of the input fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingDevice(prev => ({ ...prev, [name]: value }));
  };

  // Save the updated device details by calling the backend
  const handleSave = async () => {
    const payload = {
      deviceId: editingDevice.deviceId,
      newDeviceType: editingDevice.deviceType,
      newLocation: editingDevice.location,
      newMacAddress: editingDevice.macAddress,
      newIpAddress: editingDevice.ipAddress
    };

    try {
      setUpdating(true);
      await axios.post('http://localhost:3000/update-device', payload);
      alert('Device updated successfully!');
      setEditingDevice(null);
      fetchDevices(); // Refresh devices list
    } catch (error) {
      console.error('Error updating device:', error);
      alert('Error updating device: ' + error.message);
    }
    setUpdating(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-5">
      <h1 className="text-2xl font-bold text-center mb-6">Registered Devices</h1>
      {loading ? (
        <p>Loading devices...</p>
      ) : (
        <div className="space-y-4">
          {devices.length > 0 ? (
            devices.map((device, index) => (
              <div key={index} className="p-4 shadow rounded bg-white">
                <p><strong>ID:</strong> {device.deviceId}</p>
                {editingDevice && editingDevice.deviceId === device.deviceId ? (
                  <div>
                    <label>
                      <strong>Type:</strong>
                      <input
                        type="text"
                        name="deviceType"
                        value={editingDevice.deviceType}
                        onChange={handleInputChange}
                        className="border p-1 ml-2"
                      />
                    </label>
                    <br />
                    <label>
                      <strong>Location:</strong>
                      <input
                        type="text"
                        name="location"
                        value={editingDevice.location}
                        onChange={handleInputChange}
                        className="border p-1 ml-2"
                      />
                    </label>
                    <br />
                    <label>
                      <strong>MAC Address:</strong>
                      <input
                        type="text"
                        name="macAddress"
                        value={editingDevice.macAddress}
                        onChange={handleInputChange}
                        className="border p-1 ml-2"
                      />
                    </label>
                    <br />
                    <label>
                      <strong>IP Address:</strong>
                      <input
                        type="text"
                        name="ipAddress"
                        value={editingDevice.ipAddress}
                        onChange={handleInputChange}
                        className="border p-1 ml-2"
                      />
                    </label>
                    <br />
                    <button
                      onClick={handleSave}
                      disabled={updating}
                      className="bg-green-500 text-white px-3 py-1 rounded mt-2"
                    >
                      {updating ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-500 text-white px-3 py-1 rounded mt-2 ml-2"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p><strong>Type:</strong> {device.deviceType}</p>
                    <p><strong>Location:</strong> {device.location}</p>
                    <p><strong>MAC Address:</strong> {device.macAddress || 'N/A'}</p>
                    <p><strong>IP Address:</strong> {device.ipAddress || 'N/A'}</p>
                    <p><strong>Status:</strong> {device.isRegistered ? 'Active' : 'Inactive'}</p>
                    <p><strong>Owner:</strong> {device.owner}</p>
                    <p>
                      <strong>Last Active:</strong>{' '}
                      {new Date(device.lastActiveTimestamp * 1000).toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleEditClick(device)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            ))
          ) : (
            <p>No devices found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DeviceList;
