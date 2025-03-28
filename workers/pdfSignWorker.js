// workers/pdfSignWorker.js
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const { plainAddPlaceholder, SignPdf } = require('node-signpdf');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function addWatermark(pdfBuffer, signatureText) {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Get pages in the document
    const pages = pdfDoc.getPages();
    
    // Load a standard font
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Add watermark to each page
    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Get current date and time in Indian Standard Time (IST)
      const now = new Date();
      
      // Convert to IST (UTC+5:30)
      const istOptions = { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      
      const istDateString = now.toLocaleString('en-IN', istOptions);
      
      // Calculate position for top left corner with some margin
      const topLeftX = 20; // Right margin from left edge
      const topLeftY = height - 30; // Top margin from top edge
      
      // Draw company signature in green with reduced font size
      page.drawText(`Digitally Signed by Sapphire Broking`, {
        x: topLeftX,
        y: topLeftY, 
        size: 10, // Reduced from 12
        font: helveticaFont,
        color: rgb(0, 0.5, 0), // Green color
        opacity: 0.8,
      });
      
      // Add date and time in IST
      page.drawText(`Date: ${istDateString} IST`, {
        x: topLeftX,
        y: topLeftY - 12, // Adjusted spacing for smaller text
        size: 8, // Reduced from 10
        font: helveticaFont,
        color: rgb(0, 0.5, 0),
        opacity: 0.8,
      });
      
      // Add reason
      page.drawText(`Reason: Contract Note as per Regulation`, {
        x: topLeftX,
        y: topLeftY - 24, // Adjusted spacing
        size: 8,
        font: helveticaFont,
        color: rgb(0, 0.5, 0),
        opacity: 0.8,
      });
      
      // Add location
      page.drawText(`Location: Nagpur, Maharashtra`, {
        x: topLeftX,
        y: topLeftY - 36, // Adjusted spacing
        size: 8,
        font: helveticaFont,
        color: rgb(0, 0.5, 0),
        opacity: 0.8,
      });
    }
    
    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();
    
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error adding watermark to PDF:', error);
    throw error;
  }
}

async function processPdf() {
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
    const certPassword = 'your-certificate-password'; 
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
    
    // Add watermark to the signed PDF with Sapphire Broking signature text
    const watermarkedPdf = await addWatermark(signedPdf);

    // Ensure output directory exists
    if (!fs.existsSync(workerData.outputDir)) {
      fs.mkdirSync(workerData.outputDir, { recursive: true });
    }

    // Generate output path and write the signed PDF
    const outputPath = path.join(workerData.outputDir, `signed_${workerData.file}`);
    fs.writeFileSync(outputPath, watermarkedPdf);

    // Log success for debugging
    console.log(`Successfully signed and saved to: ${outputPath}`);

    // Inform the parent thread that the PDF signing is complete
    parentPort.postMessage(`Signed and watermarked: ${workerData.file} -> ${outputPath}`);
  } catch (error) {
    console.error(`Error in PDF signing worker:`, error);
    
    // Handle any errors during the PDF signing process and send a failure message to the parent thread
    parentPort.postMessage(`Failed to sign ${workerData.file || 'unknown'}: ${error.message}`);
  }
}

// Start the PDF processing
processPdf();