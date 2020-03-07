<template>
  <div class="qrcode-login">
    <label>二维码登录</label>
    <img src="../../assets/qr_code.png">
    <a-button class="back-button" @click="backBtnClick">账号密码登录</a-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { loginIcons } from '../Login/iconList'
import router from '../../router'

export default Vue.extend({
  name: 'qr-code-login',
  data () {
    return {
      loginIcons
    }
  },
  methods: {
    backBtnClick () {
      router.go(-1)
    }
  }
})
</script>

<style lang="less" scoped>
.qr-code-login {
  height: 100%;
  .header {
    height: 40px;
    display: flex;
    padding: 0px 10px;
    flex-direction: row-reverse;
    align-items: center;
    background-color: #fdffff;
    .header-item {
      height: 20px;
      width: 20px;
      margin-right: 10px;
    }
  }
  
}
.qrcode-login {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  background-color: white;
  label {
    width: 280px;
    padding-top: 50px;
    font-size: 19px;
    font-weight: bold;
    line-height: 19px;
    color: #7d7e7e;
    text-align: left;
  }
  img {
    height: 210px;
    padding: 10px;
    border: 1px solid #323232;
  }
  .back-button {
    border: none;
    color: #06b650;
    font-size: 14px;
    box-shadow: none;
    margin-bottom: 70px;
    background-color: white;
  }
}
</style>
