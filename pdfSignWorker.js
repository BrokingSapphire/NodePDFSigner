const { parentPort, workerData } = require('worker_threads');
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');
const { plainAddPlaceholder, SignPdf } = require('node-signpdf');

const cert = readFileSync(path.resolve(__dirname, './certificate.p12'));

try {
  console.log(`Signing file: ${workerData.file}`);

  const pdfPath = path.join(workerData.inputDir, workerData.file);
  let pdfBuffer = readFileSync(pdfPath);

  pdfBuffer = plainAddPlaceholder({ pdfBuffer });
  const signedPdf = new SignPdf().sign(pdfBuffer, cert);

  writeFileSync(path.join(workerData.outputDir, `signed_${workerData.file}`), signedPdf);
  parentPort.postMessage(`Signed: ${workerData.file}`);
} catch (error) {
  parentPort.postMessage(`Failed to sign ${workerData.file}: ${error.message}`);
}