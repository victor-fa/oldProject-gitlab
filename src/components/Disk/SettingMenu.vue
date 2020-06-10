<template>
	<ul class="cd-setting-menu">
		<li v-for="(item, index) in data" :key="index" :class="item.active" @click="change(item, index)">
			<p>{{ item.name }}</p>
		</li>
	</ul>
</template>

<script>
export default {
	name: 'SettingMenu',
	props: {
		data: {
			type: Object
		}
	},
	methods: {
		change(item, index) {
			this.$emit('change', item, index);
		}
	}
};
</script>

<style lang="less" scoped>
.cd-setting-menu {
	width: 100px;
	height: 100%;
	float: left;
	overflow: unset !important;
	z-index: 1;
	overflow-y: scroll;
	li {
		width: 100%;
		height: 44px;
		background: #fff;
		color: #6e6e6e;
		border-radius: 5px 0 0 5px;
		border: 1px solid #fff;
		* {
			float: left;
			line-height: 41px;
		}
		&:active {
			width: calc(100% + 1px);
			border: 1px solid #eee;
			border-right: none;
			color: #06B650 !important;
			cursor: default !important;
		}
		&:hover {
			color: #06B650;
			cursor: pointer;
		}
		span {
			width: 35px;
			height: 35px;
			text-align: center;
		}
		p {
			width: 100%;
			margin-bottom: 0;
		}
	}
}
</style>
