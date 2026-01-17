const os = require('os');

const interfaces = os.networkInterfaces();
let wlanIP = null;

// 查找 WLAN/Wi-Fi 的 IPv4 地址
for (const [name, addrs] of Object.entries(interfaces)) {
  if (name.includes('WLAN') || name.includes('Wi-Fi') || name.includes('Wireless')) {
    const ipv4 = addrs.find(a => a.family === 'IPv4' && !a.internal);
    if (ipv4) {
      wlanIP = ipv4.address;
      break;
    }
  }
}

// 如果没找到 WLAN，找以太网（排除虚拟网卡）
if (!wlanIP) {
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (name.includes('VMware') || name.includes('WSL') || name.includes('Radmin') || name.includes('Meta')) {
      continue;
    }
    const ipv4 = addrs.find(a => a.family === 'IPv4' && !a.internal);
    if (ipv4) {
      wlanIP = ipv4.address;
      break;
    }
  }
}

console.log('');
console.log('========================================');
console.log('  手机局域网访问地址');
console.log('========================================');
console.log('');

if (wlanIP) {
  console.log(`  前端: http://${wlanIP}:5173`);
  console.log(`  后端: http://${wlanIP}:3000`);
} else {
  console.log('  未找到局域网 IP');
}

console.log('');
console.log('========================================');
