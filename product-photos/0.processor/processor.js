'use strict'

const aws = require('aws-sdk'); // eslint-disable-line import/no-unresolved, import/no-extraneous-dependencies
const { v4: uuidv4 } = require('uuid');
const child_process = require("child_process");
const v8 = require("v8");
const { performance, monitorEventLoopDelay } = require("perf_hooks");

/**
 * AJV Schemas
 */
const updatePhoneSchema = require('./user-update-phone-schema.json');
const productCreateSchema = require('./product-create-schema.json');

const constants = {
  MODULE: 'product-photos/0.processor/processor.js',
  TTL_DELTA_IN_SECONDS: 60 * 60 * 2,
  STEP_FUNCTION: process.env.STEP_FUNCTION,
  TABLE_PHOTO_REGISTRATIONS_NAME: process.env.TABLE_PHOTO_REGISTRATIONS_NAME,
  PRODUCT_CATALOG_TABLE_ARN: process.env.PRODUCT_CATALOG_TABLE_ARN,
};

/**
 * Event Processor
 */
const dynamo = new aws.DynamoDB.DocumentClient();
const stepfunctions = new aws.StepFunctions();

const impl = {
  /**
   * Parse the origin
   * @param origin
   * @return {*}
   */
  eventSource: (origin = '') => {
    const parts = origin.split('/');
    if (parts.length > 2) {
      return {
        uniqueId: parts[2],
        friendlyName: parts.length === 3 ? parts[2] : parts[3],
      };
    } else if (parts.length === 2) {
      return {
        uniqueId: parts[1],
        friendlyName: parts[1],
      };
    } else {
      return {
        uniqueId: 'UNKNOWN',
        friendlyName: 'UNKNOWN',
      };
    }
  },
  /**
   * Handle the given photographer registration message.
   * @param event The DynamoDB Stream event
   * @param complete The callback with which to report any errors
   */
  registerPhotographer: (event, complete) => {
    const updated = Date.now();
    const putParams = {
      TableName: constants.TABLE_PHOTO_REGISTRATIONS_NAME,
      ConditionExpression: 'attribute_not_exists(id)',
      Item: {
        id: event.id,
        created: updated,
        createdBy: event.origin,
        updatedBy: event.origin,
        phone: event.phone,
        timeToLive: Math.ceil(updated / 1000 /* milliseconds per second */) + constants.TTL_DELTA_IN_SECONDS,
      },
    };
    dynamo.put(putParams, (err) => {
      if (err) {
        if (err.code && err.code === 'ConditionalCheckFailedException') {
          const updateParams = {
            TableName: constants.TABLE_PHOTO_REGISTRATIONS_NAME,
            Key: {
              id: event.id,
            },
            UpdateExpression: [
              'set',
              '#c=if_not_exists(#c,:c),',
              '#cb=if_not_exists(#cb,:cb),',
              '#u=:u,',
              '#ub=:ub,',
              '#tt=:tt',
              '#tk=:tk',
            ].join(' '),
            ExpressionAttributeNames: {
              '#c': 'created',
              '#cb': 'createdBy',
              '#u': 'updated',
              '#ub': 'updatedBy',
              '#tt': 'timeToLive',
              '#tk': 'taskToken'
            },
            ExpressionAttributeValues: {
              ':c': updated,
              ':cb': event.origin,
              ':u': updated,
              ':ub': event.origin,
              ':tt': (Math.ceil(updated / 1000 /* milliseconds per second */) + constants.TTL_DELTA_IN_SECONDS).toString(),
              ':tk': event.id,
            },
            ReturnValues: 'NONE',
            ReturnConsumedCapacity: 'NONE',
            ReturnItemCollectionMetrics: 'NONE',
          };
          dynamo.update(updateParams, complete);
        } else {
          console.log(`registerPhotographer error: ${err}`);
          complete(err);
        }
      } else {
        complete();
      }
    });
  },
  registerProduct: (event, complete) => {
    
  },
  /**
   * Start and execution corresponding to the given event.
   * @param event The DynamoDB Stream event
   * @param complete The callback with which to report any errors
   */
  startExecution: (event, complete) => {
    
    console.log(event)
    const params = {
      stateMachineArn: constants.STEP_FUNCTION,
      name: event.data.id,
      input: JSON.stringify(event),
    };
    stepfunctions.startExecution(params, (err) => {
      if (err) {
        if (err.code && err.code === 'ExecutionAlreadyExists') {
          complete();
        } else {
          console.log(`startExecution error: ${err}`);
          complete(err);
        }
      } else {
        complete();
      }
    });
  },
};

