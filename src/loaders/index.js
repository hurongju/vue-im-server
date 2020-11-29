import expressLoader from './express'
import loggerLoader from './logger'
import socketLoader from './socket'

export default ({ expressApp }) => {
  loggerLoader({ app: expressApp })
  socketLoader({ app: expressApp })
  expressLoader({ app: expressApp })
}
