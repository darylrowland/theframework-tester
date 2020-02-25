const theFramework = require("the-framework");
const testRunner = require("../test-runner");

const server = theFramework.startServer({
    test: true,
    apiDirectory: "test/api"
});

async function run () {
    await testRunner.runTest(
        server, 
        "Test Hello Works",
        "GET", 
        "/hello?name=Daryl", 
        {},
        200, 
        {
            message: "Hello Daryl"
        }
    );

    await testRunner.runTest(
        server, 
        "Test Goodbye Works",
        "POST", 
        "/goodbye?name=Daryl", 
        {
            name: "Daryl"
        },
        200, 
        {
            message: "Goodbye Daryl"
        }
    );

    testRunner.summarise();


}

run();



//testRunner.run();
