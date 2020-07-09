<template>
  <div v-if="visible" class="code-modal" @click="handleCoverClick">
    <transition name="alter">
      <div v-if="showAlter" class="modal-content">
        <p class="title">授权码</p>
        <a-input
          class="input"
          placeholder="请输入授权码"
          v-model="authCode"
          v-on:pressEnter="handleOk"
        />
        <div class="bottom">
          <a-button @click="handleCancel">取消</a-button>
          <a-button @click="handleOk">确定</a-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'author-code-modal',
  data () {
    return {
      visible: false,
      authCode: '',
      showAlter: false
    }
  },
  methods: {
    show () {
      this.visible = true
      this.authCode = ''
      this.$nextTick(() => {
        this.showAlter = true
      })
    },
    hide (): Promise<void> {
      this.showAlter = false
      return new Promise(resolve => {
        setTimeout(() => {
          this.visible = false
          resolve()
        }, 250);
      })
    },
    handleCoverClick (event: MouseEvent) {
      event.stopPropagation()
    },
    handleOk () {
      this.hide().then(() => {
        this.$emit('connectCallback', this.authCode)
      })
    },
    handleCancel () {
      this.hide()
    }
  }
})
</script>

<style lang="less" scoped>
.code-modal {
  width: 100vw;
  height: 100vh;
  background-color: #9c9fa980;
  position: absolute;
  top: -55px;
  display: flex;
  justify-content: center;
  align-items: center;
  .modal-content {
    width: 280px;
    height: 190px;
    background-color: white;
    border-radius: 13px;
    overflow: hidden;
    margin-bottom: 40px;
    .title {
      color: #353535;
      font-size: 16px;
      font-weight: bold;
      margin: 27px 0px 32px;
    }
    .input {
      width: 236px;
    }
    .bottom {
      margin-top: 30px;
      height: 44px;
      border-top: 1px solid #D5D9E7;
      .ant-btn {
        height: 44px;
        width: 50%;
        border: none;
      }
      .ant-btn:first-child {
        border-right: 1px solid #D5D9E7;
      }
    }
  }
}
.alter-enter-active {
  animation: alter-show 0.25s ease-in-out;
}
.alter-leave-active {
  animation: alter-show 0.25s ease-out reverse;
}
@keyframes alter-show {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
