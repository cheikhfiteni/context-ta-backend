const fs = require('fs');
const path = require('path');

function writeErrorLog(error, verbose = false) {
    const logFilePath = path.join(__dirname, 'log.txt');
    const time = new Date().toISOString();
    const stackTrace = error.stack || 'No stack trace available';

    let errorMessage = verbose ? 
        `${time}\nError retrieving secrets: ${error}\nStack Trace:\n${stackTrace}\n` :
        `${time}\nError retrieving secrets: ${error}\n`

    errorMessage += '\n';
    // console.error(errorMessage);
    fs.appendFileSync(logFilePath, errorMessage);
}

module.exports = { writeErrorLog };