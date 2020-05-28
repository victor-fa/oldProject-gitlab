<template>
  <div class="connection-failed">
    <img src="../../assets/network_error_icon.png">
    <span class="error-tip">{{ errorMessage }}</span>
    <div class="connection-tip">
      <span>请确保：</span>
      <p>
        1.设备已开机<br>2.设备已连接局域网<br>3.电脑连接同一局域网
      </p>
    </div>
    <a-button class="scan-btn" @click="handleBtnClick">{{ buttonTitle }}</a-button>
    <a-button class="bind-list-btn" @click="handleBindClick">绑定设备列表</a-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { ConnectionErrorType } from './index.vue'

export default Vue.extend({
  name: 'connection-failed',
  data () {
    return {
      errorType: this.$route.params.errorType as ConnectionErrorType
    }
  },
  computed: {
    errorMessage: function () {
      switch (this.errorType) {
        case ConnectionErrorType.scanFailed:
          return '扫描失败'
        case ConnectionErrorType.notFound:
          return '未找到设备'
        default:
          return '连接失败'
      }
    },
    buttonTitle: function () {
      if (this.errorType === ConnectionErrorType.apiError || this.errorType === ConnectionErrorType.networkError) {
        return '重新连接'
      }
      return '局域网扫描'
    }
  },
  methods: {
    handleBtnClick () {
      if (this.buttonTitle === '重新连接') {
        this.$router.go(-1)
      } else {
        this.$store.dispatch('Login/updateErrorCount', 0)
        let type = this.$route.params.type
        type = type === 'offlineLogin' ? type : 'addDevice'
        this.$router.push({
          name: 'scan-nas',
          query: { type } 
        })
      }
    },
    handleBindClick () {
      this.$router.push('bind-device-list')
    }
  }
})
</script>

<style lang="less" scoped>
.connection-failed {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  img {
    width: 258px;
    margin-top: 80px;
  }
  .error-tip {
    color: #9c9fa9;
    font-size: 16px;
    margin-top: 25px;
  }
  .connection-tip {
    color: #9c9fa9;
    font-size: 12px;
    margin-top: 35px;
    display: flex;
    align-items: flex-start;
    span {
      margin-top: 3px;
    }
    p {
      max-width: 150px;
      white-space: pre-line;
      text-align: left;
      line-height: 24px;
    }
  }
  .scan-btn {
    height: 48px;
    width: 300px;
    margin-top: 55px;
    color: white;
    font-size: 18px;
    font-weight: bold;
    border: none;
    border-radius: 24px;
    background-image: linear-gradient(to right, #29cb7a, #4de9b9);
  }
  .bind-list-btn {
    align-self: center;
    margin-top: 10px;
    width: 130px;
    border: none;
    box-shadow: none;
    background-color: white;
    color: #06b650;
  }
}
</style>
