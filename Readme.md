# The Framework - Tester
This package makes it easy to test your applications built with The Framework.

## How to use
First, install it:

```
npm install --save theframework-tester
```

Next, create a file in your project that you'll run your tests from, e.g. test/test.js.

In that file, do something like:

```javascript
const theFramework = require("the-framework");
const testRunner = require("../test-runner");

// Setup your server as you would normally (i.e. from your main app)
const server = theFramework.startServer({
    test: true,
    apiDirectory: "test/api"
});

// Run whichever tests you want
async function run () {

    const testResult = await testRunner.runTest(
        server, // The server you are running against
        "Test Hello Works", // Description of the purpose of your test
        "GET", // HTTP Method
        "/hello?name=Daryl", // URL
        200, // HTTP Status you are expecting
        {
            message: "Hello Daryl"
        } // Object or parts of object you are expecting back
    );

    // You can also manually fail tests if you want to run your own checks
    // In this case, pass the test object and then a description of why it didn't work
    testRunner.failTest(test1, "Did not work");

    // After you've run all your tests, call summarise to summarise the results
    testRunner.summarise();

}

run();


```
