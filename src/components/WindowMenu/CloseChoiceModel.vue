<template>
  <div class="close-choice-space" v-if="visiable">
    <a-spin :spinning="loading">
      <div 
        class="close-content"
        v-bind:class="{
          'show-close-modal': !hideAnimate,
          'hide-close-modal': hideAnimate
        }"
      >
        <div class="modal-top">
          <span class="modal-title">您希望做什么？</span>
          <custom-button
            title="关闭"
            :image="menuIcons.close"
            iconWidth="20px"
            class="close-item"
            @click.native="handleCancelAction(1)"
          />
        </div>
        <a-radio-group v-model="choiceValue" class="close-checkbox">
          <a-radio value="tray">最小化到托盘</a-radio>
          <a-radio value="exit">退出程序</a-radio>
        </a-radio-group>
        <a-checkbox class="close-checkbox" :checked="rememberChoice" @change="handleCheckedAction">我已经了解, 确定重置</a-checkbox>
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
import NasFileAPI from '@/api/NasFileAPI'
import CustomButton from '@/components/CustomButton/index.vue'
import { menuIcons } from '@/components/WindowMenu/MenuIcons'

export default Vue.extend({
  name: 'close-choice-model',
  components: {
    CustomButton,
  },
  props: {
    visiable: Boolean
  },
  data () {
    return {
      loading: false,
      hideAnimate: false,
      choiceValue: 'tray',
      rememberChoice: false,
      menuIcons,
    }
  },
  methods: {
    handleCheckedAction () {
      this.rememberChoice = !this.rememberChoice
    },
    handleCancelAction () {
      this.$emit('choiceCallback', 'close')
      this.rememberChoice = false
    },
    handleConfirmAction() {
      if (this.rememberChoice) {  // 选择记住
        const input = {
          'remember': true,
          'trayOrExit': this.choiceValue
        }
        this.$store.dispatch('Setting/updateCloseChoiceInfo', input)
      }
      this.$emit('choiceCallback', this.choiceValue)
    }
  }
})
</script>

<style lang="less" scoped>
.close-choice-space {
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
  .close-content {
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
    .close-checkbox {
      align-self: flex-start;
      margin: 21px 0px 0px 26px;
      line-height: 10px;
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
.show-close-modal {
  animation: showAnimate .25s ease-in-out;
  -webkit-app-region: no-drag!important;
}
.hide-close-modal {
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
