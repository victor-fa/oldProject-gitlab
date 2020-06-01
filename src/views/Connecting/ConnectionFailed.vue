<template>
  <div class="connection-failed">
    <img src="../../assets/network_error_icon.png">
    <span class="error-tip">{{ error }}</span>
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
import { mapGetters } from 'vuex'

export default Vue.extend({
  name: 'connection-failed',
  computed: {
    ...mapGetters('NasServer', ['nasInfo', 'accessInfo']),
    error: function () {
      const error = this.$route.params.error as string
      return error
    },
    type: function () {
      const type = this.$route.params.type as string
      return type
    },
    buttonTitle: function () {
      const type = this.type as string
      return type === 'connectionFaild' ? '重新连接' : '局域网扫描'
    }
  },
  methods: {
    handleBtnClick () {
      if (this.buttonTitle === '重新连接') {
        this.$router.replace({
          name: 'connecting',
          params: {
            sn: this.nasInfo.sn,
            mac: this.nasInfo.mac,
            secretKey: this.accessInfo.key
          }
        })
      } else {
        this.$store.dispatch('Login/updateErrorCount', 0)
        let type = this.$route.params.scanType
        type = type === 'offlineLogin' ? type : 'addDevice'
        this.$router.replace({
          name: 'scan-nas',
          query: { type } 
        })
      }
    },
    handleBindClick () {
      this.$router.replace('bind-device-list')
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
