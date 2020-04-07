<template>
  <a-modal
    :visible="visible"
    width="350px"
    class="paste-modal"
    v-on:cancel="handleCancel"
  >
    <template slot="footer">
      <a-button key="skip" @click="handleClick('skip')">跳过</a-button>
      <a-button key="rename" @click="handleClick('rename')">重命名</a-button>
      <a-button key="cover" @click="handleClick('cover')">覆盖</a-button>
    </template>
    <span>请选择重名文件处理模式:</span>
  </a-modal>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'modal-alter',
  data () {
    return {
      visible: true
    }
  },
  methods: {
    handleClick(key: string) {
      this.visible = false
      this.$emit('confirm', key)
    },
    handleCancel() {
      this.visible = false
      this.$emit('cancel')
    }
  }
})
</script>

<style lang="less" scoped>
.paste-modal {
  top: 50px;
}
</style>
