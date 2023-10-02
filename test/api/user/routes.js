const theFramework = require("the-framework");
const comparators = require("../../../comparators");

const {TOKEN} = require("../../example-data");

theFramework.post("/login", [
], {
    description: "Logs a user in",
    authRequired: false,
    tests: [
        {
            success: true, 
            description: "Logs a user in",
            params: {
                email: "test@test.com",
                password: "badpassword"
            },
            expectedResult: {token: comparators.IS_UUID},
            storeResult: "user_login"
        }
    ]
}, async (params, user) => {
    return {
        token: TOKEN,
        user: {
            id: 1,
            name: "John"
        }
    };
});

theFramework.get("/me", [
], {
    description: "Returns details about you",
    authRequired: true,
    tests: [
        {
            success: true, 
            description: "Get user me data",
            // headers: {
            //     "x-user-token": "${user_login.token}"
            // },
            dependsOn: ["user_login"],
            expectedResult: {}
        }
    ]
}, async (params, user) => {
    return {message: "hello"};
});