const theFramework = require("the-framework");


theFramework.get("/me", [
], {
    description: "Returns details about you",
    authRequired: true
}, async (params, user) => {
    return user;
});