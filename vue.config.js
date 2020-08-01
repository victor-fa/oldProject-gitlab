// 获取package.json信息
const packageInfo = require('./package')
// 获取年月日
const d = new Date();
const currentDate = d.getFullYear() + '' + (d.getMonth()+1) + '' + d.getDate()
// 获取git分支
const GitRevisionPlugin = require("git-revision-webpack-plugin");
const gitRevisionPlugin = new GitRevisionPlugin();
gitRevisionPlugin.versionCommand = "describe --always --tags";
const outputDirData = gitRevisionPlugin.version();
// 后缀
const suffix = process.platform === 'win32' ? 'exe' : 'dmg'

module.exports = {
  css: {
    loaderOptions: {
      "less": {
        modifyVars: {
          "primary-color": "#06B650",
          "link-color": "#06B650",
          "border-radius-base": "2px"
        },
        "javascriptEnabled": true
      }
    }
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        "appId": `com.ugreen.app.${packageInfo.name}`,
        "productName": `${packageInfo.name}_v${packageInfo.version}_${outputDirData}_${currentDate}`, // 项目名，也是生成的安装文件名，即aDemo.exe
        "copyright": "Copyright © 2020", // 版权信息
        "directories": {
          "output": "./dist_electron"//输出文件路径
        },
        "asar": false,
        "publish": [
          {
            "provider": "generic",
            "url": "http://192.168.10.21/sys/file/exe/"
          }
        ],
        "win": {//win相关配置
          "icon": "./logo.png", //图标，当前图标在根目录下，注意这里有两个坑
					"artifactName": `${packageInfo.name}_v${packageInfo.version}_${outputDirData}_${currentDate}.${suffix}`,
          "target": [
            {
              "target": "nsis", //利用nsis制作安装程序
              "arch": [
                "x64", //64位
                "ia32"//32位
              ]
            }
          ]
        },
        "nsis": {
          "oneClick": false, // 是否一键安装
          "deleteAppDataOnUninstall": true,  // 清空所有用户数据，仅一键安装有效
          "shortcutName": "UGreen-Nas", // 图标名称
          "allowElevation": true, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
          "allowToChangeInstallationDirectory": true, // 允许修改安装目录，仅非一键安装有效
          "createDesktopShortcut": true, // 创建桌面图标
          "createStartMenuShortcut": true, // 创建开始菜单图标
          "uninstallDisplayName": "绿联云",  // 控制面板中卸载程序的名称
        }
      }
    }

  }
}
