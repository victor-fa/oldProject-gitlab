<template>
  <div>
    <a-modal
      width="260px"
      style="top: 120px;"
      :mask="false"
      :maskClosable="false"
      okText="确定"
      cancelText="取消"
      @ok="handleChoice"
      @cancel="cancle"
      :visible="visiable"
    >
      您希望做什么？
      <br>
      <br>
      <a-radio-group v-model="choiceValue">
        <a-radio value="tray">最小化到托盘</a-radio>
        <a-radio value="exit">退出程序</a-radio>
      </a-radio-group>
      <br>
      <br>
      <a-checkbox v-model="rememberChoice">
        是否记住选择？
      </a-checkbox>
    </a-modal>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'

export default Vue.extend({
  name: 'close-choice-model',
  props: {
    visiable: Boolean
  },
  data () {
    return {
      choiceValue: 'tray',
      rememberChoice: false
    }
  },
  methods: {
    cancle() {
      this.$emit('choiceCallback', 'close')
      this.rememberChoice = false
    },
    handleChoice() {
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
