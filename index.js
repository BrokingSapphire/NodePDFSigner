// index.js
const path = require('path');
const fs = require('fs');
const { Worker } = require('worker_threads');

// Ensure input and output directories exist
const inputDir = path.join(__dirname, 'input-pdfs');
const outputDir = path.join(__dirname, 'output-pdfs');

// Create directories if they don't exist
if (!fs.existsSync(inputDir)) {
  fs.mkdirSync(inputDir, { recursive: true });
  console.log(`Created input directory: ${inputDir}`);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created output directory: ${outputDir}`);
}

// Path to the bulkSignWorker file
const workerFilePath = path.join(__dirname, 'workers', 'bulkSignWorker.js');

// Function to start the PDF signing process
function startBulkSigning() {
  console.log('Starting bulk PDF signing process...');
  
  // Check if worker file exists
  if (!fs.existsSync(workerFilePath)) {
    console.error(`Worker file not found: ${workerFilePath}`);
    return;
  }

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