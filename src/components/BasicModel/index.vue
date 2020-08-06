<template>
  <div class="basic-model">
    <a-spin :spinning="loading">
      <div 
        class="basic-content"
        v-bind:class="{
          'show-basic-modal': !hideAnimate,
          'hide-basic-modal': hideAnimate
        }"
      >
        <div class="modal-top">
          <span class="modal-title">{{title}}</span>
          <custom-button
            title="关闭"
            :image="menuIcons.close"
            iconWidth="20px"
            class="close-item"
            @click.native="handleCancelAction(1)"
          />
        </div>
        <p v-html="content"></p>
        <div class="modal-bottom">
          <a-button :style="{ 'width': broadButton ? '115px' : '74px' }" @click="handleCancelAction(2)">{{leftButton}}</a-button>
          <a-button :style="{ 'width': broadButton ? '115px' : '74px' }" @click="handleConfirmAction">{{rightButton}}</a-button>
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
  name: 'basic-model',
  components: {
    CustomButton,
  },
  props: {
    title: String,
    content: String,
    type: String,
    loading: Boolean,
    data: {} as any,
    leftButton: {
      default: '取消'
    },
    rightButton: {
      default: '确定'
    },
    broadButton: {
      default: false
    },
  },
  data () {
    return {
      hideAnimate: false,
      menuIcons,
    }
  },
  methods: {
    handleConfirmAction () {
      this.$emit('confirm', this.type, this.data)
    },
    handleCancelAction (flag) {
      if (flag === 1) { // 点击右上角，必须走关闭窗口
        this.hideModal()
        return
      }
      if (this.leftButton !== '取消') { // 特殊情况下的非关闭窗口功能
        this.$emit('confirm', this.type, this.leftButton)
        return
      }
      this.hideModal()
    },
    hideModal (callback?: () => void) {
      this.hideAnimate = true
      setTimeout(() => {
        this.$emit('dismiss')
        if (callback !== undefined) callback()
      }, 250)
    }
  }
})
</script>

<style lang="less" scoped>
.basic-model {
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
  .basic-content {
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
.show-basic-modal {
  animation: showAnimate .25s ease-in-out;
}
.hide-basic-modal {
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
