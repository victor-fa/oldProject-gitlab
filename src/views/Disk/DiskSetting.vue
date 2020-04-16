import {app} from "electron";
<template>
	<div class="cd-setting-win">
		<div class="cd-drag-head-big">
			<a-icon type="setting" theme="twoTone" twoToneColor="#06B650" spin />
			<p style="color: #06B650">设置</p>
			<a-button icon="close" style="color: #ddd" @click="close" />
			<a-button icon="minus" style="color: #ddd" @click="mini" />
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
						<a-input type="password" v-model="ChangePass.oldpass" placeholder="当前账号密码" clearable style="width: 100%;margin-bottom: 10px;" />
						<a-input type="password" v-model="ChangePass.newpass" placeholder="新密码" clearable style="width: 100%;margin-bottom: 10px;" />
						<a-input type="password" v-model="ChangePass.againPass" placeholder="再次输入密码" clearable style="width: 100%;margin-bottom: 10px;" />
						<a-button class="cd-purple-button" @click="ChangePassword">修改</a-button>
					</div>
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
	</div>
</template>

<script>
import SettingMenu from '../../components/Disk/SettingMenu.vue'
import UserAPI from '../../api/UserAPI'
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
		this.GetLocalSetting();
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
		GetLocalSetting() {
			// this.$Api.LocalFile.read('setting', data => {
			// 	console.log(data);
			// 	if (data.Email !== undefined) {
			// 		this.$nextTick(() => {
			// 			this.SettingData = data;
			// 		});
			// 	} else {
			// 		this.SettingData.TransDownFolder = this.defaultFolder;
			// 		this.$Api.LocalFile.write('setting', this.SettingData);
			// 	}
			// 	switch (this.SettingData.NoticeVoice.substr(-5)) {
			// 		case '1.wav':
			// 			this.SettingData.NoticeVoice = '音效一';
			// 			break;
			// 		case '2.wav':
			// 			this.SettingData.NoticeVoice = '音效二';
			// 			break;
			// 		case '3.wav':
			// 			this.SettingData.NoticeVoice = '音效三';
			// 			break;
			// 		case '4.wav':
			// 			this.SettingData.NoticeVoice = '音效四';
			// 			break;
			// 	}
			// });
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
		}
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
	background: url("../../assets/logo_bg.png");
	background-size: cover;
	background-position: -160px 58px;
	background-repeat: repeat-y;
	-webkit-app-region: drag;
	background-color: #AFD9E6;
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
	line-height: 50px;
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
	color: #06B650;
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
