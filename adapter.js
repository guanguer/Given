const given = require('./given');

module.exports = {
  resolved(val) {
    return given().resolve(val);
  },
  rejected(reason) {
    return given().reject(reason);
  },
  deferred() {
    let g = {};
    g.promise = given(function (resolve, reject) {
      g.resolve = resolve;
      g.reject = reject;
    });
    return g;
  }
}
