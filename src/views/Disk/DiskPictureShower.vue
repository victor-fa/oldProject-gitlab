<template>
	<div class="cd-image-container" @mousewheel="MouseZoom" tabindex="-1" @keydown.left="Prev" @keydown.right="Next">
		<WindowsHeader :data="header" />
		<p class="ImageShowTips">
			<span class="cd-image-zoom" :style="{ opacity: ZoomWin }">{{ ZoomPercent }}</span
			>{{ NowShow.count + 1 }}/{{ PhotoList.length }}
		</p>
		<img :class="'cd-image-show ' + (!Control ? 'cd-image-animated' : '')" :src="NowShow.URL" ref="imageShow" @load="onload" @mousedown="Drag" alt="" />
		<ul class="cd-image-control">
			<li class="sf-icon-search-plus" @click="Zoom(1)" />
			<li class="sf-icon-search-minus" @click="Zoom(-1)" />
			<li class="sf-icon-angle-left" @click="Prev" />
			<li @click="onload">1:1</li>
			<li class="sf-icon-angle-right" @click="Next" />
			<li class="sf-icon-undo" @click="roate(-90)" />
			<li class="sf-icon-redo" @click="roate(90)" />
		</ul>
	</div>
</template>

<script>
import { mapGetters } from 'vuex'
import WindowsHeader from '@/components/Disk/WindowHeader.vue'
import NasFileAPI from '@/api/NasFileAPI'
import StringUtility from '@/utils/StringUtility'
import { CryptoInfo } from '@/api/ClientModel'
export default {
	name: 'DiskPictureShower',
	components: { WindowsHeader },
	data() {
		return {
			loaded: false,
			Control: false,
			NowShow: {
				path: '',
				count: 0,
				URL: '',
				name: ''
			},
			angle: 0,
			ZoomSize: 1,
			ZoomPercent: '0%',
			ZoomWin: 0,
			PhotoList: [],
			PhotoListStr: '',
			header: {
				title: '',
				background: 'rgba(103, 103, 103, 0.5)',
				color: '#fff'
			}
		};
	},
	watch: {
		PhotoListStr: {
			handler(newValue, oldValue) {
				this.PhotoList.forEach((item, index) => {
					if (item.now) {
						item.now = 'PlayThis';
						this.ShowPicture(item, index);
					}
				});
			},
			deep: true
		},
		ZoomSize: {
			handler() {
				this.ZoomPercent = (this.ZoomSize * 100).toFixed(0) + '%';
			},
			deep: true
		}
	},
  computed: {
		...mapGetters('NasServer', ['cryptoInfo']),
	},
	created() {
		this.$ipc.on('win-data', (event, data) => {
			const filterData = data.filter(item => { return item.type === 3 && item.path.toLowerCase().indexOf('.heic') === -1 })
			if (filterData[0].path.indexOf('.safe') > -1) {
				filterData.map(item => {
					item.encrypt = this.cryptoInfo.crypto_token
					return item
				})
			}
			//接收打开图片文件的数据
			this.$nextTick(() => {
				console.log(JSON.parse(JSON.stringify(filterData)));
				filterData.forEach((item, index) => {
					if (item.isSelected === true) {
						item.now = 'PlayThis';
						item.count = index;
						this.ShowPicture(item, index);
					}
				});
				this.PhotoList = filterData;
				this.PhotoListStr = JSON.stringify(this.PhotoList)
			});
		});
	},
	methods: {
		onload() {
			this.loaded = true;
			this.ZoomSize = 1;
			this.angle = 0;
			let img_show = this.$refs.imageShow;
			img_show.removeAttribute('style');
			document.getElementsByClassName('cd-image-container')[0].focus();
			let time_p1 = setInterval(() => {
				let imgW = img_show.offsetWidth;
				let imgH = img_show.offsetHeight;
				if (img_show.complete) {
					if (imgW >= imgH) {
						let ratio = window.innerWidth / imgW;
						img_show.style.width = imgW * ratio + 'px';
					} else {
						let ratio = window.innerHeight / imgH;
						img_show.style.height = imgH * ratio + 'px';
					}
					this.centerImg();
					this.loaded = false;
					img_show.style.opacity = 1;
				}
				time_p1 && clearInterval(time_p1);
			}, 0);
		},
		centerImg() {
			this.loaded = false;
			let img_show = this.$refs.imageShow;
			img_show.style.left = '0';
			img_show.style.top = '0';
		},
		ShowPicture(item, index) {
			this.NowShow = item;
			this.NowShow.count = index;
			if (item.encrypt) {
				this.NowShow.name = item.name
				this.NowShow.URL = NasFileAPI.encryptDownload({
					uuid: item.uuid,
					path: item.path,
					crypto_token: item.encrypt
				});
			} else {
				this.NowShow.name = item.name
				this.NowShow.URL = NasFileAPI.download({
					uuid: item.uuid,
					path: item.path
				});
			}
			console.log(this.NowShow.URL);
			this.header.title = this.NowShow.name + '-图片查看';
		},
		orginz() {
			let img_show = this.$refs.imageShow;
			img_show.removeAttribute('style');
			this.ZoomSize = 1;
			this.centerImg();
		},
		Zoom(a) {
			this.Control = true;
			let img_show = this.$refs.imageShow;
			let oldWidth = img_show.offsetWidth;
			let oldHeight = img_show.offsetHeight;
			let oldLeft = img_show.offsetLeft;
			let oldTop = img_show.offsetTop;
			let scaleX = (event.clientX - oldLeft) / oldWidth; //比例
			let scaleY = (event.clientY - oldTop) / oldHeight;
			if (a < 0 && this.ZoomSize > 0.3) {
				this.ZoomSize = this.ZoomSize - 0.1;
				img_show.style.width = img_show.offsetWidth * 0.9 + 'px';
				img_show.style.height = img_show.offsetHeight * 0.9 + 'px';
			} else if (a > 0 && this.ZoomSize < 3) {
					this.ZoomSize = this.ZoomSize + 0.1;
				img_show.style.width = img_show.offsetWidth * 1.1 + 'px';
				img_show.style.height = img_show.offsetHeight * 1.1 + 'px';
			}
			let newWidth = img_show.offsetWidth;
			let newHeight = img_show.offsetHeight;
			this.ZoomWin = 1;
			let time_p = setTimeout(() => {
				this.ZoomWin = 0;
				time_p && clearTimeout(time_p);
				this.Control = false;
			}, 1500);
			this.centerImg();
		},
		Drag() {
			let img_show = this.$refs.imageShow;
			event.preventDefault();
			let _this = this;
			this.Control = true;
			let oDragObj = img_show;
			let nTY = parseInt(oDragObj.style.top + 0);
			let y = event.clientY;
			let nTX = parseInt(oDragObj.style.left + 0);
			let x = event.clientX;
			document.onmousemove = function(event) {
				let top = nTY + event.clientY - y;
				let left = nTX + event.clientX - x;
				if (
					left < -img_show.offsetWidth * 2 + 10 ||
					left > window.innerWidth - 10 ||
					top < -img_show.offsetHeight * 2 + 10 ||
					top > window.innerHeight * 2 - 20
				) {
					document.onmousemove = null;
					_this.centerImg();
					return;
				}
				oDragObj.style.top = top + 'px';
				oDragObj.style.left = left + 'px';
				document.onmouseup = function() {
					_this.Control = false;
					this.onmousemove = null;
				};
			};
			document.onmouseup = function() {
				_this.Control = false;
				this.onmousemove = null;
			};
			return false;
		},
		MouseZoom() {
			this.Zoom(event.wheelDelta);
		},
		roate(a) {
			let img_show = this.$refs.imageShow;
			this.angle = this.angle + a;
			img_show.style.webkitTransform = 'rotate(' + this.angle + 'deg)';
		},
		Next() {
			if (!this.PhotoList.length) {
				return;
			}
			let NowCount = this.NowShow.count;
			let AllCount = this.PhotoList.length;
			if (NowCount !== AllCount - 1) {
				this.PhotoList.forEach((item, index) => {
					item.now = false;
				});
				this.PhotoList[NowCount + 1].now = 'PlayThis';
				this.PhotoListStr = JSON.stringify(this.PhotoList)
			}
		},
		Prev() {
			if (!this.PhotoList.length) {
				return;
			}
			let NowCount = this.NowShow.count;
			if (this.NowShow.count !== 0) {
				this.PhotoList.forEach((item, index) => {
					item.now = false;
				});
				this.PhotoList[NowCount - 1].now = 'PlayThis';
				this.PhotoListStr = JSON.stringify(this.PhotoList)
			}
		}
	}
};
</script>

