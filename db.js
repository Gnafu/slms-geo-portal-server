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

module.exports = db;
