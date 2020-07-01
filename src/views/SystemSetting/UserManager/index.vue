<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content">
			<div class="content" v-for="(item, index) in nasUsers" :key="index">
				<span class="role" v-show="item.role === 1">管理员</span>
				<span class="role" v-show="item.role === 0 && index === 1">共享者</span>
				<div class="detail" @contextmenu="rightClick(item)">
					<img class="userImg" v-if="item.image" :src="item.image">
					<img class="userImg" v-else :src="loginIcons.user">
					<div class="userContent">
						<span>{{item.nic_name}}（{{item.ugreen_no}}）</span>
						<span>{{item.atime | filterTime}}</span>
					</div>
					<span class="describe" :style="{color: item.is_connecting === 0 ? '#9C9FA9' : '#007934'}">
						{{item.status === 0 ? '已禁用' : item.is_connecting === 0 ? '不在线' : '在线'}}
					</span>
				</div>
			</div>
		</div>
		<a-modal
			:title="'验证码'"
			:visible="deliver.visiable" :mask="false" :closable="false" :maskClosable="false" width="350px" style="top: 50px;" 
			okText="确定" cancelText="取消" @ok="handleDeliver" @cancel="deliver.visiable = false">
			<div style="display: flex;justify-content: space-between;margin-bottom: 15px;">
				<p>验证码：</p>
				<a-input placeholder="请输入短信验证码" v-model="deliver.code" style="flex: 1;" :max-length="6"/>
			</div>
		</a-modal>
	</div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import NasFileAPI from '@/api/NasFileAPI'
import processCenter, { EventName } from '@/utils/processCenter'
import UserAPI from '@/api/UserAPI'
import { DeviceRole, User } from '@/api/UserModel'
import { NasInfo, NasAccessInfo } from '@/api/ClientModel'
import StringUtility from '@/utils/StringUtility'
import { loginIcons } from '@/views/Login/iconList'
import { mapGetters } from 'vuex'

export default Vue.extend({
  name: 'user-manager',
	data() {
		return {
			nasUsers: [] as any,
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
    ...mapGetters('User', ['user']),
		...mapGetters('NasServer', ['nasInfo', 'accessInfo']),
	},
	filters: {
		filterTime(data) {
			return StringUtility.formatShowMtime(data)
		}
	},
	beforeMount() {
		this.fetchBindUserList()
		this.isUserAdmin = this.accessInfo.role === DeviceRole.admin
	},
  methods: {
		handleSave (data) {
			// if (data === 0) setTimeout(() => this.close(), 3000);
		},
    fetchBindUserList () {
      NasFileAPI.fetchBindUserList().then(response => {
				if (response.data.code !== 200) return
				this.nasUsers = _.get(response.data.data, 'nas_users')
				this.nasUsers.sort((a, b) => {	// 在线靠前
					if (a.is_connecting > b.is_connecting) return -1
				})
				this.nasUsers.sort((a, b) => {	// 管理员置顶
					if (a.role > b.role) return -1
				})
				console.log(JSON.parse(JSON.stringify(this.nasUsers)));
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
		enableUser (item) {
			const status = item.status === 0 ? 1 : 0
			const ugreen_no = item.ugreen_no
      this.showDeleteDialog('您确定禁用该用户吗？', '禁用该用户后，该用户将无法登录设备', '禁用').then(result => {
        if (result === 1) return
				NasFileAPI.enableUser(ugreen_no, status).then(response => {
					if (response.data.code !== 200) return
					this.fetchBindUserList()
					console.log(response.data);
				}).catch(error => {
					this.$message.error('网络连接错误，请检测网络')
					console.log(error)
				})
      })
		},
		deleteCommonUser (item) {
			const ugreen_no = item.ugreen_no
      this.showDeleteDialog('您确定删除该用户吗？', '删除用户后，会清除该用户上传的所有数据。', '删除').then(result => {
        if (result === 1) return
				NasFileAPI.deleteCommonUser(ugreen_no).then(response => {
					if (response.data.code !== 200) return
					this.fetchBindUserList()
					console.log(response.data);
				}).catch(error => {
					this.$message.error('网络连接错误，请检测网络')
					console.log(error)
				})
      })
		},
		showDeliverModal (item) {
			this.deliver.ugreen_no = item.ugreen_no
			const curNas = this.nasInfo as NasInfo
      this.showDeleteDialog('确认转让您的管理员身份？', '每台设备只有一个管理员！\n身份转让后，您将失去该设备的管理员权限。', '确定').then(result => {
        if (result === 1) return
				UserAPI.smsShortCode(this.user.phoneNo, 6, curNas.sn, curNas.mac).then(response => {
					if (response.data.code !== 200) return
					this.deliver.visiable = true
					this.$message.success('短信已发送到手机')
				}).catch(error => {
					console.log(error)
					this.$message.error('网络连接错误,请检测网络')
				})
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
				const nasAccess = this.accessInfo as NasAccessInfo
				nasAccess.role = 0	// 将管理员状态改为非管理员
				this.$store.dispatch('NasServer/updateNasAccess', nasAccess)
				processCenter.renderSend(EventName.refreshSetting);
				console.log(response.data);
				this.$message.success('管理员转让成功！')
				this.fetchBindUserList()
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
		},
		rightClick: function(item) {
      const { remote } = require('electron')
			const { Menu, MenuItem } = remote as any
			const _this = this as any
			const menu = new Menu()
			if (this.isUserAdmin && item.role === 0) {
				menu.append(new MenuItem({
					label: item.status === 0 ? '启用' : '禁用',
					click: function () { _this.enableUser(item) }
				}));
				menu.append(new MenuItem({
					label: '删除',
					click: function () { _this.deleteCommonUser(item) }
				}));
				menu.append(new MenuItem({label: '提升为管理员',
					click: function () { _this.showDeliverModal(item) }
				}));
			}
      menu.popup(remote.getCurrentWindow())
    },
    showDeleteDialog (title: string, message: string, command: string): Promise<number> {
      return new Promise((resolve, reject) => {
        const { dialog } = require('electron').remote
        dialog.showMessageBox({
          type: 'info', title, message, buttons: [command, '取消'], cancelId: 1
        }).then(result => {
          resolve(result.response)
        }).catch(error => { reject(error) })
      })
    },
  }
})
</script>

<style lang="less" scoped>
p { text-align: left; }

.cd-setting-main {
	width: 100%;
	height: 100%;
	padding: 10px;
	display: inline-flex;
	.cd-setting-content {
		width: calc(100%);
		height: 100%;
		padding: 20px;
		float: left;
		overflow-y: scroll;
		.content {
			display: flex;
			flex-flow: column;
			.role {
				text-align: left;
				font-weight: 500;
				font-size: 15px;
			}
			.detail {
				display: flex;
				flex-flow: row;
				border-radius: 4px;
				&:hover, &:active, &:focus {
					background: #06b6501a;
				}
			}
		}
		.userImg {
			width: 50px;
			height: 50px;
			margin: 15px 0 0 10px;
			border-radius: 50%;
		}
		.userContent {
			flex: 1;
			display: flex;
			flex-flow: column;
			text-align: left;
			padding: 20px;
		}
		.describe {
			margin: 20px 10px 0 0;
		}
	}
}

</style>
