import _ from 'lodash'
import { ResourceType } from '@/api/NasFileModel'
import crypto from 'crypto'

//  字串处理工具类
export default {
  /**全替换字串中的文本 */
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
  // 过滤后台返回的公钥
  formatPublicKey (secretKey: string) {
    return `-----BEGIN PUBLIC KEY-----\n${secretKey}\n-----END PUBLIC KEY-----\n`
  },
  // 左斜撇转右斜撇
  convertL2R (path: string) {
    return path.replace(/\//g, '\\')
  },
  // 右斜撇转左斜撇
  convertR2L (path: string) {
    return path.replace(new RegExp("\\\\", "g"), '/')
  },
  // 格式化文件名
  formatName (path: string) {
    const name = _.last(path.split('/'))
    return name === undefined ? '' : name
  },
  // 格式化目录
  formatDirectory (path: string) {
    const index = path.lastIndexOf('/')
    return path.substring(0, index)
  },
  // 文件后缀
  formatSuffix (path: string) {
    const name = _.last(path.split('.'))
    return name === undefined ? '' : name
  },
  renamePath (oldPath: string, newName: string) {
    const components = oldPath.split('/')
    components.pop()
    components.push(newName)
    return components.join('/')
  },
  // 格式化文件修改时间
  formatShowMtime (value: number) {
    if (String(value).length < 11) value = value * 1000 // 区分秒、毫秒
    var date = new Date(value);
    var Y = date.getFullYear() + '-';
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    var D = date.getDate() + ' ';
    var h = date.getHours() + ':';
    var m = date.getMinutes() + ':';
    var s = date.getSeconds();
    return Y + M + D + h + m + s;
  },
  formatMacAddress (value) {
    return value.replace(/:/g, '')
  },
  // 格式化文件大小
	formatShowSize(bytes) {
		bytes = parseFloat(bytes);
		if (bytes === 0) return '-';
		let k = 1024,
			sizes = ['B', 'K', 'M', 'G', 'T'],
			i = Math.floor(Math.log(bytes) / Math.log(k));
		return (bytes / Math.pow(k, i)).toFixed(1) + sizes[i];
  },
  // 获取磁盘状态
  formatDiskStatus(status) {
    const nameArr = ['正常', '未初始化', '已经初始化,正在同步', '该磁盘正在重建，正在从主盘上获取数据', '该磁盘正在格式化或者切换工作模式']
    return nameArr[status]
  },
  // 加密密码规则
  // recursion 递归次数
  encryptPassword (password: string, recursion: number = 2) {
    const md5 = crypto.createHash("md5")
    const ciphertext = md5.update(password).digest('hex')
    if (recursion === 1) return ciphertext
    return this.encryptPassword(ciphertext, --recursion)
  },
  // 后缀转对应类型，支持转换成枚举类型
  suffixToType (suffix, type?) {
    let res = 'unkonw';
    let resNum = 0
    if (['mp4', 'rmvb', 'mkv'].indexOf(suffix) > -1) {
      res = 'video';
    } else if (['m4a', 'mp3', 'ogg', 'flac', 'f4a', 'wav', 'ape'].indexOf(suffix) > -1) {
      res = 'audio';
    } else if (['apng', 'png', 'jpg', 'jpeg', 'bmp', 'gif'].indexOf(suffix) > -1) {
      res = 'image';
    } else if (['ini', 'txt', 'xml', 'aspx', 'php', 'phtml', 'js', 'htm', 'html', 'log', 'c', 'cpp', 'java'].indexOf(suffix) > -1) {
      res = 'txt';
    } else if (suffix === 'pdf') {
      res = 'pdf';
    }
    if (type === 'number') {
      const arr = ['unknown', 'video', 'audio', 'image', 'document', 'archive', 'folder']
      resNum = arr.indexOf(res)
      return resNum
    }
    return res
  },
  /**获取路径目录 */
  pathDirectory (path: string) {
    const index = path.lastIndexOf('/')
    return path.slice(0, index)
  },
  // 文件类型转中文
  fileTypeToName (type: number) {
    let res = ''
    switch (type) {
      case ResourceType.all:
        res = '未知类型'
        break;
      case ResourceType.video:
        res = '视频'
        break;
      case ResourceType.audio:
        res = '音频'
        break;
      case ResourceType.image:
        res = '图片'
        break;
      case ResourceType.document:
        res = '文本'
        break;
      case ResourceType.archive:
        res = '档案'
        break;
      case ResourceType.folder:
        res = '文件夹'
        break;
      default:
        break;
    }
    return res
  },
  // 格式化速度
  formatSpeed (speed: number) {
    const kByte = 1024
    const mByte = kByte * 1024
    const gByte = mByte * 1024
    if (speed < kByte) {
      return `${(speed).toFixed(1)}B/s`
    } else if (speed < mByte) {
      return `${(speed / kByte).toFixed(1)}K/s`
    } else if (speed < gByte) {
      return `${(speed / mByte).toFixed(1)}M/s`
    } 
    return `${(speed / gByte).toFixed(1)}G/s`
  },
  // 校验手机号
  vaildatorPhone (phone: string) {
    return /^1[3456789]\d{9}$/.test(phone)
  }
}
