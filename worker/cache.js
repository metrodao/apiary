const redis = require('redis')

module.exports = function setupCache () {
  return new Promise((resolve) => {
    // Create a new Redis client
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })

    resolve(client)
  })
}