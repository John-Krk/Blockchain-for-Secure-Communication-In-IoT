// server-ws.js - Advanced Simulation Server

const WebSocket = require('ws');
const axios = require('axios');
const express = require('express');

const app = express();
const HTTP_PORT = 3002; // Port for HTTP endpoints to control simulation (different from WS port)
const WS_PORT = 8080;
const REGISTERED_DEVICES_URL = 'http://localhost:3000/get-devices';

// Simulation parameters (can be updated via API)
let simulationIntervalMs = 2000; // Frequency for sending sensor data

// Setup WebSocket Server
const wss = new WebSocket.Server({ port: WS_PORT }, () => {
  console.log(`WebSocket server started on ws://localhost:${WS_PORT}`);
});

let registeredDeviceIds = [];

// Helper function: Fetch registered devices from blockchain REST endpoint
const fetchRegisteredDevices = async () => {
  try {
    const { data } = await axios.get(REGISTERED_DEVICES_URL);
    // Assuming data is an array of devices with a deviceId property
    registeredDeviceIds = data.map(device => device.deviceId);
    console.log('Fetched registered devices:', registeredDeviceIds);
  } catch (error) {
    console.error('Error fetching registered devices:', error.message);
    registeredDeviceIds = [];
  }
};

// Refresh registered devices list every 30 seconds
fetchRegisteredDevices();
setInterval(fetchRegisteredDevices, 30000);

// Helper function: Generate a random number within a range
const randomInRange = (min, max) => Math.random() * (max - min) + min;

// Helper function: Decide whether to simulate a fault (10% chance)
const simulateFault = () => Math.random() < 0.1;

// Advanced sensor data generation function
const generateSensorData = () => {
  let deviceId;
  // With 60% chance, pick a registered device if available, otherwise generate random
  if (registeredDeviceIds.length > 0 && Math.random() < 0.6) {
    deviceId = registeredDeviceIds[Math.floor(Math.random() * registeredDeviceIds.length)];
  } else {
    deviceId = `device_${Math.floor(Math.random() * 10) + 1}`;
  }

  // Generate sensor values
  const temperature = parseFloat(randomInRange(15, 50).toFixed(2)); // °C
  const humidity = parseFloat(randomInRange(30, 90).toFixed(2));    // %
  const battery = parseFloat(randomInRange(10, 100).toFixed(0));      // Battery percentage
  const motionDetected = Math.random() > 0.7;
  const lastActive = new Date().toISOString();
  const fault = simulateFault(); // true if fault condition exists

  // You could add additional sensor parameters here
  return {
    deviceId,
    temperature,
    humidity,
    battery,
    motionDetected,
    fault,
    lastActive
  };
};

// Function to broadcast sensor data to all connected WebSocket clients
const broadcastSensorData = () => {
  const sensorData = generateSensorData();
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(sensorData));
    }
  });
  console.log('Broadcast sensor data:', sensorData);
};

// Start broadcasting sensor data on an interval
let sensorInterval = setInterval(broadcastSensorData, simulationIntervalMs);

// WebSocket connection handling
wss.on('connection', ws => {
  console.log('New client connected via WS');
  ws.on('close', () => console.log('Client disconnected from WS'));
});

// ------------------------------
// Express HTTP API for simulation control
// ------------------------------
app.use(express.json());

// Endpoint to manually trigger a sensor broadcast
app.post('/trigger-broadcast', (req, res) => {
  broadcastSensorData();
  res.json({ message: 'Sensor data broadcast triggered manually.' });
});

// Endpoint to update simulation interval (frequency)
app.post('/update-interval', (req, res) => {
  const { intervalMs } = req.body;
  if (!intervalMs || intervalMs < 500) {
    return res.status(400).json({ error: 'Please provide a valid interval (min 500 ms).' });
  }
  simulationIntervalMs = intervalMs;
  // Clear the previous interval and set a new one
  clearInterval(sensorInterval);
  sensorInterval = setInterval(broadcastSensorData, simulationIntervalMs);
  console.log(`Simulation interval updated to ${simulationIntervalMs} ms`);
  res.json({ message: `Simulation interval updated to ${simulationIntervalMs} ms` });
});

// Endpoint to get current simulation settings
app.get('/simulation-settings', (req, res) => {
  res.json({
    simulationIntervalMs,
    registeredDeviceIds,
    totalRegisteredDevices: registeredDeviceIds.length
  });
});

// Start the HTTP API server for simulation control
app.listen(HTTP_PORT, () => {
  console.log(`Simulation control API is running on http://localhost:${HTTP_PORT}`);
});