<style lang="less" scoped>
.loading {
	animation: loading 1s linear infinite;
}
@keyframes loading {
	from {
		transform: rotate(0deg);
	}
	50% {
		transform: rotate(180deg);
	}
	to {
		transform: rotate(360deg);
	}
}
/*图片查看*/
.cd-image-container {
	float: left;
	width: 100%;
	height: 100%;
	background: #4f4f4f;
	-moz-user-select: none;
	-webkit-user-select: none;
	-ms-user-select: none;
	-khtml-user-select: none;
	user-select: none;
	.ImageShowTips {
		width: 100%;
		text-align: right;
		padding-right: 10px;
		line-height: 30px;
		font-size: 14px;
		color: #fff;
		position: absolute;
		z-index: 2;
		text-shadow: 0 0 5px rgb(0, 0, 0);
		.cd-image-zoom {
			height: 30px;
			color: #fff;
			text-align: center;
			font-size: 14px;
			line-height: 30px;
			opacity: 1;
			-webkit-transition: all 0.35s;
			-moz-transition: all 0.35s;
			-o-transition: all 0.35s;
			margin-right: 10px;
		}
	}
	.cd-image-show {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		z-index: 1;
		margin: auto;
		min-width: 0 !important;
		max-width: none !important;
		min-height: 0 !important;
		max-height: none !important;
		cursor: -webkit-grab;
		-webkit-transition: none !important;
		-moz-transition: none !important;
		-o-transition: none !important;
		transition: none !important;
	}
	.cd-image-animated {
		-webkit-transition: all 0.3s ease-out !important;
		-moz-transition: all 0.3s ease-out !important;
		-o-transition: all 0.3s ease-out !important;
		transition: all 0.3s ease-out !important;
	}
	.cd-image-control {
		z-index: 3;
		position: absolute;
		margin: 0 auto;
		bottom: 30px;
		height: 42px;
		left: calc(~"50% - 145px");
		border-radius: 3px;
		-webkit-border-radius: 3px;
		-moz-border-radius: 3px;
		background: rgba(103, 103, 103, 0.5);
		text-align: center;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 0, 0, 0.2);
		li {
			float: left;
			width: 42px;
			height: 42px;
			font-size: 14px;
			text-align: center;
			line-height: 42px;
			cursor: pointer;
			color: #fff;
			&:hover {
				background: rgba(125, 125, 125, 0.5);
				color: #fff;
			}
		}
		.sf-icon-angle-left, .sf-icon-angle-right {
			font-size: 22px;
		}
	}
}
</style>
