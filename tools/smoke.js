const fs = require('fs');
const vm = require('vm');
console.log('node runtime ok, argv:', process.argv.slice(1).join(' '));
vm.runInThisContext('console.log("vm ok")', { filename: 'inline.js' });
console.log('zlib ok:', typeof require('zlib').deflateSync);
