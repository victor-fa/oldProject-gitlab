// import Disk from '../api/Disk';
import NasFileAPI from '../../api/NasFileAPI'
export default {
	name: 'upload',
	needChunkSize: 10485760,	// 规定片段位10M
	selectUploadFiles: [],
	uploadHistory: [],
	prepareFile(data, options) {
		// if (data.target) {
		// 	data = data.target;
		// }
		for (let k = 0; k < data.files.length; k++) {
			this.selectUploadFiles.push(data.files[k]);
		}
		let fileArea = data.files;
		let file;
		let OneFile = {};
		for (let i = 0; i < fileArea.length; i++) {
			file = fileArea[i];
			OneFile = {
				id: new Date().getTime() / 1000,
				url: [''],
				time: new Date().getTime() / 1000,
				uuid: '',
				name: file.name,
				filePath: '/.ugreen_nas/6001/' + file.name,
				path: file.path,
				chunk: 0,
				size: file.size,
				trans_type: 'upload',
				state: 'progressing',
				disk_main: '',
				canResume: false,
				shows: true
			};
			for (let j = 0; j < this.uploadHistory.length; j++) {
				let item = this.uploadHistory[j];
				if (item.name === OneFile.name && item.chunk !== 0 && item.disk_main === OneFile.disk_main && item.state !== 'completed') {
					item.state = 'progressing';
					this.postUploadData(item, null, options.success);
					return false;
				}
			}
			this.uploadHistory.push(OneFile);
			options.add && options.add(OneFile);
			this.postUploadData(OneFile, 'first', options.success);
		}
	},
	chunkFileData(item, times) {
		let fileName = item.name; //文件名
		let totalSize = item.size; //大小
		let eachSize = totalSize > this.needChunkSize ? item.size / 100 : item.size; //分片大小
		let chunks = totalSize > this.needChunkSize ? Math.ceil(totalSize / eachSize) : 1;
		let chunk = item.chunk || 0;
		chunk = parseInt(chunk, 10); // 上传之前查询是否以及上传过分片

		let isLastChunk = chunk === chunks - 1 ? 1 : 0; // 判断是否为末分片
		if (times === 'first' && isLastChunk === 1 && totalSize > this.needChunkSize) {
			// 如果第一次上传就为末分片，并且不是需要分片的文件即文件已经上传完成，否则重新上传
			chunk = 0;
			isLastChunk = 0;
		}
		// 设置分片的开始结尾
		let blobFrom = Math.round(chunk * eachSize); // 分段开始
		let blobTo = (chunk + 1) * eachSize > totalSize ? totalSize : Math.round((chunk + 1) * eachSize); // 分段结尾
		item.chunk = blobTo;

		let data = {	// path
			uuid: '57f8f4bc-abf4-655f-bf67-946fc0f9f25b',
			path: '/.ugreen_nas/6001/' + fileName,
			start: blobFrom,
			end: blobTo-1,
			size: totalSize,
			action: 'f'
		}
		let body = this.findTheFile(fileName).slice(blobFrom, blobTo)
		return { data, chunk, body };
	},
	postUploadData(item, times, finishCallBack) {
		const myThis = this
		let data = this.chunkFileData(item, times);
		NasFileAPI.upload({
			data: data.data,
			body: data.body
		}).then(response => {
			if (parseInt(response.status) === 200) {
				if (response.data.code !== 200) {
					this.uploadDone(item, response, finishCallBack);
					return;
				}
				if (item.chunk < data.data.size) {
					item.chunk = ++data.chunk;
					// 这样设置可以暂停，但点击后动态的设置就暂停不了..
					if (item.state === 'progressing') {
						// setTimeout(() => {
							this.postUploadData(item, 'stormfa', finishCallBack);
						// }, 3000);
					}
				} else {
					this.uploadDone(item, response, finishCallBack);
				}
			} else {
				item.state = 'interrupted'; //可恢复的上传
			}
		}).catch(error => {
			console.log(error);
		})
	},
	findTheFile(fileName) {
		let files = this.selectUploadFiles, theFile;
		for (let i = 0, j = files.length; i < j; ++i) {
			if (files[i].name === fileName) {
				theFile = files[i];
				break;
			}
		}
		return theFile ? theFile : {};
	}, //查找上传的文件
	uploadDone(item, rs, callback) {
		item.chunk = item.size;
		item.state = 'completed';
		for (let i = 0, j = this.selectUploadFiles.length; i < j; ++i) {
			if (this.selectUploadFiles[i].name === item.name) {
				this.selectUploadFiles.splice(i, 1);
				break;
			}
		}
		for (let i = 0, j = this.uploadHistory.length; i < j; ++i) {
			if (this.uploadHistory[i].name === item.name) {
				this.uploadHistory.splice(i, 1);
				break;
			}
		}
		callback(item, rs);
	},
	FileSize(bytes) {
		bytes = parseFloat(bytes);
		if (bytes === 0) return '0B';
		let k = 1024,
			sizes = ['B', 'KB', 'MB', 'GB', 'TB'],
			i = Math.floor(Math.log(bytes) / Math.log(k));
		return (bytes / Math.pow(k, i)).toPrecision(3) + sizes[i];
	},
	DiskData(item) {
		item.active = false; //设置未选择
		item.$size = this.FileSize(item.disk_size); //计算文件大小
		item.disk_size = parseInt(item.disk_size);
		item.disk_main ? (item.disk_main = severAddress() + '/' + item.disk_main) : '';
		item.shareAddress = item.share ? severAddress() + '/s/' + item.share : '';
		item.$icon = 'OtherType.png'; //初始化为其他图标
		item.OpenType = null; //初始化为无法打开的文件
		let type = (item.disk_realname || item.disk_main).Before('.').toLowerCase();
		item.type = type;
		if (item.disk_main) {
			for (let i in FileType) {
				if (type.Exist(FileType[i].TypeArray)) {
					item.$icon = FileType[i].FileIcon;
				}
			}
			if (item.type === 'zip') {
				item.OpenType = 'zip';
			} else if (item.type === 'pdf') {
				item.OpenType = 'pdf';
			} else if (item.type.Exist('apng,png,jpg,jpeg,bmp,gif')) {
				item.TypeArray = 'apng,png,jpg,jpeg,bmp,gif';
				item.OpenType = 'image';
			} else if (item.type.Exist('mp4,rmvb,mkv')) {
				item.TypeArray = 'mp4,rmvb,mkv';
				item.OpenType = 'video';
			} else if (item.type.Exist('m4a,mp3,ogg,flac,f4a,wav,ape')) {
				item.TypeArray = 'm4a,mp3,ogg,flac,f4a,wav,ape';
				item.OpenType = 'audio';
			} else if (item.type.Exist('ini,txt,xml,aspx,php,phtml,js,c,htm,html,log,c,cpp,java')) {
				item.OpenType = 'text';
			}
		} else {
			item.$icon = 'FolderType.png';
		}
	}
};
