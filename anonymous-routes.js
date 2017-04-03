const express = require('express'),
      app = module.exports = express.Router(),
      nodemailer = require('nodemailer'),
      config = require('./config');

const db = require('./db');

app.get('/api/layers.json', function(req, res) {
  db.find({ layers: { $exists: true } })
    .sort({ version: -1 })
    .limit(1)
    .exec((err, docs) => {
      if (err) return res.status(500).send('Can\'t get layers configuration from the DB');
      if (!docs.length) res.status(500).send('layers.json DB is empty!');

      const layersJson = docs[0];
      layersJson.$schema = layersJson.schema;
      delete layersJson.schema;
      delete layersJson.version;
      delete layersJson.date;

      res.status(200).send(layersJson);
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
});
