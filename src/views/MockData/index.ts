import { ResourceItem } from '../../components/ResourceList/ResourceModel'


const realResourceList = [
  {
    "path": "/.ugreen_nas",
    "uuid": "A252FB4252FB19AD",
    "type": 6,
    "size": 0,
    "ctime": 1582688532,
    "status": 0,
    "mtime": 1582688532,
    "collected": 0,
    "shared": 0,
    "duration": 0
  },
  {
    "path": "/新",
    "uuid": "A252FB4252FB19AD",
    "type": 6,
    "size": 0,
    "ctime": 1582701857,
    "status": 0,
    "mtime": 1582701857,
    "collected": 0,
    "shared": 0,
    "duration": 0
  },
  {
    "path": "/新建",
    "uuid": "A252FB4252FB19AD",
    "type": 6,
    "size": 0,
    "ctime": 1583567052,
    "status": 0,
    "mtime": 1583567052,
    "collected": 0,
    "shared": 0,
    "duration": 0
  },
  {
    "path": "/1-2.mp4",
    "uuid": "A252FB4252FB19AD",
    "type": 1,
    "size": 29652107,
    "ctime": 1582794779,
    "status": 0,
    "mtime": 1582794779,
    "collected": 0,
    "shared": 0,
    "duration": 0,
    "thumbs": [
      "/.thumb/1-2-1582794779-29652107-SMALL.png",
      "/.thumb/1-2-1582794779-29652107-MIDDLE.png",
      "/.thumb/1-2-1582794779-29652107-LARGE.png"
    ]
  },
  {
    "path": "/1-3.mp4",
    "uuid": "A252FB4252FB19AD",
    "type": 1,
    "size": 18837529,
    "ctime": 1582624990,
    "status": 0,
    "mtime": 1582624990,
    "collected": 0,
    "shared": 0,
    "duration": 0,
    "thumbs": [
      "/.thumb/1-3-1582624990-18837529-SMALL.png",
      "/.thumb/1-3-1582624990-18837529-MIDDLE.png",
      "/.thumb/1-3-1582624990-18837529-LARGE.png"
    ]
  },
  {
    "path": "/2-1.mp4",
    "uuid": "A252FB4252FB19AD",
    "type": 2,
    "size": 53642975,
    "ctime": 1582884043,
    "status": 0,
    "mtime": 1582884043,
    "collected": 0,
    "shared": 0,
    "duration": 0
  },
  {
    "path": "/2-8 简单的复杂度分析.mp4",
    "uuid": "A252FB4252FB19AD",
    "type": 2,
    "size": 38667264,
    "ctime": 1583137064,
    "status": 0,
    "mtime": 1583137064,
    "collected": 1476332575,
    "shared": 804622944,
    "duration": -251212716
  },
  {
    "path": "/2-9 均摊复杂度和防止复杂度的震荡.mp4",
    "uuid": "A252FB4252FB19AD",
    "type": 2,
    "size": 42858653,
    "ctime": 1583135489,
    "status": 0,
    "mtime": 1583136746,
    "collected": 1884060266,
    "shared": -1909757731,
    "duration": 912281777
  },
  {
    "path": "/Hearthstone Screenshot 02-21-20 13.58.16.png",
    "uuid": "A252FB4252FB19AD",
    "type": 3,
    "size": 2846660,
    "ctime": 1582792082,
    "status": 0,
    "mtime": 1582792082,
    "collected": 0,
    "shared": 0,
    "duration": 0,
    "thumbs": [
      "/.thumb/Hearthstone Screenshot 02-21-20 13-1582792082-2846660-SMALL.png",
      "/.thumb/Hearthstone Screenshot 02-21-20 13-1582792082-2846660-MIDDLE.png",
      "/.thumb/Hearthstone Screenshot 02-21-20 13-1582792082-2846660-LARGE.png"
    ]
  },
  {
    "path": "/Java核心技术 卷I 基础知识（原书第10版）.pdf",
    "uuid": "A252FB4252FB19AD",
    "type": 0,
    "size": 169510170,
    "ctime": 1582942916,
    "status": 0,
    "mtime": 1582942916,
    "collected": 0,
    "shared": 0,
    "duration": 0
  },
  {
    "path": "/QQ图片20191107013747.jpg",
    "uuid": "A252FB4252FB19AD",
    "type": 3,
    "size": 2071373,
    "ctime": 1582943488,
    "status": 0,
    "mtime": 1582943488,
    "collected": 3129355,
    "shared": -268239872,
    "duration": 0,
    "thumbs": [
      "/.thumb/QQ图片20191107013747-1582943488-2071373-SMALL.png",
      "/.thumb/QQ图片20191107013747-1582943488-2071373-MIDDLE.png",
      "/.thumb/QQ图片20191107013747-1582943488-2071373-LARGE.png"
    ]
  },
  {
    "path": "/cn.gov.tax.its_1.2.5_10205.apk",
    "uuid": "A252FB4252FB19AD",
    "type": 0,
    "size": 37554732,
    "ctime": 1582895422,
    "status": 0,
    "mtime": 1582895422,
    "collected": 0,
    "shared": 0,
    "duration": 0
  },
  {
    "path": "/com.tencent.apk",
    "uuid": "A252FB4252FB19AD",
    "type": 0,
    "size": 83617105,
    "ctime": 1582894801,
    "status": 0,
    "mtime": 1582894801,
    "collected": 0,
    "shared": 0,
    "duration": 0
  },
  {
    "path": "/com.xunmeng.pinduoduo_5.2.0_50200.apk",
    "uuid": "A252FB4252FB19AD",
    "type": 0,
    "size": 22201805,
    "ctime": 1582893865,
    "status": 0,
    "mtime": 1582893865,
    "collected": 0,
    "shared": 0,
    "duration": 0
  },
  {
    "path": "/my_music1.flac",
    "uuid": "A252FB4252FB19AD",
    "type": 2,
    "size": 22988581,
    "ctime": 1582853361,
    "status": 0,
    "mtime": 1582853361,
    "collected": 0,
    "shared": 0,
    "duration": 0
  },
  {
    "path": "/my_music2.mp3",
    "uuid": "A252FB4252FB19AD",
    "type": 2,
    "size": 13233468,
    "ctime": 1582853361,
    "status": 0,
    "mtime": 1582853361,
    "collected": 0,
    "shared": 0,
    "duration": 0
  },
  {
    "path": "/test0228.txt",
    "uuid": "A252FB4252FB19AD",
    "type": 4,
    "size": 11355,
    "ctime": 1582883356,
    "status": 0,
    "mtime": 1582883356,
    "collected": 0,
    "shared": 0,
    "duration": 0
  },
  {
    "path": "/环境变量.PNG.download_tmp.",
    "uuid": "A252FB4252FB19AD",
    "type": 0,
    "size": 37872,
    "ctime": 1582804459,
    "status": 0,
    "mtime": 1582804459,
    "collected": 0,
    "shared": 0,
    "duration": 0
  }
]

export {
  realResourceList
}
