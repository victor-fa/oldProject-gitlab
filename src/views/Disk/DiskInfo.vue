<template>
	<div class="cd-disk-info-main" @keyup.stop.esc="close" tabindex="-1">
		<WindowsHeader :data="header" />
		<div class="cd-disk-info-head">
			<span v-if="DiskData.path">{{ DiskData.path | filterName }}</span>
			<span v-else>{{ DiskData.showName }}</span>
		</div>

		<div v-if="DiskData.path">
			<div class="cd-disk-info-item">
				<span>文件类型:</span>
				<div :title="DiskData.type | filterNameType">{{ DiskData.type | filterNameType }}</div>
			</div>
			<div class="cd-disk-info-item">
				<span>文件位置:</span>
				<div ref="address" :title="DiskData.name">{{getPathSource()}}/{{ DiskData.name }}</div>
			</div>
			<div class="cd-disk-info-item">
				<span>文件大小:</span>
				<div :title="DiskData.size | filterSize">{{ DiskData.size | filterSize }}</div>
			</div>
			<div class="cd-disk-info-item">
				<span>创建时间:</span>
				<div :title="DiskData.ctime | filterTime">{{ DiskData.ctime | filterTime }}</div>
			</div>
			<div class="cd-disk-info-item">
				<span>修改时间:</span>
				<div v-if="DiskData.mtime === 0">未修改</div>
				<div v-else :title="DiskData.mtime | filterTime">{{ DiskData.mtime | filterTime }}</div>
			</div>
			<div class="cd-disk-info-item">
				<span>唯一标识:</span>
				<div :title="DiskData.uuid">{{ DiskData.uuid }}</div>
			</div>
			<div class="cd-disk-info-item">
				<span>文件分享:</span>
				<div>{{ DiskData.shared === 0 ? '未分享' : '已分享' }}</div>
			</div>
			<div class="cd-disk-info-item">
				<span>文件收藏:</span>
				<div>{{ DiskData.collected === 0 ? '未收藏' : '已收藏' }}</div>
			</div>
		</div>
		<div v-else>
			<div class="cd-disk-info-item">
				<span>名称:</span>
				<div :title="DiskData.showName">{{ DiskData.showName }}</div>
			</div>
			<div class="cd-disk-info-item">
				<span>状态:</span>
				<div :title="DiskData.status === 0 ? '非格式化' : '格式化'">
					{{ DiskData.status === 0 ? '非格式化' : '格式化' }}
				</div>
			</div>
			<div class="cd-disk-info-item">
				<span>当前温度:</span>
				<div :title="DiskData.temp">{{ DiskData.temp }}</div>
			</div>
			<div class="cd-disk-info-item">
				<span>硬盘容量:</span>
				<div :title="DiskData.size | filterSize">{{ DiskData.size | filterSize }}</div>
			</div>
			<div class="cd-disk-info-item">
				<span>硬盘类型:</span>
				<div :title="DiskData.type | filterStorageType">{{ DiskData.type | filterStorageType }}</div>
			</div>
			<div class="cd-disk-info-item">
				<span>SMART状态:</span>
				<div :title="DiskData.smartStatus">
					{{ DiskData.smartStatus === 0 ? '未打开' : '已打开' }}
				</div>
			</div>
			<div class="cd-disk-info-item">
				<span>坏区数量:</span>
				<div :title="DiskData.bad">{{ DiskData.bad }}</div>
			</div>
			<div class="cd-disk-info-item">
				<span>使用时长:</span>
				<div :title="DiskData.used | filterTime">{{ DiskData.used | filterTime }}</div>
			</div>
		</div>

		<div class="cd-disk-info-item">
			<a-button class="cd-cancel-button" @click="close">关闭</a-button>
		</div>
	</div>
</template>

