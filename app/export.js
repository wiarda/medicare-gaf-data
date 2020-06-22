const { flip } = require("ramda");
const papa = require("papaparse");

const CONFIG = {
  quotes: true,
  delimiter: ",",
  header: true,
  newline: "\r\n",
  skipEmptyLines: true,
}

const toCsv = flip(papa.unparse)(CONFIG);

module.exports = toCsv;
