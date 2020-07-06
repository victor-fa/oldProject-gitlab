<template>
  <div class="storage-progress">
    <a-layout-header class="setting-header">
      <span>磁盘正在初始化</span>
    </a-layout-header>
    <div class="content">
      <div class="top">
        <span class="title">磁盘正在初始化，请勿拔电源，关机</span>
        <span class="number">{{process}}%</span>
      </div>
      <a-progress class="progress" :percent="process" :show-info="false" :stroke-color="'#2CD18A'" />
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import NasFileAPI from '@/api/NasFileAPI'

export default Vue.extend({
  name: 'storage-progress',
  data () {
    return {
      process: 0,
			window: false as any
    }
  },
	beforeMount () {
    const _this = this as any
    this.window = _this.$electron.remote.getCurrentWindow();
  },
  mounted () {
    this.loopDiskProcess()
  },
  methods: {
    fetchDisks () {
      NasFileAPI.fetchDisks().then(response => {
        if (response.data.code !== 200) return
        const process = _.get(response.data.data, 'format_percent')
				this.process = process === -1 ? 0 : process
      }).catch(error => {
        this.$message.error('网络连接错误，请检测网络')
        console.log(error)
      })
    },
    loopDiskProcess () {
			let timer = setInterval(() => {
        this.fetchDisks()
        if (this.process === 100) {
          timer && clearInterval(timer);
          this.$message.success('初始化成功！')
          setTimeout(() => { this.window.close(); }, 2000);
        }
			}, 2000);
    }
  }
})
</script>

<style lang="less" scoped>
.storage-progress {
  width: 32vw;
  margin: 20% 34%;
  box-shadow: 0 0 10px #88888857;
  .setting-header {
    height: 35px;
    width: 100%;
    padding: 0px;
    background-color: #EDEFF4;
    display: flex;
    align-items: center;
    justify-content: space-between;
    -webkit-app-region: no-drag;
    img { width: 20px; }
    span {
      margin-left: 20px;
      font-weight: 500;
    }
    .window-menu { margin-right: 20px; }
  }
  .content {
    padding: 45px 40px;
    background: #ffffff;
    .top {
      display: flex;
      margin-bottom: 15px;
      .title {
        font-weight: 500;
        font-size: 14px;
      }
      .number {
        flex: 1;
        text-align: right;
        font-size: 30px;
        font-weight: 500;
        line-height: 11px;
      }
    }
    .progress {

    }
  }
}
</style>
