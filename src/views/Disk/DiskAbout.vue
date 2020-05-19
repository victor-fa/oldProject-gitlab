<template>
	<div class="cloudSeries-about-win">
		<WindowsHeader :data="header" />
		<div class="cloudSeries-about-main">
			<div class="app-version">
				<div class="logo">Nas-uGreen</div>
				<span>Version{{ version }}</span>
			</div>
			<div class="app-icon"></div>
			<div class="engine-info">
				<h4>核心版本{{ electron }}</h4>
				<ul>
					<li v-for="(item, index) in InfoList" :key="index">{{ index }}<span />{{ item }}</li>
				</ul>
			</div>
			<div class="update-info">
				<p class="tips">{{ message }}</p>
				<div class="process">
					<Progress :percent="percent" v-show="percent > 0" />
					<p class="process-p" v-show="percent > 0">{{ percent }}%</p>
				</div>
			</div>
			<div class="bottom">
				<p class="release">©2020 uGreen_{{ name }}</p>
				<a-button @click="checkUpdate">
					<span>{{ CheckText }}</span>
				</a-button>
				<a-button @click="openLink">
					官网
				</a-button>
			</div>
		</div>
	</div>
</template>

<script>
import WindowsHeader from '../../components/Disk/WindowHeader.vue'
import UserAPI from '../../api/UserAPI'
import StringUtility from '../../utils/StringUtility'

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
			}
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
		checkUpdate() {
			let appId = ''
			let appVersion = ''
			if (process.platform === 'win32') {	// win环境
				appId = packageInfo.winAppId
				appVersion = packageInfo.winAppVersion
			} else {	// mac环境
				appId = packageInfo.macAppId
				appVersion = packageInfo.macAppVersion
			}
      UserAPI.fetchUpdateInfo(appId, appVersion).then(response => {
        if (response.data.code !== 200) {
					this.$message.error('获取更新信息失败')
          return
				}
				if (response.data.data) {
					const pkgUrl = _.get(response.data.data, 'pkgUrl')
					this.$ipc.send('system', 'check-for-update', pkgUrl);
				} else {
					this.$message.info("当前已为最新版")
				}
      }).catch(error => {
        console.log(error)
      })
		},
		openLink() {
			this.$electron.shell.openExternal('https://www.lulian.cn/');
		}
	}
};
</script>

<style scoped>
/*关于信息窗口*/
.cloudSeries-about-win {
	width: 100%;
	height: 100%;
	-webkit-app-region: drag;
}
.cloudSeries-about-main {
	width: 100%;
	height: calc(100% - 50px);
	background: #fff;
	padding: 0 30px 20px;
	position: relative;
}
.app-version {
	text-align: left;
}
.app-version .logo {
	width: 190px;
	height: 45px;
	float: left;
	display: inline-block;
	vertical-align: bottom;
	font-size: 30px;
	line-height: 39px;
	color: #4c4c4c;
	font-family: 'Mistral';
	font-weight: bold;
}
.app-version span {
	display: inline-block;
	vertical-align: bottom;
	font-size: 14px;
	margin: 0 10px;
	color: #4c4c4c;
	line-height: 45px;
}
.app-icon {
	background: transparent url('../../assets/big_logo.png');
	position: absolute;
	top: 10px;
	right: 40px;
	background-size: 100%;
	width: 80px;
	height: 80px;
	border-radius: 100%;
	box-shadow: 0 0 10px 0 #6e6e6e;
}
.engine-info {
	text-align: left;
	margin: 20px 35% 0 8px;
}
.engine-info h4 {
	font-size: 14px;
	font-weight: 400;
	color: #4c4c4c;
	padding: 15px 0;
}
.engine-info ul {
	font-size: 12px;
	color: #bdbdbd;
	list-style: none;
	padding: 0;
	line-height: 20px;
}
.engine-info ul li {
	float: left;
	width: 50%;
}
.engine-info ul li span {
	padding: 5px;
}
.update-info {
	width: 100%;
	padding: 10px 8px;
	display: inline-block;
}
.update-info .tips {
	font-size: 14px;
	font-weight: 400;
	color: #d82b2b;
	text-align: left;
	margin-bottom: 0;
}
.update-info .process {
	padding: 10px 0;
	height: 35px;
	text-align: left;
}
.update-info .process-p {
	color: #000;
	display: inline-block;
	margin-left: 10px;
}
.cloudSeries-about-main .bottom {
	width: calc(100% - 60px);
	position: absolute;
	bottom: 0;
}
.bottom button {
	float: right;
	background: none;
	font-size: 12px;
	color: #333;
}
.cloudSeries-about-main .release {
	float: left;
	font-size: 12px;
	color: #4c4c4c;
	margin-top: 10px;
}
.cloudSeries-about-main button {
	float: right;
	margin-left: 20px;
	overflow: hidden !important;
	-webkit-app-region: no-drag;
}
</style>
