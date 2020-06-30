<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content">
			<p class="cd-setting-title title">登录设置</p>
			<p class="cd-setting-title">
				<a-checkbox class="checkbox" v-model="loginSetting.autoLogin">自动登录</a-checkbox>
				<a-checkbox v-model="loginSetting.autoPowerOn">开机自启动</a-checkbox>
			</p>
			<p class="cd-setting-title"><br></p>
			<p class="cd-setting-title close title">当关闭窗口时</p>
			<p class="cd-setting-title">
				<a-radio-group v-model="loginSetting.closeChoice">
					<a-radio value="tray">最小化到托盘</a-radio>
					<br><br>
					<a-radio value="exit">退出程序</a-radio>
				</a-radio-group>
			</p>
		</div>
	</div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  name: 'common',
	data() {
		return {
			loading: '',
			loginSetting: {
				autoLogin: true,
				autoPowerOn: false,
				closeChoice: 'tray'
			},
		};
  },
	watch: {
		loginSetting: {
			handler() {
				this.handleSave()
			},
			deep: true
		}
	},
	computed: {
    ...mapGetters('Setting', ['autoPowerOn']),
		...mapGetters('Setting', ['closeInfo']),
		...mapGetters('Setting', ['autoLogin']),
	},
	created () {
		this.loginSetting.autoPowerOn = _.isEmpty(this.autoPowerOn) ? false : this.autoPowerOn.flag
		this.loginSetting.closeChoice = _.isEmpty(this.closeInfo) ? 'tray' : this.closeInfo.trayOrExit
		this.loginSetting.autoLogin = _.isEmpty(this.autoLogin) ? true : this.autoLogin.flag
	},
  methods: {
		close() {
			const _this = this as any
			_this.$electron.remote.getCurrentWindow().close()
		},
		handleSave () {
			const input = {
				'remember': this.loginSetting.closeChoice ? true : false,
				'trayOrExit': this.loginSetting.closeChoice
			}
			const _this = this as any
			_this.$ipc.send('system', 'auto-launch', this.loginSetting.autoPowerOn);
			this.$store.dispatch('Setting/updateCloseChoiceInfo', input)
			this.$store.dispatch('Setting/updateAutoPowerOnInfo', { flag: this.loginSetting.autoPowerOn })
			this.$store.dispatch('Setting/updateAutoLoginInfo', { flag: this.loginSetting.autoLogin })
			// this.$message.success('修改成功')
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
		position: relative;
		.title {
			font-weight: 500;
			font-size: 14px;
		}
		.checkbox { margin-right: 10px; }
		.close { margin-top: 20px; }
	}
	.ant-checkbox-wrapper, .ant-radio-wrapper { font-size: 12px; }
}
</style>
