var Redis = require('ioredis');
var env = require('./env.js').env;

function getRedisConfig(env){
  if (env === 'prd') {
    return {
      sentinalConfig :     {
        sentinels: [{ host: 'redis1.msupply.com', port: 26379 }, { host: 'redis2.msupply.com', port: 26379 }, { host: 'redis3.msupply.com', port: 26379 }],
        name: 'mymaster'
      },
      options : {
          // no_ready_check: true,
          password: 'm5supplyP@ssw0rdPrd'
        },
    }
  } else if(env === 'stg') {
    return {
      sentinalConfig :     {
        sentinels: [{ host: 'redis1.stg.msupply.com', port: 26379 }, { host: 'redis2.stg.msupply.com', port: 26379 }, { host: 'redis3.stg.msupply.com', port: 26379 }],
        name: 'mymaster'
      },
      options : {
          // no_ready_check: true,
          password: 'm5supplyP@ssw0rd'
        },
    }
  } else if(env === 'dev') {
     return {
      sentinalConfig :     {
         sentinels: [{ host: '10.10.0.163', port: 26379 }, { host: '10.10.1.168', port: 26379 }, { host: '10.10.0.210', port: 26379 }],
         name: 'mymaster'
       },
       options : {
           // no_ready_check: true,
           password: 'm5supplyP@ssw0rd'
         },
    }
  } else if(env === 'loc') {

    return {
      sentinalConfig :     {
        sentinels: [{ host: '127.0.0.1', port: 26379 }, { host: '127.0.0.1', port: 26380 }, { host: '127.0.0.1', port: 26381 }],
        name: 'mymaster'
      },
      options : {
          // no_ready_check: true,
          password: 'master'
        },
    }
  }
}
exports.getRedisConfig = getRedisConfig;


exports.getSessionEncryptionKey =function (env){
  if (env === 'prd') {
    return "M5upply_auth_red1s_5e5510n_SecretKe7_prd";
  } else {
    return "M5upply_auth_red1s_5e5510n_SecretKe7";
  }
}


exports.createRedisConn = function(callback) {
  var redisConfig = getRedisConfig(env);
  var redis = new Redis(redisConfig.sentinalConfig, redisConfig.options);

  redis.on('error', function(err) {
       console.log('Redis error: ' + err);
       callback(err);
  });

  redis.on('connect', function(err) {
       console.log('Connected to Redis');
       exports.redisConn = redis;
       callback();
  });

}