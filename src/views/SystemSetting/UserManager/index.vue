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
import Vue from 'vue'
import NasFileAPI from '@/api/NasFileAPI'
import UserAPI from '@/api/UserAPI'
import { DeviceInfo, DeviceRole, User } from '@/api/UserModel'
import { NasInfo } from '@/api/ClientModel'
import { loginIcons } from '../../../views/Login/iconList'
import { mapGetters } from 'vuex'

export default Vue.extend({
  name: 'user-manager',
	data() {
		return {
			nasUsers: [],
			UploadSrc: false,
			loginIcons,
			deliver: {
				code: '',
				visiable: false,
				ugreen_no: ''
			},
			isUserAdmin: false
		};
	},
  computed: {
    ...mapGetters('User', ['user', 'nasDevices']),
		...mapGetters('NasServer', ['nasInfo']),
  },
	beforeMount() {
		this.fetchBindUserList()
		this.isUserAdmin = this.isRoleAdmin()
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
			// if (data === 0) setTimeout(() => this.close(), 3000);
		},
    fetchBindUserList () {
      NasFileAPI.fetchBindUserList().then(response => {
				if (response.data.code !== 200) return
        this.nasUsers = _.get(response.data.data, 'nas_users')
				console.log(JSON.parse(JSON.stringify(this.nasUsers)));
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
		enableUser (item) {
			const status = item.status === 0 ? 1 : 0
			const ugreen_no = item.ugreen_no
      NasFileAPI.enableUser(ugreen_no, status).then(response => {
				if (response.data.code !== 200) return
				console.log(response.data);
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
		deleteCommonUser (item) {
			const ugreen_no = item.ugreen_no
      NasFileAPI.deleteCommonUser(ugreen_no).then(response => {
				if (response.data.code !== 200) return
				console.log(response.data);
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
		showDeliver (item) {
			this.deliver.ugreen_no = item.ugreen_no
			UserAPI.smsCode(this.user.phoneNo, 6).then(response => {
				if (response.data.code !== 200) return
				this.deliver.visiable = true
				this.$message.success('短信已发送到手机')
			}).catch(error => {
				console.log(error)
				this.$message.error('网络连接错误,请检测网络')
			})
		},
		handleDeliver (item) {
			const ugreen_no = this.deliver.ugreen_no
			const deliver_code = this.deliver.code
      NasFileAPI.deliver(ugreen_no, deliver_code).then(response => {
				if (response.data.code !== 200) return
				this.deliver.visiable = false
				this.deliver = {
					code: '',
					visiable: false,
					ugreen_no: ''
				}
				console.log(response.data);
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
		rightClick: function(item) {
      const { remote } = require('electron')
      const { Menu, MenuItem } = remote as any
			const menu = new Menu()
			if (this.isUserAdmin) {
				menu.append(new MenuItem({
					label: '禁用',
					click: function () { this.enableUser(item) }
				}));
				menu.append(new MenuItem({
					label: '删除',
					click: function () { this.deleteCommonUser(item) }
				}));
				menu.append(new MenuItem({label: '提升为管理员',
					click: function () { this.showDeliver(item) }
				}));
			}
      menu.popup(remote.getCurrentWindow())
    },
    isRoleAdmin () {
			const curNas = this.nasInfo as NasInfo
			const boundDevices = this.nasDevices as DeviceInfo[]
			const curUser = this.user as User
      for (let index = 0; index < boundDevices.length; index++) {
				const item = boundDevices[index]
        if (curNas.sn === item.sn && item.uno === curUser.ugreenNo && item.role === DeviceRole.admin) return true
      }
      return false
    }
  }
})
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
			&:hover, &:active, &:focus {
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
