const states = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
};

function identity(value) {
  return value;
}

function throwIdentity(reason) {
  throw reason;
}

function isFunction(val) {
  return val && typeof val === 'function';
}

function isObject(val) {
  return val && typeof val === 'object';
}

function async(fn) {
  setImmediate(fn);
}

let Promise;

function isPromise(val) {
  return val && Object.getPrototypeOf(val) === Promise;
}

function Resolve(given, x) {
  if (given === x) {
    given.reject(new TypeError('Promise and value refer to the same object'));
  } else if (isPromise(x)) {
    if (x.status === states.PENDING) {
      x.then((val) => {
        Resolve(given, val);
      }, (reason) => {
        given.reject(reason);
      });
    } else if (x.status === states.FULFILLED) {
      given.fulfill(x.value);
    } else {
      given.reject(x.value);
    }
  } else if (isFunction(x) || isObject(x)) {
    let called = false;
    try {
      const then = x.then;
      if (isFunction(then)) {
        then.call(x,
          (y) => {
            if (!called) {
              Resolve(given, y);
              called = true;
            }
          }, (r) => {
            if (!called) {
              given.reject(r);
              called = true;
            }
          }
        );
      } else {
        given.fulfill(x);
      }
    } catch (err) {
      if (!called) {
        given.reject(err);
      }
    }
  } else {
    given.fulfill(x);
  }
}

function Given() {
  const given = Object.create(Promise);
  given.init();
  return given;
}

const Thenable = {
  then(onFulfilled, onRejected) {
    const given = Given();

    given.setFulfillHandler(onFulfilled);
    given.setRejectHandler(onRejected);

    this.enqueue(given);
    return given;
  },
};

Promise = Object.create(Thenable);

Promise.init = function init() {
  this.status = states.PENDING;
  this.queue = [];
  this.handlers = {};
};

Promise.setFulfillHandler = function setFulfillHandler(handler = identity) {
  this.handlers.fulfill = isFunction(handler) ? handler : identity;
};

Promise.setRejectHandler = function setRejectHandler(handler = throwIdentity) {
  this.handlers.reject = isFunction(handler) ? handler : throwIdentity;
};

Promise.fulfill = function fulfill(value) {
  if (this.status === states.PENDING) {
    this.status = states.FULFILLED;
    this.value = value;
    this.dequeueAll();
  }
};

Promise.reject = function reject(reason) {
  if (this.status === states.PENDING) {
    this.status = states.REJECTED;
    this.value = reason;
    this.dequeueAll();
  }
};

Promise.enqueue = function enqueue(given) {
  if (this.status !== states.PENDING) {
    this.executeHandler(given);
  } else {
    this.queue.push(given);
  }
};

Promise.dequeueAll = function dequeueAll() {
  while (this.queue.length) {
    this.executeHandler(this.queue.shift());
  }
};

Promise.executeHandler = function executeHandler(given) {
  let handler;
  let value = this.value;

  if (this.status === states.FULFILLED) {
    handler = given.handlers.fulfill;
  } else {
    handler = given.handlers.reject;
  }

  async(() => {
    try {
      value = handler(value);
    } catch (err) {
      given.reject(err);
      return;
    }
    Resolve(given, value);
  });
};

module.exports = {
  resolved(value) {
    const given = Given();
    Resolve(given, value);
    return given;
  },
  rejected(reason) {
    const given = Given();
    given.reject(reason);
    return given;
  },
  deferred() {
    const promise = Given();
    return {
      promise,
      resolve(value) {
        Resolve(promise, value);
      },
      reject(reason) {
        promise.reject(reason);
      }
    };
  }
};
