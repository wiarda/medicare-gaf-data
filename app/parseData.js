const {
  compose,
  prop,
  filter,
  equals,
  lt,
  and,
  converge,
  reduce,
  last,
  map,
  not,
  trim,
  head,
  tail,
  concat,
  flip,
  subtract,
  flatten,
  prepend,
} = require("ramda");

const log = x => y => (console.log(x), y);

// Gather horizontal line y-offsets for each page
const extractFills = prop("Fills");
const isHorizontalLine = compose(lt(0.1), prop("h"));
const isBlackLine = compose(equals(0), prop("clr"));
const filterHorizontalLines = filter(
  converge(and, [isHorizontalLine, isBlackLine])
);
const extractY = map(prop("y"));
const deduplicate = reduce((acc, curr) => {
  if (!acc) acc = []; // otherwise the acc will be memoized
  if (curr > last(acc) || last(acc) === undefined) acc.push(curr);
  return acc;
}, false);
const decrease = amt => map(flip(subtract)(amt));
const rowBreaks = compose(
  decrease(0.5), // lines not offset the same as text
  deduplicate,
  extractY,
  filterHorizontalLines,
  extractFills
);


// Gather vertical lines x-offsets for each page
const isVerticalLine = compose(not, isHorizontalLine);
const filterVerticalLines = filter(
  converge(and, [isVerticalLine, isBlackLine])
);
const extractX = map(prop("x"));
const deduplicateXs = (xs) => Array.from(new Set(xs));
const colBreaks = compose(
  deduplicateXs,
  extractX,
  filterVerticalLines,
  extractFills
);

// Break a page's text entries into a tabular matrix
const extractTexts = prop("Texts");
const x = prop("x");
const y = prop("y");
const text = compose(trim, decodeURIComponent, prop("T"), head, prop("R"));

const tabularizePage = (pageData) => {
  const yOffsets = rowBreaks(pageData);
  const xOffsets = colBreaks(pageData);
  const texts = extractTexts(pageData);
  const rows = [[]];

  // break page into rows
  let idx = 0;
  for (let i = 0; i < yOffsets.length; ++i) {
    while (y(texts[idx]) < yOffsets[i]) {
      last(rows).push(texts[idx++]);
    }

    rows.push([]);
  }

  while (idx < texts.length) {
    last(rows).push(texts[idx++]);
  }

  // break rows into columns -- items above the first row line are headers
  // MSA is clumped with first Urban area (between idx 0 & 2)
  // State and subsequent Urban areas are loose
  // Wage Index and GAF are clumped (between idx 3 & 4) .. though of course there are exceptions
  return tail(rows).map((row) => {
    const cols = [[], []];
    for (let i = 0; i < row.length; ++i) {
      if (x(row[i]) < xOffsets[2]) {
        cols[0].push(text(row[i]));
      } else {
        cols[1].push(text(row[i]));
      }
    }
    
    return flatten(cols.map((el, idx) => {
      const temp = el.join(" ");
      if (idx === 0) {
        return [temp.slice(0,4), temp.slice(5)]
      } else {
        return temp.split(" ");
      }
    }));
    
  });
};

// fold paginated matrices
const foldPages = reduce((acc, curr) => {
  return concat(acc, curr);
}, []);

// extract text data from PDF and return it in a tabular matrix
const HEADERS = ["MSA", "Counties", "Wage Index", "GAF"];
const extractPages = compose(prop("Pages"), prop("formImage"));
const tabularizeData = compose(
  log("Extraction complete"),
  prepend(HEADERS),
  tail,
  foldPages,
  map(tabularizePage),
  extractPages,
);

module.exports = tabularizeData;
