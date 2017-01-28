(function UMD(name, context, definition) {
  // special form of UMD for polyfilling across evironments
  context[name] = context[name] || definition();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = context[name];
  } else if (typeof define === 'function' && define.amd) {
    define(() => context[name]);
  }
}('given', typeof global !== 'undefined' ? global : this, () => {
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

  function isPromise(val) {
    return val && typeof val === 'object' && val.thenable;
  }

  function isPending(status) {
    return status && status === states.PENDING;
  }

  function isFulfilled(status) {
    return status && status === states.FULFILLED;
  }

  function schedule(fn) {
    setTimeout(fn, 0);
  }

  function Resolve(promise, x) {
    if (promise === x) {
      promise.reject(new TypeError('The promise and value refer to the same object'));
    } else if (isPromise(x)) {
      x.then((val) => {
        Resolve(promise, val);
      }, (reason) => {
        promise.reject(reason);
      });
    } else if (isFunction(x) || isObject(x)) {
      let called = false;
      try {
        const then = x.then;
        if (isFunction(then)) {
          then.call(x, (val) => {
            if (!called) {
              Resolve(promise, val);
              called = true;
            }
          }, (reason) => {
            if (!called) {
              promise.reject(reason);
              called = true;
            }
          });
        } else {
          promise.resolve(x);
        }
      } catch (err) {
        if (!called) {
          promise.reject(err);
        }
      }
    } else {
      promise.resolve(x);
    }
  }

  function queue() {
    const items = [];

    const add = function add(item) {
      items.push(item);
    };

    const serve = function serve() {
      while (items.length) {
        let item = items.shift();
        item.process(item);
        item = undefined;
      }
    };

    return Object.freeze({
      add,
      serve
    });
  }

  function given(fn) {
    let status = states.PENDING;
    let value;
    let that;

    const { add, serve } = queue();

    const then = function then(onFulfilled, onRejected) {
      const g = {
        process(self) {
          let handler;
          let val;

          if (isFulfilled(status)) {
            handler = isFunction(onFulfilled) ? onFulfilled : identity;
          } else {
            handler = isFunction(onRejected) ? onRejected : throwIdentity;
          }

          try {
            val = handler(value);
          } catch (err) {
            self.reject(err);
            return;
          }
          Resolve(self.promise, val);
        }
      };

      g.promise = given((resolve, reject) => {
        g.resolve = resolve;
        g.reject = reject;
      });

      add(g);

      if (!isPending(status)) {
        schedule(serve);
      }

      return g.promise;
    };

    const fail = function fail(err) {
      return then(undefined, err);
    };

    const resolve = function resolve(val) {
      if (isPending(status)) {
        status = states.FULFILLED;
        value = val;
        schedule(serve);
      }
      return that;
    };

    const reject = function reject(reason) {
      if (isPending(status)) {
        status = states.REJECTED;
        value = reason;
        schedule(serve);
      }
      return that;
    };

    that = Object.freeze({
      thenable: true,
      resolve,
      reject,
      then,
      catch: fail
    });

    try {
      if (fn) {
        fn((val) => {
          resolve(val);
        }, (reason) => {
          reject(reason);
        });
      }
    } catch (err) {
      reject(err);
    }
    return that;
  }

  return given;
}));
