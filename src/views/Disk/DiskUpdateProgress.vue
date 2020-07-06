<template>
  <div class="disk-update-progress">
    <a-layout-header class="setting-header">
      <span>{{ uploadStatus === 0 || uploadStatus === 1 ? '检查升级' : uploadStatus === 2 ? '正在升级' : '升级完成' }}</span>
      <window-menu :configure="'unable'" :showMinimizable=false :showResizable=false class="window-menu"/>
    </a-layout-header>
    <div class="content">
      <!-- 升级中 -->
      <div class="top" v-if="uploadStatus === 2">
        <span class="title">正在升级最新版本…</span>
        <span class="number">{{process}}%</span>
      </div>
      <a-progress v-if="uploadStatus === 2" class="progress" :percent="process" :show-info="false" :stroke-color="'#2CD18A'" />
      <!-- 无升级、可升级、升级完成 -->
      <div class="top" v-if="uploadStatus === 0 || uploadStatus === 1 || uploadStatus === 3">
        <img src="../../assets/big_logo.png">
        <div class="detail">
          <span>{{ uploadStatus === 0 ? '目前是最新版本' : uploadStatus === 1 ? '检测到最新版本号：V1.01.03' : '升级完成'}}</span>
          <span>当前版本号：V{{ currentVer }}</span>
        </div>
      </div>
    </div>
    <a-button v-show="uploadStatus !== 2" @click="handleClickBut">
      <span>{{ uploadStatus === 0 || uploadStatus === 3 ? '我知道了' : '立即升级' }}</span>
    </a-button>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import NasFileAPI from '@/api/NasFileAPI'
import UserAPI from '@/api/UserAPI'
import processCenter, { EventName } from '@/utils/processCenter'
import WindowMenu from '@/components/WindowMenu/index.vue'

const packageInfo = require('../../../package');
export default Vue.extend({
  name: 'disk-update-progress',
  data () {
    return {
      process: 0,
      window: false as any,
      uploadStatus: 0, // 0：无 1：有 3：升级中 2：完成
      currentVer: '',
      pkgUrl: ''
    }
  },
	components: { WindowMenu },
	beforeMount () {
		this.bind();
    const _this = this as any
    this.window = _this.$electron.remote.getCurrentWindow();
  },
  mounted () {
    this.getUpdateInfo()
    this.currentVer = packageInfo.version
  },
  methods: {
		bind() {
      const _this = this as any
			_this.$ipc.on('percent', (event, message) => {
				this.process = Number((message * 100).toFixed(0))
        this.uploadStatus = 2
				if (this.process === 100) {
          this.process = 0
          this.uploadStatus = 3
				}
			});
		},
		getUpdateInfo() {
			let appId = ''
			let appVersion = 0
			if (process.platform === 'win32') {	// win环境
				appId = packageInfo.winAppId
				appVersion = packageInfo.winAppVersion
			} else {	// mac环境
				appId = packageInfo.macAppId
				appVersion = packageInfo.macAppVersion
			}
      UserAPI.fetchSoftVerUpdateInfo(appId, appVersion).then(response => {
        if (response.data.code !== 200) {
					this.$message.error('获取更新信息失败')
          return
				}
				if (response.data.data) {
					const verNo = _.get(response.data.data, 'verNo')
          this.pkgUrl = _.get(response.data.data, 'pkgUrl')
          if (Number(verNo) > appVersion) { // 当版本号超过，则更新
            this.uploadStatus = 1
					}
				} else {
          this.uploadStatus = 0
				}
      }).catch(error => {
        console.log(error)
      })
    },
    handleClickBut () {
      switch (this.uploadStatus) {
        case 0:
          this.window.close()
          break;
        case 1:
          this.doUpdate()
          break;
        case 3:
          this.window.close()
          break;
        default:
          break;
      }
    },
		doUpdate() {
      console.log(this.pkgUrl);
      processCenter.renderSend(EventName.uploadPackage, this.pkgUrl)
		},
  }
})
</script>

<style lang="less" scoped>
.disk-update-progress {
  width: 32vw;
  margin: 20% 34%;
  box-shadow: 0 0 10px #88888857;
  background: #ffffff;
  position: relative;
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
      img {
        width: 85px;
        height: 85px;
      }
      .detail {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        text-align: left;
        padding-left: 40px;
      }
    }
  }
  button {
    position: absolute;
    bottom: 20px;
    right: 20px;
  }
}
</style>
