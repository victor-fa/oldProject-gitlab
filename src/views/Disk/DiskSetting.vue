import {app} from "electron";
<template>
	<div class="cd-setting-win">
		<div class="cd-drag-head-big">
			<a-icon type="setting" theme="twoTone" twoToneColor="#06b650" spin />
			<p style="color: #06B650">设置</p>
			<a-button icon="close" style="color: #d9d9d9" @click="close" />
			<a-button icon="minus" style="color: #d9d9d9" @click="mini" />
		</div>
		<div class="cd-setting-main">
			<SettingMenu :data="SettingMenuData" @change="changeMenu" />
			<div class="cd-setting-content">
				<div class="cd-setting-container" v-show="SettingMenuData.Account.active">
					<p class="cd-setting-info">
						<img draggable="false" style="width: 70px; height: 70px; margin: 15px 0 0 -3px;" v-if="UploadSrc" :src="UploadSrc" alt="" />
						<img draggable="false" style="width: 70px; height: 70px; margin: 15px 0 0 -3px;" v-else-if="user.image" :src="user.image" alt="" />
					</p>
					<form @submit.prevent="onSubmit" ref="form">
						<div class="cd-user-head" onclick="this.childNodes[0].click()">
							<a-input type="file" name="userhead" @change="changePhoto()" ref="file" />
						</div>
					</form>
					<p class="cd-setting-info" style="display: flex;">
						昵称：<a-input type="text" v-model="user.nicName" placeholder="请输入昵称" clearable style="width: 200px;margin-left: 13px;" />
					</p>
					<p class="cd-setting-info">
						手机号：<a-input type="text" v-model="user.phoneNo" placeholder="请输入手机号" clearable style="width: 200px;" />
					</p>
					<p class="cd-setting-info">
						<a-button @click="ChangePassword">修改密码</a-button>
					</p>
					<p class="cd-setting-title"><br></p>
				</div>
				
				<div class="cd-setting-container" v-show="SettingMenuData.Currency.active">
					<p class="cd-setting-title">登录设置</p>
					<p class="cd-setting-title">
						<a-checkbox v-model="loginSetting.autoLogin">自动登录</a-checkbox>
						<a-checkbox v-model="loginSetting.autoPowerOn">开机自启动</a-checkbox>
					</p>
					<p class="cd-setting-title">当关闭窗口时</p>
					<p class="cd-setting-title">
						<a-radio-group v-model="loginSetting.closeChoice">
							<a-radio value="tray">最小化到托盘</a-radio>
							<a-radio value="exit">退出程序</a-radio>
						</a-radio-group>
					</p>
				</div>

				<div class="cd-setting-container" v-show="SettingMenuData.User.active">
					<div style="display: flex;" v-for="(item, index) in [1, 2, 3, 4]" :key="index">
						<img style="width: 25px; height: 30px; margin: 15px 0 0 10px;" :src="loginIcons.account">
						<div style="flex: 1; display: flex; flex-flow: column; text-align: left; padding: 10px;">
							<span>管理员</span>
							<span>2020-02-03 12:34:56</span>
						</div>
						<span style="margin: 20px 10px 0 0;">在线</span>
						<img style="width: 10px; height: 14px; margin: 23px 10px 0px 0px;" :src="loginIcons.open">
					</div>
				</div>
				
				<div class="cd-setting-container" v-show="SettingMenuData.Device.active">
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
				</div>
				
				<div class="cd-setting-container" v-show="SettingMenuData.LocalAccount.active">
					<p class="cd-setting-title">用户离线设置</p>
					<p class="cd-setting-title"><a-switch v-model="offlinePass.isUsed" defaultChecked @change="onOfflineChange"/></p>
					<template v-if="offlinePass.isUsed">
						<p class="cd-setting-sec-title">{{offlinePass.already_set ? '修改' : '添加'}}账号密码</p>
						<div class="cd-setting-form">
							<a-input v-if="!offlinePass.already_set" type="text" v-model="offlinePass.offline_username" placeholder="离线账号" clearable style="width: 100%;margin-bottom: 10px;" />
							<p v-if="offlinePass.already_set" class="cd-setting-info">当前离线账号：{{ offlinePass.offline_username }}</p>
							<a-input v-if="!offlinePass.already_set" type="password" v-model="offlinePass.offline_password" placeholder="离线密码" clearable style="width: 100%;margin-bottom: 10px;" />
							<a-button v-if="offlinePass.already_set" @click="showModifyOffline">修改密码</a-button>
							<a-button v-if="!offlinePass.already_set" @click="setOfflineAccount">保存</a-button>
						</div>
						<p class="cd-setting-title"><br></p>
					</template>
					<p class="cd-setting-title"><br></p>
				</div>
				
				<SettingBottom v-if="!SettingMenuData.User.active" @callback="handleBottom" />
			</div>
		</div>
		<a-modal
			:visible="codePhoneVisiable" :mask="false" :closable="false" :maskClosable="false" width="300px"
			okText="确定" cancelText="取消" @ok="changePhone" @cancel="codePhoneVisiable = false">
			<p>验证码：</p><a-input placeholder="请输入验证码" v-model="changePhoneData.code" />
		</a-modal>
		<a-modal
			:title="'修改密码'"
			:visible="offlinePass.offline_modify_visiable" :mask="false" :closable="false" :maskClosable="false" width="350px" style="top: 50px;" 
			okText="确定" cancelText="取消" @ok="modifyOfflineAccount" @cancel="offlinePass.offline_modify_visiable = false">
			<div style="display: flex;justify-content: space-between;margin-bottom: 15px;">
				<p>离线密码(旧)：</p>
				<a-input type="password" placeholder="请输入旧离线密码" v-model="offlinePass.offline_password" style="flex: 1;" />
			</div>
			<div style="display: flex;justify-content: space-between;">
				<p>离线密码(新)：</p>
				<a-input type="password" placeholder="请输入新离线密码" v-model="offlinePass.offline_password_new" style="flex: 1;" />
			</div>
		</a-modal>
	</div>
