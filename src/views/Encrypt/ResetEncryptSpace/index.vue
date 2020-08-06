<template>
  <div class="reset-encrypt-space">
    <a-spin :spinning="loading">
      <div 
        class="reset-content"
        v-bind:class="{
          'show-reset-modal': !hideAnimate,
          'hide-reset-modal': hideAnimate
        }"
      >
        <div class="modal-top">
          <span class="modal-title">重置加密空间</span>
          <custom-button
            title="关闭"
            :image="menuIcons.close"
            iconWidth="20px"
            class="close-item"
            @click.native="handleCancelAction(1)"
          />
        </div>
        <p>此操作将会清除加密空间所有文件，并注销您原来的密码！<br>一旦重置，您可重新激活使用加密空间。</p>
        <a-checkbox class="reset-checkbox" :checked="checked" @change="handleCheckedAction">我已经了解, 确定重置</a-checkbox>
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
  name: 'reset-encrypt-space',
  components: {
    CustomButton,
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      checked: false,
      loading: false,
      hideAnimate: false,
      menuIcons,
    }
  },
  methods: {
    handleCheckedAction () {
      this.checked = !this.checked
    },
    handleConfirmAction () {
      if (!this.checked) {
        this.$message.error('请勾选确认框')
        return
      }
      this.loading = true
      NasFileAPI.resetEncrypt().then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.hideModal(() => {
          this.$router.replace('activate-view')
        })
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('重置失败')
      })
    },
    handleCancelAction () {
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
.reset-encrypt-space {
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
  .reset-content {
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
    .reset-checkbox {
      align-self: flex-start;
      margin: 21px 0px 0px 26px;
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
.show-reset-modal {
  animation: showAnimate .25s ease-in-out;
}
.hide-reset-modal {
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
