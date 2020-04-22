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
    var date = new Date(value * 1000);
    var Y = date.getFullYear() + '-';
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    var D = date.getDate() + ' ';
    var h = date.getHours() + ':';
    var m = date.getMinutes() + ':';
    var s = date.getSeconds();
    return Y + M + D + h + m + s;
  },
  // 格式化文件大小
	formatShowSize(bytes) {
		bytes = parseFloat(bytes);
		if (bytes === 0) return '0B';
		let k = 1024,
			sizes = ['B', 'KB', 'MB', 'GB', 'TB'],
			i = Math.floor(Math.log(bytes) / Math.log(k));
		return (bytes / Math.pow(k, i)).toPrecision(3) + sizes[i];
	},
  // 加密密码规则
  // recursion 递归次数
  encryptPassword (password: string, recursion: number = 2) {
    const crypto = require('crypto')
    const md5 = crypto.createHash("md5")
    const ciphertext = md5.update(password).digest('hex')
    if (recursion === 1) return ciphertext
    return this.encryptPassword(ciphertext, --recursion)
  },
  // 后缀转对应类型
  suffixToTpe (suffix) {
    let res = 'unkonw';
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
    return res
  },
  // 路由转中文名
  pathToName (path) {
    const toolJson = [
      { path: 'disk', name: '最近' }, { path: 'storage', name: '存储' }, 
      { path: 'custom', name: '我的' },  { path: 'collect', name: '收藏' }, 
      { path: 'encrypt', name: '加密' },  { path: 'backup', name: '备份' }, 
      { path: 'share', name: '分享' },  { path: 'transport', name: '任务' }
    ]
    return toolJson.filter(o => o.path === path)[0].name
  },
  // 获取路径目录
  pathDirectory (path: string) {
    const index = path.lastIndexOf('/')
    return path.slice(0, index)
  }
}
