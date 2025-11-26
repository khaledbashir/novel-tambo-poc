const fs = require('fs');
const pdf = require('pdf-parse');

console.log('Type of pdf:', typeof pdf);
console.log('Value of pdf:', pdf);

if (typeof pdf === 'function') {
    let dataBuffer = fs.readFileSync('test-document.pdf');
    pdf(dataBuffer).then(function (data) {
        console.log("Success!");
    }).catch(function (error) {
        console.error("Error:", error);
    });
} else if (pdf.default && typeof pdf.default === 'function') {
    console.log('Using pdf.default');
    let dataBuffer = fs.readFileSync('test-document.pdf');
    pdf.default(dataBuffer).then(function (data) {
        console.log("Success!");
    }).catch(function (error) {
        console.error("Error:", error);
    });
}
