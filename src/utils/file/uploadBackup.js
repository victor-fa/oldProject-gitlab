// import Disk from '../api/Disk';
import NasFileAPI from '../../api/NasFileAPI'
import { USER_MODEL } from '../../common/constants'
import SparkMD5 from 'spark-md5'

export default {
	name: 'uploadBackup',
	needChunkSize: 1024 * 1024 * 2,	// 规定片段位2M
	selectUploadFiles: [],
	uploadHistory: [],
	getUgreenNo () {
		const userJson = localStorage.getItem(USER_MODEL)
		let ugreenNo = '';
		if (userJson !== null) {
			ugreenNo = JSON.parse(userJson).ugreenNo
		}
		return ugreenNo
	},
	async prepareFile(data, options) {	// 处理成同步
		if (data.name || data.sourcePath) {
			console.log(JSON.parse(JSON.stringify(data)));
			console.log(JSON.parse(JSON.stringify(this.selectUploadFiles)));
			console.log(JSON.parse(JSON.stringify(this.uploadHistory)));
			if (data.state === 'interrupted') {
				// 进行中 转 暂停
			} else if (data.state === 'progressing') {
				this.postUploadData(data, null, options.success);
			}
			return;
		}
		// if (data.target) {
		// 	data = data.target;
		// }
		for (let k = 0; k < data.files.length; k++) {
			this.selectUploadFiles.push(data.files[k]);
		}
		let fileArea = data.files;
		let OneFile = {};
		for (let i = 0; i < fileArea.length; i++) {
			let file;
			file = fileArea[i];
			await this.handlePrepareUpload(file).then(callbackMd5 => {	// 获取文件的md5
				const filePath = '/' +(options.data + '\\' + file.path).replace(new RegExp("\\\\", "g"), '/')
				OneFile = {
					id: new Date().getTime() / 1000,
					time: new Date().getTime() / 1000,
					name: file.name,
					filePath: filePath,
					path: file.path,
					chunk: 0,
					size: file.size,
					trans_type: 'backup',
					state: 'progressing',
					shows: true,
					mac: options.data,
					md5: callbackMd5
				}
				this.handleUpload(OneFile, options).then().catch(err => {	// 处理过程切换成同步
					console.log(err)
				})
			}).catch(err => {
				console.log(err)
			})
		}
	},
	handleUpload (OneFile, options) {	// 获取到结果后同步处理
		return new Promise((resolve, reject) => {
			for (let j = 0; j < this.uploadHistory.length; j++) {
				let item = this.uploadHistory[j];
				if (item.name === OneFile.name && item.chunk !== 0 && item.state !== 'completed') {
					item.state = 'progressing';
					this.postUploadData(item, null, options.success);
					return false;
				}
			}
			this.uploadHistory.push(OneFile);
			options.add && options.add(OneFile);
			console.log(JSON.parse(JSON.stringify(OneFile)));
			this.postUploadData(OneFile, 'first', options.success);
		})
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
		let data = {
			path: item.filePath,
			start: blobFrom,
			end: blobTo-1,
			size: totalSize,
			md5: item.md5,
			alias: item.mac,
			id: item.mac
		}
		let body = this.findTheFile(fileName).slice(blobFrom, blobTo)
		return { data, chunk, body };
	},
	postUploadData(item, times, finishCallBack) {
		let data = this.chunkFileData(item, times);
		NasFileAPI.uploadBackup({
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
					if (item.state === 'progressing') {
						// setTimeout(() => {
							this.postUploadData(item, null, finishCallBack);
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
	findTheFile(fileName) { //查找上传的文件
		let files = this.selectUploadFiles, theFile;
		for (let i = 0, j = files.length; i < j; ++i) {
			if (files[i].name === fileName) {
				theFile = files[i];
				break;
			}
		}
		return theFile ? theFile : {};
	},
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
	handlePrepareUpload(file) {
		return new Promise((resolve, reject) => {
			const fileSize = file.size; // 文件大小
			const chunkSize = 1024 * 1024 * 10; // 切片的大小
			const chunks = Math.ceil(fileSize / chunkSize); // 获取切片个数
			const fileReader = new FileReader();
			const spark = new SparkMD5.ArrayBuffer();
			const bolbSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
			let currentChunk = 0;
			let md5 = '';
			fileReader.onload = e => {
				const res = e.target.result;
				spark.append(res);
				currentChunk++;
				if (currentChunk < chunks) {
					loadNext();
					console.log(`第${currentChunk}分片解析完成, 开始第${currentChunk +1}分片解析`);
				} else {
					md5 = spark.end();
					resolve(md5)
				}
			};
			const loadNext = () => {
				const start = currentChunk * chunkSize;
				const end =
					start + chunkSize > file.size ? file.size : start + chunkSize;
				fileReader.readAsArrayBuffer(bolbSlice.call(file, start, end));
			};
			loadNext();
		})
	}
};
