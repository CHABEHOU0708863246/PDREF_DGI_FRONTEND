const express = require('express');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.env.PORT || 4000);
const root = path.join(__dirname, '..', 'dist', 'PDREF_FRONTEND', 'browser');
const app = express();

if (!fs.existsSync(path.join(root, 'index.csr.html'))) {
  throw new Error(`Build development introuvable : ${root}`);
}

app.use(express.static(root, { index: false, maxAge: 0 }));
app.use((_request, response) => {
  response.sendFile(path.join(root, 'index.csr.html'));
});
app.listen(port, () => {
  process.stdout.write(`LIGHTHOUSE_READY http://localhost:${port}\n`);
});
