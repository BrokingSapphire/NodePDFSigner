// index.js
const path = require('path');
const { Worker } = require('worker_threads');

// Path to the bulkSignWorker file
const workerFilePath = path.join(__dirname, 'workers', 'bulkSignWorker.js');

// Function to start the PDF signing process
function startBulkSigning() {
  console.log('Starting bulk PDF signing process...');

  // Create a new worker thread to run the bulkSignWorker.js script
  const worker = new Worker(workerFilePath);

  // Listen for messages from the worker
  worker.on('message', (msg) => {
    console.log(`Worker Message: ${msg}`);
  });

  // Handle worker errors
  worker.on('error', (err) => {
    console.error(`Worker Error: ${err.message}`);
  });

  // Handle worker exit
  worker.on('exit', (code) => {
    if (code === 0) {
      console.log('Bulk PDF signing process completed successfully!');
    } else {
      console.error(`Worker stopped with exit code ${code}`);
    }
  });
}

// Start the bulk signing process
startBulkSigning();
