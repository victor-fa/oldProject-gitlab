<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content">
			<div class="content" v-for="(item, index) in nasUsers" :key="index" @contextmenu="rightClick(item)">
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
		<a-modal
			:title="'验证码'"
			:visible="deliver.visiable" :mask="false" :closable="false" :maskClosable="false" width="350px" style="top: 50px;" 
			okText="确定" cancelText="取消" @ok="handleDeliver" @cancel="deliver.visiable = false">
			<div style="display: flex;justify-content: space-between;margin-bottom: 15px;">
				<p>验证码：</p>
				<a-input placeholder="请输入短信验证码" v-model="deliver.code" style="flex: 1;" />
			</div>
		</a-modal>
	</div>
</template>

<script lang="ts">
import _ from 'lodash'
import NasFileAPI from '@/api/NasFileAPI'
import UserAPI from '@/api/UserAPI'
import { loginIcons } from '../../../views/Login/iconList'
import { mapGetters } from 'vuex'

export default {
  name: 'user-manager',
	data() {
		return {
			loading: '',
			nasUsers: [],
			UploadSrc: false,
			loginIcons,
			deliver: {
				code: '',
				visiable: false,
				ugreen_no: ''
			}
		};
	},
  computed: {
    ...mapGetters('User', ['user'])
  },
	beforeMount() {
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
      NasFileAPI.fetchBindUserList().then(response => {
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
		enableUser (item) {
			const _this = this as any
			const status = item.status === 0 ? 1 : 0
			const ugreen_no = item.ugreen_no
      NasFileAPI.enableUser(ugreen_no, status).then(response => {
				if (response.data.code !== 200) return
				console.log(response.data);
      }).catch(error => {
        _this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
		deleteCommonUser (item) {
			const _this = this as any
			const ugreen_no = item.ugreen_no
      NasFileAPI.deleteCommonUser(ugreen_no).then(response => {
				if (response.data.code !== 200) return
				console.log(response.data);
      }).catch(error => {
        _this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
		showDeliver (item) {
			const _this = this as any
			_this.deliver.ugreen_no = item.ugreen_no
			UserAPI.smsCode(_this.user.phoneNo, 6).then(response => {
				if (response.data.code !== 200) return
				_this.deliver.visiable = true
				_this.$message.success('短信已发送到手机')
			}).catch(error => {
				console.log(error)
				_this.$message.error('网络连接错误,请检测网络')
			})
		},
		handleDeliver (item) {
			const _this = this as any
			const ugreen_no = _this.deliver.ugreen_no
			const deliver_code = _this.deliver.code
      NasFileAPI.deliver(ugreen_no, deliver_code).then(response => {
				if (response.data.code !== 200) return
				_this.deliver.visiable = false
				_this.deliver = {
					code: '',
					visiable: false,
					ugreen_no: ''
				}
				console.log(response.data);
      }).catch(error => {
        _this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
		rightClick: function(item) {
      const _this = this
      const { remote } = require('electron')
      const { Menu, MenuItem } = remote as any
      const menu = new Menu()
			menu.append(new MenuItem({
				label: '禁用',
				click: function () { _this.enableUser(item) }
			}));
			menu.append(new MenuItem({
				label: '删除',
				click: function () { _this.deleteCommonUser(item) }
			}));
			menu.append(new MenuItem({label: '提升为管理员',
				click: function () { _this.showDeliver(item) }
			}));
      menu.popup(remote.getCurrentWindow())
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
		.content {
			display: flex;
			&:hover {
				background: lightgray;
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
