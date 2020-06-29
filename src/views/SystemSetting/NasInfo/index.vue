<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content">
			<p class="cd-setting-title">设备信息</p>
			<p class="cd-setting-info">设备名：{{nasInfo.name}}</p>
			<p class="cd-setting-info">序列号：{{nasInfo.sn}}</p>
			<p class="cd-setting-info">固件版本：{{nasInfo.softversion}}</p>
			<p class="cd-setting-info">IP地址：{{nasInfo.ip}}</p>
			<p class="cd-setting-info">MAC地址：{{nasInfo.mac | filterMac}}</p>
			<p class="cd-setting-title">磁盘信息</p>
			<div class="content" v-for="(item, index) in disks" :key="index">
				<template v-if="item.type !== 7">
					<div class="left-side">
						<img :src="loginIcons.disk">
					</div>
					<div class="right-side">
						<span>盘位{{index + 1}}<font>{{item.status | filterStatus}}</font></span>
						<div class="average">
							<span>{{item.type | filterStorageType(index)}}</span>
							<span>{{item.modelName}}</span>
						</div>
						<div class="average">
							<span>容量 {{item.size | filterSize}}</span>
							<span>已使用 {{item.used | filterSize}}</span>
						</div>
					</div>
					<!-- <a-button v-show="isUserAdmin && diskFormatting === 0 && (item.status === 0 || item.status === 2)" @click="handleInitialize(item)">初始化</a-button> -->
					<!-- 管理员可以进行格式化（2020.3.22伟明说针对某个内置的初始化不要了） -->
				</template>
			</div>
			<p class="cd-setting-title"><br></p>
			<p class="cd-setting-title">
				<a-button class="cd-purple-button" @click="handleDangerousOperation('shutdown')" v-show="isUserAdmin">关机</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('reboot')" v-show="isUserAdmin">重启</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('factory')" v-show="isUserAdmin">恢复出厂设置</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('update')" v-show="isUserAdmin">固件升级</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('delete')">删除设备</a-button>
			</p>
		</div>
		<a-modal title="检测到有新版本固件更新"
			:visible="update.visiable" :mask="false" :closable="false" :maskClosable="false" width="450px"
			okText="确认升级" cancelText="取消升级" @ok="handleUpdate" @cancel="update.visiable = false,update.info = {}">
			<p>版本名称：{{update.info.versionName}}（{{update.info.size | filterSize}}）</p>
			<p>发布时间：{{update.info.pubtime | filterTime}}</p>
			<p>描述：{{update.info.desc}}</p>
		</a-modal>
		<a-modal
			:visible="mode.visiable" :mask="false" :closable="false" :maskClosable="false" width="300px"
			okText="确定" cancelText="取消" @ok="handleInitialize(null)" @cancel="mode.visiable = false;mode.choice = 0">
			<p>请选择存储模式</p>
			<a-radio-group v-model="mode.choice">
				<a-radio :value="0">{{firstMode.title}}</a-radio>
				<a-radio :value="1">{{secondMode.title}}</a-radio>
			</a-radio-group>
		</a-modal>
		<a-modal :title="makesureModal.title"
			:visible="makesureModal.visiable" :mask="false" :closable="false" :maskClosable="false" width="400px"
			:okText="commonInfo.okText" :cancelText="commonInfo.cancelText" @ok="handleMakesure"
			@cancel="handleCancle">
			<p>{{makesureModal.message}}</p>
			<font class="modal-font">{{commonInfo.tips}}</font>
      <a-input :placeholder="commonInfo.placeholder" v-model="makesureModal.input" :max-length="4"/>
		</a-modal>
	</div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { loginIcons } from '@/views/Login/iconList'
import NasFileAPI from '@/api/NasFileAPI'
import { NasInfo } from '@/api/ClientModel'
import StorageHandler from '../../Storage/StorageHandler'
import ClientAPI from '@/api/ClientAPI'
import StringUtility from '@/utils/StringUtility'
import processCenter, { EventName } from '@/utils/processCenter'
import { DeviceRole } from '@/api/UserModel'
import { firstMode, secondMode, commonInfo } from '../settingModel'
import TransportHelper from '../../../api/Transport/TransportHelper'

