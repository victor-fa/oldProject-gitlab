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
			<SettingMenu :data="SettingMenuData" @change="change" />
			<div class="cd-setting-content">
				<div class="cd-setting-container" v-show="SettingMenuData.Account.active">
					<p class="cd-setting-title">用户设置</p>
					<!-- <p class="cd-setting-sec-title">账号当前状态</p>
					<p class="cd-setting-info">最近登录时间：{{ LoginTime }}<Time :time="LoginTime" :interval="1" /></p> -->
					<p class="cd-setting-sec-title">修改账号密码</p>
					<div class="cd-setting-form">
						<a-input type="password" v-model="ChangePass.oldpass" placeholder="当前密码" clearable style="width: 100%;margin-bottom: 10px;" />
						<a-input type="password" v-model="ChangePass.newpass" placeholder="新密码" clearable style="width: 100%;margin-bottom: 10px;" />
						<a-input type="password" v-model="ChangePass.againPass" placeholder="再次输入密码" clearable style="width: 100%;margin-bottom: 10px;" />
						<a-button class="cd-purple-button" @click="ChangePassword">修改</a-button>
					</div>
					<p class="cd-setting-title"><br></p>
					<p class="cd-setting-title">用户离线设置</p>
					<p class="cd-setting-title"><a-switch v-model="offlinePass.isUsed" defaultChecked @change="onOfflineChange"/></p>
					<template v-if="offlinePass.isUsed">
						<p class="cd-setting-sec-title">{{offlinePass.already_set ? '修改' : '添加'}}账号密码</p>
						<div class="cd-setting-form">
							<a-input v-if="!offlinePass.already_set" type="text" v-model="offlinePass.offline_username" placeholder="离线账号" clearable style="width: 100%;margin-bottom: 10px;" />
							<p v-if="offlinePass.already_set" class="cd-setting-info">当前离线账号：{{ offlinePass.offline_username }}</p>
							<a-input v-if="!offlinePass.already_set" type="password" v-model="offlinePass.offline_password" placeholder="离线密码" clearable style="width: 100%;margin-bottom: 10px;" />
							<a-button v-if="offlinePass.already_set" class="cd-purple-button" @click="showModifyOffline">修改密码</a-button>
							<a-button v-if="!offlinePass.already_set" class="cd-purple-button" @click="setOfflineAccount">保存</a-button>
						</div>
						<p class="cd-setting-title"><br></p>
					</template>
					<p class="cd-setting-title"><br></p>
				</div>
				<div class="cd-setting-container" v-show="SettingMenuData.System.active">
					<p class="cd-setting-title">系统设置</p>
					<p class="cd-setting-sec-title">开机自启动</p>
					<div class="cd-setting-form">
						<a-checkbox v-model="SettingData.AutoStartFlag">系统启动后自动运行CloudDisk</a-checkbox>
					</div>
					<!-- <p class="cd-setting-sec-title">自动登录</p>
					<div class="cd-setting-form" style="width: 100%;text-align: left;">
						<a-checkbox v-model="SettingData.AutoLogin">打开CloudDisk后自动登录(需勾选记住密码)</a-checkbox>
					</div> -->
				</div>
				<div class="cd-setting-container" v-show="SettingMenuData.Safety.active">
					<p class="cd-setting-title">绑定设置</p>
					<p class="cd-setting-sec-title">修改安全邮箱</p>
					<p class="cd-setting-info">当前绑定邮箱：{{ SettingData.Email }}<a-button @click="OpenChangeEmailDialog">修改</a-button></p>
				</div>
				<div class="cd-setting-container" v-show="SettingMenuData.Trans.active">
					<p class="cd-setting-title">传输设置</p>
					<p class="cd-setting-sec-title">下载目录设置</p>
					<div class="cd-setting-info">
						当前目录：{{ SettingData.TransDownFolder }}
						<a-button @click="ChangeTransAddress">修改</a-button>
					</div>
					<!-- <p class="cd-setting-sec-title">同时上传数</p>
					<div class="cd-setting-form">
						<a-input-number :min="1" :max="5" v-model="SettingData.MaxUpTrans" />
					</div>
					<p class="cd-setting-sec-title">同时下载数</p>
					<div class="cd-setting-form" style="margin-bottom: 0">
						<a-input-number :min="1" :max="5" v-model="SettingData.MaxDownTrans" />
					</div> -->
					<p class="cd-setting-tips">*请不要在正在下载文件的情况下修改下载目录</p>
					<p class="cd-setting-tips">*修改目录在下次登录生效</p>
				</div>
				<div class="cd-setting-container" v-show="SettingMenuData.Notice.active">
					<p class="cd-setting-title">提醒设置</p>
					<p class="cd-setting-sec-title">弹窗提醒</p>
					<div class="cd-setting-form">
						<a-checkbox v-model="SettingData.NoticeBubble">传输完成后气泡提示</a-checkbox>
					</div>
					<!-- <p class="cd-setting-sec-title">声音提醒</p>
					<div class="cd-setting-form" style="width: 100%">
						<a-checkbox v-model="SettingData.NoticeFlag">传输完成后声音提醒</a-checkbox>
						<div class="cd-setting-form" style="width: 100%">
							<a-radio-group @change="VoiceChange" v-model="SettingData.NoticeVoice">
								<a-radio :value="1" :disabled="!SettingData.NoticeFlag">音效一</a-radio>
								<a-radio :value="2" :disabled="!SettingData.NoticeFlag">音效二</a-radio>
								<a-radio :value="3" :disabled="!SettingData.NoticeFlag">音效三</a-radio>
								<a-radio :value="4" :disabled="!SettingData.NoticeFlag">音效四</a-radio>
							</a-radio-group>
						</div>
						<audio :src="VoiceSrc" ref="audio" />
					</div> -->
				</div>
			</div>
		</div>
		<a-modal title="更换邮箱" :visible="ShowEmailDialog" width="400px" top="70px" style="top: 50px;" @cancel="ShowEmailDialog = false">
			<div style="height: 120px;">
				<p class="cd-setting-sec-title">输入新邮箱地址</p>
				<a-input type="text" v-model="ChangeEmailData.email" placeholder="您的新邮箱地址" clearable style="width: 100%;margin: 10px 0" />
			</div>
			<span slot="footer" class="dialog-footer">
				<a-button class="cd-button cd-cancel-button" @click="ShowEmailDialog = false">取 消</a-button>
				<a-button class="cd-purple-button" @click="getEmailCode">确 定</a-button>
			</span>
		</a-modal>
		<a-modal
			:visible="codeVisiable" :mask="false" :closable="false" :maskClosable="false" width="300px"
			okText="确定" cancelText="取消" @ok="ChangePassword" @cancel="codeVisiable = false">
			<p>验证码：</p><a-input placeholder="请输入短信验证码" v-model="ChangePass.code" />
		</a-modal>
		<a-modal
			:visible="codeEmailVisiable" :mask="false" :closable="false" :maskClosable="false" width="300px"
			okText="确定" cancelText="取消" @ok="ChangeEmail" @cancel="codeEmailVisiable = false">
			<p>验证码：</p><a-input placeholder="请输入邮箱验证码" v-model="ChangeEmailData.code" />
		</a-modal>
		<a-modal
			:title="'阿萨德'"
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
import SettingMenu from '../../components/Disk/SettingMenu.vue'
import UserAPI from '../../api/UserAPI'
import NasFileAPI from '../../api/NasFileAPI'
import StringUtility from '../../utils/StringUtility'
import { mapGetters } from 'vuex'
export default {
	name: 'DiskSetting',
	components: { SettingMenu },
	watch: {
		SettingData: {
			handler() {
				this.$ipc.send('system', 'auto-launch', this.SettingData.AutoStartFlag);
				// this.$Api.LocalFile.write('setting', this.SettingData);
			},
			deep: true
		}
	},
	computed: {
		...mapGetters('User', ['user']),
	},
	data() {
		return {
			SettingMenuData: {
				Account: {
					active: 'active',
					name: '用户',
					icon: 'sf-icon-user'
				},
				System: {
					active: '',
					name: '系统',
					icon: 'sf-icon-hashtag'
				},
				Safety: {
					active: '',
					name: '绑定',
					icon: 'sf-icon-lock'
				},
				Trans: {
					active: '',
					name: '传输',
					icon: 'sf-icon-exchange'
				},
				Notice: {
					active: '',
					name: '提醒',
					icon: 'sf-icon-bell'
				}
			},
			ChangePass: {
				oldpass: '',
				newpass: '',
				againPass: '',
				code: ''
			},
			offlinePass: {
				isUsed: false,
				offline_username: '',
				offline_password: '',
				offline_password_new: '',
				offline_modify_visiable: false,
				already_set: false
			},
			ChangeEmailData: {
				email: '',
				code: ''
			},
			LoginTime: 0,
			VoiceSrc: '', //提醒测试音效.
			ShowEmailDialog: false,
			EmailSendFlag: false,
			SettingData: {
				AutoLogin: false,
				AutoStartFlag: false,
				Email: '',
				TransDownFolder: '',
				MaxUpTrans: 1,
				MaxDownTrans: 1,
				NoticeBubble: true, //气泡提示
				NoticeFlag: true, //提醒声音
				NoticeVoice: '音效一' //哪个提醒声音
			},
			defaultFolder: null,
			loading: '',
			codeVisiable: false,
			codeEmailVisiable: false
		};
	},
	created() {
		this.defaultFolder = (this.$electron.remote ? this.$electron.remote : this.$electron).app.getPath('downloads');
		this.LoginTime = localStorage.LoginTime;
		this.getOfflineName()
		console.log(JSON.parse(JSON.stringify(this.user)));
		this.SettingData.Email = this.user.email
	},
	methods: {
		change(item, index) {
			for (let i in this.SettingMenuData) {
				this.SettingMenuData[i].active = '';
			}
			this.SettingMenuData[index].active = 'active';
		},
		ChangePassword() {
			if (this.loading) {
				this.$message.warning('正在进行其他操作，请等待');
				return;
			}
			if (!this.ChangePass.oldpass.length) {
				this.$message.warning('请先输入原密码');
				return;
			}
			if (!this.ChangePass.newpass.length) {
				this.$message.warning('请输入新密码');
				return;
			}
			if (!this.ChangePass.againPass.length) {
				this.$message.warning('请再次输入新密码');
				return;
			}
			if (this.ChangePass.newpass !== this.ChangePass.againPass) {
				this.$message.error('密码不一致，请检查');
				return;
			}
			if (this.ChangePass.newpass === this.ChangePass.oldpass) {
				this.$message.warning('新旧密码一致，取消操作');
				this.ChangePass.newpass = '';
				this.ChangePass.againPass = '';
				return;
			}
			if (this.ChangePass.code === '') {
				this.codeVisiable = true
				UserAPI.smsCode(this.user.userName, 2).then(response => {
					this.loading = false;
					if (response.data.code !== 200) return
					this.codeVisiable = true
					this.$message.success('短信已发送到手机')
				}).catch(error => {
					this.loading = false;
					console.log(error)
					this.$message.error('网络连接错误,请检测网络')
				})
				return
			}
			const input = {
				userName: this.user.userName,
				password: StringUtility.encryptPassword(this.ChangePass.newpass),
				code: this.ChangePass.code
			}
      UserAPI.changePass(input).then(response => {
				if (response.data.code !== 200) return
				this.$message.success('修改成功，请牢记密码');
				this.ChangePass.oldpass = '';
				this.ChangePass.newpass = '';
				this.ChangePass.againPass = '';
				this.ChangePass.code = '';
				this.codeVisiable = false
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误,请检测网络')
      })
		},
		OpenChangeEmailDialog() {
			this.ShowEmailDialog = true;
		},
		getEmailCode () {
			UserAPI.emailCode(this.ChangeEmailData.email).then(response => {	
				if (response.data.code !== 200) return
				this.codeEmailVisiable = true
				this.$message.success('认证邮件已发送，授权码24小时有效')
			}).catch(error => {
				console.log(error)
				this.$message.error('网络连接错误,请检测网络')
			})
		},
		ChangeEmail() {
			if (this.loading) {
				this.$message.warning('正在进行其他操作，请等待');
				return;
			}
			if (!this.ChangeEmailData.email.length) {
				this.$message.warning('请输入新的邮箱地址');
				return;
			}
			if (this.ChangeEmailData.email && !/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(this.ChangeEmailData.email)) {
				this.$message.error('请输入正确的邮箱');
				return;
			}
			const input = {
				email: this.ChangeEmailData.email,
				code: this.ChangeEmailData.code
			}
			UserAPI.changeEmail(input).then(response => {	
				if (response.data.code !== 200) return
				this.codeEmailVisiable = false;
				this.ShowEmailDialog = false;
				this.ChangeEmailData.email = '';
				this.$store.dispatch('User/updateUser', response.data.data.userVO)
				this.$message.success('修改邮箱成功')
			}).catch(error => {
				console.log(error)
				this.$message.error('网络连接错误,请检测网络')
			})
		},
		VoiceChange(a) {
			switch (a) {
				case '音效一':
					this.VoiceSrc = this.$path.join(__static, 'voice/1.wav');
					this.PlayVoice();
					break;
				case '音效二':
					this.VoiceSrc = this.$path.join(__static, 'voice/2.wav');
					this.PlayVoice();
					break;
				case '音效三':
					this.VoiceSrc = this.$path.join(__static, 'voice/3.wav');
					this.PlayVoice();
					break;
				case '音效四':
					this.VoiceSrc = this.$path.join(__static, 'voice/4.wav');
					this.PlayVoice();
					break;
			}
			localStorage.NoticeVoice = this.VoiceSrc;
		},
		PlayVoice() {
			this.$refs.audio.currentTime = 0;
			this.$refs.audio.pause();
			this.$refs.audio.load();
			setTimeout(() => {
				this.$refs.audio.play();
			}, 200);
		},
		ChangeTransAddress() {
			this.$electron.remote.dialog.showOpenDialog(
				{
					//默认路径
					defaultPath: '../Desktop',
					//选择操作，此处是打开文件夹
					properties: ['openDirectory'],
					filters: [{ name: 'All', extensions: ['*'] }]
				},
				res => {
					res = (res[0] && res[0]) || this.defaultFolder;
					//回调函数内容，此处是将路径内容显示在input框内
					this.SettingData.TransDownFolder = res;
				}
			);
		},
		close() {
			this.$electron.remote.getCurrentWindow().close();
		},
		mini() {
			this.$electron.remote.getCurrentWindow().minimize();
		},
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
.cd-drag-head-big img{
	margin: 8px;
	width: 32px;
	height: 32px;
	border-radius: 100%;
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
.cd-drag-head-big {

}
.cd-setting-main {
	width: 100%;
	height: calc(100% - 50px);
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
.cd-setting-sec-title {
	width: 100%;
	font-size: 14px;
	border-left: 2px solid #06B650;
	text-indent: 5px;
	margin: 5px 0;
}
.cd-setting-tips {
	color: #e83c3c;
	width: 100%;
	font-size: 12px;
	margin-top: 5px;
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
	margin-left: 10px;
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
</style>
