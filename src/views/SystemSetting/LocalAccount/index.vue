<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content">
			<p class="cd-setting-title">用户离线设置</p>
			<p class="cd-setting-title"><a-switch v-model="offlinePass.isUsed" defaultChecked @change="onOfflineChange"/></p>
			<template v-if="offlinePass.isUsed">
				<p class="cd-setting-sec-title">{{offlinePass.already_set ? '修改' : '添加'}}账号密码</p>
				<div class="cd-setting-form">
					<a-input v-if="!offlinePass.already_set" type="text" v-model="offlinePass.offline_username" placeholder="离线账号" clearable style="width: 100%;margin-bottom: 10px;" />
					<p v-if="offlinePass.already_set" class="cd-setting-info">当前离线账号：<font style="float: right;">{{ offlinePass.offline_username }}</font></p>
					<a-input v-if="!offlinePass.already_set" type="password" v-model="offlinePass.offline_password" placeholder="离线密码" clearable style="width: 100%;margin-bottom: 10px;" />
					<a-button v-if="offlinePass.already_set" @click="showModifyOffline">修改密码</a-button>
					<a-button v-if="!offlinePass.already_set" @click="setOfflineAccount">保存</a-button>
				</div>
				<p class="cd-setting-title"><br></p>
			</template>
			<p class="cd-setting-title"><br></p>
		</div>
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

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import StringUtility from '@/utils/StringUtility'
import { USER_MODEL } from '@/common/constants'
import NasFileAPI from '@/api/NasFileAPI'

export default Vue.extend({
  name: 'local-account',
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
			UploadSrc: false,
			offlinePass: {
				isUsed: false,
				offline_username: '',
				offline_password: '',
				offline_password_new: '',
				offline_modify_visiable: false,
				already_set: false
			}
		};
  },
	created() {
		this.getOfflineName()
	},
  methods: {
		close() {
			const _this = this as any
			_this.$electron.remote.getCurrentWindow().close()
		},
		onOfflineChange(e) {
			console.log(this.offlinePass.already_set);
			const _this = this as any
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
		getOfflineName () {
			NasFileAPI.getOfflineName().then(response => {
				if (response.data.code !== 200) return
				const offline_username = _.get(response.data.data, 'offline_username')
				if (offline_username) {
					this.offlinePass.offline_username = offline_username
					this.offlinePass.already_set = true
					this.offlinePass.isUsed = true
				} else {
					this.offlinePass.isUsed = false
					this.offlinePass.already_set = false
				}
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
		}
  }
})
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
		.cd-setting-form {
			margin: 8px 0;
			width: 230px;
			text-align: left;
			.ivu-input-number, .ivu-input-wrapper {
				margin: 5px 0;
			}
			button {
				float: right;
				margin-top: 10px;
			}
		}
	}
}

</style>
