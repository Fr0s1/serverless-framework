const handler = require('serverless-express/handler')
const app = require('./express')

module.exports.api = handler(app)