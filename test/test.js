const theFramework = require("the-framework");
const testRunner = require("../test-runner");
const path = require('path');

const TEST_TOKEN = "123456";

const server = theFramework.startServer({
    test: true,
    apiDirectory: "test/api",
    authenticationMethod: (req, token) => {
        if (!token || token !== TEST_TOKEN) {
            return null;
        }

        return {
            id: TEST_TOKEN,
            first_name: "Daryl",
            last_name: "Rowland"
        }
    },
    userTokenHeader: "x-user-token"
});

async function run () {
    await testRunner.runTest(
        server, 
        "Test Hello Works",
        "GET", 
        "/hello?name=Daryl", 
        {},
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
        {},
        {
            name: "Daryl"
        },
        200, 
        {
            message: "Goodbye Daryl"
        }
    );

    const result = await testRunner.runTest(
        server, 
        "Test Me Works",
        "GET", 
        "/me", 
        {
            "x-user-token": TEST_TOKEN
        },
        {},
        200, 
        {
            first_name: "Daryl"
        }
    );

    testRunner.summarise();
}


async function runAutoTest() {
    const apiPath = path.join(__dirname, "api");
    await testRunner.autoTest(server,  apiPath);
}

//run();
runAutoTest();
