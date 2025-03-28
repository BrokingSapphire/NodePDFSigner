const { parentPort, workerData } = require('worker_threads');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const path = require('path');
const { plainAddPlaceholder, SignPdf } = require('node-signpdf');

// Define the certificate path dynamically based on the project root structure
const certPath = path.join(__dirname, '../certificate.p12');

// Check if the certificate exists, and handle the missing file case gracefully
if (!existsSync(certPath)) {
  console.error('Error: Certificate file not found. Please add certificate.p12 to the project root.');
  process.exit(1);
}

const cert = readFileSync(certPath);

try {
  console.log(`Signing file: ${workerData.file}`);

  // Construct PDF input and output paths dynamically
  const pdfPath = path.join(workerData.inputDir, workerData.file);
  let pdfBuffer = readFileSync(pdfPath);

  // Add placeholder and sign the PDF
  pdfBuffer = plainAddPlaceholder({ pdfBuffer });
  const signedPdf = new SignPdf().sign(pdfBuffer, cert);

  // Write the signed PDF to the output directory with a 'signed_' prefix
  writeFileSync(path.join(workerData.outputDir, `signed_${workerData.file}`), signedPdf);

  // Inform the parent thread that the PDF signing is complete
  parentPort.postMessage(`Signed: ${workerData.file}`);
} catch (error) {
  // Handle any errors during the PDF signing process and send a failure message to the parent thread
  parentPort.postMessage(`Failed to sign ${workerData.file}: ${error.message}`);
}
