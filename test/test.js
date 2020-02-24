const theFramework = require("the-framework");
const testRunner = require("../test-runner");

const server = theFramework.startServer({
    test: true,
    apiDirectory: "test/api"
});

async function run () {
    const result = await testRunner.runTest(server, "GET", "/hello?name=Daryl", 200, {
        message: "Hello Daryls"
    });

    console.log(result.pass);
    console.log(result.outcomes);
}

run();



//testRunner.run();
