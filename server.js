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

    //3. Query Parser
    function queryParser(req,res,next){
        if(!req.url.includes("?")){
            req.query = {};
            return next();
        }else{
            const query = ((req.url.split("?")[1]).split("&"));
            console.log(query);
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
        res.end("Home page");
    })

    get("/users", (req, res) => {
        res.end("Get users");
    })

    get("/users/:id", (req, res) => {
        res.end(`Get usersid = ${req.params.id} `);
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
                const result = matchRoutes(req);

                if (result) {
                    req.params = result.params;
                    return result.handler(req, res);
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