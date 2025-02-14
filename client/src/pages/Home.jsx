import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Home = () => {
    const [accounts, setAccounts] = useState([]);
    const [networkDevices, setNetworkDevices] = useState([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [scanningNetwork, setScanningNetwork] = useState(false);

    // Function to fetch accounts from the blockchain
    const fetchAccounts = async () => {
        setLoadingAccounts(true);
        try {
            const response = await axios.get('http://localhost:3000/accounts');
            setAccounts(response.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoadingAccounts(false);
        }
    };

    // Function to initiate a network scan
    const scanNetwork = async () => {
        setScanningNetwork(true);
        try {
            const response = await axios.get('http://localhost:3000/scan-network');
            setNetworkDevices(response.data);
        } catch (error) {
            console.error('Error scanning network:', error);
        } finally {
            setScanningNetwork(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900 my-8">IoT Blockchain Home Security System</h1>
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={fetchAccounts}
                    disabled={loadingAccounts}
                    className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${loadingAccounts ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loadingAccounts ? 'Loading...' : 'Refresh Accounts'}
                </button>
                <button
                    onClick={scanNetwork}
                    disabled={scanningNetwork}
                    className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${scanningNetwork ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {scanningNetwork ? 'Scanning...' : 'Scan Network'}
                </button>
            </div>
            <section className="mb-12">
                <h2 className="text-xl font-semibold text-gray-700">Accounts</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
                    <ul className="divide-y divide-gray-200">
                        {accounts.map(account => (
                            <li key={account} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account}</li>
                        ))}
                    </ul>
                </div>
            </section>
            <section>
                <h2 className="text-xl font-semibold text-gray-700">Network Devices</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
                <ul className="divide-y divide-gray-200">
                    {networkDevices.map((device, index) => (
                        <li key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            IP: {device.ip}<br/>
                            MAC: {device.mac || 'N/A'}<br/>
                            Open Ports: {device.openPorts?.map(port => `${port.portId}/${port.protocol} `) || 'None'}<br/>
                            OS: {device.osNmap || 'Unknown'}<br/>
                            Device Type: {device.deviceType || 'Unknown'}  // Display if your script scan provides this info
                        </li>
                    ))}
                </ul>
                </div>
            </section>
        </div>
    );
};

export default Home;
