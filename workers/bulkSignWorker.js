const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');

function runWorker(file) {
  return new Promise((resolve, reject) => {
    const workerFilePath = path.join(__dirname, 'pdfSignWorker.js'); // Updated path
    const inputDir = path.join(__dirname, '../input-pdfs'); // Correct relative path to input-pdfs
    const outputDir = path.join(__dirname, '../output-pdfs'); // Correct relative path to output-pdfs

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
  const inputDir = path.join(__dirname, '../input-pdfs'); // Updated input path
  const pdfFiles = fs.readdirSync(inputDir).filter(file => file.endsWith('.pdf'));
  const concurrencyLimit = 8; // Process 8 PDFs concurrently

  console.log(`Starting bulk PDF signing process. Found ${pdfFiles.length} PDFs to sign...`);

  for (let i = 0; i < pdfFiles.length; i += concurrencyLimit) {
    const batch = pdfFiles.slice(i, i + concurrencyLimit);
    await Promise.all(batch.map(file => runWorker(file)));
  }
}

bulkSignPDFs()
  .then(() => console.log("All PDFs processed!"))
  .catch(console.error);
