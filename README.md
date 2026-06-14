
> [!WARNING]
> **This README is not up to date.**
>
> The project is under active development, and parts of this documentation may be outdated or incomplete. Refer to the source code and recent commits for the latest implementation details.
---

#  Mini HTTP Server (From Scratch – No Express)

##  Overview

This project is a **lightweight HTTP server built using Node.js core modules only**, without using Express or any external frameworks.

It demonstrates how frameworks like Express work internally by implementing:

* Custom routing system
* Middleware pipeline
* JSON body parser
* Route parameters (`/users/:id`)
* Request handling using `http` module

---

##  Why this project exists

The goal of this project is to understand:

* How HTTP servers work internally
* How routing is implemented from scratch
* How middleware systems work
* How request bodies are parsed manually
* How frameworks like Express are built under the hood

---

#  Tech Stack

* Node.js (Core `http` module)
* JavaScript (ES6)

---

#  Core Components

## 1. `http.createServer()`

This is the **main entry point** of the application.

It:

* Receives incoming requests (`req`)
* Sends responses (`res`)
* Executes middleware chain
* Executes route handler

---

## 2. `routes` Array

```js
const routes = [];
```

### Purpose:

Stores all registered routes.

Each route looks like:

```js
{
  method: "GET",
  path: "/users/:id",
  handler: function
}
```

### Why array?

Because we need to:

* Loop through routes
* Match dynamic routes (`:id`)
* Extract parameters

---

## 3. `middlewares` Array

```js
const middlewares = [];
```

### Purpose:

Stores middleware functions that execute before route handlers.

Example:

```js
logger → jsonParser → route handler
```

---

## 4. `use(middleware)`

Registers middleware into the system.

```js
function use(middleware) {
    middlewares.push(middleware);
}
```

### Flow:

```text
use(logger)
use(jsonParser)
```

becomes:

```text
middlewares = [logger, jsonParser]
```

---

## 5. Middleware System (`next()`)

Each middleware gets:

```js
(req, res, next)
```

### Flow:

```text
logger → jsonParser → route handler
```

`next()` moves execution forward.

---

## 6. Logger Middleware

```js
function logger(req, res, next) {
    console.log(req.method, req.url);
    next();
}
```

### Purpose:

Logs every request:

```text
GET /users
POST /users
```

---

## 7. JSON Parser Middleware

```js
function jsonParser(req, res, next)
```

### Purpose:

Parses incoming JSON request body.

### Works only for:

```text
POST, PUT, PATCH
```

### Flow:

1. Collect data chunks
2. Combine them
3. Parse JSON
4. Attach to request:

```js
req.body = parsedData;
```

---

## 8. Routing System (`get`, `post`)

### GET Route

```js
function get(path, handler) {
    routes.push({
        method: "GET",
        path,
        handler
    });
}
```

### POST Route

```js
function post(path, handler) {
    routes.push({
        method: "POST",
        path,
        handler
    });
}
```


## 9. Route Matching System (`matchRoutes`)

### Purpose:

Finds the correct route for incoming request.

### Features:

* Method matching
* Static route matching
* Dynamic params (`:id`)
* Query string handling
* Returns handler + params

---

### Example:

```js
/users/:id
```

Request:

```http
/users/42
```

Result:

```js
{
  handler: function,
  params: {
    id: "42"
  }
}
```

---

## 10. Middleware Execution Flow

```text
Request comes in
    ↓
logger middleware
    ↓
jsonParser middleware
    ↓
matchRoutes(req)
    ↓
Find matching route
    ↓
Execute handler
```

---

## 11. Server Flow (`createServer`)

```js
const server = http.createServer((req, res) => {
```

### Steps:

1. Run middleware chain
2. Call `matchRoutes(req)`
3. If route found:

   * attach params
   * execute handler
4. Else:

   * return 404



---

## 12. Route Examples

### Home Route

```js
get("/", (req, res) => {
    res.end("Home page");
});
```

---

### Get Users

```js
get("/users", (req, res) => {
    res.end("Get users");
});
```

---

### Dynamic Route

```js
get("/users/:id", (req, res) => {
    res.end(`User id = ${req.params.id}`);
});
```

---

### Create User

```js
post("/users", (req, res) => {
    console.log(req.body);
    res.end("User created");
});
```

---

##  Full Request Lifecycle

### Example: `GET /users/42`

```text
1. Request enters server
2. Logger runs
3. JSON parser runs (skipped for GET)
4. matchRoutes finds /users/:id
5. params extracted → { id: "42" }
6. handler executed
7. response sent
```


