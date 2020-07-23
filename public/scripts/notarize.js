require('dotenv').config()
const {notarize} = require('electron-notarize')
 
exports.default = async function notarizing (context) {
  const appName = context.packager.appInfo.productFilename
  const {electronPlatformName, appOutDir} = context
  if (electronPlatformName !== 'darwin') {
    return
  }

  let appPath = `${appOutDir}/${appName}.app`
  let appleId = 'rasping@163.com'
  let appBundleId = 'com.ugreen.nas.client'
  let ascProvider = '4X996UV8LC'
  let appleIdPassword = 'ofsz-mdey-aqrp-cwqo'

  // eslint-disable-next-line no-return-await
  return await notarize({
    appBundleId,
    appPath,
    ascProvider,
    appleId,
    appleIdPassword
  })
}
