const fs = require("fs");
const PdfParser = require("pdf2json");
const { compose } = require("ramda");
const tabularize = require("./parseData");
const toCsv = require("./export");

const INPUT = "./raw/96182_table4a_msa.pdf";
const OUTPUT = "./medicare-gaf-data.csv";

const writeFileTo = (path) => (data) => fs.writeFileSync(path, data);
const parseData = compose(writeFileTo(OUTPUT), toCsv, tabularize);

const pdfParser = new PdfParser();
pdfParser.on("pdfParser_dataError", console.error);
pdfParser.on("pdfParser_dataReady", parseData);
pdfParser.loadPDF(INPUT);
