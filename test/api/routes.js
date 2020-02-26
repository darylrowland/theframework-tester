const theFramework = require("the-framework");

theFramework.get("/hello", [
    {id: "name", type: theFramework.STRING, required: false, description: "Your name"}
], {
    description: "Says hello",
    authRequired: false
}, async (params, user) => {
    return {message: `Hello ${params.name || ""}`, data: {age: 36}}
});

theFramework.post("/goodbye", [
    {id: "name", type: theFramework.STRING, required: false, description: "Your name"}
], {
    description: "Says goodbye",
    authRequired: false
}, async (params, user) => {
    return {message: `Goodbye ${params.name}`}
});

theFramework.get("/me", [
], {
    description: "Returns details about you",
    authRequired: true
}, async (params, user) => {
    return user;
});