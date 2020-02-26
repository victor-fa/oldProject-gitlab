<template>
  <div class="basic-form">
    <img :src="icon">
    <a-input
      :type="inputType"
      :placeholder="placeholder"
      :value="text"
      @change="changeValue($event.target.value)"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'basic-form',
  model: {
    prop: 'text',
    event: 'change'
  },
  props: {
    text: String,
    placeholder: String,
    icon: {
      default: null
    },
    isSecure: {
      default: false
    }
  },
  computed: {
    inputType: function () {
      return this.isSecure ? 'password' : 'text'
    }
  },
  methods: {
    changeValue (value: string) {
      this.$emit('change', value)
    }
  }
})
</script>

<style lang="less" scoped>
.basic-form {
  height: 40px;
  border-bottom: 1px solid #cacdca;
  display: flex;
  align-items: center;
  img {
    height: 20px;
    margin-left: 13px;
  }
  input {
    font-size: 14px;
    line-height: 20px;
    margin-left: 8px;
    margin-right: 13px;
    border: none;
    padding-left: 8px;
  }
}
</style>

<style>
/* .basic-form .ant-input {
  font-size: 14px;
  line-height: 20px;
  margin-left: 5px;
  margin-right: 13px;
  border: none;
} */
</style>
