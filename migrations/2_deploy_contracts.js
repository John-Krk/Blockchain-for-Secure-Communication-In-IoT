// const fs = require('fs');
// const path = require('path');
// const MyContract = artifacts.require("DeviceManagement");

// module.exports = function(deployer, network, accounts) {
//   deployer.deploy(MyContract).then(() => {
//     // Assuming your server folder is at the same level as the migrations folder
//     const envPath = path.join(__dirname, '../server/.env');
//     const contractAddress = MyContract.address;
    
//     // Read existing contents into data
//     let data = '';
//     if (fs.existsSync(envPath)) {
//       data = fs.readFileSync(envPath, { encoding:'utf8', flag:'r' });
//     }
    
//     // Check if CONTRACT_ADDRESS is already set
//     if (data.indexOf('CONTRACT_ADDRESS=') === -1) {
//       // If not, append it
//       data += `\nCONTRACT_ADDRESS=${contractAddress}\n`;
//     } else {
//       // If yes, replace it
//       data = data.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${contractAddress}`);
//     }

//     // Write the new .env content
//     fs.writeFileSync(envPath, data, { encoding: 'utf8' });
//     console.log('Contract address written to server/.env:', contractAddress);
//   });
// };

const fs = require('fs');
const path = require('path');
const MyContract = artifacts.require("DeviceManagement");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(MyContract).then(async () => {
    const contractAddress = (await MyContract.deployed()).address;
    const envPath = path.join(__dirname, '../server/.env');

    let data = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const addressLine = `CONTRACT_ADDRESS=${contractAddress}`;

    if (data.includes('CONTRACT_ADDRESS=')) {
      data = data.replace(/CONTRACT_ADDRESS=.*/, addressLine);
    } else {
      data += `\n${addressLine}\n`;
    }

    fs.writeFileSync(envPath, data, 'utf8');
    console.log('Contract address written to server/.env:', contractAddress);
  });
};
