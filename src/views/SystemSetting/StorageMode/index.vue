<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content" >
			<p class="cd-setting-title">存储模式</p>
			<p class="cd-setting-title">
				<a-radio-group v-model="mode">
					<a-radio :value="0">{{firstMode.title}}</a-radio>
					<br><br><font>{{firstMode.content[0]}}<br>{{firstMode.content[1]}}<br>{{firstMode.content[2]}}</font><br><br>
					<a-radio :value="1">{{secondMode.title}}</a-radio>
					<br><br><font>{{firstMode.content[0]}}<br>{{firstMode.content[1]}}</font><br><br>
				</a-radio-group>
			</p>
		</div>
		<SettingBottom @callback="handleBottom" />
		<a-modal :title="makesureModal.title"
			:visible="makesureModal.visiable" :mask="false" :closable="false" :maskClosable="false" width="400px"
			:okText="commonInfo.okText" :cancelText="commonInfo.cancelText" @ok="handleMakesure"
			@cancel="handleCancle">
			<p>{{makesureModal.message}}</p>
			<font class="modal-font">{{commonInfo.tips}}</font>
      <a-input :placeholder="commonInfo.placeholder" v-model="makesureModal.input" :max-length="4"/>
		</a-modal>
	</div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import SettingBottom from '@/components/Disk/SettingBottom.vue'
import { loginIcons } from '@/views/Login/iconList'
import NasFileAPI from '@/api/NasFileAPI'
import StorageHandler from '../../Storage/StorageHandler'
import StringUtility from '@/utils/StringUtility'
import processCenter, { EventName } from '@/utils/processCenter'
import { firstMode, secondMode, commonInfo } from '../settingModel'
import TransportHelper from '../../../api/Transport/TransportHelper'


export default Vue.extend({
  name: 'nas-info',
	components: {
		SettingBottom
	},
  filters: {
    filterSize (bytes) {
      return StringUtility.formatShowSize(bytes)
		},
    filterStatus (status) {
      return StringUtility.formatDiskStatus(status)
		},
		filterStorageType (data, index) {
			return StorageHandler.matchStorageName(data, index)
		}
	},
	data() {
		return {
			mode: 0,
			loginSetting: {
				autoLogin: false,
				autoPowerOn: false,
				closeChoice: 'tray'
			},
			loginIcons,
			firstMode,
			secondMode,
			commonInfo,
			detach: {
				visiable: false,
				choice: 0
			},
			makesureModal: {
				title: '',
				visiable: false,
				input: '',
				message: ''
			}
		};
  },
	created() {
		this.fetchDisks()
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
			this.mode !== -1 ? this.handleOperation('makesure') : null
		},
		handleOperation (flag) {
			if (flag === 'makesure') {
				this.makesureModal = {
					title: this.mode === 0 ? this.firstMode.makesure.title : this.secondMode.makesure.title,
					visiable: true,
					input: '',
					message: this.mode === 0 ? this.firstMode.makesure.message : this.secondMode.makesure.message
				}
			} else if (flag === 'switchMode') {
				this.makesureModal = {
					title: this.mode === 0 ? this.firstMode.switchMode.title : this.secondMode.switchMode.title,
					visiable: true,
					input: '',
					message: this.mode === 0 ? this.firstMode.switchMode.message : this.secondMode.switchMode.message
				}
			}
		},
		handleSwitchMode () {
			NasFileAPI.switchMode(this.mode, 1).then(response => {
				if (response.data.code !== 200) return
				console.log(response);
				this.switchDevice()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		switchDevice () {
			this.$store.dispatch('NasServer/clearCacheNas')
			TransportHelper.clearQueueCache()
			processCenter.renderSend(EventName.bindList)
		},
		handleMakesure () {
			if (this.makesureModal.input.length === 0) { this.$message.error('您未输入关键信息！'); return; }
			if (this.makesureModal.input !== '我已了解') { this.$message.error('输入关键信息错误！'); return; }
			this.handleCancle()
			this.makesureModal.title === '硬盘初始化' ? this.handleSwitchMode() : this.handleOperation('switchMode')
		},
		handleCancle () {
			this.makesureModal = {
				title: this.makesureModal.title,
				visiable: false,
				input: '',
				message: ``
			}
		},
    fetchDisks () {
      NasFileAPI.fetchDisks().then(response => {
        if (response.data.code !== 200) return
				this.mode = _.get(response.data.data, 'mode')
				console.log(this.mode);
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		}
  }
})
</script>

<style lang="less" scoped>
p { text-align: left; }
.cd-setting-main {
	width: 100%;
	height: 86%;
	padding: 10px;
	display: inline-flex;
	.cd-setting-content {
		width: calc(100%);
		height: 100%;
		padding: 20px;
		float: left;
		overflow-y: scroll;
		.cd-setting-title {
			width: 100%;
			font-size: 16px;
			line-height: 35px;
			margin-bottom: 10px;
			font-weight: bold;
			.cd-purple-button { margin-right: 10px; }
			font {
				font-weight: 500;
				line-height: 24px;
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
		.content {
			display: flex;
			.side {
				flex: 1;
				display: flex;
				flex-flow: column;
				text-align: left;
				padding: 10px;
				font { color: #06B650; }
				img {
					width: 60px;
					height: 60px;
					margin: 0px;
				}
			}
			button { margin: 30px 10px 0 0; }
		}
	}
}
.modal-font {
	color: #f00;
	display: block;
	margin-bottom: 15px;
}
</style>
