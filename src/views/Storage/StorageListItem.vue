<template>
  <div
    class="storage-item"
    v-bind:class="{ 'storage-item-selected': isSelected }"
  >
    <img :src="model.showIcon"/>
    <div class="content">
      <label class="title">{{ model.showName }}</label>
      <label class="size">{{ model.isNotInit ? '未初始化' : model.showSize }}</label>
      <a-progress
        strokeLinecap="square"
        :percent="model.showProgress"
        :showInfo="false"
        :strokeColor="'#06B650'"
        :strokeWidth="12"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'storage-list-item',
  props: {
    model: {
      type: Object,
      required: true
    },
    index: Number,
    isSelected: {
      default: false
    }
  }
})
</script>

<style lang="less" scoped>
.storage-item {
  width: 225px;
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
  padding: 15px;
  background-color: white;
  cursor: pointer;
  img {
    height: 50px;
  }
  .content {
    display: flex;
    flex-direction: column;
    margin-left: 15px;
    .title {
      text-align: left;
      color: #353535;
      font-size: 14px;
      font-weight: bold;
      line-height: 14px;
      margin-bottom: 7px;
      cursor: pointer;
    }
    .size {
      text-align: left;
      color: #b3b6c5;
      font-size: 10px;
      line-height: 10px;
      margin-bottom: 2px;
      cursor: pointer;
    }
  }
}
.storage-item-selected {
  border-radius: 6px;
  background-color: #def1ea;
}
</style>

<style>
.storage-item .content .ant-progress-inner {
  border-radius: 0;
  width: 130px;
}
</style>
