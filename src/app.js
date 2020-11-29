import express from 'express'
import cluster from 'cluster'
import config from './config'
import logger from './common/logger'
import cons from './constants'

function startServer () {
  global.imCtx = global.imCtx || {}
  const app = express()
  require('./loaders').default({ expressApp: app })
}

function startClusterServer () {
  if (cluster.isMaster) {
    let sockets = [] // 主进程存所有socket和客户username的绑定关系
    for (let i = 0; i < workers; i++) {
      cluster.fork()
    }
    cluster.on('exit', function (worker, code, signal) {
      logger.info(`【worker进程${worker.process.pid}died】`)
    })
    for (const id in cluster.workers) {
      cluster.workers[id].on('message', function (msg) {
        if (Object.prototype.toString.call(msg) === '[object Object]') { // 屏蔽pm2的log
          return
        }
        let msgObj = null
        let sendData = null
        let sendMsg = null
        logger.info(`【master收到worker进程${cluster.workers[id].process.pid}的消息】`, msg)
        try {
          msgObj = JSON.parse(msg)
          switch (msgObj.type) {
            case cons.processEvent.ON_LINE:
              sockets.push(msgObj.data)
              break
            case cons.processEvent.OFF_LINE:
              sockets = sockets.filter(v => {
                return v.sid !== msgObj.data.sid
              })
              break
            case cons.processEvent.GET_SOCKET_ID:
              sendData = sockets.filter(v => msgObj.data.includes(v.username))
              sendMsg = {
                from: cons.MASTER_PROCESS_NAME,
                to: `worker${cluster.workers[id].process.pid}`,
                type: cons.processEvent.POST_SOCKET_ID,
                data: sendData
              }
              logger.info(`【master发送worker进程${cluster.workers[id].process.pid}的消息】`, JSON.stringify(sendMsg))
              cluster.workers[id].send(JSON.stringify(sendMsg))
              break
          }
        } catch (e) { logger.error(`【master收到worker进程${cluster.workers[id].process.pid}的消息】`, e) }
      })
    }
  } else {
    startServer()
  }
}

const workers = config.workers

if (workers > 0) {
  startClusterServer()
} else {
  startServer()
}
