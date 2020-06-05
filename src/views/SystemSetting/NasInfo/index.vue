<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content">
			<p class="cd-setting-title">设备信息</p>
			<p class="cd-setting-info">序列号：{{nasInfo.sn}}</p>
			<p class="cd-setting-info">固件版本：{{nasInfo.softversion}}</p>
			<p class="cd-setting-info">IP地址：{{nasInfo.ip}}</p>
			<p class="cd-setting-info">MAC地址：{{nasInfo.mac}}</p>
			<p class="cd-setting-title">磁盘信息</p>
			<div style="display: flex;" v-for="(item, index) in storages" :key="index">
				<div style="flex: 1; display: flex; flex-flow: column; text-align: left; padding: 10px;">
					<span>盘位{{index}}   <font style="color: #06B650;">正常</font></span>
					<img style="width: 60px; height: 60px; margin: 0px;" :src="loginIcons.disk">
				</div>
				<div style="flex: 1; display: flex; flex-flow: column; text-align: left; padding: 10px;">
					<span>disk_a</span>
					<span>{{item.showName}}</span>
					<span>容量 {{item.showSizeSimple}}</span>
					<span>已使用 {{item.showUsed}}</span>
				</div>
				<a-button style="margin: 30px 10px 0 0;">格式化</a-button>
			</div>
			<p class="cd-setting-title">存储模式</p>
			<p class="cd-setting-title">
				<a-radio-group v-model="loginSetting.closeChoice">
					<a-radio value="tray">双盘备份模式</a-radio>
					<a-radio value="exit">普通存储模式</a-radio>
				</a-radio-group>
			</p>
			<p class="cd-setting-title">
				<a-button class="cd-purple-button" @click="handleDangerousOperation('shutdown')">关机</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('reboot')">重启</a-button>
				<a-button class="cd-purple-button" @click="handleDangerousOperation('factory')">恢复出厂设置</a-button>
			</p>
			<p class="cd-setting-title"><br></p>
			<SettingBottom @callback="handleBottom" />
		</div>
	</div>
</template>

<script lang="ts">
import _ from 'lodash'
import { mapGetters } from 'vuex'
import SettingBottom from '../../../components/Disk/SettingBottom.vue'
import { USER_MODEL } from '../../../common/constants'
import { loginIcons } from '../../../views/Login/iconList'
import NasFileAPI from '@/api/NasFileAPI'
import StorageHandler from '../../Storage/StorageHandler'

export default {
  name: 'nas-info',
	components: {
		SettingBottom
	},
	computed: {
		...mapGetters('User', ['user']),
		...mapGetters('NasServer', ['nasInfo']),
	},
	data() {
		return {
			loading: '',
			storages: [],
			loginSetting: {
				autoLogin: false,
				autoPowerOn: false,
				closeChoice: 'tray'
			},
      loginIcons,
		};
  },
	created() {
		const _this = this as any
		_this.fetchStorages()
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
			const _this = this as any
			const input = { nicName: _this.user.nicName ? _this.user.nicName : '' }
			const userJson = localStorage.getItem(USER_MODEL)
			if (userJson === null) return
			const userObj = JSON.parse(userJson)
			if (_this.user.nicName !== userObj.nicName) _this.handleNickname()
			if (_this.user.phoneNo !== userObj.phoneNo) {
				_this.changePhoneData.phone = _this.user.phoneNo
				_this.getPhoneCode()
			}
			// if (data === 0) setTimeout(() => _this.close(), 3000);
		},
		handleDangerousOperation (flag) {
			const _this = this as any
			let message = ''
			const { dialog } = require('electron').remote
			if (flag === 'shutdown') {
				message = `关机会导致所有正在进行的任务停止，\n并且绿联云设备断开与桌面端之间的连接`
			} else if (flag === 'reboot') {
				message = `重启会导致所有正在进行的任务停止，\n并且绿联云设备断开与桌面端之间的连接，\n直到绿联云设备重启成功！`
			} else if (flag === 'factory') {
				message = `1、恢复出厂设置将会清除所有用户信息与缓存数据，并重新同步数据。\n2、操作并不会删除您硬盘里面的文件。\n3、恢复出厂过程可能会比较长，请耐心等待！`
			}
			setTimeout(() => {
				dialog.showMessageBox({
					type: 'info',
					message,
					buttons: ['确定', '取消'],
					cancelId: 1
				}).then(result => {
					if (result.response === 0) {
						NasFileAPI.shutdown().then(response => {
							if (response.data.code !== 200) {
								_this.$message.error(
									`您不是管理员，无法操作设备${flag === 'shutdown' ? '关机' : flag === 'reboot' ? '重启' : '恢复出厂设置'}`
								)
							}
						}).catch(error => {
							_this.$message.error('网络连接错误，请检测网络')
							console.log(error)
						})
					}
				}).catch(error => console.log(error))
			}, 100);
		},
    fetchStorages () {
			const _this = this as any
      _this.loading = true
      NasFileAPI.fetchStorages().then(response => {
        _this.loading = false
        if (response.data.code !== 200) return
        const storages = _.get(response.data.data, 'storages')
				_this.storages = StorageHandler.formatStorages(storages)
				console.log(JSON.parse(JSON.stringify(_this.storages)));
      }).catch(error => {
        _this.loading = false
        _this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
  }
}
</script>

<style lang="less" scoped>
p {
	color: #000;
	text-align: left;
}

.cd-setting-main {
	width: 100%;
	height: 86%;
	padding: 10px;
	display: inline-flex;
	.cd-setting-content {
		width: calc(100%);
		height: 100%;
		border: 1px solid #eee;
		padding: 20px;
		float: left;
		overflow-y: scroll;
		.cd-setting-title {
			width: 100%;
			font-size: 16px;
			line-height: 35px;
			margin-bottom: 10px;
			color: #06B650;
			.cd-purple-button {
				margin-right: 10px;
			}
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
	}
}

</style>
