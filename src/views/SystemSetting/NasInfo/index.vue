<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content">
			<p class="cd-setting-title">设备信息</p>
			<p class="cd-setting-info">序列号：{{nasInfo.sn}}</p>
			<p class="cd-setting-info">固件版本：{{nasInfo.softversion}}</p>
			<p class="cd-setting-info">IP地址：{{nasInfo.ip}}</p>
			<p class="cd-setting-info">MAC地址：{{nasInfo.mac}}</p>
			<p class="cd-setting-title">磁盘信息</p>
			<div class="content" v-for="(item, index) in disks" :key="index">
				<template v-if="item.type !== 7">
					<div class="side">
						<span>盘位{{index + 1}}<font>{{item.status | filterStatus}}</font></span>
						<img :src="loginIcons.disk">
					</div>
					<div class="side">
						<span>{{item.type | filterStorageType(index)}}</span>
						<span>{{item.modelName}}</span>
						<span>容量 {{item.size | filterSize}}</span>
						<span>已使用 {{item.used | filterSize}}</span>
					</div>
					<a-button v-show="isUserAdmin" style="">格式化</a-button>
				</template>
			</div>
			<p class="cd-setting-title">存储模式</p>
			<p class="cd-setting-title">
				<a-radio-group v-model="mode">
					<a-radio :value="0">双盘备份模式</a-radio>
					<a-radio :value="1">普通存储模式</a-radio>
				</a-radio-group>
			</p>
			<p class="cd-setting-title">
				<a-button class="cd-purple-button" @click="handleDangerousOperation('shutdown')" v-show="isUserAdmin">关机</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('reboot')" v-show="isUserAdmin">重启</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('factory')" v-show="isUserAdmin">恢复出厂设置</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('update')" v-show="isUserAdmin">固件升级</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('delete')">删除设备</a-button>
			</p>
			<SettingBottom @callback="handleBottom" />
		</div>
		<a-modal
			:visible="detach.visiable" :mask="false" :closable="false" :maskClosable="false" width="300px"
			okText="确定" cancelText="取消" @ok="handleAdminDelete" @cancel="detach.visiable = false">
			<p>是否删除用户数据？</p>
			<a-radio-group v-model="detach.choice">
				<a-radio :value="0">不删除</a-radio>
				<a-radio :value="1">删除</a-radio>
			</a-radio-group>
		</a-modal>
	</div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import SettingBottom from '@/components/Disk/SettingBottom.vue'
import { USER_MODEL } from '@/common/constants'
import { loginIcons } from '@/views/Login/iconList'
import NasFileAPI from '@/api/NasFileAPI'
import UserAPI from '@/api/UserAPI'
import { NasInfo } from '@/api/ClientModel'
import StorageHandler from '../../Storage/StorageHandler'
import ClientAPI from '@/api/ClientAPI'
import { DeviceInfo, DeviceRole, User } from '@/api/UserModel'
import StringUtility from '@/utils/StringUtility'

