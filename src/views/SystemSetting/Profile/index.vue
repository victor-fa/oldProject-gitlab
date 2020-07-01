<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content">
			<p class="cd-setting-info">
				<img class="photo" draggable="false" v-if="UploadSrc" :src="UploadSrc" alt="" />
				<img class="photo" draggable="false" v-else-if="user.image" :src="user.image" alt="" />
				<img class="photo" draggable="false" v-else :src="loginIcons.user">
			</p>
			<form @submit.prevent="onSubmit" ref="form">
				<div class="cd-user-head" onclick="this.childNodes[0].click()">
					<a-input type="file" name="userhead" @change="changePhoto()" ref="file" />
				</div>
			</form>
			<p class="cd-setting-info nick">
				昵称：{{!edit_nick ? user.nicName : ''}}
				<a-input type="text" v-show="edit_nick"
					v-model="user.nicName" placeholder="请输入昵称" clearable
					class="nick-name" :max-length="20" ref="input_nick"
					@blur.native.capture="handleSave()"/>
				<img class="edit" v-show="!edit_nick" :src="loginIcons.edit" @click="edit_nick = true">
			</p>
			<p class="cd-setting-info">
				手机号：{{!edit_phone ? user.phoneNo : ''}}
				<a-input type="text" v-show="edit_phone"
					v-model="user.phoneNo" placeholder="请输入手机号" clearable
					style="width: 200px;" :max-length="11" ref="input_phone"
					@blur.native.capture="handleSave()"/>
				<img class="edit" v-show="!edit_phone" :src="loginIcons.edit" @click="edit_phone = true">
			</p>
			<p class="cd-setting-info">
				<a-button @click="changePassword">修改密码</a-button>
			</p>
		</div>
		<a-modal
			:visible="codePhoneVisiable" :mask="false" :closable="false" :maskClosable="false" width="300px"
			okText="确定" cancelText="取消" @ok="changePhone" @cancel="codePhoneVisiable = false">
			<p>验证码：</p><a-input placeholder="请输入验证码" v-model="changePhoneData.code" :max-length="6"/>
		</a-modal>
	</div>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import StringUtility from '@/utils/StringUtility'
import UserAPI from '@/api/UserAPI'
import processCenter, { EventName } from '@/utils/processCenter'
import { USER_MODEL } from '@/common/constants'
import { loginIcons } from '@/views/Login/iconList'

export default Vue.extend({
  name: 'profil',
	computed: {
		...mapGetters('User', ['user']),
	},
	data() {
		return {
			codeVisiable: false,
			codePhoneVisiable: false,
			storages: [],
			nasUsers: [],
			UploadSrc: false as any,
			changePhoneData: {
				phone: '',
				code: ''
			},
			loginIcons,
			edit_nick: false,
			edit_phone: false
		};
  },
	watch: {
    edit_nick: function (newValue) {
			this.$nextTick(() => (this.$refs.input_nick as any).focus())
    },
    edit_phone: function (newValue) {
			this.$nextTick(() => (this.$refs.input_phone as any).focus())
    }
	},
  methods: {
		changePhoto () {
			const _event = event as any
			this.UploadSrc = false;
			let elm = _event.target;
			let user_pic = elm.value;
			if (user_pic.length > 1 && user_pic) {
				let type = StringUtility.formatSuffix(user_pic).toLowerCase();
				if (['png', 'jpg', 'jpeg', 'bmp', 'gif'].indexOf(type) === -1)  return this.$message.error('所选格式为' + type + ' 请重新选择上传的文件')
				elm.files && elm.files[0] ? (this.UploadSrc = window.URL.createObjectURL(elm.files[0])) : '';
				UserAPI.uploadPhoto(elm.files[0]).then(response => {
					if (response.data.code !== 200) return
					this.user.image = response.data.data.imageUrl
					this.$message.success('修改头像成功')
					processCenter.renderSend(EventName.account);
					this.$store.dispatch('User/updateUser', this.user)
				}).catch(error => {
					console.log(error)
					this.$message.error('网络连接错误,请检测网络')
				})
			}
		},
		changePassword() {
			const _this = this as any
			_this.$ipc.send('system', 'forget-pass');
		},
		handleSave () {
			const input = { nicName: this.user.nicName ? this.user.nicName : '' }
			const userJson = localStorage.getItem(USER_MODEL)
			if (userJson === null) return
			const userObj = JSON.parse(userJson)
			this.edit_nick = false
			this.edit_phone = false
			if (this.user.nicName !== userObj.nicName) this.handleNickname()
			if (this.user.phoneNo !== userObj.phoneNo) {
				this.changePhoneData.phone = this.user.phoneNo
				this.getPhoneCode()
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
				this.edit_nick = false
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误,请检测网络')
      })
		},
		getPhoneCode () {
			if (!this.changePhoneData.phone.length) { this.$message.warning('请输入新的手机号'); return; }
			if (this.changePhoneData.phone && !(/^1[3456789]\d{9}$/.test(this.changePhoneData.phone))) { this.$message.error('请输入正确的手机号'); return; }
			UserAPI.smsCode(this.changePhoneData.phone, 5).then(response => {
				if (response.data.code !== 200) return
				this.codePhoneVisiable = true
        this.$message.success('短信验证码已发送到手机')
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误,请检测网络')
      })
		},
		changePhone() {
			if (!this.changePhoneData.code.length) { this.$message.warning('请输入短信验证码'); return; }
			const input = { phoneNo: this.changePhoneData.phone, code: this.changePhoneData.code }
			UserAPI.updateInfo(input).then(response => {
				if (response.data.code !== 200) return
				this.codePhoneVisiable = false;
				this.$store.dispatch('User/updateUser', response.data.data.userVO)
        this.$message.success('修改手机号成功')
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误,请检测网络')
      }).finally(() => {
				this.changePhoneData = {
					phone: '',
					code: ''
				}
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
			.photo {
				width: 70px;
				height: 70px;
				border-radius: 50%;
			}
			.edit {
				width: 20px;
				height: 20px;
				margin: 3px 0 0 10px;
				cursor: pointer;
			}
		}
		.nick {
			display: flex;
			.nick-name {
				width: 200px;
				margin-left: 13px;
			}
		}
		.cd-user-head {
			width: 70px;
			height: 70px;
			position: absolute;
			left: 155px;
			top: 65px;
			overflow: unset;
			transition: all 0.35s;
			input {
				position: absolute;
				top: -50px;
				left: -11px;
				display: none;
			}
			&:hover {
				box-shadow: 0 0 29px -2px #ffffff;
				cursor: pointer;
				transition: all 0.35s;
			}
		}
	}
}

</style>
