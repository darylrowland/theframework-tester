const theFramework = require("the-framework");
const testRunner = require("../test-runner");

const server = theFramework.startServer({
    test: true,
    apiDirectory: "test/api"
});

async function run () {
    const test1 = await testRunner.runTest(
        server, 
        "Test Hello Works",
        "GET", 
        {},
        "/hello?name=Daryl", 
        200, 
        {
            message: "Hello Daryl"
        }
    );

    testRunner.failTest(test1, "Did not work");

    testRunner.summarise();


}

run();



//testRunner.run();
