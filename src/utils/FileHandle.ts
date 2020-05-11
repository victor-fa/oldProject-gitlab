// 文件句柄工具类,让文件操作支持Promise
import fs, { mkdirSync } from 'fs'
import _ from 'lodash'

export default {
  /**异步获取文件信息 */
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
  /**打开文件句柄 */
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
  /**打开写文件句柄，(创建中间目录，文件重命名) */
  openWriteFileHandle (path: string): Promise<number> {
    return new Promise((resolve, reject) => {
      let newPath = path
      if (fs.existsSync(newPath)) {
        newPath = this.renameFile(path)
      }
      this.checkDirectoryExist(newPath)
      fs.open(newPath, 'w+', (error, fd) => {
        if (error === null) {
          resolve(fd)
        } else {
          console.log(error)
          reject(FileHandleError.openError)
        }
      })
    })
  },
  /**重命名文件 */
  renameFile (path: string) {
    let number = 0
    const index = path.lastIndexOf('/') + 1
    const filename = path.substring(index, path.length)
    const loc = this.searchInsertLocaltion(filename) + index
    let newPath = ''
    while (++number) {
      const numstr = `(${number})`
      newPath = path.slice(0, loc) + numstr + path.slice(loc)
      if (!fs.existsSync(newPath)) break
    }
    return newPath
  },
  searchInsertLocaltion (filename: string) {
    for (let index = 0; index < filename.length; index++) {
      const element = filename.charAt(index)
      if (index !== 0 && element === '.') return index
    }
    return filename.length - 1
  },
  /**检测中间目录是否存在，不存在就创建 */
  checkDirectoryExist (path: string) {
    const index = path.lastIndexOf('/')
    const directory = path.substring(0, index)
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true })
    }
  },
  /**关闭文件句柄 */
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
  /**读取文件数据 */
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
  /**写文件 */
  wirteFile (fd: number, buffer: Buffer) {
    return new Promise((resolve, reject) => {
      fs.writeFile(fd, buffer, {flag: 'a+'}, error => {
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
