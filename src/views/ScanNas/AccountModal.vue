<template>
  <div v-if="visible" class="account-modal" @click="handleClick">
    <div class="content">
      <div class="header">
        <span>本地登录</span>
        <custom-button
          class="qrcode-btn"
          :image="qrcode"
          iconWidth="18px"
          @click.native="handleQrcodeLogin"
        />
      </div>
      <div class="body">
        <a-input placeholder="请输入本地账号" v-model="account"/>
        <a-input type="password" placeholder="请输入本地密码" v-model="password"/>
      </div>
      <div class="footer">
        <a-button @click="handleCancel">取消</a-button>
        <a-button @click="handleLogin">登录</a-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import CustomButton from '../../components/CustomButton/index.vue'

export default Vue.extend({
  name: 'account-modal',
  components: {
    CustomButton
  },
  data () {
    return {
      visible: false,
      account: '',
      password: '',
      qrcode: require('../../assets/qrcode_icon.png')
    }
  },
  methods: {
    show () {
      this.visible = true
    },
    hide () {
      this.visible = false
    },
    handleClick (event: MouseEvent) {
      event.stopPropagation()
    },
    handleCancel () {
      this.hide()
    },
    handleLogin () {
      if (_.isEmpty(this.account)) {
        this.$message.error('账号不能为空')
      } else if (_.isEmpty(this.password)) {
        this.$message.error('密码不能为空')
      } else {
        this.hide()
        this.$emit('offlienLogin', this.account, this.password)
      }
    },
    handleQrcodeLogin () {
      this.$emit('qrcodeLogin')
    }
  }
})
</script>

<style lang="less" scoped>
.account-modal {
  width: 100vw;
  height: 100vh;
  top: -55px;
  background-color: #9c9fa988;
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  .content {
    width: 280px;
    height: 235px;
    border-radius: 13px;
    overflow: hidden;
    background-color: white;
    .header {
      position: relative;
      margin: 20px 0px;
      color: #353535;
      font-size: 16px;
      font-weight: bold;
      .qrcode-btn {
        vertical-align: middle;
        position: absolute;
        right: 20px;
        top: 3px;
      }
    }
    .body {
      padding: 15px 20px 25px;
      input:first-child {
        margin-bottom: 20px;
      }
      input {
        padding: 10px;
        border: none;
        border-bottom: 1px solid #cfd3e5;
      }
    }
    .footer {
      margin-top: 3px;
      border-top: 1px solid #cfd3e5;
      .ant-btn:first-child {
        border-right: 1px solid #cfd3e5;
      }
      .ant-btn:first-child:hover {
        color: #353535;
      }
      .ant-btn:last-child {
        color: #2cd18a;
      }
      .ant-btn {
        color: #353535;
        border: none;
        height: 43px;
        width: 50%;
      }
    }
  }
}
</style>
