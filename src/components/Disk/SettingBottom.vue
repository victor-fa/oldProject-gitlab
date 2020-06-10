<template>
	<div class="cd-setting-bottom">
		<a-button @click="handle(2)">应 用</a-button>
		<a-button @click="handle(1)">取 消</a-button>
		<a-button @click="handle(0)">确 定</a-button>
	</div>
</template>

<script>
export default {
	name: 'SettingBottom',
	props: {
		data: {
			type: Object
		}
	},
	methods: {
		handle(flag) {
			this.$emit('callback', flag);
		}
	}
};
</script>

<style lang="less" scoped>
.cd-setting-bottom {
	width: calc(100% - 136px);
	position: absolute;
	bottom: 15px;
	right: 10px;
	display: flex;
	flex-direction: row;
	flex-flow: row-reverse;
	button {
		margin-right: 15px;
	}
}
</style>
