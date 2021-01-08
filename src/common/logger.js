import log4js from 'log4js'
import config from '../config'

log4js.configure({
  appenders: {
    dateFile: { type: 'dateFile', filename: config.log.filename, keepFileExt: true },
    err: { type: 'stderr' }
  },
  categories: {
    default: { appenders: ['dateFile', 'err'], level: 'debug' }
  },
  pm2: true,
  pm2InstanceVar: 'INSTANCE_ID'
})

export default log4js.getLogger()
