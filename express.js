/**
 * @swagger
 * tags:
 *   name: User Id
 *   description: The ID of the user
 * /user/{id}:
 *   get:
 *     summary: Get information of the user with id {id}
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: The user information.
 *       500:
 *         description: Some server error
 *
 */

"use strict";

/**
 * Module dependencies.
 */
// const opentelemetrySdk = require("./instrumentation")
const sdk = require("./nodeSDK");
const express = require("serverless-express/express");
var app = express();

const bodyParser = require("body-parser");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// console.log("Start tracing")
// // Start tracing
// opentelemetrySdk.start()

sdk.nodeSDKBuilder().then(() => {
  const options = {
    definition: {
      openapi: "3.1.0",
      info: {
        title: "Express API with Swagger",
        version: "0.1.0",
        description:
          "This is a simple CRUD API application made with Express and documented with Swagger",
        license: {
          name: "MIT",
          url: "https://spdx.org/licenses/MIT.html",
        },
        contact: {
          name: "LogRocket",
          url: "https://logrocket.com",
          email: "info@email.com",
        },
      },
      servers: [
        {
          url: "https://wldn657ph2.execute-api.ap-northeast-1.amazonaws.com/dev",
        },
      ],
    },
    apis: ["./express.js"],
  };
  
  const specs = swaggerJsdoc(options);
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  
  console.log(process.env)
  
  // Example requests:
  //     curl http://localhost:3000/user/0
  //     curl http://localhost:3000/user/0/edit
  //     curl http://localhost:3000/user/1
  //     curl http://localhost:3000/user/1/edit (unauthorized since this is not you)
  //     curl -X DELETE http://localhost:3000/user/0 (unauthorized since you are not an admin)
  
  // Dummy users
  var users = [
    { id: 0, name: "tj", email: "tj@vision-media.ca", role: "member" },
    { id: 1, name: "ciaran", email: "ciaranj@gmail.com", role: "member" },
    {
      id: 2,
      name: "aaron",
      email: "aaron.heckmann+github@gmail.com",
      role: "admin",
    },
  ];
  
  function loadUser(req, res, next) {
    // You would fetch your user from the db
    var user = users[req.params.id];
    if (user) {
      req.user = user;
      next();
    } else {
      next(new Error("Failed to load user " + req.params.id));
    }
  }
  
  function andRestrictToSelf(req, res, next) {
    // If our authenticated user is the user we are viewing
    // then everything is fine :)
    if (req.authenticatedUser.id === req.user.id) {
      next();
    } else {
      // You may want to implement specific exceptions
      // such as UnauthorizedError or similar so that you
      // can handle these can be special-cased in an error handler
      // (view ./examples/pages for this)
      next(new Error("Unauthorized"));
    }
  }
  
  function andRestrictTo(role) {
    return function (req, res, next) {
      if (req.authenticatedUser.role === role) {
        next();
      } else {
        next(new Error("Unauthorized"));
      }
    };
  }
  
  // Middleware for faux authentication
  // you would of course implement something real,
  // but this illustrates how an authenticated user
  // may interact with middleware
  
  app.use(function (req, res, next) {
    req.authenticatedUser = users[0];
    next();
  });
  
  app.get("/", function (req, res) {
    res.redirect("/user/0");
  });
  
  app.get("/user/:id", loadUser, function (req, res) {
    res.send("Viewing user " + req.user.name);
  });
  
  app.get("/user/:id/edit", loadUser, andRestrictToSelf, function (req, res) {
    res.send("Editing user " + req.user.name);
  });
  
  app.delete("/user/:id", loadUser, andRestrictTo("admin"), function (req, res) {
    res.send("Deleted user " + req.user.name);
  });
  
  /* istanbul ignore next */
  if (!module.parent) {
    app.listen(3000);
    console.log("Express started on port 3000");
  }
  
  module.exports = app
});
