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
    // filter enter
    return this.replaceString(newSecretKey, '/n', '')
  }
}