<script>
import WindowsHeader from '@/components/Disk/WindowHeader.vue'
import StringUtility from '@/utils/StringUtility'
import StorageHandler from '../Storage/StorageHandler';
export default {
	name: 'DiskInfo',
	components: {
		WindowsHeader
	},
	filters: {
		filterName (data) {
			return StringUtility.formatName(data)
		},
		filterNameType (data) {
			console.log(StringUtility.fileTypeToName(data));
			return StringUtility.fileTypeToName(data)
		},
		filterTime (data) {
			return StringUtility.formatShowMtime(data)
		},
		filterSize (data) {
			return StringUtility.formatShowSize(data)
		},
		filterStorageType (data) {
			return StorageHandler.matchStorageName(data)
		}
	},
	data() {
		return {
			DiskData: {
				path: '',
				disk_type: '',
				size: 0,
				ctime: '',
				mtime: '',
				uuid: '',
				isMyself: false,
				showName: '',
				status: 0,
				temp: 0,
				status: 0,
				status: 0,
				type: 0,
				smartStatus: 0,
				bad: 0,
				used: 0
			},
			header: {
				title: '',
				resize: false,
				mini: false,
				color: '#000'
			},
			window: false
		};
	},
	beforeMount () {
		this.window = this.$electron.remote.getCurrentWindow();
		this.$ipc.on('win-data', (event, data) => {
			console.log(JSON.parse(JSON.stringify(data)));
			//接收打开文件的数据
			this.DiskData = data;
			if (data.myself_folder) {
				this.DiskData.isMyself = true
				this.DiskData.size = 0
				this.DiskData.ctime = data.myself_folder.mtime
				this.DiskData.mtime = data.myself_folder.mtime
			}
			console.log(JSON.parse(JSON.stringify(this.DiskData)));
			this.header.title = StringUtility.formatName(data.path) + ' 属性';
			this.window.setTitle(StringUtility.formatName(data.path) + ' 属性');
		});
	},
	methods: {
		close() {
			this.window.close();
		},
		getPathSource () {
			if (this.DiskData.path.indexOf('/.library') > -1) { return '珍藏' }
			if (this.DiskData.path.indexOf('/.safe') > -1) { return '加密空间' }
			if (this.DiskData.path.indexOf('/.backup') > -1) { return '备份' }
			if (this.DiskData.collected === 1) { return '收藏' }
			if (this.DiskData.shared === 1) { return '珍藏' }
			return '存储'
		}
	}
};
</script>

<style lang="less" scoped>
/*文件属性窗口*/
.cd-disk-info-main {
	width: 100%;
	height: 100%;
	background: #fff;
	color: #000;
	box-shadow: 0 3px 3px 0 rgba(0, 0, 0, 0.14), 0 1px 7px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -1px rgba(0, 0, 0, 0.2);
	border: 1px solid #efefef;
	// -webkit-app-region: drag;
}
.cd-disk-info-head {
	height: 56px;
	border-bottom: 1px solid #ccc;
	padding: 10px;
	img {
		width: 35px;
	}
	* {
		display: inline-block;
		line-height: 35px;
		text-indent: 10px;
		text-overflow: ellipsis;
	}
	span {
		width: calc(100%);
		font-size: 16px;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: left;
	}
}
.cd-disk-info-item {
	width: 100%;
	padding: 0 50px;
	font-size: 14px;
	line-height: 32px;
	display: flex;
	span {
		height: 30px;
		display: block;
		font-size: 14px;
		font-weight: 600;
	}
	div {
		flex: 1;
		width: calc(100% - 60px);
		height: 30px;
		line-height: 20px;
		padding-top: 6px;
		padding-left: 10px;
		color: #2d2d2d;
		text-overflow: ellipsis;
		white-space: normal;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 1;
		display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
		cursor: pointer;
    text-align: left;
	}
	input {
		width: calc(100% - 160px);
		height: 29px;
		border-radius: 0;
		margin-left: 10px;
		// -webkit-app-region: no-drag;
	}
	button {
		float: right;
		background: none;
		height: 30px;
		line-height: 30px;
		padding: 0 10px;
		position: absolute;
    right: 35px;
		// -webkit-app-region: no-drag;
	}
}
.cd-disk-info-item input::selection {
	background-color: #eaecf0;
}
.cd-disk-info-line {
	width: calc(100% - 88px);
	height: 1px;
	background: #eaecf0;
	margin: 5px auto;
}
</style>
