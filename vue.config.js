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
        "appId": "com.ugreen.nas",
        "productName": "Nas-uGreen",//项目名，也是生成的安装文件名，即aDemo.exe
        "copyright": "Copyright © 2020",//版权信息
        "directories": {
          "output": "./dist_electron"//输出文件路径
        },
        "publish": [
          {
            "provider": "generic",
            "url": "http://192.168.10.21/sys/file/gz/"
          }
        ],
        "win": {//win相关配置
          "icon": "./logo.png",//图标，当前图标在根目录下，注意这里有两个坑
          "target": [
            {
              "target": "nsis",//利用nsis制作安装程序
              "arch": [
                "x64",//64位
                "ia32"//32位
              ]
            }
          ]
        },
        "nsis": {
          "oneClick": false, // 是否一键安装
          "allowElevation": true, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
          "allowToChangeInstallationDirectory": true, // 允许修改安装目录
          "createDesktopShortcut": true, // 创建桌面图标
          "createStartMenuShortcut": true,// 创建开始菜单图标
          "shortcutName": "Nas-uGreen", // 图标名称
        }
      }
    }

  }
}