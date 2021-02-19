# `endb`
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Key-value storage for multiple databases

## Installing
Using npm:
```
$ npm install endb-main
```

Using yarn:
```
$ yarn add endb-main
```

## Usage

```javascript
const Endb = require('endb-main');

const endb = new Endb();
const endb = new Endb({
  store: new Map(),
  namespace: 'cache',
});
```

## Database Support
|  Database  |         Endb Adapter        |
| ---------- | --------------------------- |
|    SQL     |    [BluSpring/endb-sql](https://npmjs.com/package/endb-sql)   |
|   MySQL    |  [BluSpring/endb-mysql](https://npmjs.com/package/endb-mysql)   |
|   SQlite   |  [BluSpring/endb-sqlite](https://npmjs.com/package/endb-sqlite)  |
|  MongoDB   |  [BluSpring/endb-mongo](https://npmjs.com/package/endb-mongo)   |
| PostgreSQL | [BluSpring/endb-postgres](https://npmjs.com/package/endb-postgres) |
|   Redis    |   [BluSpring/endb-redis](https://npmjs.com/package/endb-redis)  |

## What happened to the original `endb`?
  I don't know what happened. The original developer, [`chroventer`](https://github.com/chroventer) disappeared without a trace (his GitHub account seems to have been deleted too), so I decided to recover the files myself from what remained on NPM. 
  
  This unfortunately means that the source files are not the real ones, and the original means of testing have also been lost. So from now on, I guess I'm the new maintainer of endb.

  If chroventer returns to GitHub and anything else in general, and wishes for me to stop maintaining this project, he can e-mail me with proof that it is actually him, and I shall archive this project.