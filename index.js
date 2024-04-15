require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('node:dns');
const crypto = require('crypto')
const dnsPromises = dns.promises;

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app
// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let table = {}

function createHash(data, len) {
  return crypto.createHash("shake256", { outputLength: len })
    .update(data)
    .digest("hex");
}

app.post('/api/shorturl', genShortUrl);

app.get('/api/shorturl/:id', redirectUrl);

async function genShortUrl(req, res) {
  const url = req.body.url
  if (! isValidUrl(url)) {
    res.json({"error": "Invalid url"})
  }
  else {
    const hostname = new URL(url).hostname
    try {
      const ip = await dnsPromises.lookup(hostname)
      const id = createHash(url, 5)
      table[id] = url
      res.json({
        "original_url": url,
        "short_url": id
    })
    } catch (error) {
      res.json({"error": "Invalid Hostname"})
    }
  }
}



function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

function redirectUrl(req, res){
  const id = req.params.id
  if (! id in table) res.json({"error": "No short URL found for the given input"})
  const url= table[id]
  res.redirect(url)
}

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
