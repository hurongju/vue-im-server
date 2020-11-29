import os from 'os'
import path from 'path'

const numCPUs = os.cpus().length

export default {
  env: 'production',
  workers: numCPUs, // 生产配置worker进程数为cpu数
  resource: {
    enable: false,
    root: path.join(__dirname, '../../www'),
    publicPath: /^\/(static|favicon\.ico)/
  }
}
