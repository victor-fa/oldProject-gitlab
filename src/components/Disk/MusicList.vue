<template>
	<ul class="sf-music-player-list">
		<li v-for="(item, index) in PlayList" :key="index" :class="item.play" @click="ClickPlay(item, index)">
			{{ 9 > index ? '0' : '' }}{{ index + 1 }} {{ item.path | filterName }}
		</li>
	</ul>
</template>

<script>
import StringUtility from '../../utils/StringUtility'
export default {
	name: 'MusicList',
	props: {
		PlayList: {
			type: Array
		}
	},
	filters: {
		filterName(data) {
			return StringUtility.formatName(data)
		}
	},
	methods: {
		ClickPlay(item, index) {
			this.PlayList.forEach(list => {
				list.play = false;
			});
			item.play = 'active';
			this.$emit('play', item, index);
		}
	}
};
</script>

<style scoped>
.sf-music-player-list {
	width: 100%;
	height: calc(100% - 180px);
	overflow-y: auto;
	background: #fff;
	position: relative;
	z-index: 2;
	text-align: left;
}
.sf-music-player-list li {
	width: 100%;
	height: 35px;
	line-height: 35px;
	color: #4a4a4a;
	border-top: 1px solid #dcdbdb;
	text-indent: 10px;
	font-size: 12px;
}
.sf-music-player-list li:hover {
	color: #01B74F;
	cursor: pointer;
}
.sf-music-player-list .active {
	color: #01B74F !important;
	background-color: #eaecf0;
}
</style>
