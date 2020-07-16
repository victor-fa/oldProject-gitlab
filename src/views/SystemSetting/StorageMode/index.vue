<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content" >
			<p class="cd-setting-title">存储模式</p>
			<p class="cd-setting-title">
				<a-checkbox :checked="isBackup" @change="handleSave(0)">{{firstMode.title}}</a-checkbox>
				<br><font>{{firstMode.content[0]}}<br>{{firstMode.content[1]}}<br>{{firstMode.content[2]}}</font><br><br>
				<a-checkbox :checked="isCommon" @change="handleSave(1)">{{secondMode.title}}</a-checkbox>
				<br><font>{{secondMode.content[0]}}<br>{{secondMode.content[1]}}</font><br><br>
			</p>
		</div>
		<a-modal :title="makesureModal.title"
			:visible="makesureModal.visiable" :mask="false" :closable="false" :maskClosable="false" width="400px"
			:okText="commonInfo.okText" :cancelText="commonInfo.cancelText" @ok="handleMakesure"
			@cancel="handleCancle">
			<p>{{ makesureModal.message }}</p>
			<font class="modal-font">{{ commonInfo.tips }}</font>
      <a-checkbox v-model="makesureModal.checked">确认删除数据</a-checkbox>
		</a-modal>
	</div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import NasFileAPI from '@/api/NasFileAPI'
import processCenter, { EventName } from '@/utils/processCenter'
import { firstMode, secondMode, commonInfo } from '../settingModel'
import TransportHelper from '../../../api/Transport/TransportHelper'

export default Vue.extend({
  name: 'nas-info',
	data() {
		return {
			mode: -1,
			firstMode,
			secondMode,
			commonInfo,
			makesureModal: {
				title: '',
				visiable: false,
				message: '',
				checked: false
			},
			diskFormatting: 0
		};
  },
	computed: {
    isBackup: function () {
			const _this = this as any
			return _this.mode === 0;
		},
		isCommon: function () {
			const _this = this as any
			return _this.mode === 1;
		}
	},
	created() {
		this.fetchDisks()
	},
  methods: {
		handleSave (data) {
			this.mode = data
			if (this.diskFormatting !== 0) {	// 有磁盘任务，不可初始化
				this.$message.error('当前有磁盘任务，不可初始化')
				return
			}
			this.handleOperation()
		},
		handleOperation () {
			this.makesureModal = {
				title: this.mode === 0 ? this.firstMode.switchMode.title : this.secondMode.switchMode.title,
				visiable: true,
				message: this.mode === 0 ? this.firstMode.switchMode.message : this.secondMode.switchMode.message,
				checked: false
			}
		},
		handleSwitchMode () {
			NasFileAPI.switchMode(this.mode, 1).then(response => {
				if (response.data.code !== 200) return
				console.log(response);
				processCenter.renderSend(EventName.initialize)  // 打开获取初始化进度窗口
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
		},
		handleMakesure () {
			if (!this.makesureModal.checked) { this.$message.error('您未勾选“确认删除数据”'); return; }
			this.handleCancle()
			this.handleSwitchMode()
		},
		handleCancle () {
			this.makesureModal = {
				title: this.makesureModal.title,
				visiable: false,
				message: ``,
				checked: false
			}
			this.fetchDisks()
		},
    fetchDisks () {
      NasFileAPI.fetchDisks().then(response => {
        if (response.data.code !== 200) return
				this.mode = _.get(response.data.data, 'mode')
				this.diskFormatting = _.get(response.data.data, 'formatting')
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
	height: 100%;
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
