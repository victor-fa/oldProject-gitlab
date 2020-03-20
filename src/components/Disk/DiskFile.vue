<template>
	<div>
		<div
			v-for="(item, index) in data"
			:key="index"
			:class="DiskData.DiskShowState + (item.active === true ? ' active' : '')"
			ripple
			@mousedown="select(item, index)"
			@dblclick="OpenFile(item)"
		>
			<span class="icon">
				<img :src="itemIcon(item)" draggable="false" alt="" />
			</span>
			<p>{{ item.path | filterPath }}</p>
			<div class="time">{{ item.ctime || item.mtime | formatDate }}</div>
			<div class="time">{{ item.size | filterSize }}</div>
		</div>
	</div>
</template>

<script lang="ts">
import Vue from 'vue'
import StringUtility from '../../utils/StringUtility'
export default Vue.extend({
	name: 'DiskFile',
	props: {
		data: {
			type: Array
		},
		DiskData: {
			type: Object
		}
	},
  filters: {
    formatDate (value) {
      let date: any = new Date(value);
      let y: any = date.getFullYear();
      let MM: any = date.getMonth() + 1;
      MM = MM < 10 ? ('0' + MM) : MM;
      let d = date.getDate();
      d = d < 10 ? ('0' + d) : d;
      let h = date.getHours();
      h = h < 10 ? ('0' + h) : h;
      let m = date.getMinutes();
      m = m < 10 ? ('0' + m) : m;
      let s = date.getSeconds();
      s = s < 10 ? ('0' + s) : s;
      return y + '-' + MM + '-' + d + ' ' + h + ':' + m + ':' + s;
    },
    filterPath (value) {
      return StringUtility.formatName(value);
    },
    filterSize (bytes) {
      return StringUtility.formatShowSize(bytes)
		}
	},
	methods: {
		select(item, index) {
			this.$emit('SelectFiles', event, item, index)
		},
		OpenFile(item) {
			this.$emit('OpenFile', 'open', item);
		},
		itemIcon(item) {
			const myThis = this as any
			let type = myThis.getTypeNam(item)
			return require(`../../assets/resource/${type}_icon.png`);
		},
		getTypeNam(data) {
			let typeName = 'unkonw'
			switch (data.type) {
				case 0:
					typeName = 'unkonw'
					break;
				case 1:
					typeName = 'video'
					break;
				case 2:
					typeName = 'audio'
					break;
				case 3:
					typeName = 'image'
					break;
				case 4:
					typeName = 'txt'
					break;
				case 5:
					typeName = (data.path.indexOf('.pdf') > -1 ? 'pdf' : 'unkonw')
					break;
				case 6:
					typeName = 'folder'
					break;
				default:
					break;
			}
			return typeName
		}
	}
})
</script>

<style scoped>
/*文件图标视图*/
.cd-disk-block-file {
	width: 90px;
	height: 80px;
	float: left;
	margin: 10px 10px 0 0;
	text-align: center;
	border-radius: 3px;
	cursor: pointer;
}
.cd-disk-block-file .icon {
	font-size: 30px;
	width: 100%;
	height: 40px;
	line-height: 40px;
	margin: 5px 0;
	display: block;
}
.cd-disk-block-file .icon > img {
	height: 40px;
}
.cd-disk-block-file > p {
	color: #333333;
	text-overflow: ellipsis;
	word-break: break-all;
	font-size: 11px;
	width: 100%;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}
.cd-disk-block-file > .time {
	display: none;
}
/*文件列表视图*/
.cd-disk-list-file {
	width: 100%;
	height: 35px;
	padding-left: 5px;
	cursor: pointer;
	margin-top: 5px;
}
.cd-disk-list-file img {
	width: 20px;
	height: 20px;
}
.cd-disk-list-file > .icon,
.cd-disk-list-file > p {
	float: left;
	display: inline-block;
	height: 35px;
	line-height: 35px;
	margin-left: 5px;
	font-size: 12px;
}
.cd-disk-list-file > .ivu-checkbox-wrapper {
	float: left;
	margin-top: 8px;
	margin-right: 3px;
}
.cd-disk-list-file > .icon {
	padding-top: 5px;
}
.cd-disk-list-file p {
	width: calc(56% - 52px);
}
.cd-disk-list-file > .time {
	width: 22%;
	float: left;
	height: 100%;
	font-size: 12px;
	line-height: 35px;
	text-align: left;
	text-indent: 10px;
}
.cd-disk-block-file:hover,
.cd-disk-list-file:hover {
	background: #f4f5f7;
}
/*选中样式*/
.active {
	background-color: #ececec !important;
}
</style>
