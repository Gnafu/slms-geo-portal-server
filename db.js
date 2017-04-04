const Datastore = require('nedb'),
      db = new Datastore({
        filename: './layers.json.db',
        autoload: true
      });

db.getAutoincrementId = function(cb) {
  this.update(
    { _id: '__autoid__' },
    { $inc: { seq: 1 } },
    { upsert: true, returnUpdatedDocs: true },
    function(err, affected, autoid) {
      cb && cb(err, autoid.seq);
    }
  );
  return this;
};

db.insertNewLayersJson = function(layersJson) {
  return new Promise((resolve, reject) => {
    db.getAutoincrementId((err, id) => {
      if (err) reject(err);

      layersJson.version = id;
      layersJson.date = new Date();
      layersJson.schema = layersJson.$schema;
      delete layersJson.$schema;
      delete layersJson._id;

      db.insert(layersJson, (err, newDoc) => {
        if (err) reject(err);
        resolve(layersJson);
      });
    });
  });
};

module.exports = db;
