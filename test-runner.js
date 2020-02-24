const fs = require("fs");

module.exports = {

    async ls(dir) {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files);
                }
            });
        });

    },

    async findTests() {
        const files = await this.ls("/");
        
        var testFiles = [];

        files.forEach((file) => {
            if (file.endsWith(".json")) {
                testFiles.push(file);
            }
        });
        
        console.log(testFiles);

        return testFiles;
    },

    runTests() {
        
    },


    checkExpectedResponseItem(actual, expectedItemKey, expectedItemValue) {
        if (actual[expectedItemKey] !== expectedItemValue) {
            throw {
                type: "field",
                actual: actual[expectedItemKey],
                expected: expectedItemValue
            }
        }
    },

    async checkTestResult(actual, expectedStatus, expectedResponse) {
        var testResult = {
            pass: true,
            outcomes: []
        };
        
        if (!actual) {
            testResult.pass = false;
            return testResult;
        }

        if (expectedStatus !== actual.status) {
            testResult.pass = false;
            testResult.outcomes.push({
                type: "status",
                actual: actual.status,
                expected: expectedStatus
            });
        }

        if (expectedResponse && Object.keys(expectedResponse).length > 0) {
            // Loop through each expected response item
            Object.keys(expectedResponse).forEach((key) => {
                try {
                    this.checkExpectedResponseItem(actual.response, key, expectedResponse[key]);
                } catch (e) {
                    // If an errror is thrown, we have a difference
                    testResult.outcomes.push(e);
                }
                
            });
        }

        return testResult;
    },

    async runTest(server, method, url, expectedStatus, expectedResponse) {
        return new Promise((resolve, reject) => {
            var response = null;
            var status = null;

            server.runRequest({
                method: method,
                url: url
            }, {
                writeHead: (content) => {
                    status = content;
                },
                write: (content) => {
                    response = content;
                },
                end: async () => {
                    const testResult = await this.checkTestResult({
                        status: status,
                        response: JSON.parse(response)
                    }, expectedStatus, expectedResponse);
                    
                    resolve(testResult);
                }
            });
        });
    },

    async run() {
        await this.findTests();
    }


};