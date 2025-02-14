const nmap = require('node-nmap');
nmap.nmapLocation = "nmap"; // Ensure nmap is installed and in your PATH

var quickScan = new nmap.QuickScan('192.168.254.0/24');

quickScan.on('complete', function(data){
  console.log(data);
});

quickScan.on('error', function(error){
  console.error(error);
});

quickScan.start();
