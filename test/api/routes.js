const theFramework = require("the-framework");

theFramework.get("/hello", [
    {id: "name", type: theFramework.STRING, required: true, description: "Your name"}
], {
    description: "Says hello",
    authRequired: false,
    tests: [
        {
            success: true, 
            description: "Check we can say hello to a user",
            params: {name: "John"}, 
            expectedResult: {message: "Hello John", data: {age: 36}},
            storeResult: "hello"
        }
    ]
}, async (params, user) => {
    return {message: `Hello ${params.name || ""}`, data: {age: 36, name: params.name}}
});

theFramework.post("/goodbye", [
    {id: "name", type: theFramework.STRING, required: true, description: "Your name"}
], {
    description: "Says goodbye",
    authRequired: false,
    tests: [
        {
            success: true, 
            dependsOn: ["hello"],
            description: "Check we can say goodbye to a user",
            params: {
                name: "${hello.data.name}"
            },
            expectedResult: {message: "Goodbye John", data: {age: 36}}
        }
    ]
}, async (params, user) => {
    return {message: `Goodbye ${params.name}`, data: {age: 36}}
});

