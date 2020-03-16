<template>
	<div class="cd-main FileContent">
		<WindowsHeader :data="header" style="border-bottom: 2px solid #6ce26c;" />
		<div class="cd-file-show-container">
			<iframe :src="LoadUrl"></iframe>
		</div>
	</div>
</template>

<script>
import WindowsHeader from '../../components/Disk/WindowHeader.vue'
export default {
	name: 'DiskFileContent',
	components: { WindowsHeader },
	data() {
		return {
			NowLoad: {
				path: '',
				content: ''
			},
			LoadUrl: '',
			header: {
				title: ''
			}
		};
	},
	created() {
		this.$ipc.on('win-data', (event, data) => {
			//接收打开文本文件的数据
			this.$nextTick(() => {
				this.NowLoad = data;
				this.header.title = data.path + ' 文件查看';
				const path = require('path');
				this.LoadUrl =
					path.join(__static, 'plugins/syntaxhighlighter/index.html?id=') +
					data.uuid +
					'&type=' +
					data.type +
					'&server=' +
					'http://192.168.10.91:9999';
			});
		});
	}
};
</script>

<style scoped>
/*文件查看窗口*/
.cd-file-show-container {
	width: 100%;
	height: calc(100% - 30px);
}
.cd-file-show-container iframe {
	overflow: auto;
}
</style>
