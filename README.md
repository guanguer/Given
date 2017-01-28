# Given


Given is a Promises/A+ spec implementation wrote for fun and learning purposes, using ES6 syntax, taking as reference the blog post on <a href="http://abdulapopoola.com/2015/02/23/how-to-write-a-promisea-compatible-library/">here, </a> and the Native-Promise-Only library on <a href=""/>here. </a>.

## Usage

Use Given in the browser by adding the file Given.js, and use the constructor:

```js
var g = given().resolve("Hello");
g.then(function(msg) {
  console.log(msg);
});
```

Use in NodeJS by adding the file GIven.js, and require it where needed:

```js
const given = require('./given');
var g = given().resolve("Hello");
g.then(function(msg) {
  console.log(msg);
});
```
## Compliance

*Given* is a Promises/A+ compliant implementation, because it passed all tests in [Promises/A+ Test Suite](https://github.com/promises-aplus/promises-tests).

To run the tests:

1. git-clone this repo
2. Run `npm install`
3. Run `npm test`.

## Acknowledgments

I must thank Kyle Simpson (@getify) for his feedback on the first version I published of this library.  I have implemented most of his suggestions in the 1.0.1 version.