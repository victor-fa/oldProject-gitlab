<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content">
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
		<SettingBottom @callback="handleBottom" />
	</div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex'
import SettingBottom from '../../../components/Disk/SettingBottom.vue'

export default {
  name: 'common',
	components: {
		SettingBottom
	},
	data() {
		return {
			loading: '',
			loginSetting: {
				autoLogin: false,
				autoPowerOn: false,
				closeChoice: 'tray'
			},
		};
  },
	computed: {
    ...mapGetters('Setting', ['autoPowerOn']),
		...mapGetters('Setting', ['closeInfo']),
		...mapGetters('Setting', ['autoLogin']),
	},
	watch: {
		loginSetting: {
			handler() {
				const _this = this as any
				_this.$ipc.send('system', 'auto-launch', _this.loginSetting.autoPowerOn);
        _this.$store.dispatch('Setting/updateAutoPowerOnInfo', { flag: _this.loginSetting.autoPowerOn })
        _this.$store.dispatch('Setting/updateAutoLoginInfo', { flag: _this.loginSetting.autoLogin })
			},
			deep: true
		}
	},
	created () {
		const _this = this as any
		_this.loginSetting.autoPowerOn = _this.autoPowerOn ? _this.autoPowerOn.flag : false
		_this.loginSetting.closeChoice = _this.closeInfo ? _this.closeInfo.trayOrExit : 'tray'
		_this.loginSetting.autoLogin = _this.autoLogin ? _this.autoLogin.flag : false
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
			const input = {
				'remember': _this.loginSetting.closeChoice ? true : false,
				'trayOrExit': _this.loginSetting.closeChoice
			}
			_this.$store.dispatch('Setting/updateCloseChoiceInfo', input)
			_this.$message.success('修改成功')
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
		position: relative;
	}
}
</style>
