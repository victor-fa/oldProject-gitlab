<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content">
			<a-row class="row">
				<a-col :span="4" class="title">设备名称：</a-col>
				<a-col :span="8" class="content" v-show="!edit_device_name">{{ nasInfo.name }}</a-col>
				<a-col :span="8" class="content" v-show="edit_device_name">
					<a-input type="text" v-model="nasInfo.name" placeholder="请输入昵称" clearable :max-length="15" ref="input_device_name" style="width: 200px;" @blur.native.capture="handleSetDeviceName()"/>
				</a-col>
				<a-col :span="4" v-show="!edit_device_name && isUserAdmin">
					<img class="edit" :src="loginIcons.edit" @click="edit_device_name = true">
				</a-col>
			</a-row>
			<a-row class="row">
				<a-col :span="4" class="title">处理器：</a-col>
				<a-col :span="8" class="content">{{cpu}}</a-col>
				<a-col :span="4" class="title">运行内存：</a-col>
				<a-col :span="8" class="content">{{memory | filterSize}}</a-col>
			</a-row>
			<a-row class="row">
				<a-col :span="4" class="title">设备型号：</a-col>
				<a-col :span="8" class="content">{{model}}</a-col>
				<a-col :span="4" class="title">序列号：</a-col>
				<a-col :span="8" class="content">{{nasInfo.sn}}</a-col>
			</a-row>
			<a-row class="row">
				<a-col :span="4" class="title">IP地址：</a-col>
				<a-col :span="8" class="content">{{nasInfo.ip}}</a-col>
				<a-col :span="4" class="title">MAC地址：</a-col>
				<a-col :span="8" class="content">{{nasInfo.mac | filterMac}}</a-col>
			</a-row>
			<a-row class="row">
				<a-col :span="4" class="title">服务版本：</a-col>
				<a-col :span="8" class="content">{{nas_server_ver}}</a-col>
				<a-col :span="4" class="title">系统版本：</a-col>
				<a-col :span="8" class="content">{{ sys_version}}</a-col>
			</a-row>
			<a-row class="row" v-show="showInfo">
				<a-col :span="4" class="title">版本信息：</a-col>
				<a-col :span="8" class="content">{{firmwareVer}}</a-col>
			</a-row>
			<div class="bottom">
				<a-row>
					<a-col :span="4" class="button" v-show="isUserAdmin">
						<img :src="loginIcons.shutdown" @click="handleDangerousOperation('shutdown')">
						<p>关机</p>
					</a-col>
					<a-col :span="4" class="button" v-show="isUserAdmin">
						<img :src="loginIcons.reboot" @click="handleDangerousOperation('reboot')">
						<p>重启</p>
					</a-col>
					<a-col :span="4" class="button" v-show="isUserAdmin">
						<img :src="loginIcons.factory" @click="handleDangerousOperation('factory')">
						<p>恢复出厂设置</p>
					</a-col>
					<a-col :span="4" class="button" v-show="isUserAdmin">
						<img :src="loginIcons.update" @click="handleDangerousOperation('update')">
						<p>固件升级</p>
					</a-col>
					<a-col :span="4" class="button">
						<img :src="loginIcons.delete" @click="handleDangerousOperation('delete')">
						<p>删除设备</p>
					</a-col>
				</a-row>
			</div>
		</div>
		<a-modal title="检测到有新版本固件更新"
			:visible="update.visiable" :mask="false" :closable="false" :maskClosable="false" width="450px"
			okText="确认升级" cancelText="取消升级" @ok="handleUpdate" @cancel="update.visiable = false;update.info = {}"
			:ok-button-props="{ props: { disabled: disable } }">
			<p>版本名称：{{update.info.versionName}}（{{update.info.size | filterSize}}）</p>
			<p>发布时间：{{update.info.pubtime | filterTime}}</p>
			<p>描述：{{update.info.desc === 'null' ? '无' : update.info.desc}}</p>
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
			disable: false,
			showInfo: false,
			firmwareVer: '',	// 固件版本
			nas_server_ver: '',	// 服务版本
			cpu: '',	// 处理器
			memory: '',	// 运行内存
			model: '',	// 设备型号
			sys_version: '',	// 系统版本
			edit_device_name: false,
		};
  },
	watch: {
    edit_device_name: function (newValue) {
			this.$nextTick(() => (this.$refs.input_device_name as any).focus())
    },
	},
	created() {
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
				if (this.disable === true) {
					this.$message.error('请勿重复点击')
					return
				}
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
		fetchSysInfo () {
      NasFileAPI.fetchSysInfo().then(response => {
				if (response.data.code !== 200) return
				const versionInfo = _.get(response.data.data, 'firmware_ver')
				this.showInfo = versionInfo.indexOf('-') > -1
				this.firmwareVer = this.showInfo ? versionInfo.split('-')[0] : ''
				this.sys_version = this.showInfo ? versionInfo.split('-')[1] : versionInfo
				this.cpu = _.get(response.data.data, 'cpu')
				this.memory = _.get(response.data.data, 'memory')
				this.model = _.get(response.data.data, 'model')
				this.nas_server_ver = _.get(response.data.data, 'nas_server_ver')
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
		.row {
			text-align: left;
			margin-bottom: 10px;
			line-height: 30px;
			.title {
				text-align-last: justify;
				font-weight: 500;
			}
			.content {
				font-weight: 100;
			}
			.edit {
				width: 20px;
				height: 20px;
				margin: 3px 0 0 10px;
				cursor: pointer;
			}
		}
		.bottom {
			position: absolute;
			bottom: 30px;
			width: 91%;
			.button {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				img {
					width: 45px;
					cursor: pointer;
				}
				p {
					text-align: center;
					font-weight: bold;
					margin-top: 12px;
				}
			}
		}
	}
}
</style>

