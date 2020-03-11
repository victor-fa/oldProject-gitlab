import Disk from '../api/Disk';
export default {
	name: 'upload',
	needChunkSize: 1048576,	// 1024kb = 1M
	selectUploadFiles: [],
	uploadHistory: [],
	prepareFile(data, options) {
		if (data.target) {
			data = data.target;
		}
		for (let k = 0; k < data.files.length; k++) {
			this.selectUploadFiles.push(data.files[k]);
		}
		let fileArea = data.files;
		console.log(fileArea);
		let file;
		let OneFile = {};
		for (let i = 0; i < fileArea.length; i++) {
			file = fileArea[i];
			OneFile = {
				time: new Date().getTime() / 1000,
				name: file.name,
				chunk: 0,
				size: file.size,
				trans_type: 'upload',
				state: 'progressing',
				disk_main: file.path,
				NowDiskID: options.data,
				shows: false
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
		console.log(totalSize > this.needChunkSize);
		let fileName = item.name; //文件名
		let totalSize = item.size; //大小
		let eachSize = totalSize > this.needChunkSize ? item.size / 100 : item.size; //分片大小
		let chunks = totalSize > this.needChunkSize ? Math.ceil(totalSize / eachSize) : 1;
		let chunk = item.chunk || 0;
		chunk = parseInt(chunk, 10); // 上传之前查询是否以及上传过分片
		console.log(chunk, chunks, eachSize, +'abc' + totalSize.toString());
		let isLastChunk = chunk === chunks - 1 ? 1 : 0; // 判断是否为末分片
		if (times === 'first' && isLastChunk === 1 && totalSize > this.needChunkSize) {
			// 如果第一次上传就为末分片，并且不是需要分片的文件即文件已经上传完成，否则重新上传
			chunk = 0;
			isLastChunk = 0;
		}
		// 设置分片的开始结尾
		// let blobFrom = chunk * eachSize; // 分段开始
		let blobTo = (chunk + 1) * eachSize > totalSize ? totalSize : (chunk + 1) * eachSize; // 分段结尾
		let fd = new FormData();
		let data = {	// path
			uuid: 'A252FB4252FB19AD',
			path: '/' + fileName,
			start: 0,
			end: totalSize-1,
			size: totalSize,
			action: 'f',
			api_token: 'NmVjZDhkMWVhMDM2ZjEwOTMyMTdkZTYwZTFmM2MxNjNlMjM5YTYwMgYjkyMmZkZGQ1ZGE5Y2RmYTIyNGYxOTgzOWVlNDY0MTNjYjQ5YjdhMA=='
		}
		let body = this.selectUploadFiles[0];
		item.chunk = blobTo;
		return { data, chunk, body };
	},
	postUploadData(item, times, finishCallBack) {
		let data = this.chunkFileData(item, times);
		Disk.Upload(data, rs => {
			if (parseInt(rs.status) === 200) {
				// 上传成功
				if (rs.data) {
					// 已经上传完毕
					this.uploadDone(item, rs, finishCallBack);
				} else {
					item.chunk = ++data.chunk;
					// 这样设置可以暂停，但点击后动态的设置就暂停不了..
					if (item.state === 'progressing') {
						this.postUploadData(item, null, finishCallBack);
					}
				}
			} else {
				item.state = 'interrupted'; //可恢复的上传
			}
		});
	},
	findTheFile(fileName) {
		let files = this.selectUploadFiles,
			theFile;
		for (let i = 0, j = files.length; i < j; ++i) {
			if (files[i].name === fileName) {
				theFile = files[i];
				break;
			}
		}
		return theFile ? theFile : {};
	}, //查找上传的文件
	uploadDone(item, rs, callback) {
		console.log(callback);
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
	}
};