</template>

<script>
import _ from 'lodash'
import SettingMenu from '../../components/Disk/SettingMenu.vue'
import SettingBottom from '../../components/Disk/SettingBottom.vue'
import UserAPI from '@/api/UserAPI'
import NasFileAPI from '@/api/NasFileAPI'
import StringUtility from '../../utils/StringUtility'
import { loginIcons } from '../../views/Login/iconList'
import { mapGetters } from 'vuex'
import StorageHandler from '../Storage/StorageHandler'
import processCenter, { EventName } from '../../utils/processCenter'
import { USER_MODEL } from '../../common/constants'

export default {
	name: 'DiskSetting',
	components: {
		SettingMenu,
		SettingBottom
	},
	watch: {
		settingData: {
			handler() {
				this.$ipc.send('system', 'auto-launch', this.settingData.AutoStartFlag);
			},
			deep: true
		}
	},
	computed: {
		...mapGetters('User', ['user']),
		...mapGetters('NasServer', ['nasInfo']),
		...mapGetters('Setting', ['closeInfo']),
	},
	data() {
		return {
      loginIcons,
			SettingMenuData: {
				Account: { active: 'active', name: '我的账号' },
				Currency: { active: '', name: '通用设置' },
				User: { active: '', name: '用户管理' },
				Device: { active: '', name: '设备信息' },
				LocalAccount: { active: '', name: '本地账号' },
			},
			loginSetting: {
				autoLogin: false,
				autoPowerOn: false,
				closeChoice: 'tray'
			},
			offlinePass: {
				isUsed: false,
				offline_username: '',
				offline_password: '',
				offline_password_new: '',
				offline_modify_visiable: false,
				already_set: false
			},
			changePhoneData: {
				phone: '',
				code: ''
			},
			settingData: {
				Phone: '',
			},
			loading: '',
			codeVisiable: false,
			codePhoneVisiable: false,
			storages: [],
			UploadSrc: false
		};
	},
	created() {
		console.log(JSON.parse(JSON.stringify(this.user)));
		this.settingData.Phone = this.user.phoneNo
	},
	methods: {
		changeMenu(item, index) {
			if (item.name === '本地账号') {
				this.getOfflineName()
			} else if (item.name === '设备信息') {
				this.fetchStorages()
			} else if (item.name === '通用设置') {
				this.loginSetting.closeChoice = this.closeInfo.trayOrExit
			}
			for (let i in this.SettingMenuData) {
				this.SettingMenuData[i].active = '';
			}
			this.SettingMenuData[index].active = 'active';
		},
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
		handleSave (data) {
			if (this.SettingMenuData.Account.active) {
				const input = { nicName: this.user.nicName ? this.user.nicName : '' }
				const userJson = localStorage.getItem(USER_MODEL)
				if (userJson === null) return
				const userObj = JSON.parse(userJson)
				if (this.user.nicName !== userObj.nicName) this.handleNickname()
				if (this.user.phoneNo !== userObj.phoneNo) {
					this.changePhoneData.phone = this.user.phoneNo
					this.getPhoneCode()
				}
			} else if (this.SettingMenuData.Currency.active) {
				this.handleCloseChoice()
			} else if (this.SettingMenuData.Device.active) {
				
			} else if (this.SettingMenuData.LocalAccount.active) {

			}
			// if (data === 0) setTimeout(() => this.close(), 3000);
		},
		ChangePassword() {
			this.$ipc.send('system', 'forget-pass');
		},
		getPhoneCode () {
			if (!this.changePhoneData.phone.length) {
				this.$message.warning('请输入新的手机号');
				return;
			}
			if (this.changePhoneData.phone && !(/^1[3456789]\d{9}$/.test(this.changePhoneData.phone))) {
				this.$message.error('请输入正确的手机号');
				return;
			}
			UserAPI.smsCode(this.changePhoneData.phone, 5).then(response => {
				if (response.data.code !== 200) return
				this.codePhoneVisiable = true
        this.$message.success('短信验证码已发送到手机')
      }).catch(error => {
				this.loading = false;
        console.log(error)
        this.$message.error('网络连接错误,请检测网络')
      })
		},
		changePhone() {
			if (this.loading) {
				this.$message.warning('正在进行其他操作，请等待');
				return;
			}
			if (!this.changePhoneData.code.length) {
				this.$message.warning('请输入短信验证码');
				return;
			}
			const input = { phoneNo: this.changePhoneData.phone, code: this.changePhoneData.code }
			UserAPI.updateInfo(input).then(response => {
				if (response.data.code !== 200) return
				this.codePhoneVisiable = false;
				this.changePhoneData.phone = '';
				this.$store.dispatch('User/updateUser', response.data.data.userVO)
				this.settingData.Phone = response.data.data.userVO.phoneNo
        this.$message.success('修改手机号成功')
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误,请检测网络')
      }).finally(() => {
				this.changePhoneData.code = ''
			})
		},
		close() { this.$electron.remote.getCurrentWindow().close() },
		mini() { this.$electron.remote.getCurrentWindow().minimize() },
		getOfflineName () {
			NasFileAPI.getOfflineName().then(response => {
				if (response.data.code !== 200) return
				if (response.data.data.offline_username !== '') {
					this.offlinePass.isUsed = true
					this.offlinePass.already_set = true
					this.offlinePass.offline_username = response.data.data.offline_username
				} else {
					this.offlinePass.isUsed = false
					this.offlinePass.already_set = false
				}
			}).catch(error => {
				console.log(error)
				this.$message.error('网络连接错误,请检测网络')
			})
		},
		onOfflineChange(e) {
			const _this = this
			if (!this.offlinePass.isUsed && this.offlinePass.already_set) {
				this.offlinePass.isUsed = true
				this.$confirm({
					title: '删除',
					content: '是否删除离线账号？',
					okText: '删除',
					okType: 'danger',
					cancelText: '取消',
					onOk() {
						NasFileAPI.deleteOfflineAccount().then(response => {
							if (response.data.code !== 200) return
							_this.$message.success('离线账号删除成功')
							_this.getOfflineName()
						}).catch(error => {
							console.log(error)
							_this.$message.error('网络连接错误,请检测网络')
						})
					}
				});
			} else {
				this.offlinePass.offline_username = ''
				this.offlinePass.offline_password = ''
			}
		},
		setOfflineAccount () {
			if (!this.offlinePass.offline_username.length) {
				this.$message.warning('请输入离线账号');
				return
			}
			if (!this.offlinePass.offline_password.length) {
				this.$message.warning('请输入离线密码');
				return
			}
			const input = {
				offline_username: this.offlinePass.offline_username,
				offline_password: StringUtility.encryptPassword(this.offlinePass.offline_password)
			}
			NasFileAPI.setOfflineAccount(input).then(response => {
				if (response.data.code !== 200) return
				this.$message.success('添加离线账号成功')
				this.offlinePass.offline_password = ''
				this.getOfflineName()
			}).catch(error => {
				console.log(error)
				this.$message.error('网络连接错误,请检测网络')
			})
		},
		showModifyOffline () {
			this.offlinePass.offline_password = ''
			this.offlinePass.offline_password_new = ''
			this.offlinePass.offline_modify_visiable = true
		},
		modifyOfflineAccount () {
			const input = {
				offline_password: StringUtility.encryptPassword(this.offlinePass.offline_password),
				offline_password_new: StringUtility.encryptPassword(this.offlinePass.offline_password_new)
			}
			NasFileAPI.modifyOfflineAccount(input).then(response => {
				if (response.data.code !== 200) return
				this.offlinePass.offline_password = ''
				this.offlinePass.offline_password_new = ''
				this.offlinePass.offline_modify_visiable = false
				this.$message.success('修改离线密码成功')
				this.getOfflineName()
			}).catch(error => {
				console.log(error)
				this.$message.error('网络连接错误,请检测网络')
			})
		},
		handleCloseChoice () {
			const input = {
				'remember': this.loginSetting.closeChoice ? true : false,
				'trayOrExit': this.loginSetting.closeChoice
			}
			this.$store.dispatch('Setting/updateCloseChoiceInfo', input)
			this.$message.success('修改成功')
		},
    fetchStorages () {
      this.loading = true
      NasFileAPI.fetchStorages().then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        const storages = _.get(response.data.data, 'storages')
				this.storages = StorageHandler.formatStorages(storages)
				console.log(JSON.parse(JSON.stringify(this.storages)));
      }).catch(error => {
        this.loading = false
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
								this.$message.error(
									`您不是管理员，无法操作设备${flag === 'shutdown' ? '关机' : flag === 'reboot' ? '重启' : '恢复出厂设置'}`
								)
							}
						}).catch(error => {
							this.$message.error('网络连接错误，请检测网络')
							console.log(error)
						})
					}
				}).catch(error => reject(error))
			}, 100);
		},
		changePhoto () {
			this.UploadSrc = false;
			let elm = event.target;
			let user_pic = elm.value;
			if (user_pic.length > 1 && user_pic) {
				let type = StringUtility.formatSuffix(user_pic).toLowerCase();
				if (['png', 'jpg', 'jpeg', 'bmp', 'gif'].indexOf(type) === -1) {
					return this.$message.error('所选格式为' + type + ' 请重新选择上传的文件');
				}
				elm.files && elm.files[0] ? (this.UploadSrc = window.URL.createObjectURL(elm.files[0])) : '';
				this.loading = true;
				UserAPI.uploadPhoto(elm.files[0]).then(response => {
					this.loading = false;
					if (response.data.code !== 200) return
					this.user.image = response.data.data.imageUrl
					this.$message.success('修改头像成功')
					processCenter.renderSend(EventName.account);
					this.$store.dispatch('User/updateUser', this.user)
				}).catch(error => {
					this.loading = false;
					console.log(error)
					this.$message.error('网络连接错误,请检测网络')
				})
			}
		},
		handleNickname() {
			const input = { nicName: this.user.nicName ? this.user.nicName : '' }
			UserAPI.updateInfo(input).then(response => {
				if (response.data.code !== 200) return
				this.$store.dispatch('User/updateUser', response.data.data.userVO)
				this.user = response.data.data.userVO
				processCenter.renderSend(EventName.account);
        this.$message.success('修改成功')
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误,请检测网络')
      })
		},
	}
};
</script>

