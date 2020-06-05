<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content">
			<div style="display: flex;" v-for="(item, index) in nasUsers" :key="index">
				<img class="userImg" v-if="item.image" :src="item.image">
				<img class="userImg" v-else :src="loginIcons.account">
				<div class="userContent">
					<span>{{item.nic_name}}（{{item.ugreen_no}}）</span>
					<span>{{item.atime}}</span>
				</div>
				<span style="margin: 20px 10px 0 0;">{{item.status === 0 ? '禁用' : item.is_connecting === 0 ? '未连接' : '在线'}}</span>
				<img class="userEnter" :src="loginIcons.open">
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import _ from 'lodash'
import ClientAPI from '@/api/ClientAPI'
import { loginIcons } from '../../../views/Login/iconList'

export default {
  name: 'user-manager',
	data() {
		return {
			loading: '',
			nasUsers: [],
			UploadSrc: false,
			loginIcons
		};
  },
	created() {
		// const _this = this as any
		// _this.fetchBindUserList()
	},
	mounted() {
		const _this = this as any
		_this.fetchBindUserList()
	},
  methods: {
		handleBottom(data) {
			switch (data) {
				case 0:
					this.handleSave(data)
					break;
				case 1:
					this.close()
					break;
				case 2:
					this.handleSave(data)
					break;
				default:
					break;
			}
		},
		close() {
			const _this = this as any
			_this.$electron.remote.getCurrentWindow().close()
		},
		handleSave (data) {
			// if (data === 0) setTimeout(() => _this.close(), 3000);
		},
    fetchBindUserList () {
			const _this = this as any
      _this.loading = true
      ClientAPI.fetchBindUserList().then(response => {
        _this.loading = false
				if (response.data.code !== 200) return
        _this.nasUsers = _.get(response.data.data, 'nas_users')
				console.log(JSON.parse(JSON.stringify(_this.nasUsers)));
      }).catch(error => {
        _this.loading = false
        _this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
  }
}
</script>

<style lang="less" scoped>
p {
	color: #000;
	text-align: left;
}

.cd-setting-main {
	width: 100%;
	height: 86%;
	padding: 10px;
	display: inline-flex;
	.cd-setting-content {
		width: calc(100%);
		height: 100%;
		border: 1px solid #eee;
		padding: 20px;
		float: left;
		overflow-y: scroll;
		.cd-setting-info {
			width: 100%;
			font-size: 14px;
			padding-left: 5px;
			line-height: 30px;
			color: #000;
			span {
				background: #06B650;
				color: #fff;
				border-radius: 5px;
				padding: 3px 5px;
				font-size: 12px;
				margin-left: 10px;
			}
			button {
				background: none;
				font-size: 14px;
				margin-right: 10px;
			}
			img {
				width: 70px;
				height: 70px;
				margin: 15px 0 0 -3px;
			}
		}
		.cd-user-head {
			width: 70px;
			height: 70px;
			position: absolute;
			left: 154px;
			top: 70px;
			overflow: unset;
			transition: all 0.35s;
			input {
				position: absolute;
				top: -50px;
				left: -11px;
				display: none;
			}
			&:hover {
				box-shadow: 0 0 29px -2px #ffffff;
				cursor: pointer;
				transition: all 0.35s;
			}
		}
		.userImg {
			width: 30px;
			height: 30px;
			margin: 15px 0 0 10px;
		}
		.userContent {
			flex: 1;
			display: flex;
			flex-flow: column;
			text-align: left;
			padding: 10px;
		}
		.userEnter {
			width: 10px;
			height: 14px;
			margin: 23px 10px 0px 0px;
		}
	}
}

</style>
