# Bulk PDF Signer with Worker Threads

This project uses Node.js Worker Threads and `node-signpdf` to sign PDFs in bulk.

## Setup Instructions
1. Clone the repository and navigate to the project folder.

2. Install dependencies.

3. Place PDF files in the `input-pdfs` folder and the replace `certificate.p12` certificate in the project root.

4. Replace the certificate passwords from `pdfSignWorker.js` file.

5. Delete `example.txt` file from `input-pdfs` and `output-pdfs` folder.

6. Run the `index.js`

7. Signed PDFs will be saved in the `output-pdfs` folder.
