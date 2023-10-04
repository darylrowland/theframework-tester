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

theFramework.get("/hello/:paramName", [
    {id: "paramName", type: theFramework.STRING, required: true, description: "Your name"}
], {
    description: "Says hello via URL params",
    authRequired: false,
    tests: [
        {
            success: true, 
            description: "Check we can say hello to a user",
            params: {paramName: "John"}, 
            expectedResult: {message: "Hello John", data: {age: 36}},
            storeResult: "hello"
        }
    ]
}, async (params, user) => {
    return {message: `Hello ${params.paramName || ""}`, data: {age: 36, name: params.paramName}}
});

theFramework.get("/hello/array", [
], {
    description: "Says hello in an array",
    authRequired: false,
    tests: [
        {
            success: true, 
            description: "Check array comparison",
            expectedResult: ["h", "e", "l", "l", "o"],
        }
    ]
}, async (params, user) => {
    return ["h", "e", "l", "l", "o"]
});

theFramework.get("/hello/array/deep", [
], {
    description: "Says hello in an array",
    authRequired: false,
    tests: [
        {
            success: true, 
            description: "Check array comparison",
            expectedResult: [{hello: "world"}, {"how": "are you?"}],
        }
    ]
}, async (params, user) => {
    return [{hello: "world"}, {how: "are you?"}];
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

theFramework.post("/copy", [
    {id: "name", type: theFramework.STRING, required: true, description: "Your name"}
], {
    description: "Copy paste route (copy)",
    authRequired: false,
    tests: [
        {
            success: true, 
            description: "Check we can copy a value",
            params: {
                name: "Mr Copy"
            },
            storeResult: "copy"
        }
    ]
}, async (params, user) => {
    var proc = require('child_process').spawn('pbcopy'); 
    proc.stdin.write(params.name); proc.stdin.end();
    
    return {message: `Copied`};
});

theFramework.post("/paste", [
    {id: "pasted", type: theFramework.STRING, required: true, description: "Pasted Value"}
], {
    description: "Says goodbye",
    authRequired: false,
    tests: [
        {
            success: true, 
            dependsOn: ["copy"],
            params: {
                pasted: "${COPY_PASTE}"
            },
            description: "Check we can paste a value in a test",
            expectedResult: {message: "Hey Mr Copy"}
        }
    ]
}, async (params, user) => {
    return {message: `Hey ${params.pasted}`}
});
