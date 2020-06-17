<template>
	<div class="cloudSeries-about-win">
		<WindowsHeader :data="header" />
		<div class="cloudSeries-about-main">
			<div class="title"><img src="../../assets/logo.png">绿联云</div>
			<div class="content">
				<div class="title">关于（产品介绍）</div>
				<div class="detail">
					<p>（1）您应具有中华人民共和国法律规定的与您行为相适应的民事行为能力；如果您未满18周岁，您需要在由您法定监护人同意、并代表您签署确认该协议，方可注册、使用绿联云软件平台帐户。</p><br>
					<p>（2）您通过相关设备（如个人手机、电脑、电视等）下载对应专用的绿联云软件，使用您自有的手机号码在平台上注册帐号，并设置个人密码，绑定您自有的绿联网络私有云存储产品，即可享受本服务。绿联云软件平台帐号的所有权归绿联所有，您注册后享有其使用权，不得出租、出借、转让、赠与或与他人共同使用。</p><br>
					<p>（3）您应自行负责您的帐号和密码的安全性。您需采取积极措施保证帐号和密码的安全性，建议措施包括但不限于：不将自己的帐号和密码透露给他人、设置复杂密码、定期修改密码等。无论是否经过您的授权，对通过您帐户进行的或在您帐户中发生的所有活动，均应由您自行负责。如发现他人未经授权使用您的帐号和密码的，您应立即通知绿联。</p><br>
					<p>（4）您有权在平台上修改个人帐号中各项可修改的信息，若密码遗失，您可以根据提示通过注册的手机号码重置密码。</p><br>
					<p>（5）您需确保用于注册帐号所使用的手机号码的真实、准确性和合法性，注册所使用的手机号码是认定您与平台帐号之关联性的唯一凭证。一旦手机号码出现更换、丢失或者无法收到验证码等，您需更新手机号码，方可继续使用本服务。</p><br>
				</div>
			</div>
			<div class="update-info">
				<p class="tips">{{ message }}</p>
				<div class="process">
					<Progress :percent="percent" v-show="percent > 0" />
					<p class="process-p" v-show="percent > 0">{{ percent }}%</p>
				</div>
			</div>
			<div class="bottom">
				<p class="release">版本号：{{ version }}</p>
				<!-- ©2020 uGreen_{{ name }} -->
				<a-button @click="openUpdateInfo"><span>{{ CheckText }}</span></a-button>
				<a-button @click="$electron.shell.openExternal(nasCloudIP + '/sys/file/resource/pc/serviceAgreement.htm')">用户协议</a-button>
				<a-button @click="$electron.shell.openExternal(nasCloudIP + '/sys/file/resource/pc/secretAgreement.htm')">隐私协议</a-button>
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
import WindowsHeader from '@/components/Disk/WindowHeader.vue'
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
	components: { WindowsHeader },
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
}
.cloudSeries-about-main {
	width: 100%;
	height: calc(100% - 50px);
	background: #fff;
	padding: 0 30px 20px;
	position: relative;
	.title {
		display: flex;
		line-height: 25px;
		img {
			width: 25px;
			margin-right: 10px;
		}
	}
	.content {
		.title {
			display: flex;
			justify-content: center;
		}
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
		border-top: 1px solid;
    padding-top: 16px;
		button {
			float: right;
			background: none;
			font-size: 12px;
			color: #333;
		}
	}
	.release {
		float: left;
		font-size: 12px;
		color: #4c4c4c;
		margin-top: 10px;
	}
	button {
		float: right;
		margin-left: 20px;
		overflow: hidden !important;
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
</style>

<style>
.ant-modal-body {
	overflow-y: scroll;
	height: 175px;
}
</style>
