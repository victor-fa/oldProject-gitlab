import _ from 'lodash'

//  字串处理工具类
export default {
  // 全替换字串中的文本
  replaceString (str: string, char: string, replaceChar: string) {
    let tmpStr = ''
    for (let index = 0; index < str.length; index++) {
      const element = str.charAt(index)
      if (element !== char) {
        tmpStr = tmpStr.concat(element)
      } else {
        tmpStr = tmpStr.concat(replaceChar)
      }
    }
    return tmpStr.length === 0 ? str : tmpStr
  },
  // 将aRadix进制的num字串转换成bRadix进制的数字
  conversionUtility (num: string, aRadix: number, bRadix: number) {
    return parseInt(num, aRadix).toString(bRadix)
  },
  // 过滤后台返回的公钥
  filterPublicKey (secretKey: string) {
    // filter prefix
    let newSecretKey = secretKey.replace('-----BEGIN PUBLIC KEY-----', '')
    // filter suffix
    newSecretKey = newSecretKey.replace('-----END PUBLIC KEY-----', '')
    console.log(newSecretKey);
    // filter enter
    return this.replaceString(newSecretKey, '/n', '')
  },
  // 格式化文件名
  formatName (path: string) {
    const name = _.last(path.split('/'))
    return name === undefined ? '' : name
  },
  renamePath (oldPath: string, newName: string) {
    const components = oldPath.split('/')
    components.pop()
    components.push(newName)
    return components.join('/')
  },
  // 格式化文件修改时间
  formatShowMtime (mtime: number) {
    let date: any = new Date(mtime)
    let y: any = date.getFullYear()
    let MM: any = date.getMonth() + 1
    MM = MM < 10 ? ('0' + MM) : MM
    let d = date.getDate()
    d = d < 10 ? ('0' + d) : d
    let h = date.getHours()
    h = h < 10 ? ('0' + h) : h
    let m = date.getMinutes()
    m = m < 10 ? ('0' + m) : m
    let s = date.getSeconds()
    s = s < 10 ? ('0' + s) : s
    return y + '-' + MM + '-' + d + ' ' + h + ':' + m + ':' + s
  },
  // 格式化文件大小
  formatShowSize (size: number) {
    var sizestr = ""
    if (size < 0.1 * 1024) { //如果小于0.1KB转化成B
      sizestr = size.toFixed(2) + "B"
    } else if (size < 0.1 * 1024 * 1024) {  //如果小于0.1MB转化成KB
      sizestr = (size / 1024).toFixed(2) + "KB"
    } else if (size < 0.1 * 1024 * 1024 * 1024) { //如果小于0.1GB转化成MB
      sizestr = (size / (1024 * 1024)).toFixed(2) + "MB"
    } else { //其他转化成GB
      sizestr = (size / (1024 * 1024 * 1024)).toFixed(2) + "GB"
    }
    var len = sizestr.indexOf(`/\.`)
    var dec = sizestr.substr(len + 1, 2)
    if (dec === "00") { //当小数点后为00时 去掉小数部分
      return sizestr.substring(0, len) + sizestr.substr(len + 3, 2)
    }
    return sizestr
  }
}
