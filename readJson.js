var fs = require('fs');

function readJson(path) {
    const data = fs.readFileSync(path)
    let json = JSON.parse(data)
    return json
}

exports.readJson = readJson