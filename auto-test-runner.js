const { v4: uuidv4 } = require('uuid');
const fs = require("fs");
const constants = require('./constants');
const comparators = require('./comparators');

module.exports = {

    async runOnServer(server, method, url, body, headers) {
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
                    resolve(response);
                }
            });
        });
    },

    getTestsToRun(apiDefinition) {
        var tests = [];

        apiDefinition.method.forEach((api) => {
            if (api.options && api.options.tests) {
                api.options.tests.forEach((test) => {
                    tests.push({
                        id: uuidv4(),
                        test: test,
                        api: api
                    });
                });
            }
        });

        return tests;
    },

    areDependenciesMet(test, resultData) {
        if (!test.dependsOn || test.dependsOn.length === 0) {
            return true;
        }

        // We have dependencies, see if all are present
        for (const dependency of test.dependsOn) {
            if (!resultData[dependency]) {
                return false;
            }
        }

        return true;
    },

    getNextTest(tests, resultData) {
        // Here we look through tests to see which is the next one we can run
        for (const test of tests) {
            if (this.areDependenciesMet(test.test, resultData)) {
                return test;
            }
        }

        return null;
    },

    getValueFromParamsOrResultData(fieldValue, params, resultData) {
        if (fieldValue && fieldValue.indexOf("${") < 0) {
            return fieldValue;
        }

        if (params[fieldValue]) {
            return params[fieldValue];
        }

        if (fieldValue.indexOf("${") === 0) {
            // If key starts with ${ we need to look for the value in resultData
            // Note result data can have data like this: {hello: {message: "Hello Daryl"}}
            // So we need to split the key by . and then look through the resultData
            var keys = fieldValue.substring(2, fieldValue.length - 1).split(".");
            var result = JSON.parse(JSON.stringify(resultData));

            for (const key of keys) {
                if (!result[key]) {
                    return null;
                }

                result = result[key];
            }

            return result;
        }

        return null;
    },

    formatPath(path, key) {
        return `${path ? path + "." : ""}${key}`;
    },

    async compareKey(path, key, result, expectedResult) {
        if (!result[key]) {
            // result does not have the key
            return [{
                pass: false,
                key: this.formatPath(path, key),
                actualResult: null,
                expectedResult: expectedResult[key],
                reason: constants.KEY_MISSING
            }];
        }

        // If expected result is a function we use that to return the comparison result
        if (comparators.isCompareFunction(expectedResult[key])) {
            return await comparators.compare(path, key, result, expectedResult);
        }

        // We have the key - first check the type matches that of expectedResult
        if (typeof result[key] !== typeof expectedResult[key]) {
            // Types don't match
            return [{
                pass: false,
                key: this.formatPath(path, key),
                expectedResult: typeof expectedResult[key],
                actualResult: typeof result[key],
                reason: constants.NOT_MATCHING
            }];
        }

        // Types match - now check the value
        if (typeof result[key] === "object") {
            // We need to loop through each key recursively in the expected result and compare it to the actual result
            var comparisonResults = [];

            for (const subKey of Object.keys(expectedResult[key])) {
                comparisonResults = comparisonResults.concat(await this.compareKey(`${path}.${key}`, subKey, result[key], expectedResult[key]));
            }

            return comparisonResults;
        } else {
            // We have a simple value - compare it
            if (result[key] === expectedResult[key]) {
                return [{
                    pass: true,
                    key: this.formatPath(path, key),
                    expectedResult: expectedResult[key],
                    actualResult: result[key],
                    reason: null
                }];
            } else {
                return [{
                    pass: false,
                    key: this.formatPath(path, key),
                    expectedResult: expectedResult[key],
                    actualResult: result[key],
                    reason: constants.NOT_MATCHING
                }];
            }
        }
    },

    async compareOutcome(result, expectedResult) {
        if (!expectedResult) {
            // No expected result specified
            return {comparisonOutcome: true};
        }

        if (result) {
            jsonResult = JSON.parse(result);
            
            // We need to loop through each key recursively in the expected result and compare it to the actual result
            var comparisonResults = [];

            for (const key of Object.keys(expectedResult)) {
                comparisonResults = comparisonResults.concat(await this.compareKey("", key, jsonResult, expectedResult));
            }

        }

        var passed = true;

        for (const comparison of comparisonResults) {
            if (!comparison.pass) {
                passed = false;
                break;
            }
        }

        return {
            comparison: comparisonResults,
            comparisonOutcome: passed
        };
    },

    async runTest(server, test, resultData) {
        // test contains api and test
        // api contains method, url, body, headers
    
        var url = test.api.url;

        // The url contains sections like :id and :name
        // We need to replace these with the actual values
        if (test.test.params) {
            Object.keys(test.test.params).forEach((key) => {
                if (url.indexOf(`:${key}`) >= 0) {
                    url = url.replace(`:${key}`, test.test.params[key]);
                    
                    // We also need to remove this paramfrom the params
                    delete test.test.params[key];
                }
            });
        }

        var body = null;
        var queryStr = "?";

        if (test.api.method === "GET") {
            if (test.test.params) {
                Object.keys(test.test.params).forEach((key) => {
                    
                    const value = this.getValueFromParamsOrResultData(test.test.params[key], test.test.params, resultData);
                
                    if (value) {
                        if (queryStr.length > 1) {
                            queryStr += "&";
                        }

                        queryStr += `${key}=${value}`;
                    }
                });
            }

        } else {
            body = test.test.params;

            if (body) {
                // We need to look through all the params and replace any ${} with 
                Object.keys(body).forEach((key) => {
                    body[key] = this.getValueFromParamsOrResultData(body[key], test.test.params, resultData);
                });
            }

        }

        const result = await this.runOnServer(server, test.api.method, `${url}${queryStr}`, body, test.test.headers);
        
        const {comparison, comparisonOutcome} = await this.compareOutcome(result, test.test.expectedResult);

        return {
            result: JSON.parse(result),
            comparisonOutcome: comparisonOutcome,
            comparison: comparison
        }
    },

    formatActualOrExpectedResult(result) {
        if (comparators.isCompareFunction(result)) {
            return comparators.FRIENDLY_NAMES[result];
        }


        // If result is an object stringify it
        if (typeof result === "object") {
            return JSON.stringify(result);
        }

        return result;
    },

    async run(server) {
        const apiDefinition = JSON.parse(await this.runOnServer(server, "GET", "/docs.json", {}, {}));
        var tests = this.getTestsToRun(apiDefinition);

        if (tests.length === 0) {
            console.log(`👎 We don't have any tests to run...\n`);
            return;
        }

        console.log(`👍 We have ${tests.length} tests to run...\n`);

        var passedCount = 0;
        var resultData = {};
        var testResults = [];

        var nextTest = this.getNextTest(tests, resultData);
    
        while (nextTest) {
            nextTest = this.getNextTest(tests, resultData);

            if (nextTest) {
                // We need to remove this test from the list of future tests to run
                for (var  i = 0; i < tests.length; i++) {
                    if (tests[i].id === nextTest.id) {
                        tests.splice(i, 1);
                    }
                }

                // Run test
                var result;
                var comparisonOutcome;
                var comparison;

                try {
                    const overallResult = await this.runTest(server, nextTest, resultData);
                    result = overallResult.result;
                    comparisonOutcome = overallResult.comparisonOutcome;
                    comparison = overallResult.comparison;

                    const success = comparisonOutcome && nextTest.test.success;

                    testResults.push({
                        test: nextTest,
                        result: result,
                        comparison: comparison && comparison.length > 0 ? comparison : undefined,
                        pass: success // If we were exepected a success return, we can pass
                    });

                    if (success) {
                        passedCount ++;
                    }

                    // Add result to resultData
                    if (nextTest.test.storeResult) {
                        resultData[nextTest.test.storeResult] = result;
                    }

                } catch (e) {
                    testResults.push({
                        test: nextTest,
                        result: e,
                        pass: !nextTest.test.success // If we were not expecting a success return, we can pass
                    });

                    if (!nextTest.test.success) {
                        passedCount ++;
                    }
                }

                console.log(`${testResults[testResults.length - 1].pass ? "✅" : "❌"} '${nextTest.test.description || "Unknown"}' [${nextTest.api.method}] ${nextTest.api.url}`);

                if (testResults[testResults.length - 1].comparison && testResults[testResults.length - 1].comparison.length > 0) {
                    testResults[testResults.length - 1].comparison.forEach((comparison) => {
                        if (!comparison.pass) {
                            console.log(`      - ${comparison.key} ${comparison.reason === constants.KEY_MISSING ? "is missing" : "does not match"} \n            Expected: ${this.formatActualOrExpectedResult(comparison.expectedResult)}\n            ${comparison.reason === constants.NOT_MATCHING ? `Actual: ${this.formatActualOrExpectedResult(comparison.actualResult)}` : ""}`);
                        }
                    });
                }

            }
        }

        // Save testResults to a formatted JSON file
        const jsonString = JSON.stringify(testResults, null, 2);

        // Write formatted JSON string to file
        fs.writeFile('test-results.json', jsonString, err => {
          if (err) {
            console.error(err);
            return;
          }
        
          console.log("\n--------------------------");
          console.log(`${passedCount === testResults.length ? "✅" : "❌"} ${passedCount} / ${testResults.length} tests passed`);
          
          if (tests.length > 0) {
            console.log(`❌ Could not run ${tests.length} tests as dependencies were not met`);
            tests.forEach((test) => {
                console.log("   - " + test.test.description || "Unknown");
            });
          }
          
          console.log('💾 Test results saved to test-results.json');
          console.log("--------------------------\n");
        });


    }


};