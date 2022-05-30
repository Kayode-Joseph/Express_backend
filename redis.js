const redis = require('redis');

const client = redis.createClient();

const createRedisConnection = async () => {
  await client.connect();
};

const setData = async (key, data, next) => {
  try {
    await client.setEx(key, 1000000, data);
  } catch (e) {
    next(e);
  }
};
const getData = async (key, next) => {
  try {
    const data = await client.get(key);
    return data;
  } catch (e) {
    next(e);
  }
};

module.exports = { createRedisConnection, setData, getData};
