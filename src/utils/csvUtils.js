const fs = require('fs');
const parse = require('csv-parse');
const fastcsv = require('fast-csv');

async function parseCsvFile(filePath) {
  const records = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
      .on('data', row => records.push(row))
      .on('end', () => resolve(records))
      .on('error', err => reject(err));
  });
}

function streamCsvToResponse(rows, res, headers) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');

  const csvStream = fastcsv.format({ headers });
  csvStream.pipe(res);
  rows.forEach(r => csvStream.write(r));
  csvStream.end();
}

module.exports = { parseCsvFile, streamCsvToResponse };
