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
			<p v-if="item.isUser">{{ item.nick_name }}（{{ item.ugreen_no }}）</p>
			<p v-else>{{ item.path | filterPath }}</p>
			<div v-if="!item.isUser" class="time">{{ item.ctime || item.mtime | formatDate }}</div>
			<div v-if="!item.isUser" class="time" style="width: 20%">{{ item.size | filterSize }}</div>
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
      return StringUtility.formatShowMtime(value);
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
			if (data.type === 6 || data.myself_folder) {
				typeName = 'folder'
			} else {
				typeName = StringUtility.suffixToTpe(StringUtility.formatSuffix(data.path))
			}
			return typeName
		}
	}
})
</script>

<style lang="less" scoped>
/*文件图标视图*/
.cd-disk-block-file {
	width: 90px;
	height: 80px;
	float: left;
	margin: 10px 10px 0 0;
	text-align: center;
	border-radius: 3px;
	cursor: pointer;
	.icon {
		font-size: 30px;
		width: 100%;
		height: 40px;
		line-height: 40px;
		margin: 5px 0;
		display: block;
		img {
			height: 40px;
		}
	}
	p {
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
	.time {
		display: none;
	}
}
/*文件列表视图*/
.cd-disk-list-file {
	width: 100%;
	height: 35px;
	padding-left: 5px;
	cursor: pointer;
	margin-top: 5px;
	color: #000000;
	text-align: left;
	float: left;
	img {
		width: 20px;
		height: 20px;
	}
	.icon, p {
		float: left;
		display: inline-block;
		height: 35px;
		line-height: 35px;
		margin-left: 5px;
		font-size: 12px;
	}
	.ivu-checkbox-wrapper {
		float: left;
		margin-top: 8px;
		margin-right: 3px;
	}
	.icon {
		padding-top: 0;
	}
	p {
		width: calc(46%);
	}
	.time {
		width: 27%;
		float: left;
		height: 100%;
		font-size: 12px;
		line-height: 35px;
		text-align: left;
		text-indent: 10px;
	}
}
.cd-disk-block-file:hover,
.cd-disk-list-file:hover {
	background: #f4f5f7;
}
.active {
	background-color: #ececec !important;
}
</style>
