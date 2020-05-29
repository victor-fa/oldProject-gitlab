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
        <a-radio value="tray">缩小到托盘</a-radio>
        <a-radio value="exit">退出程序</a-radio>
      </a-radio-group>
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
      choiceValue: 'tray'
    }
  },
  methods: {
    cancle() {
      this.$emit('choiceCallback', 'close')
    },
    handleChoice() {
      this.$emit('choiceCallback', this.choiceValue)
    }
  }
})
</script>
