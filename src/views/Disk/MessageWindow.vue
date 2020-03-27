<template>
	<div :class="'cd-message-main ' + animation">
		<div class="shadow"></div>
		<div class="cd-message-main">
			<WindowsHeader v-bind:data="confData"></WindowsHeader>
			<div class="cd-message-container">
				<img src="../../assets/logo.png"/>
				<p>{{ MegData }}</p>
			</div>
		</div>
	</div>
</template>

<script>
import WindowsHeader from '../../components/Disk/WindowHeader.vue'
export default {
	name: 'MessageWindow',
	components: {
		WindowsHeader
	},
	data() {
		return {
			confData: {
				mini: false,
				resize: false,
				drag: true,
				background: '#01B74F',
				color: '#fff',
				title: 'Nas-uGreen-通知'
			},
			MegData: '',
			animation: '',
			TimeOut: null,
			TimeOut2: null
		};
	},
	created() {
		this.bind();
	},
	methods: {
		bind() {
			this.$ipc.on('win-data', (e, msg) => {
				this.$nextTick(() => {
					this.MegData = msg;
					this.animation = 'animated slideInUp';
					clearTimeout(this.TimeOut);
					this.TimeOut = setTimeout(() => {
						this.animation = 'animated slideOutDown';
						clearTimeout(this.TimeOut);
						clearTimeout(this.TimeOut2);
						this.TimeOut2 = setTimeout(() => {
							this.$electron.remote.getCurrentWindow().hide();
							clearTimeout(this.TimeOut2);
						}, 500);
					}, 5000);
				});
			});
		}
	}
};
</script>

<style scoped>
/*消息弹窗*/
.cd-message-main {
	width: 100%;
	height: 100%;
	background: #fff;
	border: 1px solid #01B74F;
}
.cd-message-container {
	padding: 10px;
	color: #000;
	float: left;
	width: 100%;
}
.cd-message-container img {
	float: left;
	width: 25%;
}
.cd-message-container p {
	float: left;
	font-size: 14.5px;
	line-height: 1.6;
	width: 50%;
	/* width: calc(100% - 30px); */
	word-break: break-all;
	text-overflow: ellipsis;
	-webkit-line-clamp: 4;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	padding-left: 10px;
}
</style>
