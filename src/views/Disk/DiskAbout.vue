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
			<div class="update-info" v-if="percent > 0">
				<p class="tips">{{ message }}</p>
				<div class="process">
					<Progress :percent="percent" v-show="percent > 0" />
					<p class="process-p" v-show="percent > 0">{{ percent }}%</p>
				</div>
			</div>
			<div class="bottom">
				<p class="release">版本号：{{ version }}</p>
				<div class="button">
					<a-button class="update" @click="openUpdateInfo"><span>{{ CheckText }}</span></a-button>
					<a-button class="privacy" @click="$electron.shell.openExternal(nasCloudIP + '/sys/file/resource/pc/secretAgreement.htm')">隐私协议</a-button>
					<a-button class="user" @click="$electron.shell.openExternal(nasCloudIP + '/sys/file/resource/pc/serviceAgreement.htm')">用户协议</a-button>
				</div>
			</div>
		</div>
		<a-modal
			:visible="updateInfo.visiable" :mask="false" :closable="false" :maskClosable="false" width="450px" style="top: 60px;"
			okText="下载" cancelText="取消" @ok="doUpdate" @cancel="updateInfo.visiable = false">
			<p v-show="updateInfo.appName">{{updateInfo.appName}} 有新版本【{{updateInfo.verNo}}】更新！</p>
			<p v-show="updateInfo.desc">描述：{{updateInfo.desc}}</p>
			<p>
				<font v-show="updateInfo.pubTime">时间：{{updateInfo.pubTime | filterTime}}</font>
				<font v-show="updateInfo.size" style="margin-left: 20px">大小：{{updateInfo.size | filterSize}}</font>
			</p>
		</a-modal>
	</div>
</template>

<script>
import WindowMenu from '@/components/WindowMenu/index.vue'
import UserAPI from '@/api/UserAPI'
import StringUtility from '@/utils/StringUtility'
import { nasCloudIP } from '@/api/CloudServer'


const packageInfo = require('../../../package');
export default {
	name: 'DiskAbout',
	data() {
		return {
			CheckText: '检查更新',
			message: '',
			percent: 0,
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
			InfoList: {
				Author: '绿联科技有限公司',
				Email: '827542599@qq.com',
				Platform: process.platform + ' ' + process.arch,
				Vue: require('vue/package.json').version,
				Node: process.versions.node
			},
			updateInfo: {
				visiable: false,
				pkgUrl: '',
				appNo: '',
				appName: '',
				verNo: '',
				verName: '',
				size: '',
				desc: '',
				remark: '',
				pubTime: 0
			},
			nasCloudIP
		};
	},
	components: { WindowMenu },
	beforeMount() {
		this.bind();
	},
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
		bind() {
			this.$ipc.on('percent', (event, message) => {
				this.percent = Number((message * 100).toFixed(0))
				if (this.percent === 100) {
					this.percent = 0
				}
			});
			this.$ipc.on('newVersion', (event, message) => {
				this.message = '有新版本！'
				this.CheckText = '点我更新'
			});
		},
		openUpdateInfo() {
			this.getUpdateInfo()
		},
		getUpdateInfo() {
			let appId = ''
			let appVersion = ''
			if (process.platform === 'win32') {	// win环境
				appId = packageInfo.winAppId
				appVersion = packageInfo.winAppVersion
			} else {	// mac环境
				appId = packageInfo.macAppId
				appVersion = packageInfo.macAppVersion
			}
      UserAPI.fetchSoftVerUpdateInfo(appId, appVersion).then(response => {
        if (response.data.code !== 200) {
					this.$message.error('获取更新信息失败')
          return
				}
				if (response.data.data) {
					this.updateInfo.visiable = true
					this.updateInfo.pkgUrl = _.get(response.data.data, 'pkgUrl')
					this.updateInfo.appNo = _.get(response.data.data, 'appNo')
					this.updateInfo.appName = _.get(response.data.data, 'appName')
					this.updateInfo.verNo = _.get(response.data.data, 'verNo')
					this.updateInfo.verName = _.get(response.data.data, 'verName')
					this.updateInfo.size = _.get(response.data.data, 'size')
					this.updateInfo.desc = _.get(response.data.data, 'desc')
					this.updateInfo.remark = _.get(response.data.data, 'remark')
					this.updateInfo.pubTime = _.get(response.data.data, 'pubTime')
					console.log(this.updateInfo);
				} else {
					this.$message.info("当前已为最新版")
				}
      }).catch(error => {
        console.log(error)
      })
		},
		doUpdate() {
			this.$ipc.send('system', 'check-for-update', this.updateInfo.pkgUrl);
			this.updateInfo.visiable = false
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
