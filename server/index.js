const dotenv = require('dotenv');
const express = require('express');
const Web3 = require('web3');
const nmap = require('node-nmap');
const fs = require('fs-extra');
const cors = require('cors');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE_NAME
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Database connection established');
});

// Token generation function
function generateToken(user) {
    return jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

const contractABIPath = '../build/contracts/DeviceManagement.json';
const contractABI = fs.readJsonSync(contractABIPath).abi;
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(contractABI, contractAddress);


const WebSocket = require('ws');

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8090 });

// Mock real-time IoT data
const generateMockData = () => ({
    deviceId: `device_${Math.floor(Math.random() * 10) + 1}`,
    temperature: (Math.random() * 50).toFixed(2), // Random temperature value
    motionDetected: Math.random() > 0.7, // Random motion detection
    lastActive: new Date().toISOString(),
});

// Broadcast data to all connected clients
const broadcastData = (data) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

// Send mock data every 2 seconds
setInterval(() => {
    const data = generateMockData();
    broadcastData(data);
    // console.log('Sent data:', data); // For debugging
}, 2000);

// Handle WebSocket connections
wss.on('connection', ws => {
    console.log('Client connected');
    ws.on('close', () => console.log('Client disconnected'));
});


// Fetch accounts
app.get('/accounts', async (req, res) => {
    try {
        const accounts = await web3.eth.getAccounts();
        res.send(accounts);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).send(`Error fetching accounts: ${error.message}`);
    }
});

// Register a new device
app.post('/register-device', async (req, res) => {
    const { deviceId, deviceType, location, macAddress, ipAddress } = req.body;
    try {
        const accounts = await web3.eth.getAccounts();
        const gasEstimate = await contract.methods.registerDevice(deviceId, deviceType, location, macAddress, ipAddress).estimateGas({ from: accounts[0] });
        const result = await contract.methods.registerDevice(deviceId, deviceType, location, macAddress, ipAddress)
            .send({ from: accounts[0], gas: gasEstimate + 10000 });
        res.json({ message: "Device registered successfully", result });
    } catch (error) {
        console.error('Error registering device:', error.message);
        res.status(500).send(`Error registering device: ${error.message}`);
    }
});

// Toggle device status
app.post('/toggle-device', async (req, res) => {
    const { deviceId } = req.body;
    try {
        const accounts = await web3.eth.getAccounts();
        const result = await contract.methods.toggleDeviceStatus(deviceId).send({ from: accounts[0] });
        res.json({ message: "Device status toggled successfully", result });
    } catch (error) {
        console.error('Error toggling device status:', error);
        res.status(500).send(`Error toggling device status: ${error.message}`);
    }
});

// Endpoint to scan network devices
app.get('/scan-network', (req, res) => {
    const quickScan = new nmap.QuickScan('192.168.254.0/24');
    const filePath = './scan_results.json'; // File where scan results will be saved

    quickScan.on('complete', data => {
        try {
            // Overwrite the file with the latest scan results
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`Scan results saved to ${filePath}`);
        } catch (error) {
            console.error('Error writing scan results to file:', error);
        }
        res.json(data); // Send the scan results as JSON response
    });

    quickScan.on('error', error => {
        console.error('Nmap scan error:', error);
        if (!res.headersSent) {
            res.status(500).send('Failed to scan network');
        }
    });
});


// Get all devices
app.get('/get-devices', async (req, res) => {
    try {
        const devices = await contract.methods.getAllDevices().call();
        // console.log('Smart Contract Devices:', devices);

        // Format devices for frontend
        const formattedDevices = devices.map(device => ({
            deviceId: device.deviceId,
            deviceType: device.deviceType,
            location: device.location,
            macAddress: device.macAddress,
            ipAddress: device.ipAddress,
            isRegistered: device.isRegistered,
            owner: device.owner,
            lastActiveTimestamp: device.lastActiveTimestamp
        }));

        res.json(formattedDevices);
    } catch (error) {
        console.error('Failed to fetch devices:', error);
        res.status(500).send(`Failed to fetch devices: ${error.message}`);
    }
});

// Endpoint to update device IP address
app.post('/update-device-ip', async (req, res) => {
    const { deviceId, ipAddress } = req.body;
    try {
        const accounts = await web3.eth.getAccounts();
        const gasEstimate = await contract.methods.updateDeviceInfo(deviceId, "", ipAddress).estimateGas({ from: accounts[0] });
        const result = await contract.methods.updateDeviceInfo(deviceId, "", ipAddress)
            .send({ from: accounts[0], gas: gasEstimate + 10000 });

        // Fetch updated device info
        const device = await contract.methods.devices(deviceId).call();

        // Emit event to connected clients
        io.emit('deviceInfoUpdated', {
            deviceId,
            newLocation: device.location,
            newIpAddress: device.ipAddress
        });

        res.json({ message: "Device IP updated successfully", result });
    } catch (error) {
        console.error('Error updating device IP:', error.message);
        res.status(500).send(`Error updating device IP: ${error.message}`);
    }
});

app.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(400).send('Username, password, and email are required');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO users (username, password, email) VALUES (?, ?, ?)`;
        db.query(sql, [username, hashedPassword, email], (err, result) => {
            if (err) {
                console.error('Signup failed:', err);
                return res.status(500).send('Signup failed');
            }
            res.send('User registered successfully');
        });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).send('Server error');
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error('Login failed:', err);
            return res.status(500).send('Login failed');
        }
        if (results.length === 0) {
            return res.status(401).send('Incorrect username or password');
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
            const token = generateToken(user);
            const updateLastLogin = 'UPDATE users SET last_login = NOW() WHERE user_id = ?';
            db.query(updateLastLogin, [user.user_id], (error, updateResults) => {
                if (error) {
                    console.error('Failed to update last login:', error);
                    return res.status(500).send('Failed to update user data');
                }
                res.json({ token, username: user.username });
            });
        } else {
            res.status(401).send('Incorrect username or password');
        }
    });
});

app.post('/update-device', async (req, res) => {
    const { deviceId, newDeviceType, newLocation, newMacAddress, newIpAddress } = req.body;
    try {
      const accounts = await web3.eth.getAccounts();
      // Estimate gas for the updateDevice function call
      const gasEstimate = await contract.methods
        .updateDevice(deviceId, newDeviceType, newLocation, newMacAddress, newIpAddress)
        .estimateGas({ from: accounts[0] });
        
      const result = await contract.methods
        .updateDevice(deviceId, newDeviceType, newLocation, newMacAddress, newIpAddress)
        .send({ from: accounts[0], gas: gasEstimate + 10000 });
        
      res.json({ message: "Device updated successfully", result });
    } catch (error) {
      console.error('Error updating device:', error);
      res.status(500).send(`Error updating device: ${error.message}`);
    }
  });

  app.get('/scan_results.json', (req, res) => {
    const filePath = path.join(__dirname, 'scan_results.json');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending scan_results.json:', err);
        res.status(500).send('Error sending file');
      }
    });
  });
  

  
// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
