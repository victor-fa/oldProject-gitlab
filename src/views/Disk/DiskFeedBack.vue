<template>
	<div class="cd-feedback-win">
		<WindowsHeader :data="header" />
		<div class="cd-about-main">
			<div class="app-version">
				<div class="logo">绿联云</div>
				<span>Version&nbsp;&nbsp;{{ version }}</span>
			</div>
			<div class="cd-feedback-main">
				<p>我们需要以下信息进行问题反馈</p>
				<input v-model="FeedBackTitle" placeholder="简单的描述下问题" />
				<textarea v-model="FeedBackContent" placeholder="尽量详细的描述遇到的问题" />
			</div>
			<div class="bottom">
				<p class="release">©2020 绿联云</p>
				<a-button class="cd-cancel-button" :disabled="loading" @click="FeedBack">提交</a-button>
			</div>
		</div>
	</div>
</template>

<script>
import WindowsHeader from '@/components/Disk/WindowHeader.vue'
import UserAPI from '@/api/UserAPI'
const packageInfo = require('../../../package');
export default {
	name: 'DiskFeedBack',
	components: { WindowsHeader },
	data() {
		return {
			loading: false,
			FeedBackTitle: '',
			FeedBackContent: '',
			header: {
				color: '#666',
				title: '',
				resize: false,
				mini: false
			}
		};
	},
	computed: {
		version() {
			return packageInfo.version;
		}
	},
	methods: {
		FeedBack() {
			if (!this.FeedBackTitle.length) {
				this.$message.warning('请先简单描述下问题');
				return;
			}
			if (!this.FeedBackContent.length) {
				this.$message.warning('详细描述问题不能是空的');
				return;
			}
			this.loading = true;
      UserAPI.feedback(this.FeedBackTitle, this.FeedBackContent, '').then(response => {
				this.loading = false;
				if (response.data.code !== 200) return
        this.$message.success('反馈提交成功，Thanks♪(･ω･)ﾉ')
      }).catch(error => {
				this.loading = false;
        console.log(error)
        this.$message.error('网络连接错误,请检测网络')
      })
		},
	}
};
</script>

<style lang="less" scoped>
/*反馈窗口*/
.cd-feedback-win {
	width: 100%;
	height: 100%;
	.cd-about-main {
		width: 100%;
		height: calc(100% - 50px);
		background: #fff;
		padding: 0 20px;
		position: relative;
		.app-version {
			.logo {
				width: 181px;
				height: 45px;
				float: left;
				display: inline-block;
				vertical-align: bottom;
				font-size: 30px;
				color: #4c4c4c;
				font-family: 'Mistral';
				font-weight: bold;
			}
			span {
				display: inline-block;
				vertical-align: bottom;
				font-size: 14px;
				margin: 0 10px;
				color: #4c4c4c;
				line-height: 45px;
			}
		}
		.cd-feedback-main {
			height: calc(100% - 50px);
			background: #fff;
			float: left;
			p {
				font-size: 14px;
				color: #4f4f4f;
				margin-bottom: 10px;
				text-align: left;
				display: inline-block;
				width: 100%;
			}
			input, textarea {
				width: 100%;
				height: 32px;
				border-radius: 3px;
				border: 1px solid #eee;
				padding: 0 5px;
				margin-bottom: 15px;
				color: #000; 
				&:focus {
					border-color: #06B650;
					outline: 0;
					box-shadow: 0 0 0 2px rgba(6,182,80, 0.2);
				}
			}
			textarea {
				padding: 5px;
				height: 110px;
				resize: none;
			}
			.release {
				float: left;
				font-size: 12px;
				color: #06B650;
			}
			button {
				float: right;
				margin-left: 20px;
				overflow: hidden !important;
			}
		}
		.bottom {
			width: 91%;
			position: absolute;
			bottom: -118px;
			p {
				float: left;
			}
			button {
				float: right;
			}
		}
	}
}

</style>
