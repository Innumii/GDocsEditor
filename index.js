const { google } = require('googleapis');
require('dotenv').config();

// Retrieve the Google Docs ID from environment variables
const gDocsID = process.env.GOOGLE_DOCS_ID;

// Set up Google authentication with the necessary scopes for Google Docs API
const auth = new google.auth.GoogleAuth({
    keyFile: './google.json', // Path to your service account JSON key file
    scopes: ['https://www.googleapis.com/auth/documents'] // Scope for accessing Google Docs API
});

async function fetchUpdatedDocument(documentId) {
    const docs = google.docs({ version: 'v1', auth });
    const response = await docs.documents.get({
        documentId
    });
    return response.data;
}

async function writeGoogleDocs(documentId, requests) {
    const docs = google.docs({ version: 'v1', auth });
    const response = await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests }
    });
    return response.data;
}

function getNewRowCells(updatedDocument, tableStartIndex, newRowIndex) {
    const tables = updatedDocument.body.content.filter(element => element.table);
    const targetTable = tables.find(table => table.startIndex === tableStartIndex);
    const newRow = targetTable.table.tableRows[newRowIndex];
    return newRow.tableCells.map(cell => cell.startIndex);
}

(async () => {
    const documentData = await fetchUpdatedDocument(gDocsID);

    // Filter the document content to find the table
    const tables = documentData.body.content.filter(element => element.table);
    if (tables.length === 0) {
        console.log('No table found in the document.');
        return;
    }

    const table = tables[0].table; // Assume there is only one table and get the first one
    const rows = table.tableRows; // Get all rows of the table
    const lastRow = rows[rows.length - 1]; // Get the last row of the table
    const firstColumnText = lastRow.tableCells[0].content.map(cellContent =>
        cellContent.paragraph.elements.map(element => element.textRun.content).join('')
    ).join('').replace(/\n/g, ''); // Remove newline characters

    const [,, name, idNumber] = process.argv;

    if (!name || !idNumber) {
        console.error('Name and ID number are required as command-line arguments.');
        process.exit(1);
    }

    // Remove newline characters from name and idNumber
    const cleanName = name.replace(/\n/g, '');
    const cleanIdNumber = idNumber.replace(/\n/g, '');

    // Define requests to insert a new row
    const newRowRequests = [
        {
            insertTableRow: {
                tableCellLocation: {
                    tableStartLocation: {
                        index: tables[0].startIndex // Start index of the table
                    },
                    rowIndex: rows.length - 1 // Insert below the last row
                },
                insertBelow: true // Insert the new row below the specified row
            }
        }
    ];

    // Insert the new row first
    await writeGoogleDocs(gDocsID, newRowRequests);

    // Re-read the document to get the updated table structure
    const updatedDocumentData = await fetchUpdatedDocument(gDocsID);
    const updatedRows = updatedDocumentData.body.content.filter(element => element.table)[0].table.tableRows;
    const newRowIndex = updatedRows.length - 1; // Index of the newly inserted row
    const newRowCellIndexes = getNewRowCells(updatedDocumentData, tables[0].startIndex, newRowIndex);

    // Define requests to populate the new row with data
    const populateRowRequests = [
        { // Insert the first column text into the first cell of the new row
            insertText: {
                location: {
                    index: newRowCellIndexes[0] + 1 // +1 to insert at the beginning of the cell
                },
                text: firstColumnText
            }
        },
        { // Insert the given name into the second cell of the new row
            insertText: {
                location: {
                    index: newRowCellIndexes[1] + 1 + firstColumnText.length// +1 to insert at the beginning of the cell
                },
                text: cleanName
            }
        },
        { // Insert the given ID number into the third cell of the new row
            insertText: {
                location: {
                    index: newRowCellIndexes[2] + 1 + firstColumnText.length + cleanName.length// +1 to insert at the beginning of the cell
                },
                text: cleanIdNumber
            }
        }
    ];

    // Execute the requests to populate the new row
    await writeGoogleDocs(gDocsID, populateRowRequests);

    const finalDocumentData = await fetchUpdatedDocument(gDocsID); // Read the updated document data
    console.log(finalDocumentData.body.content.map(d => d.paragraph?.elements[0]?.textRun?.content).join('')); // Log the content of the updated document
})();
