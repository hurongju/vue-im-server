import chat from './chat'
import login from './login'
import user from './user'
import { Router } from 'express'

export default () => {
  const app = Router()
  chat(app)
  login(app)
  user(app)
  return app
}
