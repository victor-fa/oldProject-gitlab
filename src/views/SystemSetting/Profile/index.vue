<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content">
			<p class="cd-setting-info">
				<img draggable="false" v-if="UploadSrc" :src="UploadSrc" alt="" />
				<img draggable="false" v-else-if="user.image" :src="user.image" alt="" />
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
				<a-button @click="changePassword">修改密码</a-button>
			</p>
			<p class="cd-setting-title"><br></p>
			<SettingBottom @callback="handleBottom" />
		</div>
	</div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex'
import StringUtility from '../../../utils/StringUtility'
import UserAPI from '@/api/UserAPI'
import SettingBottom from '../../../components/Disk/SettingBottom.vue'
import processCenter, { EventName } from '../../../utils/processCenter'
import { USER_MODEL } from '../../../common/constants'

export default {
  name: 'profil',
	components: {
		SettingBottom
	},
	computed: {
		...mapGetters('User', ['user']),
	},
	data() {
		return {
			loading: '',
			codeVisiable: false,
			codePhoneVisiable: false,
			storages: [],
			nasUsers: [],
			UploadSrc: false
		};
  },
	created() {
	},
  methods: {
		changePhoto () {
			const _this = this as any
			const _event = event as any
			_this.UploadSrc = false;
			let elm = _event.target;
			let user_pic = elm.value;
			if (user_pic.length > 1 && user_pic) {
				let type = StringUtility.formatSuffix(user_pic).toLowerCase();
				if (['png', 'jpg', 'jpeg', 'bmp', 'gif'].indexOf(type) === -1) {
					return _this.$message.error('所选格式为' + type + ' 请重新选择上传的文件');
				}
				elm.files && elm.files[0] ? (_this.UploadSrc = window.URL.createObjectURL(elm.files[0])) : '';
				_this.loading = true;
				UserAPI.uploadPhoto(elm.files[0]).then(response => {
					_this.loading = false;
					if (response.data.code !== 200) return
					_this.user.image = response.data.data.imageUrl
					_this.$message.success('修改头像成功')
					processCenter.renderSend(EventName.account);
					_this.$store.dispatch('User/updateUser', _this.user)
				}).catch(error => {
					_this.loading = false;
					console.log(error)
					_this.$message.error('网络连接错误,请检测网络')
				})
			}
		},
		changePassword() {
			const _this = this as any
			_this.$ipc.send('system', 'forget-pass');
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
		.cd-user-head {
			width: 70px;
			height: 70px;
			position: absolute;
			left: 154px;
			top: 70px;
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
