// workers/pdfSignWorker.js
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const { plainAddPlaceholder, SignPdf } = require('node-signpdf');

try {
  // Log received data for debugging
  console.log(`Worker data:`, JSON.stringify(workerData, null, 2));
  
  // Define the certificate path dynamically based on the project root structure
  const rootDir = path.resolve(workerData.inputDir, '..');
  const certPath = path.join(rootDir, 'certificate.p12');

  // Check if the certificate exists, and handle the missing file case gracefully
  if (!fs.existsSync(certPath)) {
    throw new Error(`Certificate file not found: ${certPath}`);
  }

  console.log(`Signing file: ${workerData.file}`);
  console.log(`Using certificate: ${certPath}`);

  // Read certificate
  // The certificate password - change this to your actual certificate password
  const certPassword = 'badssl.com'; 
  const cert = fs.readFileSync(certPath);

  // Construct PDF input and output paths dynamically
  const pdfPath = path.join(workerData.inputDir, workerData.file);
  
  // Verify the input file exists
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Input PDF not found: ${pdfPath}`);
  }

  // Read PDF file
  let pdfBuffer = fs.readFileSync(pdfPath);

  // Add placeholder and sign the PDF
  pdfBuffer = plainAddPlaceholder({ pdfBuffer });
  const signedPdf = new SignPdf().sign(pdfBuffer, cert, { passphrase: certPassword });

  // Ensure output directory exists
  if (!fs.existsSync(workerData.outputDir)) {
    fs.mkdirSync(workerData.outputDir, { recursive: true });
  }

  // Generate output path and write the signed PDF
  const outputPath = path.join(workerData.outputDir, `signed_${workerData.file}`);
  fs.writeFileSync(outputPath, signedPdf);

  // Log success for debugging
  console.log(`Successfully signed and saved to: ${outputPath}`);

  // Inform the parent thread that the PDF signing is complete
  parentPort.postMessage(`Signed: ${workerData.file} -> ${outputPath}`);
} catch (error) {
  console.error(`Error in PDF signing worker:`, error);
  
  // Handle any errors during the PDF signing process and send a failure message to the parent thread
  parentPort.postMessage(`Failed to sign ${workerData.file || 'unknown'}: ${error.message}`);
}