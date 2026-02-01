
const lib = require('pdf-parse');
console.log('Default:', typeof lib.default);
console.log('PDFParse:', typeof lib.PDFParse);

if (lib.default) {
    try {
        console.log('Testing default as function...');
        // Mock buffer or just see if it throws "not a function"
    } catch (e) { console.log(e.message); }
}

