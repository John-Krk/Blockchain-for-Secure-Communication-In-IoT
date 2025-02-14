// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DeviceManagement {
    struct Device {
        string deviceId;         // Unique identifier for the device (immutable)
        bool isRegistered;       // Active/Inactive status
        address owner;           // Owner of the device
        string deviceType;       // Type or model of the device
        string location;         // Physical location of the device
        string macAddress;       // Unique MAC address
        string ipAddress;        // Unique IP address (unique at any given time)
        uint256 lastActiveTimestamp;
    }
    
    // Mapping to store devices by their deviceId.
    mapping(string => Device) public devices;
    // Array to keep track of device IDs for iteration.
    string[] private deviceIds;
    // Mapping to enforce uniqueness of MAC addresses.
    mapping(string => bool) public registeredMacAddresses;
    // Mapping to enforce uniqueness of IP addresses.
    mapping(string => bool) public registeredIPAddresses;
    
    event DeviceRegistered(string deviceId, address owner, string macAddress, string ipAddress);
    event DeviceStatusChanged(string deviceId, bool isActive);
    event DeviceInfoUpdated(
        string deviceId, 
        string deviceType, 
        string location, 
        string macAddress, 
        string ipAddress
    );
    event DeviceDeleted(string deviceId);

    constructor() {
        // No admin or role-based checks are implemented in this version.
    }

    /// @notice Register a new device.
    /// @dev Ensures deviceId, macAddress, and ipAddress are unique.
    function registerDevice(
        string memory _deviceId,
        string memory _deviceType,
        string memory _location,
        string memory _macAddress,
        string memory _ipAddress
    ) public {
        require(!devices[_deviceId].isRegistered, "Device already registered by id");
        require(!registeredMacAddresses[_macAddress], "Device already registered by MAC address");
        require(!registeredIPAddresses[_ipAddress], "Device already registered by IP address");

        devices[_deviceId] = Device({
            deviceId: _deviceId,
            isRegistered: true,
            owner: msg.sender,
            deviceType: _deviceType,
            location: _location,
            macAddress: _macAddress,
            ipAddress: _ipAddress,
            lastActiveTimestamp: block.timestamp
        });
        deviceIds.push(_deviceId);
        registeredMacAddresses[_macAddress] = true;
        registeredIPAddresses[_ipAddress] = true;

        emit DeviceRegistered(_deviceId, msg.sender, _macAddress, _ipAddress);
    }

    /// @notice Update device information.
    /// @dev Allows the owner to update deviceType, location, ipAddress, and MAC address.
    ///      If the MAC or IP address changes, the new values must be unique.
    function updateDevice(
        string memory _deviceId,
        string memory newDeviceType,
        string memory newLocation,
        string memory newMacAddress,
        string memory newIpAddress
    ) public {
        require(devices[_deviceId].isRegistered, "Device not registered");
        require(devices[_deviceId].owner == msg.sender, "Only device owner can update the device");

        Device storage device = devices[_deviceId];

        // Update MAC address if it's changing.
        if (keccak256(bytes(newMacAddress)) != keccak256(bytes(device.macAddress))) {
            require(!registeredMacAddresses[newMacAddress], "New MAC address already in use");
            delete registeredMacAddresses[device.macAddress];
            registeredMacAddresses[newMacAddress] = true;
            device.macAddress = newMacAddress;
        }
        
        // Update IP address if it's changing.
        if (keccak256(bytes(newIpAddress)) != keccak256(bytes(device.ipAddress))) {
            require(!registeredIPAddresses[newIpAddress], "New IP address already in use");
            delete registeredIPAddresses[device.ipAddress];
            registeredIPAddresses[newIpAddress] = true;
            device.ipAddress = newIpAddress;
        }

        device.deviceType = newDeviceType;
        device.location = newLocation;
        device.lastActiveTimestamp = block.timestamp;

        emit DeviceInfoUpdated(_deviceId, newDeviceType, newLocation, device.macAddress, device.ipAddress);
    }

    /// @notice Toggle the device's active/inactive status.
    /// @dev Only the device owner can toggle the status.
    function toggleDeviceStatus(string memory _deviceId) public {
        require(devices[_deviceId].isRegistered, "Device not registered");
        require(devices[_deviceId].owner == msg.sender, "Only device owner can toggle status");

        devices[_deviceId].isRegistered = !devices[_deviceId].isRegistered;
        emit DeviceStatusChanged(_deviceId, devices[_deviceId].isRegistered);
    }

    /// @notice Delete a device from the registry.
    /// @dev Only the device owner can delete the device.
    function deleteDevice(string memory _deviceId) public {
        require(devices[_deviceId].isRegistered, "Device not registered");
        require(devices[_deviceId].owner == msg.sender, "Only device owner can delete the device");

        // Remove the deviceId from the list.
        for (uint i = 0; i < deviceIds.length; i++) {
            if (keccak256(bytes(deviceIds[i])) == keccak256(bytes(_deviceId))) {
                deviceIds[i] = deviceIds[deviceIds.length - 1];
                deviceIds.pop();
                break;
            }
        }

        // Remove MAC and IP addresses from their respective mappings.
        string memory macAddr = devices[_deviceId].macAddress;
        string memory ipAddr = devices[_deviceId].ipAddress;
        delete registeredMacAddresses[macAddr];
        delete registeredIPAddresses[ipAddr];

        emit DeviceDeleted(_deviceId);
        delete devices[_deviceId];
    }

    /// @notice Retrieve all registered devices.
    function getAllDevices() public view returns (Device[] memory) {
        Device[] memory allDevices = new Device[](deviceIds.length);
        for (uint i = 0; i < deviceIds.length; i++) {
            allDevices[i] = devices[deviceIds[i]];
        }
        return allDevices;
    }
}
