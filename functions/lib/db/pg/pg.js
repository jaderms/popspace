const massive = require('massive');
const monitor = require('pg-monitor');
const moment = require("moment")

const overridePgTimestampConversion = () => {
  // node-postgres, which is what massivejs is based on,
  // performs time zone conversion.
  // this screws everything up if you store dates in UTC
  // what we want is to return the raw date.
  const types = require('pg').types;
  const timestampOID = 1114;
  types.setTypeParser(1114, function(stringValue) {
    return stringValue;
  })
}

let db = null

class Pg {
  async init() {
    if(db) {
      return db
    }
    overridePgTimestampConversion()
    // Require it here to make sure environment is set up with Netlify.
    // We inject env vars manually after the function starts,
    // but after module dependencies are loaded
    // so unless we access process.env after dependencies are loaded,
    // we won't have the credentials.
    const config = require('./config.js')
    db = await massive(config)
    monitor.attach(db.driverConfig);

    return db
  }



  async tearDown() {
    if(db) {
      monitor.detach()
      await db.pgp.end()
      db = null
    }
  }


}


module.exports = new Pg()
