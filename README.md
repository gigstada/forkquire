# forkquire

Forkquire allows you to import a function exported from another file and invoke it in a new process without worrying about message-passing or process setup and teardown.

## Installation

`npm install --save forkquire`

## Usage

You can use forkquire like you use require to load modules that export a function. This is meant to be used whe you have a slow or resource-intensive function you want to run in a separate process for better performance or parallelizability. Here's an example of how you might do that:

**count-to-x.js**
```javascript
module.exports = x => {

    for (var i = 0; i < x; i++) {}

    return i;
}
```

**index.js**
```javascript
const forkquire = require("forkquire");

const countToX = forkquire("./count-to-x.js");

countToX(1e9).then(x => console.log(x));

// prints 1000000000

```
Note that forkquired functions return a promise even if your exported function does not.

## Limitations

### Target Module Export Format

In the current version of this module, the forkquired module must have a module.exports that is a function. You will only be able to call this function and will not be able to access properties on it. This is because forkquire does not *really* return the actual exported function, but rather a wrapper that allows you to invoke the real function in a new process.

### Serializable Arguments and Return Values

All values you pass to and from the forkquired function must be serializable. Passing or returning functions or objects whose prototypes you want to access may not work as expected and in some cases will throw an error.

### Debugging

If you're setting breakpoints in your forkquired module you expect to hit in a debugger, it may not work how it typically does when the module is required. There are a couple of ways you can work around this:

* Temporarily change your `forkquire("your/module/path")` call to `require("your/module/path")` to enable debugging. This will bring your function call back into the current process which means your parallelization will be disabled while this change is in place.
* Run your forkquired module in its own debugger instance. You can use [this approach](https://nodejs.org/docs/latest/api/all.html#modules_accessing_the_main_module) to call your function with some default inputs when it is invoked directly by node in the terminal or debugger as shown here:

**count-to-x.js**
```javascript
function countToX(x) {

    for (var i = 0; i < x; i++) {}

    return i;
}

if (require.main === module) {
    console.log(countToX(1e9));
}

module.exports = countToX;
```

```
$ node count-to-x.js
1000000000
```

## Examples

### Run a slow function on many values in parallel

**add-one-billion-one-by-one.js**
```javascript
function addOneBillionOneByOne(n) {

    for (let i = 0; i < 1e9; i++) {
        n++;
    }

    return n;
}

module.exports = addOneBillionOneByOne;

```

**index.js**
```javascript
const forkquire = require("forkquire");

const addOneBillionOneByOne = forkquire("./add-one-billion-one-by-one");

async function main() {

    const nums = [1, 2, 3, 4];

    const promises = nums.map(n => addOneBillionOneByOne(n));

    const answers = await Promise.all(promises);

    console.log(answers);

    // prints [ 1000000001, 1000000002, 1000000003, 1000000004 ]
}

main();
```
You'll notice that if you change the `forkquire("./add-one-billion-one-by-one")` call to `require("./add-one-billion-one-by-one")`, it will still run but it will be slower as the function calls will not happen in parallel.

### Run a slow function on many values in parallel with a concurrency limit

This example uses the [Promise.map function](http://bluebirdjs.com/docs/api/promise.map.html) from [bluebird](https://www.npmjs.com/package/bluebird) to enforce a concurrency limit.

**add-one-billion-one-by-one.js** (same as previous example)
```javascript
function addOneBillionOneByOne(n) {

    for (let i = 0; i < 1e9; i++) {
        n++;
    }

    return n;
}

module.exports = addOneBillionOneByOne;

```

**index.js**
```javascript
const forkquire = require("forkquire");

const addOneBillionOneByOne = forkquire("./add-one-billion-one-by-one");

const Promise = require("bluebird");

async function main() {

    const nums = [1, 2, 3, 4];

    const answers = await Promise
        .map(nums, n => addOneBillionOneByOne(n), {concurrency: 2});

    console.log(answers);

    // prints [ 1000000001, 1000000002, 1000000003, 1000000004 ]
}

main();
```