// Lambda handler for DynamoDB Stream events
function handler(event, context, callback) {
  const [beforeBytesRx, beforePkgsRx, beforeBytesTx, beforePkgsTx] = child_process.execSync("cat /proc/net/dev | grep vinternal_1| awk '{print $2,$3,$10,$11}'").toString().split(" ");
  const startUsage = process.cpuUsage();
  const beforeResourceUsage = process.resourceUsage();
  const h = monitorEventLoopDelay();
  h.enable();
  const durationStart = process.hrtime();

  console.log('Received DynamoDB Stream event:', JSON.stringify(event, null, 2));
  
  // Process each record from the DynamoDB Stream event
  const processRecords = event.Records.map(record => {
    return new Promise((resolve, reject) => {
      const newImage = record.dynamodb.NewImage;
      const customInput = {
        "schema": "com.nordstrom/retail-stream/1-0-0",
        "origin": "hello-retail/product-producer-automation",
        "timeOrigin": "2017-01-12T18:29:25.171Z",
        "data": {
          "schema": "com.nordstrom/product/create/1-0-0",
          "id": newImage.id.S,
          "brand": newImage.brand.S,
          "name": newImage.name.S,
          "description": newImage.description.S,
          "category": newImage.category.S
        }
      };
      console.log(customInput)
        // Determine action based on the record's schema
      impl.startExecution(customInput, (err) => err ? reject(err) : resolve());
    });
  });

  Promise.all(processRecords).then(() => {
    h.disable();
    const durationDiff = process.hrtime(durationStart);
    const duration = (durationDiff[0] * 1e9 + durationDiff[1]) / 1e6;
    const cpuUsageDiff = process.cpuUsage(startUsage);
    const afterResourceUsage = process.resourceUsage();
    const heapCodeStats = v8.getHeapCodeStatistics();
    const heapStats = v8.getHeapStatistics();
    const heapInfo = process.memoryUsage();
    const [afterBytesRx, afterPkgsRx, afterBytesTx, afterPkgsTx] = child_process.execSync("cat /proc/net/dev | grep vinternal_1| awk '{print $2,$3,$10,$11}'").toString().split(" ");
    const dynamodb = new aws.DynamoDB();
    if (!event.warmup)
      dynamodb.putItem({
        Item: {
          "id": {
            S: uuidv4()
          },
          "duration": {
            N: `${duration}`
          },
          "maxRss": {
            N: `${afterResourceUsage.maxRSS - beforeResourceUsage.maxRSS}`
          },
          "fsRead": {
            N: `${afterResourceUsage.fsRead - beforeResourceUsage.fsRead}`
          },
          "fsWrite": {
            N: `${afterResourceUsage.fsWrite - beforeResourceUsage.fsWrite}`
          },
          "vContextSwitches": {
            N: `${afterResourceUsage.voluntaryContextSwitches - beforeResourceUsage.voluntaryContextSwitches}`
          },
          "ivContextSwitches": {
            N: `${afterResourceUsage.involuntaryContextSwitches - beforeResourceUsage.involuntaryContextSwitches}`
          },
          "userDiff": {
            N: `${cpuUsageDiff.user}`
          },
          "sysDiff": {
            N: `${cpuUsageDiff.system}`
          },
          "rss": {
            N: `${heapInfo.rss}`
          },
          "heapTotal": {
            N: `${heapInfo.heapTotal}`
          },
          "heapUsed": {
            N: `${heapInfo.heapUsed}`
          },
          "external": {
            N: `${heapInfo.external}`
          },
          "elMin": {
            N: `${h.min}`
          },
          "elMax": {
            N: `${h.max}`
          },
          "elMean": {
            N: `${isNaN(h.mean) ? 0 : h.mean}`
          },
          "elStd": {
            N: `${isNaN(h.stddev) ? 0 : h.stddev}`
          },
          "bytecodeMetadataSize": {
            N: `${heapCodeStats.bytecode_and_metadata_size}`
          },
          "heapPhysical": {
            N: `${heapStats.total_physical_size}`
          },
          "heapAvailable": {
            N: `${heapStats.total_available_size}`
          },
          "heapLimit": {
            N: `${heapStats.heap_size_limit}`
          },
          "mallocMem": {
            N: `${heapStats.malloced_memory}`
          },
          "netByRx": {
            N: `${afterBytesRx - beforeBytesRx}`
          },
          "netPkgRx": {
            N: `${afterPkgsRx - beforePkgsRx}`
          },
          "netByTx": {
            N: `${afterBytesTx - beforeBytesTx}`
          },
          "netPkgTx": {
            N: `${afterPkgsTx - beforePkgsTx}`
          }
        },
        TableName: "metrics.photo-processor"
      }, function (err, data) {
        if (err) {
          console.log("Error", err);
        } else {
          console.log("Success", data.Item);
        }
      });

    callback();
  }).catch(err => {
    callback(err);
  });
}

module.exports = {
  handler: handler,
};

console.log(`${constants.MODULE} - CONST: ${JSON.stringify(constants, null, 2)}`);
console.log(`${constants.MODULE} - ENV:   ${JSON.stringify(process.env, null, 2)}`);
