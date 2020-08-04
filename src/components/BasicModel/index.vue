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
        <span class="modal-title">{{title}}</span>
        <p>{{content}}</p>
        <div class="modal-bottom">
          <a-button @click="handleCancelAction">{{leftButton}}</a-button>
          <a-button @click="handleConfirmAction">{{rightButton}}</a-button>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'

export default Vue.extend({
  name: 'basic-model',
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
  },
  data () {
    return {
      hideAnimate: false
    }
  },
  methods: {
    handleConfirmAction () {
      this.$emit('confirm', this.type, this.data)
    },
    handleCancelAction () {
      if (this.leftButton !== '取消') {
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
    width: 282px;
    border-radius: 12px;
    border: 1px solid #CFD3E5;
    background-color: white;
    box-shadow: 0px 4px 12px rgba(0,0,0,0.25);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    span {
      margin-top: 20px;
      font-size: 17px;
      color: black;
      font-weight: bold;
      line-height: 17px;
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
      border-top: 1px solid #CFD3E5;
      line-height: 40px;
      .ant-btn {
        width: 50%;
        height: 44px;
        border: none;
        font-size: 17px;
      }
      .ant-btn:last-child {
        color: #2CD18A;
        border-left: 1px solid #CFD3E5;
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
