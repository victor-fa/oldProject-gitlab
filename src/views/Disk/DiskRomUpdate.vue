<template>
  <div>
    <a-modal
      title="检测到有新版本固件更新"
			:visible="true" :mask="false" :maskClosable="false" style="top: -7px;"
      width="450px" okText="确认升级" cancelText="取消升级" @ok="handleUpdate" @cancel="handleCancleUpdate"
      :ok-button-props="{ props: { disabled: disable } }">
			<p>版本名称：{{updateInfo.versionName}}（{{updateInfo.size | filterSize}}）</p>
			<p>发布时间：{{updateInfo.pubtime | filterTime}}</p>
			<p>描述：{{updateInfo.desc === 'null' ? '无' : updateInfo.desc}}</p>
		</a-modal>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import StringUtility from '@/utils/StringUtility'
import processCenter, { EventName } from '@/utils/processCenter'
import NasFileAPI from '@/api/NasFileAPI'

export default Vue.extend({
  name: 'DiskForgetPass',
  components: {
  },
  data () {
    const _this = this as any
    return {
      window: null as any,
      updateInfo: {} as any,
      disable: false
    }
  },
	beforeMount () {
    const _this = this as any
		this.window = _this.$electron.remote.getCurrentWindow();
		_this.$ipc.on('win-data', (event, data) => {
      this.updateInfo = data;
      this.disable = false
			console.log(JSON.parse(JSON.stringify(this.updateInfo)));
		});
	},
  filters: {
    filterSize (bytes) {
      return StringUtility.formatShowSize(bytes, true)
		},
    filterTime (time) {
      return StringUtility.formatShowMtime(time)
		}
	},
  methods: {
		handleUpdate () {
      this.disable = true
			NasFileAPI.fetchRomUpgrade().then(response => {
				if (response.data.code !== 200) return
        console.log(response);
        this.$message.success('请等待几分钟重新连接，请勿关闭电源')
        this.handleCancleUpdate()
			}).catch(error => {
				this.$message.error('网络连接错误，请检测网络')
				console.log(error)
			})
    },
    handleCancleUpdate() {
      this.updateInfo = {} as any
			this.window.close();
    },
  }
})
</script>

<style lang="less" scoped>
.rom-update {
  height: 100%;
  background-color: #fdffff;
  display: block;
  justify-content: center;
  .rom-update-content {
    float: left;
    width: 100%;
    height: 100%;
    background: #fff;
    padding: 0 20px 20px;
    color: #000;
    text-align: left;
    .bottom {
      display: flex;
    }
  }
}
</style>
<style scoped>
  .ant-modal-header {
    -webkit-app-region: drag;
  }
</style>
