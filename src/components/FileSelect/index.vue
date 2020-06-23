<template>
  <div class="file-select-style">
    <span
      class="value"
      v-bind:class="{ 'placeholder': !showPlaceholder }"
    >
      {{ showText }}
    </span>
    <img src="../../assets/accessory_icon.png">
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'

export default Vue.extend({
  name: 'file-select',
  props: {
    placeholder: String,
    value: String,
    options: Array
  },
  computed: {
    showPlaceholder: function () {
      const result: boolean = _.isEmpty(this.value)
      return result
    },
    showText: function () {
      const result: boolean = _.isEmpty(this.value)
      return result ? this.placeholder : this.value
    }
  }
})
</script>

<style lang="less" scoped>
.file-select-style {
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  span {
    padding: 0px 11px;
    font-size: 13px;
    color: #9C9FA9;
  }
  .placeholder {
    color: #484848;
  }
  img {
    height: 15px;
    width: 15px;
    margin-right: 8px;
    opacity: 0.3;
  }
}
.file-select-style:hover {
  border: 1px solid #06B650;
}
</style>
