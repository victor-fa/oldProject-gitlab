import { app, session } from 'electron';
import StringUtility from '../../utils/StringUtility'

export default {
	transDownFolder: app.getPath('downloads'),
	downloadList: {},
	fileObject(item, state) {
		return {
			id: Math.round(item.getStartTime()),
			url: item.getURLChain(),
			time: item.getStartTime(),
			uuid: item.uuid,
			name: item.name,
			filePath: item.filePath,
			path: item.path,
			chunk: item.getReceivedBytes(),
			size: item.getTotalBytes(),
			trans_type: 'download',
			state: state || item.getState(),
			disk_main: item.getURL(),
			canResume: item.canResume(),
			shows: true
		};
	},
	changeFolder(data) {
		this.transDownFolder = data;
	},
	init() {
		session.defaultSession.removeAllListeners('will-download');
		session.defaultSession.on('will-download', (event, item, webContents) => {
			const paramsStr = item.getURL();
			let str = ''
			if (paramsStr.indexOf('&crypto_token') === -1) {
				str = paramsStr.substring(paramsStr.indexOf('?')+1, paramsStr.indexOf('&api_token'))
			} else {
				str = paramsStr.substring(paramsStr.indexOf('?')+1, paramsStr.indexOf('&crypto_token'))
			}
			let filePath = decodeURIComponent(str.substring(str.indexOf('&path=') + 6))
			let name = StringUtility.formatName(filePath).replace(new RegExp("\\+", "g"), ' ')
			item.uuid = str.substring(str.indexOf('uuid='), str.indexOf('&'))
			item.name = name
			item.filePath = filePath
			item.path = this.transDownFolder + '\\' + name
			item.setSavePath(this.transDownFolder + '\\' + name); // 设置保存路径,使Electron不提示保存对话框。
			item.on('updated', () => {
				this.downloadList[Math.round(item.getStartTime())] = item;
				let file = this.fileObject(item, item.isPaused() ? 'interrupted' : false);
				webContents && webContents.send('download', file);
			});
			item.once('done', (event, state) => {
				let file = this.fileObject(item, item.isPaused() ? 'interrupted' : false);
				webContents && webContents.send('download', file);
				if (state === 'completed') {
					delete this.downloadList[Math.round(item.getStartTime())];
					webContents && webContents.send('download', file, 'completed');
				} else {
					console.log(`Download failed: ${state}`);
				}
			});
		});
	}
};
