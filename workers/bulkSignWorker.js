// workers/bulkSignWorker.js
const { Worker, parentPort } = require('worker_threads');
const fs = require('fs');
const path = require('path');

// Get absolute paths to directories
const rootDir = path.resolve(__dirname, '..');
const inputDir = path.join(rootDir, 'input-pdfs');
const outputDir = path.join(rootDir, 'output-pdfs');

function runWorker(file) {
  return new Promise((resolve, reject) => {
    const workerFilePath = path.join(__dirname, 'pdfSignWorker.js');

    // Log file paths for debugging
    console.log(`Processing file: ${file}`);
    console.log(`Input path: ${path.join(inputDir, file)}`);
    console.log(`Output path: ${path.join(outputDir, `signed_${file}`)}`);
    
    // Verify the input file exists
    if (!fs.existsSync(path.join(inputDir, file))) {
      console.error(`Input file not found: ${path.join(inputDir, file)}`);
      reject(new Error(`Input file not found: ${file}`));
      return;
    }

    const worker = new Worker(workerFilePath, {
      workerData: { file, inputDir, outputDir },
    });

    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

async function bulkSignPDFs() {
  // Verify directories exist
  if (!fs.existsSync(inputDir)) {
    parentPort.postMessage(`Input directory not found: ${inputDir}`);
    return;
  }
  
  if (!fs.existsSync(outputDir)) {
    // Create output directory if it doesn't exist
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      parentPort.postMessage(`Created output directory: ${outputDir}`);
    } catch (error) {
      parentPort.postMessage(`Failed to create output directory: ${error.message}`);
      return;
    }
  }

  // Get PDF files from input directory
  const pdfFiles = fs.readdirSync(inputDir).filter(file => file.endsWith('.pdf'));
  
  if (pdfFiles.length === 0) {
    parentPort.postMessage(`No PDF files found in ${inputDir}`);
    return;
  }

  parentPort.postMessage(`Starting bulk PDF signing process. Found ${pdfFiles.length} PDFs to sign...`);

  const concurrencyLimit = 8; // Process 8 PDFs concurrently
  let processedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < pdfFiles.length; i += concurrencyLimit) {
    const batch = pdfFiles.slice(i, i + concurrencyLimit);
    
    try {
      const results = await Promise.allSettled(batch.map(file => runWorker(file)));
      
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          processedCount++;
          parentPort.postMessage(result.value);
        } else {
          errorCount++;
          parentPort.postMessage(`Error: ${result.reason}`);
        }
      });
    } catch (error) {
      parentPort.postMessage(`Batch processing error: ${error.message}`);
    }
  }

  parentPort.postMessage(`PDF processing complete. Successful: ${processedCount}, Failed: ${errorCount}`);
}

// Start the bulk signing process
bulkSignPDFs().catch(error => {
  parentPort.postMessage(`Fatal error in bulkSignPDFs: ${error.message}`);
});