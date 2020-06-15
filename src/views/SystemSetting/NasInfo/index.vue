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
					<a-button v-show="isUserAdmin" @click="handleInitialize(item)" style="">初始化</a-button>
					<!-- 管理员可以进行格式化 -->
				</template>
			</div>
			<p class="cd-setting-title">
				<a-button class="cd-purple-button" @click="handleDangerousOperation('shutdown')" v-show="isUserAdmin">关机</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('reboot')" v-show="isUserAdmin">重启</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('factory')" v-show="isUserAdmin">恢复出厂设置</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('update')" v-show="isUserAdmin">固件升级</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('delete')">删除设备</a-button>
			</p>
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
		<a-modal
			:visible="update.visiable" :mask="false" :closable="false" :maskClosable="false" width="300px"
			okText="确认升级" cancelText="取消升级" @ok="handleUpdate" @cancel="update.visiable = false">
			<p>{{update.info}}</p>
			
		</a-modal>
		<a-modal
			:visible="mode.visiable" :mask="false" :closable="false" :maskClosable="false" width="300px"
			okText="确定" cancelText="取消" @ok="handleInitialize(null)" @cancel="mode.visiable = false;mode.choice = 0">
			<p>请选择存储模式</p>
			<a-radio-group v-model="mode.choice">
				<a-radio :value="0">双盘备份模式</a-radio>
				<a-radio :value="1">普通存储模式</a-radio>
			</a-radio-group>
		</a-modal>
	</div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { USER_MODEL } from '@/common/constants'
import { loginIcons } from '@/views/Login/iconList'
import NasFileAPI from '@/api/NasFileAPI'
import UserAPI from '@/api/UserAPI'
import { NasInfo } from '@/api/ClientModel'
import StorageHandler from '../../Storage/StorageHandler'
import ClientAPI from '@/api/ClientAPI'
import StringUtility from '@/utils/StringUtility'
import processCenter, { EventName } from '@/utils/processCenter'
import { clearQueueCache } from '@/api/Transport/TransportQueue'
import { DeviceRole } from '@/api/UserModel'

export default Vue.extend({
  name: 'nas-info',
	computed: {
		...mapGetters('NasServer', ['nasInfo', 'accessInfo']),
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
			update: {
				visiable: false,
				info: null as any
			},
			mode: {
				visiable: false,
				choice: 0
			},
			isUserAdmin: false,
			diskMode: 0
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
			const { dialog } = require('electron').remote
			if (flag === 'shutdown') {
				message = `关机会导致所有正在进行的任务停止，\n并且绿联云设备断开与桌面端之间的连接`
			} else if (flag === 'reboot') {
				message = `重启会导致所有正在进行的任务停止，\n并且绿联云设备断开与桌面端之间的连接，\n直到绿联云设备重启成功！`
			} else if (flag === 'factory') {
				message = `1、恢复出厂设置将会清除所有用户信息与缓存数据，并重新同步数据。\n2、操作并不会删除您硬盘里面的文件。\n3、恢复出厂过程可能会比较长，请耐心等待！`
			} else if (flag === 'update') {
				this.fetchUpdateInfo()
				return
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
						} else if (flag === 'delete') {
							this.handleCommonDelete()
						}
					}
				}).catch(error => console.log(error))
			}, 100);
		},
		handleShutdown () {
			NasFileAPI.shutdown().then(response => {
				if (response.data.code !== 200) { this.$message.error('网络连接错误，请检测网络') }
				this.switchDevice()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleReboot () {
			NasFileAPI.reboot().then(response => {
				if (response.data.code !== 200) { this.$message.error('网络连接错误，请检测网络') }
				this.switchDevice()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleFactory () {
			NasFileAPI.factory().then(response => {
				if (response.data.code !== 200) { this.$message.error('网络连接错误，请检测网络') }
				this.switchDevice()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		fetchUpdateInfo () {
			NasFileAPI.fetchRomInfo().then(response => {
				if (response.data.code !== 200) {
					this.$message.error('网络连接错误，请检测网络')
					return
				}
				if (!response.data.data) {
					this.$message.info('当前版本已最新')
					return
				}
				this.update.visiable = true
				this.update.info = response.data.data
				console.log(this.update.info);
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
		handleAdminDelete () {
			ClientAPI.adminDetach(this.detach.choice).then(response => {
				if (response.data.code !== 200) return
				this.switchDevice()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		switchDevice () {
			this.$store.dispatch('NasServer/clearCacheNas')
			clearQueueCache()
			processCenter.renderSend(EventName.bindList)
		},
    fetchDisks () {
      NasFileAPI.fetchDisks().then(response => {
        if (response.data.code !== 200) return
				this.disks = _.get(response.data.data, 'disks')
				console.log(JSON.parse(JSON.stringify(this.disks)));
				this.diskMode = _.get(response.data.data, 'mode')
				console.log(this.diskMode);
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
		handleInitialize (item) {
			if (this.mode.visiable) {	// 已有弹框，选择后切换
				this.handleOperation('detail', this.mode.choice)
				return
			}
			if (this.diskMode === -1) {	// 打开弹框
				this.mode.visiable = true
				return
			}
			this.handleOperation('detail', item.raidMode)	// 按原先的默认模式处理
		},
		switchMode(mode) {
			NasFileAPI.switchMode(mode, 0).then(response => {
				if (response.data.code !== 200) { this.$message.error('网络连接错误，请检测网络') }
				this.mode = {
					visiable: false,
					choice: 0
				}
				this.switchDevice()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleOperation (flag, data) {
			const { dialog } = require('electron').remote
			let message = ''
			if (flag === 'detail') {
				message = data === 0 ? `双盘备份模式是将两个硬盘互作备份，即双盘raid1模式，
								单个硬盘损坏不影响数据的读取，把坏的硬盘换掉后可继
								续恢复双盘备份功能。组合之后，总容量等于2块硬盘中
								较小的容量。` : `普通硬盘存储模式，没有相互备份数据功能，如有硬盘损
								坏，那坏掉的硬盘的数据将无法读取。`
			} else if (flag === 'second') {
				message = data === 0 ? `当前接入内置硬盘口的硬盘数据将会被格式化，并将两
								个硬盘组合成双盘备份模式。
								（操作开始后将不能中止）` : `当前接入内置硬盘口的硬盘数据将会被格式化，并将两个
								硬盘设置成普通硬盘模式，两块硬盘单独使用，没有备份功能。
								（操作开始后将不能中止）`
			} else if (flag === 'switchMode') {
				message = data === 0 ? `当前存储模式是：双盘备份模式
								此操作将把（盘位2）进行磁盘格式化，然后自动同步盘位1
								的数据，恢复当前双盘备份功能。
								（操作开始后将不能中止）` : `当前存储模式是：普通存储模式
								此操作将把（盘位2）进行磁盘格式化，请确认备份好硬盘的
								数据再进行操作。
								（操作开始后将不能中止）`
			}
			dialog.showMessageBox({
				type: 'info', message, buttons: ['确定', '取消'], cancelId: 1
			}).then(result => {
				if (result.response === 0) {
					if (flag === 'detail') {
						this.handleOperation('second', data)
					} else if (flag === 'second') {
						this.handleOperation('switchMode', data)
					} else if (flag === 'switchMode') {
						this.switchMode(data)
					}
				}
			}).catch(error => console.log(error))
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

