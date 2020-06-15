<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content" >
			<p class="cd-setting-title">存储模式</p>
			<p class="cd-setting-title">
				<a-radio-group v-model="mode">
					<a-radio :value="0">双盘备份模式</a-radio>
					<a-radio :value="1">普通存储模式</a-radio>
				</a-radio-group>
			</p>
		</div>
		<SettingBottom @callback="handleBottom" />
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
import StringUtility from '@/utils/StringUtility'
import { DeviceRole } from '@/api/UserModel'

export default Vue.extend({
  name: 'nas-info',
	components: {
		SettingBottom
	},
	computed: {
		...mapGetters('NasServer', ['accessInfo'])
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
		this.isUserAdmin = this.accessInfo.role === DeviceRole.admin
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
			this.mode !== -1 ? this.handleOperation('detail') : null
			// if (data === 0) setTimeout(() => this.close(), 3000);
		},
		handleSwitchMode () {
			NasFileAPI.switchMode(this.mode, 1).then(response => {
				if (response.data.code !== 200) { this.$message.error('您不是管理员，无法操作设备关机') }
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleOperation (flag) {
			const { dialog } = require('electron').remote
			let message = ''
			if (flag === 'detail') {
				message = this.mode === 0 ? `双盘备份模式是将两个硬盘互作备份，即双盘raid1模式，
								单个硬盘损坏不影响数据的读取，把坏的硬盘换掉后可继
								续恢复双盘备份功能。组合之后，总容量等于2块硬盘中
								较小的容量。` : `普通硬盘存储模式，没有相互备份数据功能，如有硬盘损
								坏，那坏掉的硬盘的数据将无法读取。`
			} else if (flag === 'second') {
				message = this.mode === 0 ? `当前接入内置硬盘口的硬盘数据将会被格式化，并将两
								个硬盘组合成双盘备份模式。
								（操作开始后将不能中止）` : `当前接入内置硬盘口的硬盘数据将会被格式化，并将两个
								硬盘设置成普通硬盘模式，两块硬盘单独使用，没有备份功能。
								（操作开始后将不能中止）`
			} else if (flag === 'switchMode') {
				message = this.mode === 0 ? `当前存储模式是：双盘备份模式
								此操作将把（盘位2）进行磁盘格式化，然后自动同步盘位1
								的数据，恢复当前双盘备份功能。
								（操作开始后将不能中止）` : `当前存储模式是：普通存储模式
								此操作将把（盘位2）进行磁盘格式化，请确认备份好硬盘的
								数据再进行操作。
								（操作开始后将不能中止）`
			}
			setTimeout(() => {
				dialog.showMessageBox({
					type: 'info',
					message,
					buttons: ['确定', '取消'],
					cancelId: 1
				}).then(result => {
					if (result.response === 0) {
						if (flag === 'detail') {
							this.handleOperation('second')
						} else if (flag === 'second') {
							this.handleOperation('switchMode')
						} else if (flag === 'switchMode') {
							this.handleSwitchMode()
						}
					}
				}).catch(error => console.log(error))
			}, 100);
		},
    fetchDisks () {
      NasFileAPI.fetchDisks().then(response => {
        if (response.data.code !== 200) return
				this.mode = _.get(response.data.data, 'mode')
				console.log(this.mode);
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
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
