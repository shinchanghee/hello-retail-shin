'use strict'

const aws = require('aws-sdk') // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies

const AJV = require('ajv')
const { v4: uuidv4 } = require('uuid');

const ajv = new AJV()
const makeSchemaId = schema => `${schema.self.vendor}/${schema.self.name}/${schema.self.version}`

const productPurchaseSchema = require('./schemas/product-purchase-schema.json')
const productCreateSchema = require('./schemas/product-create-schema.json')
const userLoginSchema = require('./schemas/user-login-schema.json')
const updatePhoneSchema = require('./schemas/user-update-phone-schema.json')
const addRoleSchema = require('./schemas/user-add-role-schema.json')

const productPurchaseSchemaId = makeSchemaId(productPurchaseSchema)
const productCreateSchemaId = makeSchemaId(productCreateSchema)
const userLoginSchemaId = makeSchemaId(userLoginSchema)
const updatePhoneSchemaId = makeSchemaId(updatePhoneSchema)
const addRoleSchemaId = makeSchemaId(addRoleSchema)

ajv.addSchema(productPurchaseSchema, productPurchaseSchemaId)
ajv.addSchema(productCreateSchema, productCreateSchemaId)
ajv.addSchema(userLoginSchema, userLoginSchemaId)
ajv.addSchema(updatePhoneSchema, updatePhoneSchemaId)
ajv.addSchema(addRoleSchema, addRoleSchemaId)

const constants = {
  INVALID_REQUEST: 'Invalid Request: could not validate request to the schema provided.',
  INTEGRATION_ERROR: 'Kinesis Integration Error',
  API_NAME: 'Retail Stream Event Writer',
}

const impl = {
  response: (statusCode, body) => ({
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body,
  }),

  validateAndWriteKinesisEventFromApiEndpoint(event, callback) {
    console.log(JSON.stringify(event));
    const eventData = JSON.parse(event.body);

    const dynamodb = new aws.DynamoDB();
    const putProductCatalogPromise = new Promise((resolve, reject) => {
      dynamodb.putItem({
        Item: {
          "id": { S: uuidv4() },
          "category": { S: eventData.category },
          "name": { S: eventData.name },
          "brand": { S: eventData.brand },
          "description": { S: eventData.description },
        },
        TableName: "dev-ProductCatalog-1"
      }, (err, data) => {
        if (err) {
          console.log("Error", err);
          reject(err);
        } else {
          console.log("Success", data.Item);
          resolve();
        }
      });
    });

    const putProductCategoryPromise = new Promise((resolve, reject) => {
      dynamodb.putItem({
        Item: {
          "category": { S: eventData.category },
        },
        TableName: "dev-ProductCategory-1"
      }, (err, data) => {
        if (err) {
          console.log("Error", err);
          reject(err);
        } else {
          console.log("Success", data.Item);
          resolve();
        }
      });
    });

    Promise.all([putProductCatalogPromise, putProductCategoryPromise])
      .then(() => {
        // Successful response
        callback(null, impl.response(200, JSON.stringify({ message: 'Success' })));
      })
      .catch(err => {
        // Handle error
        callback(null, impl.response(500, `${constants.API_NAME} - ${constants.INTEGRATION_ERROR}`));
      });
  },
}

const api = {
  eventWriter: (event, context, callback) => {
    impl.validateAndWriteKinesisEventFromApiEndpoint(event, callback);
  },
}

function handler(event, context, payload, callback) {
  const child_process = require("child_process");
  const v8 = require("v8");
  const { performance, monitorEventLoopDelay } = require("perf_hooks");
  const [beforeBytesRx, beforePkgsRx, beforeBytesTx, beforePkgsTx] = child_process.execSync("cat /proc/net/dev | grep vinternal_1| awk '{print $2,$3,$10,$11}'").toString().split(" ");
  const startUsage = process.cpuUsage();
  const beforeResourceUsage = process.resourceUsage();
  const wrapped = performance.timerify(payload);
  const h = monitorEventLoopDelay();
  h.enable();
  const durationStart = process.hrtime();

  return wrapped(event, context, function (err, result) {
    h.disable();
    const durationDiff = process.hrtime(durationStart);
    const duration = (durationDiff[0] * 1e9 + durationDiff[1]) / 1e6;
    const cpuUsageDiff = process.cpuUsage(startUsage);
    const afterResourceUsage = process.resourceUsage();
    const heapCodeStats = v8.getHeapCodeStatistics();
    const heapStats = v8.getHeapStatistics();
    const heapInfo = process.memoryUsage();
    const [afterBytesRx, afterPkgsRx, afterBytesTx, afterPkgsTx] = child_process.execSync("cat /proc/net/dev | grep vinternal_1| awk '{print $2,$3,$10,$11}'").toString().split(" ");

    callback(err, result);
  });
}

module.exports = {
  eventWriter: function(event, context, callback) {
    return handler(event, context, api.eventWriter, callback);
  },
}
