// 文件句柄工具类,让文件操作支持Promise
import fs from 'fs'
import _ from 'lodash'

export default {
  // 异步获取文件信息
  statFile (filePath: string): Promise<fs.Stats> {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (error, stats) => {
        if (_.isEmpty(error)) {
          resolve(stats)
        } else {
          console.log(error)
          reject(FileHandleError.statError)
        }
      })
    })
  },
  // 打开文件句柄
  openReadFileHandle (filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      fs.open(filePath, 'r+', (error, fd) => {
        if (error === null) {
          resolve(fd)
        } else {
          console.log(error)
          reject(FileHandleError.openError)
        }
      })
    })
  },
  // 关闭文件句柄
  closeFileHandle (fd: number) {
    return new Promise((resolve, reject) => {
      fs.close(fd, error => {
        if (error === null) {
          resolve()
        } else {
          console.log(error)
          reject(FileHandleError.closeError)
        }
      })
    }) 
  },
  // 读取文件数据
  readFile (fd: number, position: number, length: number): Promise<any> {
    return new Promise((resolve, reject) => {
      let buffer = Buffer.alloc(length, 0, 'binary')
      fs.read(fd, buffer, 0, length, position, (error, bytes) => {
        if (error === null) {
          resolve(buffer.slice(0, bytes))
        } else {
          console.log(error)
          reject(FileHandleError.readError)
        }
      })
    })
  },
  // 写文件
  wirteFile (fd: number, buffer: Buffer) {
    return new Promise((resolve, reject) => {
      fs.writeFile(fd, buffer, {flag: 'a'}, error => {
        if (error === null) {
          resolve()
        } else {
          console.log(error)
          reject(FileHandleError.writeError)
        }
      })
    })
  }
}

enum FileHandleError {
  statError = 1,
  openError,
  closeError,
  readError,
  writeError
}

export {
  FileHandleError
}
