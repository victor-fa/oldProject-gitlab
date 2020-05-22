<template>
  <div>
    <a-modal
      width="360px"
      style="top: 120px;"
      :mask="false"
      :closable="false"
      :maskClosable="false"
      okText="确定"
      cancelText="取消"
      @ok="handlePass"
      @cancel="cancle"
      :visible="visiable"
    >
      <p>输入加密密码</p>
      <a-input
        type="password"
        placeholder="请输入加密空间密码"
        v-model="securityPassword"
        v-on:pressEnter="handlePass"
      />
    </a-modal>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'

export default Vue.extend({
  name: 'encrypt-pass-model',
  props: {
    visiable: Boolean
  },
  data () {
    return {
      securityPassword: '',
    }
  },
  methods: {
    cancle() {
      this.$emit('passCallback', 'close')
    },
    handlePass() {
      this.$emit('passCallback', this.securityPassword)
    }
  }
})
</script>
