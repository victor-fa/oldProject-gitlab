<template>
  <div class="encrypt-pass-space" v-if="visiable">
    <a-spin :spinning="loading">
      <div 
        class="encrypt-content"
        v-bind:class="{
          'show-encrypt-modal': !hideAnimate,
          'hide-encrypt-modal': hideAnimate
        }"
      >
        <div class="modal-top">
          <span class="modal-title">输入加密密码</span>
          <custom-button
            title="关闭"
            :image="menuIcons.close"
            iconWidth="20px"
            class="close-item"
            @click.native="handleCancelAction(1)"
          />
        </div>
        <a-input type="password" class="encrypt-input" placeholder="请输入加密空间密码" v-model="securityPassword" v-on:pressEnter="handleConfirmAction"/>
        <div class="modal-bottom">
          <a-button @click="handleCancelAction">取消</a-button>
          <a-button @click="handleConfirmAction">确定</a-button>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import CustomButton from '@/components/CustomButton/index.vue'
import { menuIcons } from '@/components/WindowMenu/MenuIcons'

export default Vue.extend({
  name: 'encrypt-pass-model',
  components: {
    CustomButton,
  },
  props: {
    visiable: Boolean
  },
  data () {
    return {
      securityPassword: '',
      loading: false,
      hideAnimate: false,
      menuIcons,
    }
  },
  methods: {
    handleCancelAction () {
      this.$emit('passCallback', 'close')
    },
    handleConfirmAction() {
      this.$emit('passCallback', this.securityPassword)
    }
  }
})
</script>

<style lang="less" scoped>
.encrypt-pass-space {
  width: 100vw;
  height: 100vh;
  position: absolute;
  left: 0px;
  top: 0px;
  background-color: rgba(0,0,0,0);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  .encrypt-content {
    margin-left: 85px;
    width: 400px;
    background-color: white;
    box-shadow: 0px 4px 12px rgba(0,0,0,0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    .modal-top {
      display: flex;
      background-color: #EDEFF4;
      height: 28px;
      width: 100%;
      padding: 7px;
      justify-content: space-between;
      .modal-title {
        font-size: 13px;
        color: black;
        line-height: 13px;
        text-align: left;
      }
      .close-item {
        height: 20px;
        width: 20px;
        margin-top: -3px;
        -webkit-app-region: no-drag;
      }
    }
    p {
      margin: 22px 21px 0px 23px;
      font-size: 13px;
      line-height: 19px;
      color: black;
      text-align: left;
    }
    .encrypt-input {
      align-self: flex-start;
      margin: 21px 0px 0px 26px;
      line-height: 10px;
      width: 350px;
    }
    .modal-bottom {
      margin-top: 22px;
      width: 100%;
      line-height: 40px;
      text-align: right;
      padding-right: 10px;
      .ant-btn {
        margin-left: 10px;
        height: 24px;
        width: 74px;
        font-size: 12px;
      }
      .ant-btn:last-child {
        color: #2CD18A;
      }
    }
  }
}
.show-encrypt-modal {
  animation: showAnimate .25s ease-in-out;
  -webkit-app-region: no-drag!important;
}
.hide-encrypt-modal {
  animation: hideAnimate .25s ease-in-out;
}
@keyframes showAnimate {
  0% { transform: scale(0.3); opacity: 0.3; };
  100% { transform: scale(1.0); opacity: 1.0; };
}
@keyframes hideAnimate {
  0% { transform: scale(1.0); opacity: 1.0; };
  100% { transform: scale(0.3); opacity: 0.3; };
}
</style>