export default Vue.extend({
  name: 'nas-info',
	computed: {
		...mapGetters('NasServer', ['nasInfo', 'accessInfo']),
	},
  filters: {
    filterSize (bytes) {
      return StringUtility.formatShowSize(bytes)
		},
    filterTime (time) {
      return StringUtility.formatShowMtime(time)
		},
    filterStatus (status) {
      return StringUtility.formatDiskStatus(status)
		},
		filterStorageType (data, index) {
			return StorageHandler.matchStorageName(data, index)
		},
		filterMac (data) {
			return StringUtility.formatMacAddress(data)
		}
	},
	data() {
		return {
			disks: [] as any,
			loginSetting: {
				autoLogin: false,
				autoPowerOn: false,
				closeChoice: 'tray'
			},
			loginIcons,
			update: {
				visiable: false,
				info: {} as any
			},
			mode: {
				visiable: false,
				choice: 0
			},
			isUserAdmin: false,
			diskMode: 0,
			finalMode: 0,
			firstMode,
			secondMode,
			commonInfo,
			diskFormatting: 0,
			makesureModal: {
				title: '',
				visiable: false,
				input: '',
				message: ''
			}
		};
  },
	created() {
		this.fetchDisks()
		this.isUserAdmin = this.accessInfo.role === DeviceRole.admin
	},
  methods: {
		close() {
			const _this = this as any
			_this.$electron.remote.getCurrentWindow().close()
		},
		handleDangerousOperation (flag) {
			let message = ''
			let leftBut = ''
			let rightBut = ''
			const { dialog } = require('electron').remote
			if (flag === 'shutdown') {
				message = `该操作将中断所有正在进行中的任务！`
			} else if (flag === 'reboot') {
				message = `该操作将中断所有正在进行中的任务！`
			} else if (flag === 'factory') {
				message = `该操作将设备恢复至初始状态，但不会清除您硬盘的任何数据。\n恢复出厂时间可能较长，请您耐心等待！`
			} else if (flag === 'update') {
				this.fetchUpdateInfo()
				return
			} else if (flag === 'delete') {
				leftBut = '解绑并保留数据'
				rightBut = '解绑并删除数据'
				if (this.isUserAdmin) {
					message = `该操作将会清除所有用户信息，用户数据可保留或删除。\n解绑过程需设备连接互联网，是否继续？`
				} else {
					message = `该操作将会清除您的用户信息，用户数据可保留或删除。\n解绑过程需设备连接互联网，是否继续？`
				}
			}
			dialog.showMessageBox({
				type: 'info',
				title: '绿联云',
				message,
				buttons: [leftBut ? leftBut : '确定', rightBut ? rightBut : '取消'],
				cancelId: 2	// 右上角关闭
			}).then(result => {
				if (result.response === 0) {
					if (flag === 'shutdown') {
						this.handleShutdown()
					} else if (flag === 'reboot') {
						this.handleReboot()
					} else if (flag === 'factory') {
						this.handleFactory()
					} else if (flag === 'delete') {
						this.isUserAdmin ? this.handleAdminDelete(1) : this.handleCommonDelete()
					}
				} else if (result.response === 1) {
					if (flag === 'delete') {
						this.isUserAdmin ? this.handleAdminDelete(0) : this.handleCommonDelete()
					}
				}
			}).catch(error => console.log(error))
		},
		handleShutdown () {
			NasFileAPI.shutdown().then(response => {
				if (response.data.code !== 200) return
				this.switchDevice()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleReboot () {
			NasFileAPI.reboot().then(response => {
				if (response.data.code !== 200) return
				this.switchDevice()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleFactory () {
			NasFileAPI.factory().then(response => {
				if (response.data.code !== 200) return
				this.switchDevice()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		fetchUpdateInfo () {
			NasFileAPI.fetchRomInfo().then(response => {
				if (response.data.code !== 200) { this.$message.error('网络连接错误，请检测网络'); return; }
        const info = _.get(response.data, 'data')
				if (!info) { this.$message.info('当前版本已最新'); return; }
				this.update.info = info as any
				this.update.visiable = true
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleUpdate () {
			NasFileAPI.fetchRomUpgrade().then(response => {
				if (response.data.code !== 200) return
				console.log(response);
				this.switchDevice()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleCommonDelete () {
			ClientAPI.commonDetach().then(response => {
				if (response.data.code !== 200) return
				this.switchDevice()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleAdminDelete (choice: number) {	// 不删除:0 删除:1
			ClientAPI.adminDetach(choice).then(response => {
				if (response.data.code !== 200) return
				this.switchDevice()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		switchDevice () {
			this.$store.dispatch('NasServer/clearCacheNas')
			TransportHelper.clearQueueCache()
			processCenter.renderSend(EventName.bindList)
		},
    fetchDisks () {
      NasFileAPI.fetchDisks().then(response => {
        if (response.data.code !== 200) return
				this.disks = _.get(response.data.data, 'disks')
				console.log(JSON.parse(JSON.stringify(response.data.data)));
				this.diskMode = _.get(response.data.data, 'mode')
				this.diskFormatting = _.get(response.data.data, 'formatting')
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
		handleInitialize (item) {
			if (this.mode.visiable) {	// 已有弹框，选择后切换
				this.finalMode = this.mode.choice
				this.handleOperation('makesure')
				return
			}
			if (this.diskMode === -1) { this.mode.visiable = true; return; }	// 打开弹框
			this.finalMode = item.raidMode
			this.handleOperation('makesure')
		},
		handleOperation (flag) {
			if (flag === 'makesure') {
				this.makesureModal = {
					title: this.finalMode === 0 ? this.firstMode.makesure.title : this.secondMode.makesure.title,
					visiable: true,
					input: '',
					message: this.finalMode === 0 ? this.firstMode.makesure.message : this.secondMode.makesure.message
				}
			} else if (flag === 'switchMode') {
				this.makesureModal = {
					title: this.finalMode === 0 ? this.firstMode.switchMode.title : this.secondMode.switchMode.title,
					visiable: true,
					input: '',
					message: this.finalMode === 0 ? this.firstMode.switchMode.message : this.secondMode.switchMode.message
				}
			}
		},
		handleMakesure () {
			if (this.makesureModal.input.length === 0) { this.$message.error('您未输入关键信息！'); return; }
			if (this.makesureModal.input !== '我已了解') { this.$message.error('输入关键信息错误！'); return; }
			this.handleCancle()
			this.makesureModal.title === '硬盘初始化' ? this.handleSwitchMode() : this.handleOperation('switchMode')
		},
		handleCancle () {
			this.makesureModal = {
				title: this.makesureModal.title,
				visiable: false,
				input: '',
				message: ''
			}
		},
		handleSwitchMode () {
			NasFileAPI.switchMode(this.finalMode, 1).then(response => {
				if (response.data.code !== 200) return
				this.mode = { visiable: false, choice: 0 }
				// this.switchDevice()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
  }
})
</script>

<style lang="less" scoped>
p { text-align: left; }
.cd-setting-main {
	width: 100%;
	height: 86%;
	padding: 10px;
	display: inline-flex;
	.cd-setting-content {
		width: calc(100%);
		height: 100%;
		padding: 20px;
		float: left;
		overflow-y: scroll;
		.cd-setting-title {
			width: 100%;
			font-size: 16px;
			line-height: 35px;
			margin-bottom: 10px;
			font-weight: bold;
			.cd-purple-button { margin-right: 10px; }
		}
		.cd-setting-info {
			width: 100%;
			font-size: 14px;
			padding-left: 5px;
			line-height: 30px;
			color: #000;
			span {
				background: #06B650;
				color: #fff;
				border-radius: 5px;
				padding: 3px 5px;
				font-size: 12px;
				margin-left: 10px;
			}
			button {
				background: none;
				font-size: 14px;
				margin-right: 10px;
			}
			img {
				width: 70px;
				height: 70px;
				margin: 15px 0 0 -3px;
			}
		}
		.content {
			display: flex;
			.left-side {
				display: flex;
				flex-flow: column;
				text-align: left;
				padding: 10px;
				img {
					width: 60px;
					height: 60px;
					margin: 0px;
				}
			}
			.right-side {
				flex: 1;
				display: flex;
				flex-flow: column;
				text-align: left;
				padding: 10px;
				font { color: #06B650; }
				.average {
					display: flex;
					span { flex: 1; }
				}
			}
			button { margin: 30px 10px 0 0; }
			&:active, &:focus, &:hover {
				background: #06b6501a;
				border-radius: 4px;
			}
		}
	}
}
.modal-font {
	color: #f00;
	display: block;
	margin-bottom: 15px;
}
</style>

