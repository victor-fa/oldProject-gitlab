'use strict'

import { app, protocol, BrowserWindow, ipcMain, nativeImage } from 'electron'
import {
  createProtocol,
} from 'vue-cli-plugin-electron-builder/lib'
import processCenter, { MainEventName } from './utils/processCenter'
import windowControl from './utils/windowControl'
const path = require('path');

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null,
	MusicPlayer,
  VideoPlayer,
	PictureViewer,
	FileWindow,
  DiskInfo,
	PdfWindow
/*播放按钮*/
let PlayerIcon = path.join(__filename, 'start_icon');
let NextBtn = nativeImage.createFromPath(path.join(PlayerIcon, 'start_icon.png'));
let PlayBtn = nativeImage.createFromPath(path.join(PlayerIcon, 'start_icon.png'));
let PauseBtn = nativeImage.createFromPath(path.join(PlayerIcon, 'start_icon.png'));
let PrevBtn = nativeImage.createFromPath(path.join(PlayerIcon, 'start_icon.png'));
let MusicButtons = [
	{
		tooltip: '上一首',
		icon: PrevBtn,
		click: () => {
			MusicPlayer.webContents.send('Prev');
		}
	},
	{
		tooltip: '播放',
		icon: PlayBtn,
		click: () => {
			MusicPlayer.webContents.send('Play');
		}
	},
	{
		tooltip: '下一首',
		icon: NextBtn,
		click: () => {
			MusicPlayer.webContents.send('Next');
		}
	}
];

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ width: 800,
    icon: './src/assets/logo.png',
    height: 600,
    frame: false,
    resizable: false,
    backgroundColor: '#f6f8fb',
    webPreferences: {
      nodeIntegration: true,
			webSecurity: false,
			nodeIntegrationInSubFrames: true
		}
	})

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // if (win === null) {
  //   createWindow()
  // }
  const wins = BrowserWindow.getAllWindows()
  if (wins.length === 0) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    // try {
    //   await installVueDevtools()
    // } catch (e) {
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }

  }
  bindIpc(); //初始化ipc
  createWindow()
  processCenter.mainObserverChannel()
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

let VideoButtons = [
	/*{
      tooltip: '上一个',
      icon: PrevBtn,
      click: () => {
          VideoPlayer.webContents.send('video-Prev');
      }
  },*/
	{
		tooltip: '播放',
		icon: PlayBtn,
		click: () => {
			VideoPlayer.webContents.send('video-Play');
		}
	}
	/*{
      tooltip: '下一个',
      icon:NextBtn,
      click: () => {
          VideoPlayer.webContents.send('video-Next');
      }
  }*/
];
let FileViewer = {
	Music: data => {
		if (MusicPlayer) {
			return windowControl.active(MusicPlayer, data);
		}
		MusicPlayer = windowControl.create({
			url: 'music-player',
			data: data,
			title: '音乐播放器',
			width: 350,
			height: 535,
			maximizable: false,
			minimizable: false,
			resizable: false,
			onclose: () => {
				MusicPlayer = null;
			},
			callback: () => {
				MusicPlayer.setThumbarButtons(MusicButtons);
			}
		});
	},
	Video: data => {
		if (VideoPlayer) {
			return windowControl.active(VideoPlayer, data);
		}
		VideoPlayer = windowControl.create({
			url: 'video-player',
			data: data,
			title: '视频播放器',
			width: 750,
			height: 500,
			minHeight: 350,
			minWidth: 500,
			onclose: () => {
				VideoPlayer = null;
			},
			callback: () => {
				VideoPlayer.setThumbarButtons(VideoButtons);
			}
		});
	},
	Image: data => {
		if (PictureViewer) {
			return windowControl.active(PictureViewer, data);
		}
		PictureViewer = windowControl.create({
			url: 'picture-shower',
			data: data,
			title: '图片查看',
			width: 750,
			height: 500,
			minHeight: 350,
			minWidth: 500,
			backgroundColor: '#4f4f4f',
			onclose: () => {
				PictureViewer = null;
			}
		});
	},
	Text: data => {
		if (FileWindow) {
			return windowControl.active(FileWindow, data);
		}
		FileWindow = windowControl.create({
			url: 'file-shower',
			data: data,
			title: '文件查看',
			width: 750,
			height: 500,
			minHeight: 350,
			minWidth: 500,
			onclose: () => {
				FileWindow = null;
			}
		});
	},
	Pdf: data => {
		if (PdfWindow) {
			return windowControl.active(PdfWindow, data);
		}
		PdfWindow = windowControl.create({
			url: 'pdf-viewer',
			data: data,
			title: 'PDF阅读器',
			width: 750,
			height: 500,
			minHeight: 350,
			minWidth: 500,
			backgroundColor: '#4f4f4f',
			onclose: () => {
				PdfWindow = null;
			}
		});
	},
	Attributes: data => {
		if (DiskInfo) {
			return windowControl.active(DiskInfo, data);
		}
		DiskInfo = windowControl.create({
			url: 'info',
			data: data,
			width: 600,
			height: 390,
			title: '文件属性',
			maximizable: false,
			minimizable: false,
			resizable: false,
			onclose: () => {
				DiskInfo = null;
			}
		});
	}
};
/*初始化ipc*/
function bindIpc() {
	/*网盘文件操作事件*/
	ipcMain.on('file-control', (event, type, data) => {
		switch (type) {
			case 1: //视频
				FileViewer.Video(data);
				break;
			case 2: //音频
				FileViewer.Music(data);
				break;
			case 3: //图片
				FileViewer.Image(data);
				break;
			case 4: //文本
				FileViewer.Text(data);
				break;
			case 5: //PDF
				FileViewer.Pdf(data);
				break;
			case 0: //属性
				FileViewer.Attributes(data);
				break;
		}
	});
}

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
