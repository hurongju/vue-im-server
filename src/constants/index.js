import message from './message'
import processEvent from './processEvent'

export default {
  message,
  processEvent,
  DEFAULT_ROOM_NAME: 'vChat开发团队',
  DEFAULT_WELCOME_WORDS: '欢迎来到vChat', // 注册成功默认欢迎语
  PREFIX_ROOM: '__PREFIX_ROOM__', // 房间名前缀
  PREFIX_ROOM_HAND_SHAKE: '__PREFIX_ROOM_HAND_SHAKE__', // 新用户连接成功创建房间名前缀
  DEFAULT_SYSTEM_NAME: '[SYSTEM]', // 默认系统消息名称
  MASTER_PROCESS_NAME: 'master', // 主进程name
  WORKER_PROCESS_NAME: 'worker' // worker进程name
}
