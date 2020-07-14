<template>
	<div class="cd-pdf-window">
		<WindowsHeader :data="header" />
		<div class="cd-pdf-show-container">
			<iframe :src="src"></iframe>
		</div>
	</div>
</template>

<script>
import WindowsHeader from '@/components/Disk/WindowHeader.vue'
import NasFileAPI from '@/api/NasFileAPI'
import StringUtility from '@/utils/StringUtility'
export default {
	name: 'DiskPdfView',
	components: { WindowsHeader },
	data() {
		return {
			NowPlay: {
				path: '',
				name: ''
			},
			src: null,
			header: {
				title: '',
				background: '#4f4f4f',
				color: '#fff'
			}
		};
	},
	created() {
		this.$ipc.on('win-data', (event, data) => {
			//接收打开pdf文件的数据
			this.$nextTick(() => {
				data.forEach((item, index) => {
					this.NowPlay.path = item.path;
					if (item.encrypt) {
						this.NowPlay.name = item.data.name
						this.src = this.$path.join(__static, 'plugins/pdfjs/web/viewer.html?file=') + encodeURIComponent(NasFileAPI.httpEncryptDownload({
							uuid: item.data.uuid,
							path: item.data.path,
							crypto_token: item.encrypt
						}))
					} else {
						this.NowPlay.name = item.name
						this.src = this.$path.join(__static, 'plugins/pdfjs/web/viewer.html?file=') + encodeURIComponent(NasFileAPI.httpDownload({
							uuid: item.uuid,
							path: item.path
						}))
					}
					console.log(this.src);
					this.header.title = this.NowPlay.name + '-PDF阅读器';
				});
			});
		});
	}
};
</script>

<style scoped>
/*pdf窗口*/
html,body,#app{
	height: 100%;
}
.cd-pdf-window {
	width: 100%;
	height: 100%;
	background: #4f4f4f;
}
.cd-pdf-show-container {
	width: 100%;
	height: calc(100% - 46px);
}
iframe {
	width: 100%;
	height: 100%;
	border: none;
}
</style>
