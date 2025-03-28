const { parentPort, workerData } = require('worker_threads');

console.log(`Worker started for file: ${workerData.file}`);

parentPort.postMessage(`Processing done for ${workerData.file}`);