<style scoped>
p {
	color: #000;
	text-align: left;
}
/*头部*/
.cd-drag-head-big{
	width: 100%;
	height: 50px;
	background-size: auto;
	background-position: -160px 58px;
	background-repeat: repeat-y;
	-webkit-app-region: drag;
	border-bottom: 1px solid #eee;
}
.cd-drag-head-big *{
	float: left;
}
.cd-drag-head-big i{
	float: left;
	font-size: 30px;
	color: #fff;
	line-height: 55px;
	margin: 0 15px;
	margin-right: 10px;
}
.cd-drag-head-big p{
	font-size: 14px;
	line-height: 50px;
	color: #fff;
}
.cd-drag-head-big .sf-icon-minus{
	font-size: 12px;
}
.cd-drag-head-big button{
	float: right;
	width: 30px;
	height: 30px;
	line-height: 30px;
	font-size: 15px;
	-webkit-app-region: no-drag;
	background: none;
	color: #fff;
	margin: 9px 6px 9px 0;
	border-radius:5px;
}
.cd-drag-head-big button:hover{
	background: rgba(255,255,255,.1);
}

/*设置窗口*/
.cd-setting-win {
	width: 100%;
	height: 100%;
	background: #fff;
}
.cd-setting-main {
	width: 100%;
	height: calc(100% - 90px);
	padding: 10px;
	display: inline-flex;
	margin-top: -15px;
}
.cd-setting-content {
	width: calc(100% - 100px);
	height: 100%;
	border: 1px solid #eee;
	padding-left: 20px;
	float: left;
	overflow-y: scroll;
}
.cd-setting-container {
	width: 100%;
	height: 100%;
}
.cd-setting-title {
	width: 100%;
	font-size: 16px;
	line-height: 35px;
	margin-bottom: 10px;
	color: #06B650;
}
.cd-purple-button {
	margin-right: 10px;
}
.cd-setting-sec-title {
	width: 100%;
	font-size: 14px;
	border-left: 2px solid #06B650;
	text-indent: 5px;
	margin: 5px 0;
}
.ivu-input-number,
.ivu-input-number-input,
.ivu-input-number-input-wrap {
	overflow: hidden !important;
}
.cd-setting-info {
	width: 100%;
	font-size: 14px;
	padding-left: 5px;
	line-height: 30px;
	color: #000;
}
.cd-setting-info span {
	background: #06B650;
	color: #fff;
	border-radius: 5px;
	padding: 3px 5px;
	font-size: 12px;
	margin-left: 10px;
}
.cd-setting-info button {
	background: none;
	font-size: 14px;
	margin-right: 10px;
}
.cd-setting-form {
	margin: 8px 0;
	width: 230px;
	text-align: left;
}
.cd-setting-form .ivu-input-wrapper,
.cd-setting-form .ivu-input-number {
	margin: 5px 0;
}
.cd-setting-form button {
	float: right;
	margin-top: 10px;
}

.cd-user-head {
	width: 70px;
	height: 70px;
	position: absolute;
	left: 133px;
	top: 75px;
	overflow: unset;
	transition: all 0.35s;
}
.cd-user-head:hover {
	box-shadow: 0 0 29px -2px #ffffff;
	cursor: pointer;
	transition: all 0.35s;
}
.cd-user-head input {
	position: absolute;
	top: -50px;
	left: -11px;
	display: none;
}
</style>
