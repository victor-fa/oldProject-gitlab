<template>
	<div class="cd-main FileContent">
		<WindowsHeader :data="header" style="border-bottom: 2px solid #6ce26c;" />
		<div class="cd-file-show-container">
			<iframe :src="NowLoad.path"></iframe>
		</div>
	</div>
</template>

<script>
import WindowsHeader from '@/components/Disk/WindowHeader.vue'
import NasFileAPI from '@/api/NasFileAPI'
import StringUtility from '@/utils/StringUtility'
import { NAS_ACCESS, CRYPTO_INFO } from '@/common/constants'
export default {
	name: 'DiskFileContent',
	components: { WindowsHeader },
	data() {
		return {
			NowLoad: {
				path: '',
				content: '',
				name: ''
			},
			name: '',
			header: {
				title: '',
				color: '#000'
			}
		};
	},
	created() {
		this.$ipc.on('win-data', (event, data) => {
			const nasJson = localStorage.getItem(NAS_ACCESS)
			let token = '';
			if (nasJson !== null) {
				token = JSON.parse(nasJson).api_token
			}
			//接收打开文本文件的数据
			this.$nextTick(() => {
				data.forEach((item, index) => {
					this.NowLoad = item;
					if (item.encrypt) {
						this.NowLoad.name = item.data.name
						this.NowLoad.path =
							this.$path.join(__static, 'plugins/syntaxhighlighter/index.html?url=') + 
							`${NasFileAPI.getServerUrl()}/v1/crypto/http_download?uuid=${item.data.uuid}&path=${item.data.path}&crypto_token=${item.encrypt}`;
					} else {
						this.NowLoad.name = item.name
						this.NowLoad.path =
							this.$path.join(__static, 'plugins/syntaxhighlighter/index.html?url=') + 
							`${NasFileAPI.getServerUrl()}/v1/file/http_download?uuid=${item.uuid}&path=${item.path}&api_token=${token}`;
					}
					this.header.title = this.NowLoad.name + ' 文件查看';
					console.log(this.NowLoad.path);
				});
			});
		});
	}
};
</script>

<style lang="less" scoped>
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
