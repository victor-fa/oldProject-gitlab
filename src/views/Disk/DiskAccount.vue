<template>
	<div class="cd-user-main">
		<WindowsHeader :data="header" />
		<div class="cd-user-right">
			<p class="cd-user-title">个人信息</p>
			<img draggable="false" :src="UploadSrc ? UploadSrc : User.image" alt="" />
			<form @submit.prevent="onSubmit" ref="form">
				<div class="cd-user-line">
					<label>昵称：</label>
					<a-input v-model="User.nicName" clearable="" style="width: calc(100% - 50px)" placeholder="输入昵称" name="nicName" :number="true" />
				</div>
				<div class="cd-user-line">
					<label>邮箱：</label>
					<p :title="'邮箱变更，请到系统设置中进行修改'" style="cursor: pointer">{{ User.email }} <br></p>
				</div>
				<div class="cd-user-line">
					<label>手机：</label>
					<a-input v-model="User.phoneNo" clearable="" style="width: calc(100% - 50px)" placeholder="输入手机" name="phone" :number="true" :maxlength="11" />
				</div>
				<div class="cd-user-line">
					<label>生日：</label>
					<a-date-picker :defaultValue="moment(User.birthday ? new Date(User.birthday) : new Date(), dateFormat)" @change="onChange" style="width: calc(100% - 50px)" :format="dateFormat" />
				</div>
				<div class="cd-user-line">
					<label>性别：</label>
					<a-select v-model="User.sex" style="width: calc(100% - 50px)" placeholder="Tags Mode">
						<a-select-option v-for="item in sexs" :key="item.value">{{ item.label }}</a-select-option>
					</a-select>
				</div>
				<div class="cd-user-head" onclick="this.childNodes[0].click()">
					<a-input type="file" name="userhead" @change="changePhoto()" ref="file" />
				</div>
				<div class="cd-user-line" style="height: 72px;">
					<label>说说:</label>
					<a-textarea class="ivu-input" name="userSay" v-model="User.userSay" placeholder="输入说说" :autoSize="{ minRows: 2, maxRows: 2 }"/>
				</div>
				<a-button class="cd-purple-button" @click="getMessage">更新</a-button>
			</form>
		</div>
		<a-modal
			:visible="codeVisiable" :mask="false" :closable="false" :maskClosable="false" width="300px"
			okText="确定" cancelText="取消" @ok="handleUpdate" @cancel="codeVisiable = false">
			<p>验证码：</p><a-input placeholder="请输入短信验证码" v-model="code" />
		</a-modal>
	</div>
</template>

