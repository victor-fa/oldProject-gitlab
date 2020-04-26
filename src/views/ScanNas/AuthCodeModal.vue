<template>
  <a-modal
    :visible="visible"
    :mask="false"
    :closable="false"
    :maskClosable="false"
    okText="连接"
    cancelText="取消"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    邀请码:
    <a-input
      placeholder="请输入邀请码"
      v-model="authCode"
    />
  </a-modal>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'author-code-modal',
  data () {
    return {
      visible: false,
      authCode: 'UGREEN'
    }
  },
  methods: {
    show () {
      this.visible = true
    },
    hide () {
      this.visible = false
    },
    handleOk () {
      this.hide()
      this.$emit('connectCallback', this.authCode)
    },
    handleCancel () {
      this.hide()
    }
  }
})
</script>

<style lang="less" scoped>

</style>
