<template>
	<div class="cloudSeries-about-win">
    <a-layout-header class="setting-header">
      <span>关于绿联云</span>
      <window-menu :configure="'unable'" class="window-menu"/>
    </a-layout-header>
		<div class="cloudSeries-about-main">
			<div class="content">
				<div class="detail">
					<p>关于（产品介绍）</p><br>
					<p>xxxxx</p><br>
					<p>xxxxx</p><br>
					<p>xxxxx</p><br>
					<p>xxxxx</p><br>
					<p>xxxxx</p><br>
				</div>
			</div>
			<div class="bottom">
				<p class="release">当前版本号：{{ version }}</p>
				<div class="button">
					<a-button class="update" @click="doUpdate"><span>检查更新</span></a-button>
					<a-button class="privacy" @click="$electron.shell.openExternal(nasCloudIP + '/sys/file/resource/pc/secretAgreement.htm')">隐私协议</a-button>
					<a-button class="user" @click="$electron.shell.openExternal(nasCloudIP + '/sys/file/resource/pc/serviceAgreement.htm')">用户协议</a-button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import WindowMenu from '@/components/WindowMenu/index.vue'
import UserAPI from '@/api/UserAPI'
import StringUtility from '@/utils/StringUtility'
import { nasCloudIP } from '@/api/CloudServer'
import processCenter, { EventName } from '@/utils/processCenter'

const packageInfo = require('../../../package');
export default {
	name: 'DiskAbout',
	data() {
		return {
			header: {
				color: '#666',
				title: '',
				resize: false,
				mini: false,
				close: () => {
					this.$electron.remote.getCurrentWindow().hide();
					return true;
				}
			},
			electron: ' ' + process.versions.electron,
			nasCloudIP
		};
	},
	components: { WindowMenu },
	computed: {
		version() {
			return packageInfo.version;
		},
		name() {
			return packageInfo.name;
		}
	},
	filters: {
    filterSize (bytes) {
      return StringUtility.formatShowSize(bytes)
		},
    filterTime (time) {
      return StringUtility.formatShowMtime(time)
		}
	},
	methods: {
		doUpdate() {
			processCenter.renderSend(EventName.update)  // 打开更新窗口
		}
	}
};
</script>

<style lang="less" scoped>
/*关于信息窗口*/
.cloudSeries-about-win {
	width: 100%;
	height: 100%;
	/* -webkit-app-region: drag; */
  .setting-header {
    height: 35px;
    width: 100%;
    padding: 0px;
    background-color: #EDEFF4;
    display: flex;
    align-items: center;
    justify-content: space-between;
    -webkit-app-region: drag;
    span {
      margin-left: 20px;
      font-weight: bold;
    }
    .window-menu { margin-right: 20px; }
  }
	.cloudSeries-about-main {
		width: 100%;
		height: calc(100% - 50px);
		background: #fff;
		padding: 20px;
		position: relative;
		.content {
			border: 1px solid #BFBFBF;
			padding: 10px 0px 10px 10px;
			.detail {
				text-align: left;
				text-indent: 2em;
				overflow-y: scroll;
				height: 228px;
			}
		}
		.bottom {
			width: 90%;
			position: absolute;
			bottom: -148px;
			display: flex;
			flex-direction: column;
			.release {
				text-align: left;
				font-size: 14px;
				color: #4c4c4c;
				margin-top: 10px;
			}
			.button {
				background: none;
				font-size: 12px;
				color: #333;
				.update { float: left; }
				.user { float: right; }
				.privacy {
					float: right;
					margin: 0 -20px 0 10px;
				}
			}
		}
		.update-info {
			width: 100%;
			padding: 10px 8px;
			display: inline-block;
			.tips {
				font-size: 14px;
				font-weight: 400;
				color: #d82b2b;
				text-align: left;
				margin-bottom: 0;
			}
			.process {
				padding: 10px 0;
				height: 35px;
				text-align: left;
			}
			.process-p {
				color: #000;
				display: inline-block;
				margin-left: 10px;
			}
		}
	}
}
</style>

<style>
.ant-modal-body {
	overflow-y: scroll;
	height: 175px;
}
</style>