<script>
import WindowsHeader from '../../components/Disk/WindowHeader.vue'
import { USER_MODEL } from '../../common/constants'
import UserAPI from '../../api/UserAPI'
import StringUtility from '../../utils/StringUtility'
import processCenter, { EventName } from '../../utils/processCenter'
import { mapGetters } from 'vuex'
import moment from 'moment';
export default {
	name: 'DiskAccount',
	components: { WindowsHeader },
	data() {
		return {
			User: {},
			UploadSrc: false,
			sexs: [
				{
					value: 0,
					label: '男'
				},
				{
					value: 1,
					label: '女'
				}
			],
			header: {
				title: '',
				resize: false,
				color: '#000'
			},
			dateFormat: 'YYYY/MM/DD',
			codeVisiable: false,
			code: ''
		};
	},
	created() {
		this.User = this.user
		console.log(JSON.parse(JSON.stringify(this.User)));
	},
	computed: {
		...mapGetters('User', ['user']),
	},
	methods: {
		moment,
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
					this.User.image = response.data.data.imageUrl
					this.$message.success('修改头像成功')
					processCenter.renderSend(EventName.account);
					this.$store.dispatch('User/updateUser', this.User)
				}).catch(error => {
					this.loading = false;
					console.log(error)
					this.$message.error('网络连接错误,请检测网络')
				})
			}
		},
		getMessage() {
			this.loading = true;
			UserAPI.smsCode(this.User.phoneNo, 5).then(response => {
				this.loading = false;
				if (response.data.code !== 200) return
				this.codeVisiable = true
        this.$message.success('短信验证码已发送到手机')
      }).catch(error => {
				this.loading = false;
        console.log(error)
        this.$message.error('网络连接错误,请检测网络')
      })
		},
		handleUpdate() {
			if (!this.code) {
				this.$message.error('验证码不能为空')
				return
			}
			const input = {
				sex: this.User.sex,
				nicName: this.User.nicName ? this.User.nicName : '',
				userSay: this.User.userSay ? this.User.userSay : '',
				birthday: this.User.birthday ? (new Date(this.User.birthday)).getTime() : '',
				phoneNo: this.User.phoneNo ? this.User.phoneNo : '',
				code: this.code
			}
			// 获取用户信息进行比对
			const userJson = localStorage.getItem(USER_MODEL)
			if (userJson === null) return
			const userObj = JSON.parse(userJson)
			input.sex === userObj.sex ? delete input.sex : null
			input.nicName === userObj.nicName ? delete input.nicName : null
			input.userSay === userObj.userSay ? delete input.userSay : null
			input.birthday === userObj.birthday ? delete input.birthday : null
			input.phoneNo === userObj.phoneNo ? delete input.phoneNo : null
			UserAPI.updateInfo(input).then(response => {
				this.code = ''
				if (response.data.code !== 200) return
				this.$store.dispatch('User/updateUser', response.data.data.userVO)
				this.codeVisiable = false
				this.User = response.data.data.userVO
				this.getAge()
				processCenter.renderSend(EventName.account);
        this.$message.success('修改成功')
      }).catch(error => {
        console.log(error)
				this.code = ''
        this.$message.error('网络连接错误,请检测网络')
      })
		},
		onSubmit() {
			return false;
		},
		onChange(date, dateString) {
			this.User.birthday = dateString
		}
	}
};
</script>

<style scoped>
/*用户信息窗口*/
.cd-user-main {
	width: 100%;
	height: 100%;
	background: #fff;
}
.cd-user-right-info {
	width: 100%;
	height: 150px;
	text-align: center;
	margin-top: 135px;
}
.cd-user-right {
	float: left;
	width: 100%;
	height: 100%;
	background: #fff;
	padding: 0 20px 20px;
	color: #000;
}
.cd-user-right img {
	width: 70px;
	height: 70px;
	border-radius: 100px;
	margin-bottom: 15px;
	-webkit-border-radius: 100px;
	-moz-border-radius: 100px;
}
.cd-user-right img:hover {
	opacity: 0.5;
	cursor: pointer;
}
.cd-user-right name {
	color: #fff;
	font-size: 18px;
	font-weight: lighter;
}
.cd-user-right age {
	color: #a5a5a5;
	font-size: 13px;
}
.cd-user-title {
	width: 100%;
	font-size: 18px;
	border-bottom: 1px solid #d0d0d0;
	color: #2f2f2f;
	text-align: left;
}
.cd-user-line {
	width: 100%;
	height: 45px;
	line-height: 45px;
	text-align: left;
}
.cd-user-line label {
	float: left;
	width: 42px;
	font-size: 14px;
	height: 100%;
}
.cd-user-line textarea {
	width: calc(100% - 50px);
	height: 55px;
	margin-top: 8px;
	resize: none;
}
.cd-user-right button {
	float: right;
	margin-right: 8px;
}
.cd-user-head {
	width: 70px;
	height: 70px;
	position: absolute;
	left: 133px;
	top: 75px;
	overflow: unset;
	border-radius: 100%;
	-webkit-transition: all 0.35s;
	-moz-transition: all 0.35s;
	-o-transition: all 0.35s;
}
.cd-user-head:hover {
	box-shadow: 0 0 29px -2px #ffffff;
	cursor: pointer;
	-webkit-transition: all 0.35s;
	-moz-transition: all 0.35s;
	-o-transition: all 0.35s;
}
.cd-user-head input {
	position: absolute;
	top: -50px;
	left: -11px;
	display: none;
}
</style>
