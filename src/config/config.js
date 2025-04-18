require('dotenv').config();
const NODE_ENV = process.env.NODE_ENV
let REDISCLOUD_URL;
let REDISCLOUD_PASSWORD;
let REDISCLOUD_HOST;
let REDISCLOUD_PORT;
if (NODE_ENV === 'development') {
    REDISCLOUD_URL = process.env.REDISCLOUD_URL_LOCAL;
    REDISCLOUD_PASSWORD = process.env.REDIS_PASSWORD_LOCAL;
    REDISCLOUD_HOST = process.env.REDIS_HOST_LOCAL;
    REDISCLOUD_PORT = process.env.REDIS_PORT_LOCAL;
    
}else  {
    REDISCLOUD_URL = process.env.REDISCLOUD_URL_CLOUD;
    REDISCLOUD_PASSWORD = process.env.REDIS_PASSWORD_CLOUD;
    REDISCLOUD_HOST = process.env.REDIS_HOST_CLOUD;
    REDISCLOUD_PORT = process.env.REDIS_PORT_CLOUD;
}


module.exports ={
    REDISCLOUD_URL,
    REDISCLOUD_PASSWORD,
    REDISCLOUD_HOST,
    REDISCLOUD_PORT
}