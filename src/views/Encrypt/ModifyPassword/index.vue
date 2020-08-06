<template>
  <div class="modify-password">
    <a-spin :spinning="loading">
      <div 
        class="modify-content"
        v-bind:class="{
          'show-modify-modal': !hideAnimate,
          'hide-modify-modal': hideAnimate
        }"
      >
        <div class="modal-top">
          <span class="modal-title">修改密码</span>
          <custom-button
            title="关闭"
            :image="menuIcons.close"
            iconWidth="20px"
            class="close-item"
            @click.native="handleCancelAction(1)"
          />
        </div>
        <a-input
          v-focus 
          type="password" 
          v-model="oldPwd"
          placeholder="请输入旧密码" 
          @pressEnter="handleEnterAction"
        />
        <a-input
          type="password" 
          v-model="newPwd"
          placeholder="请输入新密码" 
          @pressEnter="handleEnterAction"
        />
        <a-input
          type="password" 
          v-model="confirmPwd"
          placeholder="请再次输入新密码"
          @pressEnter="handleEnterAction"
        />
        <div class="modify-bottom">
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
import NasFileAPI from '../../../api/NasFileAPI'
import StringUtility from '../../../utils/StringUtility'
import CustomButton from '@/components/CustomButton/index.vue'
import { menuIcons } from '@/components/WindowMenu/MenuIcons'

export default Vue.extend({
  name: 'modify-password',
  components: {
    CustomButton,
  },
  directives: {
    focus: {
      inserted: function (el) {
        el.focus()
      }
    }
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      oldPwd: '',
      newPwd: '',
      confirmPwd: '',
      loading: false,
      hideAnimate: false,
      menuIcons,
    }
  },
  methods: {
    handleEnterAction () {
      if (_.isEmpty(this.oldPwd) || _.isEmpty(this.newPwd) || _.isEmpty(this.confirmPwd)) return
      this.handleConfirmAction()
    },
    handleConfirmAction () {
      const tip = this.checkInput()
      if (tip !== null) {
        this.$message.error(tip)
        return
      }
      this.loading = true
      const oldPwd = StringUtility.encryptPassword(this.oldPwd)
      const newPwd = StringUtility.encryptPassword(this.newPwd)
      NasFileAPI.modifyEncrypt(oldPwd, newPwd).then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        this.$message.info('密码修改成功，请重新登录')
        this.hideModal(() => {
          this.$router.replace('encrypt-login')
        })
      }).catch(error => {
        this.loading = false
        console.log(error)
        this.$message.error('密码修改失败')
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
    },
    checkInput () {
      if (_.isEmpty(this.oldPwd)) return '请输入旧密码'
      if (_.isEmpty(this.newPwd)) return '请输入新密码'
      if (_.isEmpty(this.confirmPwd)) return '请确认新密码'
      if (this.newPwd !== this.confirmPwd) return '两次密码不一致'
      return null
    }
  }
})
</script>

<style lang="less" scoped>
.modify-password {
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
  .modify-content {
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
    .ant-input {
      margin: 15px 15px 0 15px;
      width: 364px;
      height: 36px;
      border: none;
      border-bottom: 1px solid #CFD3E5;
    }
    .modify-bottom {
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
.show-modify-modal {
  animation: showAnimate .25s ease-in-out;
}
.hide-modify-modal {
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
