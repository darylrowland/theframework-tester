const fs = require("fs");
const uuid = require("uuid").v4;
const autoTestRunner = require("./auto-test-runner");

const TYPE_STATUS = "status";
const TYPE_FIELD = "field";
const TYPE_MANUAL_FAIL = "manual_fail";

module.exports = {

    testResults: [],
    runCount: 0,
    passedCount: 0,

    notNull(fieldName, value) {
        if (!value) {
            throw {
                type: TYPE_FIELD,
                field: fieldName,
                actual: value,
                expected: "[Not null]"
            }
        }
    },

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

    isObject(potentialObj) {
        if (Object.prototype.toString.call(potentialObj) == "[object Object]") {
            return true;
        }

        return false;
    },

    checkExpectedResponseItem(actual, expectedItemKey, expectedItemValue) {
        if (typeof expectedItemValue === "function") {
            // Run the function
            expectedItemValue(expectedItemKey, actual[expectedItemKey]);
        } else {
            var comparableExpected = expectedItemValue;
            var comparableActual = actual[expectedItemKey];
    
            if (this.isObject(comparableExpected)) {
                comparableExpected = JSON.stringify(comparableExpected);
            }
    
            if (this.isObject(comparableActual)) {
                comparableActual = JSON.stringify(comparableActual);
            }
    
            if (comparableActual !== comparableExpected) {
                throw {
                    type: TYPE_FIELD,
                    field: expectedItemKey,
                    actual: comparableActual,
                    expected: comparableExpected
                }
            }
        }
    },

    failTest(testResult, failureDescription) {
        // Loop through test results so we can update this one to failed
        for (result of this.testResults) {
            if (result.id === testResult.id) {
                // Update to fail
                result.pass = false;
                
                result.outcomes.push({
                    type: TYPE_MANUAL_FAIL,
                    description: failureDescription
                });

                break;
            } 
        }

    },

    async checkTestResult(description, method, url, actual, expectedStatus, expectedResponse) {
        var testResult = {
            id: uuid(),
            description: description,
            method: method,
            url: url,
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
                type: TYPE_STATUS,
                actual: `${actual.status}${actual.response.error ? " - " + actual.response.error: ""}`,
                expected: expectedStatus,
                response: actual.response
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
                    testResult.pass = false;
                }
                
            });
        }

        return testResult;
    },

    incrementTestCount(passed) {
        if (passed) {
            this.passedCount ++;
        }

        this.runCount ++;
    },

    async runTest(server, description, method, url, headers, body, expectedStatus, expectedResponse) {
        return new Promise((resolve, reject) => {
            var response = null;
            var status = null;

            server.runRequest({
                method: method,
                url: url,
                body: body,
                headers: headers
            }, {
                writeHead: (content) => {
                    status = content;
                },
                write: (content) => {
                    response = content;
                },
                end: async () => {
                    var testResult = await this.checkTestResult(description, method, url, {
                        status: status,
                        response: JSON.parse(response)
                    }, expectedStatus, expectedResponse);
                    
                    // Add in the actual response
                    testResult.response = JSON.parse(response);

                    this.testResults.push(testResult);

                    resolve(testResult);
                }
            });
        });
    },

    summarise() {
        console.log("");
        console.log("***\n");

        this.testResults.forEach((testResult) => {
            // Loop through all test results and print out results
            if (testResult.pass) {
                // If we get here, test has passed
                console.log(`✅ ${testResult.description}`);
                this.incrementTestCount(true);
            } else {
                console.log(`🔴 ${testResult.description}`);
                console.log(`     ${testResult.method} ${testResult.url}`);
                
                // Print each difference
                testResult.outcomes.forEach((outcome) => {
                    if (outcome.type === TYPE_MANUAL_FAIL) {
                        // Manual fail with a description
                        console.log(`     |  ${outcome.description}`);
                    } else {
                        console.log(`     |  ${outcome.field || outcome.type}`);
                        console.log(`     |     Actual   = ${outcome.actual}`);
                        console.log(`     |     Expected = ${outcome.expected}`);
                        
                        if (outcome.response) {
                            console.log(`     |     Response = ${JSON.stringify(outcome.response)}`);   
                        }
                    }
                });

                this.incrementTestCount(false);
            }
        });
        
        
        if (this.runCount === this.passedCount) {
            console.log(`\n✅ Finished. Total tests = ${this.runCount}`);
        } else {
            console.log(`\n🔴 Finished with FAILs. Total tests = ${this.runCount}. Passed = ${this.passedCount}. Failed = ${this.runCount - this.passedCount}`);
        }

        console.log("");
        console.log("***\n");

        
    },

    async run() {
        await this.findTests();
    },

    async autoTest(server, apiDirectory) {
        await autoTestRunner.run(server, apiDirectory);
    }


};