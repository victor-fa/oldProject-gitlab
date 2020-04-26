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
import { NAS_ACCESS } from '../../common/constants'
import NasFileAPI from '../../api/NasFileAPI'
import StringUtility from '../../utils/StringUtility'
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
			const nasJson = localStorage.getItem(NAS_ACCESS)
			let token = NasFileAPI.getServerUrl;
			if (nasJson !== null) {
				token = JSON.parse(nasJson).api_token
			}
			const cryptoJson = localStorage.getItem(CRYPTO_INFO)
			if (cryptoJson === null) {
				return Promise.reject(Error('not find crypto_info'))
			}
			const cryptoToken = JSON.parse(cryptoJson).crypto_token
			//接收打开文本文件的数据
			this.$nextTick(() => {
				data.forEach((item, index) => {
					this.NowLoad = item;
					this.header.title = StringUtility.formatName(item.path) + ' 文件查看';
					if (item.path.indexOf('.ugreen_nas') === -1) {
						this.LoadUrl =
							this.$path.join(__static, 'plugins/syntaxhighlighter/index.html?url=') + 
							`${NasFileAPI.getServerUrl()}/v1/file/httpEncryptDownload?uuid=${item.uuid}&path=${item.path}&crypto_token=${cryptoToken}`;
					} else {
						this.LoadUrl =
							this.$path.join(__static, 'plugins/syntaxhighlighter/index.html?url=') + 
							`${NasFileAPI.getServerUrl()}/v1/file/http_download?uuid=${item.uuid}&path=${item.path}&api_token=${token}`;
					}
					console.log(this.LoadUrl);
				});
			});
		});
	}
};
</script>

<style lang="scss" scoped>
/*文件查看窗口*/
.cd-main {
	height: 100%;
}
.cd-file-show-container {
	width: 100%;
	height: calc(100% - 30px);
	iframe {
		overflow: auto;
		width: 100%;
		height: 100%;
		border: none;
	}
}
</style>
