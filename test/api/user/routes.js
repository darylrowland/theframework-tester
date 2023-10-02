const theFramework = require("the-framework");
const comparators = require("../../../comparators");

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
            expectedResult: {token: comparators.IS_UUID}
        }
    ]
}, async (params, user) => {
    return {
        token: "abc123",
        user: {
            id: 1,
            name: "John"
        }
    };
});

theFramework.get("/me", [
], {
    description: "Returns details about you",
    authRequired: true
}, async (params, user) => {
    return user;
});