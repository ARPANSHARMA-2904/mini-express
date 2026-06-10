const http = require('http');
const { json } = require('stream/consumers');

const routes = {};

const middlewares = [];

//creating use()
function use(middleware) {
    middlewares.push(middleware);
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

    if (!methodsWithBody.includes(req.method)) {
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
            res.end("Invalid JSON");

        }
    });
}

//Registering middleware
use(logger);
use(jsonParsor);

//get(path,handler)
function get(path, handler) {
    routes[`GET ${path}`] = handler;
}

//post(path,handler)
function post(path, handler) {
    routes[`POST ${path}`] = handler;
}

get("/", (req, res) => {
    res.end("Home page");
})

get("/users", (req, res) => {
    res.end("Get users");
})

post("/users", (req, res) => {
    console.log(req.body);
    res.end("User created");

})

get("/products", (req, res) => {
    res.end("Get products");
})

const server = http.createServer((req, res) => {
    let index = 0;
    function next() {
        const middleware = middlewares[index];
        index++;
        if (middleware) {
            return middleware(req, res, next);
        }
        try {
            const key = `${req.method} ${req.url}`;
            const handler = routes[key];

            if (handler) {
                return handler(req, res);
            }
            res.statusCode = 404;
            res.end("Route not Found");
        } catch (e) {
            console.error(e);
            res.statusCode = 500;
            res.end("Internal Server error");
        }
    }
    next();


})

server.listen(3000);