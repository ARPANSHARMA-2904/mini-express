const http = require('http');
const { url } = require('inspector');
const { json } = require('stream/consumers');

const routes = [];

const middlewares = [];

//creating use()
function use(middleware) {
    middlewares.push(middleware);
}

//creating matchRoutes -> To ,you,know, loop through the routes and check which one to execute
function matchRoutes(req) {
    const requestPath = req.url.split("?")[0];

    for (const route of routes) {

        if (route.method !== req.method) continue;

        const routeParts = route.path.split("/").filter(Boolean);
        const urlParts = requestPath.split("/").filter(Boolean);

        if (routeParts.length !== urlParts.length) continue;

        let params = {};
        let isMatch = true;

        for (let i = 0; i < routeParts.length; i++) {

            if (routeParts[i].startsWith(":")) {
                const paramName = routeParts[i].slice(1);
                params[paramName] = urlParts[i];
            }
            else if (routeParts[i] === urlParts[i]) {
                continue;
            }
            else {
                isMatch = false;
                break;
            }
        }

        if (isMatch) {
            return {
                handler: route.handler,
                params
            };
        }
    }

    return null;
}

//Middlewares:

//1. Logger
function logger(req, res, next) {
    console.log(req.method, req.url);
    next();
}

//2. JSON Parser
function jsonParser(req, res, next) {

    const methodsWithBody = ["POST", "PUT", "PATCH"];
    const contentType = req.get["content-type"];

    if (!methodsWithBody.includes(req.method) || !contentType?.includes("application/json")) {
        return next();
    }

    let body = "";

    req.on("data", (chunk) => {
        body += chunk;
    });

    req.on("end", () => {
        try {

            if (body) {
                req.body = JSON.parse(body);
            } else {
                req.body = {};
            }

            next();

        } catch (error) {

            res.statusCode = 400;
            res.send("Invalid JSON");

        }
    });
}

//3. Query Parser
function queryParser(req, res, next) {
    if (!req.url.includes("?")) {
        req.query = {};
        return next();
    } else {
        const queries = ((req.url.split("?")[1]).split("&"));
        const queryObject = {};
        for (const query of queries) {
            if (query === "") continue;
            const [key, value] = query.split("=");
            // const key = query.split("=")[0];   <- I actually used this method before until I saw somewhere that you can split using const [key, value] = query.split("="); which I think is a better approach and avoids splitting twice, haha
            // const value = query.split("=")[1];
            if (value === undefined) {
                queryObject[key] = "";
            } else {
                queryObject[key] = value;
            }

        }
        req.query = queryObject;
        console.log(req.query);
        next();
    }
}

//Registering middleware
use(logger);
use(queryParser);
use(jsonParser);

//get(path,handler)
function get(path, handler) {
    routes.push({
        method: "GET",
        path,
        handler
    })
}

//post(path,handler)
function post(path, handler) {
    routes.push({
        method: "POST",
        path,
        handler
    })
}

get("/", (req, res) => {
    res.send("Home page");
})

get("/users", (req, res) => {
    res.send("Get users");
})

get("/users/:id", (req, res) => {
    res.send(`Get usersid = ${req.params.id} `);
})

post("/users", (req, res) => {
    console.log(req.body);
    res.send("User created");

})

get("/products", (req, res) => {
    res.send("Get products");
})

const server = http.createServer((req, res) => {
    //res.send is primarily used for sending one-time responses in standard RESTful requests (GET, POST, PUT, DELETE) or 
    // for rendering HTML to a browser.  It automatically detects the input type (string, buffer, object, or array) and 
    // sets the appropriate Content-Type header (e.g., text/html for strings, application/json for objects), ending the 
    // response process without needing an explicit res.end() call. 

    //req.get is used to retrieve the value of specific HTTP headers from the incoming client request.  
    // This allows developers to access metadata such as the User-Agent, Content-Type, or Authorization tokens 
    // to implement logic like authentication, content negotiation, or logging. 
    //(the sources for this definition are- w3schools and the medium)
    res.send = function (data) {
        res.end(data);
    }
    req.get = function (name) {
        return req.headers[name.toLowerCase()];
    }
    res.json = function (data) {
        //So I actually Chatgpt-ed the explanation for what exactly res.json does in Express-> it technically sends
        //a JSON formatted(object) string to the client as the HTTP protocol can only transmit texts(bytes)
        res.setHeader("Content-Type", "application/json");
        return res.send(JSON.stringify(data));
    }
    let index = 0;
    function next() {
        const middleware = middlewares[index];
        index++;
        if (middleware) {
            return middleware(req, res, next);
        }
        try {
            const result = matchRoutes(req);

            if (result) {
                req.params = result.params;
                return result.handler(req, res);
            }
            res.statusCode = 404;
            res.send("Route not Found");
        } catch (e) {
            console.error(e);
            res.statusCode = 500;
            res.send("Internal Server error");
        }
    }
    next();


})

server.listen(3000);