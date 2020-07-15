const express = require('express'),
      app = module.exports = express.Router(),
      nodemailer = require('nodemailer'),
      config = require('./config'),
      fs = require('fs');

const db = require('./db');

function loadFromFile(path) {
  const json = fs.readFileSync(path, 'utf8');
  return db.insertNewLayersJson(JSON.parse(json));
}

app.get('/api/layers.json', function(req, res) {
  db.find({ layers: { $exists: true } })
    .sort({ version: -1 })
    .limit(1)
    .exec((err, docs) => {
      if (err) return res.status(500).send('Can\'t get layers configuration from the DB');
      console.log(docs);
      if (!docs.length) {
        // res.status(500).send('layers.json DB is empty!');
        loadFromFile('./layers.default.json').then((json) => {
          res.status(200).send(json);
        });
      } else {
        const json = docs[0];
        json.$schema = json.schema;
        delete json.schema;
        delete json.version;
        delete json.date;

        res.status(200).send(json);
      }
    });
});

const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: 'unix',
  path: '/usr/sbin/sendmail'
});

app.post('/feedback', (req, res) => {
  const to = config.mail.to.find(t => t.category === req.body.category);
  if (!to) {
    res.status(500).send(`Category not found: ${req.body.category}`);
    return;
  }

  transporter.sendMail({
    from: config.mail.from,
    to: to.recipients.join(','),
    subject: 'NFMS Portal feedback',
    html: '<h1>NFMS Portal feedback</h1>' +
          `<p><b>Category:</b>${req.body.category}</p>` +
          `<p><b>Message:</b>${req.body.message}</p>` +
          `<p>Please click "Upload GeoJSON" on ${config.mail.portalURL} portal and drop the attached file on the popup.</p>`,
    attachments: [{
      filename: 'overlay.kml',
      content: req.body.kml
    }]
  }, (err, info) => {
    if (err) res.status(500).send(err);
    else res.sendStatus(200);
  });
  res.sendStatus(200);
});

app.post('/api/layer_info_download_log', (req, res) => {
  const from = config.layerInfoDownloadTracking && config.layerInfoDownloadTracking.from;
  const to = config.layerInfoDownloadTracking && config.layerInfoDownloadTracking.to;

  if (!from || !to) {
    const str = !from && !to ? 'parameters "from" and "to" are' : `parameter ${!from ? '"from"' : '"to"'} is`;
    res.status(500).send(`layerInfoDownloadTracking config ${str} not set`);
    return;
  }

  transporter.sendMail({
    from,
    to,
    subject: 'Layer Info Download Data',
    html: `<p>Requester email: <a href="${req.body.email}">${req.body.email}</a></p>` +
      `<p>Requested file link: <a href="${req.body.link}">${req.body.link}</a></p>`
  }, (err) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.sendStatus(200);
    }
  });
});
