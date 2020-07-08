<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content">
			<p class="cd-setting-title">设备信息</p>
			<p class="cd-setting-info">
				设备名：{{!edit_device_name ? nasInfo.name : ''}}
				<a-input type="text" v-show="edit_device_name"
					v-model="nasInfo.name" placeholder="请输入昵称" clearable
					:max-length="15" ref="input_device_name" style="width: 200px;"
					@blur.native.capture="handleSetDeviceName()"/>
				<img class="edit" v-show="!edit_device_name && isUserAdmin" :src="loginIcons.edit" @click="edit_device_name = true">
			</p>
			<p class="cd-setting-info">序列号：{{nasInfo.sn}}</p>
			<p class="cd-setting-info">固件版本：{{firmwareVer}}</p>
			<p class="cd-setting-info">IP地址：{{nasInfo.ip}}</p>
			<p class="cd-setting-info">MAC地址：{{nasInfo.mac | filterMac}}</p>
			<p class="cd-setting-title">
				<a-button class="cd-purple-button" @click="handleDangerousOperation('shutdown')" v-show="isUserAdmin">关机</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('reboot')" v-show="isUserAdmin">重启</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('factory')" v-show="isUserAdmin">恢复出厂设置</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('update')" v-show="isUserAdmin" :disabled="disable">固件升级</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('delete')">删除设备</a-button>
			</p>
		</div>
		<a-modal title="检测到有新版本固件更新"
			:visible="update.visiable" :mask="false" :closable="false" :maskClosable="false" width="450px"
			okText="确认升级" cancelText="取消升级" @ok="handleUpdate" @cancel="update.visiable = false;update.info = {}"
			:ok-button-props="{ props: { disabled: disable } }">
			<p>版本名称：{{update.info.versionName}}（{{update.info.size | filterSize}}）</p>
			<p>发布时间：{{update.info.pubtime | filterTime}}</p>
			<p>描述：{{update.info.desc === 'null' ? '无' : update.info.desc}}</p>
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
			makesureModal: {
				title: '',
				visiable: false,
				input: '',
				message: ''
			},
			disable: false,
			firmwareVer: '',
			edit_device_name: false,
		};
  },
	watch: {
    edit_device_name: function (newValue) {
			this.$nextTick(() => (this.$refs.input_device_name as any).focus())
    },
	},
	created() {
		this.fetchDisks()
		this.fetchSysInfo()
		this.isUserAdmin = this.accessInfo.role === DeviceRole.admin
	},
  methods: {
		handleSetDeviceName() {
			NasFileAPI.setDeviceName(this.nasInfo.name).then(response => {
				if (response.data.code !== 200) return
				this.edit_device_name = false
        this.$store.dispatch('NasServer/updateNasInfo', this.nasInfo)
				processCenter.renderSend(EventName.account);
        this.$message.success('修改成功')
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误,请检测网络')
      })
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
				this.disable = true
				this.fetchUpdateInfo()
				return
			} else if (flag === 'delete') {
				if (this.isUserAdmin) {
					leftBut = '解绑并保留数据'
					rightBut = '解绑并删除数据'
					message = `该操作将会清除所有用户信息，用户数据可保留或删除。\n解绑过程需设备连接互联网，是否继续？`
				} else {
					message = `您是否确定删除该设备？`
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
						this.isUserAdmin ? this.handleAdminDelete(0) : null
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
        processCenter.renderSend(EventName.initialize)  // 打开获取初始化进度窗口
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
				this.update.visiable = false
				this.update.info = {}
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
				console.log(JSON.parse(JSON.stringify(response.data.data)));
				this.diskMode = _.get(response.data.data, 'mode')
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
		fetchSysInfo () {
      NasFileAPI.fetchSysInfo().then(response => {
        if (response.data.code !== 200) return
				this.firmwareVer = _.get(response.data.data, 'firmware_ver')
				console.log(this.firmwareVer);
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
	height: 100%;
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
			font-size: 14px;
			line-height: 35px;
			margin-bottom: 10px;
			font-weight: 500;
			.cd-purple-button { margin-right: 10px; }
		}
		.cd-setting-info {
			width: 100%;
			font-size: 12px;
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
			.disk {
				width: 70px;
				height: 70px;
				margin: 15px 0 0 -3px;
			}
			.edit {
				width: 20px;
				height: 20px;
				margin: 3px 0 0 10px;
				cursor: pointer;
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

