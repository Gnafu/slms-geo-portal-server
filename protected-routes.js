const express = require('express'),
      jwt = require('express-jwt'),
      config = require('./config');

const app = module.exports = express.Router();

const db = require('./db');

const jwtCheck = jwt({
  secret: config.secret
});

app.use('/api/protected', jwtCheck);

app.use(function(err, req, res, next) {
  res.status(err.status).send(err.message);
});

app.post('/api/protected/layers_conf/save', function(req, res) {
  db.insertNewLayersJson(req.body)
    .then(() => res.status(200).send('Ok'))
    .catch(error => res.status(400).send(error));
});

app.get('/api/protected/layers_conf/versions', function(req, res) {
  db.find({ layers: { $exists: true } })
    .sort({ version: -1 })
    .exec((err, docs) => {
      if (err) return res.status(500).send('Can\'t get layers configuration from the DB');
      if (!docs.length) return res.status(500).send('layers.json DB is empty!');

      docs.forEach(layersJson => {
        layersJson.$schema = layersJson.schema;
        delete layersJson.schema;
      });

      const ret = docs.map(doc => ({ version: doc.version, date: doc.date || new Date(0) })); // DEBUG - delete new Date(0)
      res.status(200).send(ret);
    });
});

app.get('/api/protected/layers_conf/restore_version', function(req, res) {
  const version = req.query.version;
  db.find({ version: +version })
    .limit(1)
    .exec((err, docs) => {
      if (err) return res.status(500).send(`Can't get version ${version} layers configuration from the DB`);
      if (!docs.length) return res.status(500).send(`Version ${version} not found!`);

      const layersJson = docs[0];

      db.insertNewLayersJson(layersJson)
        .then(() => res.status(200).send('Ok'))
        .catch(error => res.status(400).send(error));
    });
});
