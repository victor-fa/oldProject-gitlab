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
				data.forEach((item, index) => {
					this.NowLoad = item;
					this.header.title = item.path + ' 文件查看';
					this.LoadUrl =
						this.$path.join(__static, 'plugins/syntaxhighlighter/index.html?url=') +
						'http://192.168.10.91:9999/v1/file/http_download?uuid=A252FB4252FB19AD&path=/.ugreen_nas/6001/path.txt&api_token=MzhjNDBhYzY5NzMyMDcwNTc3NzFlNzRhMWYzODE4M2Y5ZGMwMzhjZQ==';
					console.log(this.LoadUrl);
				});
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
