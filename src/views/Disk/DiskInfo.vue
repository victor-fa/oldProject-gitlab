<template>
	<div class="cd-disk-info-main" @keyup.stop.esc="close" tabindex="-1">
		<WindowsHeader :data="header" />
		<div class="cd-disk-info-head">
			<img draggable="false" :src="DiskData.$icon" alt="" />
			<span>{{ DiskData.path | filterName }}</span>
		</div>
		<div class="cd-disk-info-item">
			<span>文件类型:</span>
			<div :title="DiskData.path | filterNameType">{{ DiskData.path | filterNameType }}</div>
		</div>
		<div class="cd-disk-info-item">
			<span>文件位置:</span>
			<div ref="address" :title="DiskData.path">{{ DiskData.path }}</div>
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
		<div class="cd-disk-info-item" style="position: absolute;bottom: 15px;right:-30px;">
			<a-button class="cd-cancel-button" @click="close">关闭</a-button>
		</div>
	</div>
</template>

<script>
import WindowsHeader from '../../components/Disk/WindowHeader.vue'
import StringUtility from '../../utils/StringUtility'
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
			return StringUtility.formatSuffix(data)
		},
		filterTime (data) {
			return StringUtility.formatShowMtime(data)
		},
		filterSize (data) {
			return StringUtility.formatShowSize(data)
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
				isMyself: false
			},
			header: {
				title: '',
				resize: false,
				mini: false
			},
			window: false
		};
	},
	created() {
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
			this.header.title = StringUtility.formatName(data.path) + ' 属性';
			this.window.setTitle(StringUtility.formatName(data.path) + ' 属性');
		});
	},
	methods: {
		close() {
			this.window.close();
		}
	}
};
</script>

<style lang="scss" scoped>
/*文件属性窗口*/
.cd-disk-info-main {
	width: 100%;
	height: 100%;
	background: #fff;
	color: #000;
	// -webkit-app-region: drag;
	box-shadow: 0 3px 3px 0 rgba(0, 0, 0, 0.14), 0 1px 7px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -1px rgba(0, 0, 0, 0.2);
	border: 1px solid #efefef;
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
		float: left;
		line-height: 35px;
		text-indent: 10px;
		text-overflow: ellipsis;
	}
	span {
		width: calc(100%);
		font-size: 16px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}
.cd-disk-info-item {
	width: 100%;
	padding: 0 50px;
	font-size: 14px;
	line-height: 32px;
	span {
		float: left;
		height: 30px;
		display: block;
		font-size: 14px;
		font-weight: 600;
	}
	div {
		float: left;
		width: calc(100% - 105px);
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
