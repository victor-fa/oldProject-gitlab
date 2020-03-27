<template>
	<ul class="cd-mouse-menu" ref="MouseMenu" v-show="MouseMenuShow">
		<li v-for="(item, index) in MenuData" :key="index" @click="MenuClick(item.commend, item.data)" v-show="toBoolean(item.vif, 'vif')">
			<button :disabled="toBoolean(item.disabled, 'disabled')">
				{{ item.name }}<span>{{ item.key }}</span>
			</button>
		</li>
	</ul>
</template>

<script>
export default {
	name: 'MouseMenu',
	props: {
		type: {
			type: String
		},
		node: {
			type: Element
		},
		DiskData: {
			type: Object
		}
	},
	data() {
		return {
			DiskMainMenu: [
				{ name: '上传文件', key: '', commend: 'upload', disabled: "ClassifyName!=='网盘'" },
				{ name: '新建文件夹', key: '', commend: '', disabled: "ClassifyName!=='网盘'" },
				{ name: '清空剪切板', key: '', commend: 'clear', vif: "ClassifyName==='网盘'", disabled: 'Clipboard.length===0' },
				{ name: '粘贴', key: '', commend: 'paste', vif: "ClassifyName==='网盘'", disabled: 'Clipboard.length===0' },
				{ name: '刷新', key: '', commend: 'reload' }
			],
			DiskFileMenu: [
				{ name: '打开', key: '', commend: 'open', data: '', disabled: 'SelectFiles.length>1' },
				{ name: '下载', key: '', commend: 'download', data: '' },
				{ name: '移动到', key: '', commend: 'MoveTo', data: '' },
				{ name: '复制', key: '', commend: 'Copy', data: '' },
				{ name: '剪切', key: '', commend: 'Cut', data: '' },
				{ name: '重命名', key: '', commend: 'rename', data: '', disabled: 'SelectFiles.length>1' },
				{ name: '删除', key: '', commend: 'delete', data: '' },
				{ name: '分享', key: '', commend: 'share', data: '', disabled: 'SelectFiles.length>1' },
				{ name: '收藏', key: '', commend: 'favourite', data: '' },
				{ name: '移入加密空间', key: '', commend: 'encrypt', data: '' },
				{ name: '移入备份空间', key: '', commend: 'backup', data: '' },
				{ name: '属性', key: '', commend: 'info', data: '', disabled: 'SelectFiles.length>1' }
			],
			DiskMyselfMenu: [
				{ name: '打开', key: '', commend: 'open', data: '', disabled: 'SelectFiles.length>1' },
				{ name: '修改信息', key: '', commend: 'modify', data: '', disabled: 'SelectFiles.length>1' },
				{ name: '删除', key: '', commend: 'delete', data: '' },
				{ name: '分享', key: '', commend: 'share', data: '' },
				{ name: '属性', key: '', commend: 'info', data: '', disabled: 'SelectFiles.length>1' }
			],
			DiskShareMenu: [
				{ name: '打开', key: '', commend: 'open', data: '', disabled: 'SelectFiles.length>1' },
				{ name: '取消分享', key: '', commend: 'cancel-share', data: '', disabled: 'SelectFiles.length>1' },
				{ name: '属性', key: '', commend: 'info', data: '', disabled: 'SelectFiles.length>1' }
			],
			DiskCollectMenu: [
				{ name: '打开', key: '', commend: 'open', data: '', disabled: 'SelectFiles.length>1' },
				{ name: '取消收藏', key: '', commend: 'cancel-favourite', data: '' },
				{ name: '属性', key: '', commend: 'info', data: '', disabled: 'SelectFiles.length>1' }
			],
			MenuData: [],
			MouseMenuShow: false
		};
	},
	watch: {
		type: {
			handler() {
				this.MouseMenuShow = false;
			},
			deep: true
		}
	},
	beforeMount() {
		document.onclick = document.onmousewheel = () => {
			this.MouseMenuShow = false;
		};
	},
	methods: {
		toBoolean(data, type) {
			if (data === undefined && type === 'vif') {
				return true;
			} else if (data === undefined && type === 'disabled') {
				return false;
			}
			return eval('this.DiskData.' + data);
		},
		UpdateMenuData(flag) {
			this.MouseMenuShow = false;
			if (flag) {
				console.log(this.type);
				if (this.type === 'share') {
					this.MenuData = this.DiskShareMenu;
				} else if (this.type === 'collect') {
					this.MenuData = this.DiskCollectMenu;
				} else if (this.type === 'custom') {
					this.MenuData = this.DiskMyselfMenu;
				} else {
					this.MenuData = this.DiskFileMenu;
				}
			} else {
				this.MenuData = this.DiskMainMenu;
			}
		},
		MenuClick(commend, data) {
			this.$emit('callback', commend, data);
			this.MouseMenuShow = false;
		},
		MenuShow(flag) {
			if (event.button !== 2) {
				this.MouseMenuShow = false;
				return;
			}
			this.UpdateMenuData(flag);
			event.preventDefault();
			event.stopPropagation();
			let menu = this.$refs.MouseMenu;
			let createNode = this.node;
			menu.style.left = event.pageX + -parseFloat(createNode.getBoundingClientRect().left) + createNode.offsetLeft + 'px';
			menu.style.top = event.pageY + -parseFloat(createNode.getBoundingClientRect().top) + createNode.offsetTop + 'px';
			if (menu.getBoundingClientRect().left + menu.offsetWidth > createNode.getBoundingClientRect().width) {
				menu.style.left = createNode.getBoundingClientRect().width - menu.getBoundingClientRect().width + 'px';
			}
			if (menu.getBoundingClientRect().top + menu.offsetHeight - createNode.getBoundingClientRect().top > createNode.offsetHeight) {
				menu.style.top = createNode.getBoundingClientRect().height - menu.getBoundingClientRect().height + 'px';
			}
			createNode.onmouseup = () => {
				if (event.button === 2) {
					createNode.onmousedown = null;
					createNode.onmouseup = null;
				}
			};
			this.MouseMenuShow = true;
		}
	}
};
</script>

<style scoped>
/*右键菜单*/
.cd-mouse-menu {
	position: absolute;
	z-index: 22;
	width: auto;
	height: auto;
	min-width: 120pt;
	background: #fff;
	box-shadow: 0 3px 3px 0 rgba(0, 0, 0, 0.14), 0 1px 7px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -1px rgba(0, 0, 0, 0.2);
	-moz-user-select: none;
	-webkit-user-select: none;
	-ms-user-select: none;
	-khtml-user-select: none;
	user-select: none;
}
.cd-mouse-menu li {
	width: auto;
	height: 30px;
	max-width: 400px;
	margin-bottom: 2px;
}
.cd-mouse-menu li button {
	width: 100%;
	color: #333;
	text-align: left;
	padding: 6px 10px;
	background: none;
	font-size: 12px;
	white-space: nowrap;
	border: none;
}
.cd-mouse-menu li:last-child {
	margin-bottom: 0;
}
.cd-mouse-menu li span {
	font-size: 12px;
	color: #bfbfbf;
	position: absolute;
	right: 10px;
}
.cd-mouse-menu li:hover {
	background-color: #eee;
	color: #000;
	cursor: pointer;
}
</style>
