const theFramework = require("the-framework");

theFramework.get("/hello", [
    {id: "name", type: theFramework.STRING, required: false, description: "Your name"}
], {
    description: "Says hello",
    authRequired: false
}, async (params, user) => {
    return {message: `Hello ${params.name || ""}`, data: {age: 36}}
});