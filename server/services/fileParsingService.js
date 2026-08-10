const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');

class FileParsingService {
  /**
   * Parse various file types and extract their text content.
   * @param {Buffer} buffer - File buffer from multer
   * @param {string} mimetype - File mime type
   * @returns {Promise<string>} Extracted text
   */
  static async extractText(buffer, mimetype) {
    switch (mimetype) {
      case 'application/pdf':
        return await this._parsePDF(buffer);
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // DOCX
        return await this._parseDOCX(buffer);
        
      case 'text/csv':
        return await this._parseCSV(buffer);
        
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': // XLSX
        return await this._parseXLSX(buffer);
        
      case 'text/plain':
        return buffer.toString('utf8');
        
      default:
        throw new Error(`Unsupported file type: ${mimetype}`);
    }
  }

  static async _parsePDF(buffer) {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  static async _parseDOCX(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  static async _parseXLSX(buffer) {
    try {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      let extractedText = '';
      
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const csvData = xlsx.utils.sheet_to_csv(sheet);
        extractedText += `\n--- Sheet: ${sheetName} ---\n${csvData}`;
      });
      
      return extractedText;
    } catch (error) {
      throw new Error(`XLSX parsing failed: ${error.message}`);
    }
  }

  static async _parseCSV(buffer) {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = Readable.from(buffer.toString('utf8'));
      
      stream
        .pipe(csv())
        .on('data', (data) => results.push(JSON.stringify(data)))
        .on('end', () => resolve(results.join('\n')))
        .on('error', (err) => reject(new Error(`CSV parsing failed: ${err.message}`)));
    });
  }
}

module.exports = FileParsingService;
