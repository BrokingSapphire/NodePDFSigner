const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');

function runWorker(file) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, './pdfSignWorker.js'), {
      workerData: { file, inputDir: './input-pdfs', outputDir: './output-pdfs' },
    });

    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

async function bulkSignPDFs() {
  const pdfFiles = fs.readdirSync('./input-pdfs').filter(file => file.endsWith('.pdf'));
  const concurrencyLimit = 8;  // Process 8 PDFs concurrently

  for (let i = 0; i < pdfFiles.length; i += concurrencyLimit) {
    const batch = pdfFiles.slice(i, i + concurrencyLimit);
    await Promise.all(batch.map(file => runWorker(file)));
  }
}

bulkSignPDFs().then(() => console.log("All PDFs processed!")).catch(console.error);
