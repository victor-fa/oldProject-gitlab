'use strict'

import { app, protocol, BrowserWindow, ipcMain, nativeImage } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import processCenter from './utils/processCenter'
import windowControl from './utils/windowControl'
import path from 'path'
import { spawn, exec } from 'child_process'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null,
	MusicPlayer,
  VideoPlayer,
	PictureViewer,
	FileWindow,
  DiskInfo,
	PdfWindow,
	LoginWindow,
	MainWindow,
	AboutWindow,
	FeedBackWindow,
	ForgetPassWindow,
	RomUpdateWindow
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
  win = new BrowserWindow({ 
		width: 420,
    height: 610,
		minWidth: 420,
    icon: './src/assets/logo.png',
    frame: false,
    resizable: false,
    backgroundColor: '#f6f8fb',
    webPreferences: {
      nodeIntegration: true,
			webSecurity: false,
			nodeIntegrationInSubFrames: true
		}
	})

	// const { spawn } = require('child_process')
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
		if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
		win.loadURL('app://./index.html')
		// win.webContents.openDevTools()
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
	DiskSystem.MainWindow({})
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
	{
		tooltip: '播放',
		icon: PlayBtn,
		click: () => {
			VideoPlayer.webContents.send('video-Play');
		}
	}
];

/*网盘函数*/
let DiskSystem = {
	LoginWindow: flag => {
		if (LoginWindow) {
			return windowControl.active(LoginWindow, flag);
		}
		LoginWindow = windowControl.create({
			url: '/',
			data: flag,
			icon: './src/assets/logo.png',
			title: '绿联云-欢迎',
			width: 850,
			height: 550,
			maximizable: false,
			resizable: false,
			onclose: () => {
				LoginWindow = null;
			}
		});
	},
	MainWindow: data => {
		if (MainWindow) {
			return windowControl.active(MainWindow, data);
		}
	},
	AboutWindow: data => {
		if (AboutWindow) {
			return windowControl.active(AboutWindow);
		}
		AboutWindow = windowControl.create({
			url: 'disk-about',
			icon: './src/assets/logo.png',
			title: '关于绿联云',
			width: 600,
			height: 400,
			maximizable: false,
			minimizable: false,
			resizable: false,
			onclose: () => {
				AboutWindow = null;
			}
		});
		AboutWindow.webContents.session.on('will-download', (event, item, webContents) => {
			const savePath = path.join(app.getPath('downloads'), item.getFilename());
			item.setSavePath(savePath);
			item.on('updated', (event, state) => {
				if (state === 'interrupted') {
					console.log('Download is interrupted but can be resumed')
				} else if (state === 'progressing') {
					if (item.isPaused()) {
						console.log('Download is paused')
					} else {
						AboutWindow.webContents.send('percent', (item.getReceivedBytes() / item.getTotalBytes()));
					}
				}
			})
			item.once('done', (event, state) => {
				if (state === 'completed') {
					console.log('Download successfully')
					const { spawn } = require('child_process')
					spawn(savePath)	// 打开对应路径
				} else {
					console.log(`Download failed: ${state}`)
				}
			})
		})
		if (data === 'new') {
			setTimeout(() => { AboutWindow.webContents.send('newVersion', '有新版本') }, 2000);
		}
	},
	FeedBackWindow: () => {
		if (FeedBackWindow) {
			return windowControl.active(FeedBackWindow);
		}
		FeedBackWindow = windowControl.create({
			url: 'disk-feedback',
			icon: './src/assets/logo.png',
			title: '问题反馈',
			width: 450,
			height: 320,
			maximizable: false,
			minimizable: false,
			resizable: false,
			onclose: () => {
				FeedBackWindow = null;
			}
		});
	},
	ForgetPassWindow: msg => {
		if (ForgetPassWindow) {
			return windowControl.active(ForgetPassWindow, msg);
		}
		ForgetPassWindow = windowControl.create({
			url: 'forget-pass',
			data: msg,
			icon: './src/assets/logo.png',
			width: 420,
			height: 610,
			maximizable: false,
			resizable: false,
      transparent: false,
      show: false,
			onclose: () => {
				ForgetPassWindow = null;
			}
		});
    ForgetPassWindow.on('blur', () => {
			ForgetPassWindow.focus()
      // shell.beep()
    })
	},
	RomUpdateWindow: msg => {
		if (RomUpdateWindow) {
			return windowControl.active(RomUpdateWindow, msg);
		}
		RomUpdateWindow = windowControl.create({
			url: 'rom-update',
			data: msg,
			icon: './src/assets/logo.png',
			width: 450,
			height: 400,
			maximizable: false,
			resizable: false,
			transparent: true,
      show: false,
			onclose: () => {
				RomUpdateWindow = null;
			}
		});
    RomUpdateWindow.on('blur', () => {
			RomUpdateWindow.focus()
      // shell.beep()
    })
	},
	logoff: () => {
		DiskSystem.LoginWindow(false);
		MainWindow.webContents.send('exit');
		MainWindow.close();
	},
	exit: () => {}
};
let FileViewer = {
	Music: data => {
		if (MusicPlayer) {
			return windowControl.active(MusicPlayer, data);
		}
		MusicPlayer = windowControl.create({
			url: 'music-player',
			data: data,
			icon: './src/assets/logo.png',
			title: '音乐播放器',
			width: 350,
			height: 180,
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
			icon: './src/assets/logo.png',
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
			icon: './src/assets/logo.png',
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
			icon: './src/assets/logo.png',
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
			icon: './src/assets/logo.png',
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
			icon: './src/assets/logo.png',
			data: data,
			width: 600,
			height: 370,
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
	/*系统操作事件*/
	ipcMain.on('system', (event, type, data) => {
		switch (type) {
			case 'login':
				DiskSystem.MainWindow(data);
				break;
			case 'forget-pass':
				DiskSystem.ForgetPassWindow(data);
				break;
			case 'rom-update':
				DiskSystem.RomUpdateWindow(data);
				break;
			case 'about':
				DiskSystem.AboutWindow(data);
				break;
			case 'feedback':
				DiskSystem.FeedBackWindow();
				break;
			case 'check-for-update':
				AboutWindow.webContents.downloadURL(data);
				break;
			case 'awaken-tunnel':
				awakeTunnel();
				break;
			case 'auto-launch':
				app.setLoginItemSettings({
					openAtLogin: data
				});
				break;
			case 'exit':
				// console.log('退出');
				break;
		}
	});
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
// 启动P2P隧道程序
function awakeTunnel () {
  if (process.env.WEBPACK_DEV_SERVER_URL) {	// 开发环境
		if (process.platform === 'win32') {
			spawn(path.join(__filename, '../../public/tunnel/win/ugreenTunnel.exe'));
		} else {
			const cwdPath = path.join(__filename, '../../public/tunnel/mac')
			const filePath = path.join(cwdPath, 'pgTunnelStatic')
			const child = spawn(filePath, { shell: true, cwd: cwdPath })
			// child.stdout.pipe(process.stdout)
		}
  } else {	// 生产环境
		if (process.platform === 'win32') {
			spawn(path.join(__filename, '../tunnel/win/ugreenTunnel.exe').replace(new RegExp("\\\\", "g"), '/'));
		} else {
			const cwdPath = path.join(__filename, '../tunnel/mac')
			const filePath = path.join(cwdPath, 'pgTunnelStatic')
			exec(`chmod 777 ${filePath}`, (error, stdout, stderr) => {
				if (error === null) spawn(filePath, { shell: true, cwd: cwdPath })
			})
		}
  }
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