export default Vue.extend({
  name: 'nas-info',
	components: {
		SettingBottom
	},
	computed: {
		...mapGetters('User', ['user', 'nasDevices']),
		...mapGetters('NasServer', ['nasInfo']),
	},
  filters: {
    filterSize (bytes) {
      return StringUtility.formatShowSize(bytes)
		},
    filterStatus (status) {
      return StringUtility.formatDiskStatus(status)
		},
		filterStorageType (data, index) {
			return StorageHandler.matchStorageName(data, index)
		}
	},
	data() {
		return {
			disks: [] as any,
			mode: 0,
			loginSetting: {
				autoLogin: false,
				autoPowerOn: false,
				closeChoice: 'tray'
			},
			loginIcons,
			detach: {
				visiable: false,
				choice: 0
			},
			isUserAdmin: false
		};
  },
	created() {
		this.fetchDisks()
		this.isUserAdmin = this.isRoleAdmin()
	},
  methods: {
		handleBottom(data) {
			switch (data) {
				case 0:
					this.handleSave(data)
					break;
				case 1:
					this.close()
					break;
				case 2:
					this.handleSave(data)
					break;
				default:
					break;
			}
		},
		close() {
			const _this = this as any
			_this.$electron.remote.getCurrentWindow().close()
		},
		handleSave (data) {
			this.mode !== -1 ? this.handleDangerousOperation('switchMode') : null
			// if (data === 0) setTimeout(() => this.close(), 3000);
		},
		handleSwitchMode () {
			NasFileAPI.switchMode(this.mode).then(response => {
				if (response.data.code !== 200) { this.$message.error('您不是管理员，无法操作设备关机') }
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleDangerousOperation (flag) {
			let message = ''
			const { dialog } = require('electron').remote
			if (flag === 'shutdown') {
				message = `关机会导致所有正在进行的任务停止，\n并且绿联云设备断开与桌面端之间的连接`
			} else if (flag === 'reboot') {
				message = `重启会导致所有正在进行的任务停止，\n并且绿联云设备断开与桌面端之间的连接，\n直到绿联云设备重启成功！`
			} else if (flag === 'factory') {
				message = `1、恢复出厂设置将会清除所有用户信息与缓存数据，并重新同步数据。\n2、操作并不会删除您硬盘里面的文件。\n3、恢复出厂过程可能会比较长，请耐心等待！`
			} else if (flag === 'update') {
				message = `确定升级？`
			} else if (flag === 'switchMode') {
				message = `切换工作模式，需要对硬盘格式化\n因此耗时比较长（一般需要半分钟到一分钟）`
			} else if (flag === 'delete') {
				if (this.isUserAdmin) {
					this.detach.visiable = true
					return
				} else {
					message = `确定删除设备？`
				}
			}
			setTimeout(() => {
				dialog.showMessageBox({
					type: 'info',
					message,
					buttons: ['确定', '取消'],
					cancelId: 1
				}).then(result => {
					if (result.response === 0) {
						if (flag === 'shutdown') {
							this.handleShutdown()
						} else if (flag === 'reboot') {
							this.handleReboot()
						} else if (flag === 'factory') {
							this.handleFactory()
						} else if (flag === 'update') {
							this.fetchUpdateInfo()
						} else if (flag === 'switchMode') {
							this.handleSwitchMode()
						} else if (flag === 'delete') {
							this.handleCommonDelete()
						}
					}
				}).catch(error => console.log(error))
			}, 100);
		},
		handleShutdown () {
			NasFileAPI.shutdown().then(response => {
				if (response.data.code !== 200) { this.$message.error('您不是管理员，无法操作设备关机') }
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleReboot () {
			NasFileAPI.reboot().then(response => {
				if (response.data.code !== 200) { this.$message.error('您不是管理员，无法操作设备重启') }
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleFactory () {
			NasFileAPI.factory().then(response => {
				if (response.data.code !== 200) { this.$message.error('您不是管理员，无法操作设备恢复出厂设置') }
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		fetchUpdateInfo () {
			NasFileAPI.fetchRomInfo().then(response => {
				if (response.data.code !== 200) {
					this.$message.error('您不是管理员，没权限操作固件更新')
					return
				}
				this.handleUpdate()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleUpdate () {
			NasFileAPI.fetchRomUpgrade().then(response => {
				if (response.data.code !== 200) return
				console.log(response);
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleCommonDelete () {
			ClientAPI.commonDetach().then(response => {
				if (response.data.code !== 200) return
				console.log(response);
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleAdminDelete () {
			ClientAPI.adminDetach(this.detach.choice).then(response => {
				if (response.data.code !== 200) return
				console.log(response);
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
    fetchDisks () {
      NasFileAPI.fetchDisks().then(response => {
        if (response.data.code !== 200) return
				this.disks = _.get(response.data.data, 'disks')
				this.mode = _.get(response.data.data, 'mode')
				console.log(JSON.parse(JSON.stringify(this.disks)));
				console.log(this.mode);
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
    isRoleAdmin () {
			const curNas = this.nasInfo as NasInfo
			const boundDevices = this.nasDevices as DeviceInfo[]
			const curUser = this.user as User
      for (let index = 0; index < boundDevices.length; index++) {
				const item = boundDevices[index]
        if (curNas.sn === item.sn && item.uno === curUser.ugreenNo && item.role === DeviceRole.admin) return true
      }
      return false
    }
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
			color: #06B650;
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
			.side {
				flex: 1;
				display: flex;
				flex-flow: column;
				text-align: left;
				padding: 10px;
				font { color: #06B650; }
				img {
					width: 60px;
					height: 60px;
					margin: 0px;
				}
			}
			button { margin: 30px 10px 0 0; }
		}
	}
}

</style>
