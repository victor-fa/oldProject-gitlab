<template>
	<div class="cd-setting-main">
		<div class="cd-setting-content">
			<div class="content" v-for="(item, index) in disks" :key="index">
				<template v-if="item.type !== 7">
					<div class="left-side">
						<img class="disk" :src="loginIcons.disk">
					</div>
					<div class="right-side">
						<div class="average">
							<span>盘位{{index + 1}}<font style="margin-left: 10px">{{item.status | filterStatus}}</font></span>
							<span>{{item.modelName}}</span>
						</div>
						<div class="average">
							<span>{{item.type | filterStorageType(index)}}</span>
						</div>
						<div class="average">
							<span>容量 {{item.size | filterSize}}</span>
							<span>已使用 {{item.used | filterSize}}</span>
						</div>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { loginIcons } from '@/views/Login/iconList'
import NasFileAPI from '@/api/NasFileAPI'
import StorageHandler from '../../Storage/StorageHandler'
import StringUtility from '@/utils/StringUtility'

export default Vue.extend({
  name: 'storage-info',
  filters: {
    filterSize (bytes) {
      return StringUtility.formatShowSize(bytes)
		},
    filterStatus (status) {
      return StringUtility.formatDiskStatus(status)
		},
		filterStorageType (data, index) {
			return StorageHandler.matchStorageName(data, index)
		}
	},
	data() {
		return {
			disks: [] as any,
			loginIcons,
		};
  },
	created() {
		this.fetchDisks()
	},
  methods: {
    fetchDisks () {
      NasFileAPI.fetchDisks().then(response => {
        if (response.data.code !== 200) return
				this.disks = _.get(response.data.data, 'disks')
				console.log(JSON.parse(JSON.stringify(response.data.data)));
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
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
			.left-side {
				display: flex;
				flex-flow: column;
				text-align: left;
				padding: 10px;
				img {
					width: 60px;
					height: 60px;
					margin: 0px;
				}
			}
			.right-side {
				flex: 1;
				display: flex;
				flex-flow: column;
				text-align: left;
				padding: 10px;
				font { color: #06B650; }
				.average {
					display: flex;
					span { flex: 1; }
				}
			}
			&:active, &:focus, &:hover {
				background: #06b6501a;
				border-radius: 4px;
			}
		}
	}
}
</style>

