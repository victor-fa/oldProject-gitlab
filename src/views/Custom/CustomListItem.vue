<template>
  <div
    :key="index"
    class="custom-item"
    v-bind:class="{ 'custom-selected-item': isSelected }"
  >
    <img :src="model.myself_folder.image_path">
    <p class="custom-name">{{ model.myself_folder.name }}</p>
    <p class="custom-desc">{{ model.myself_folder.desc }}</p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'custom-list-item',
  props: {
    model: Object,
    index: Number,
    isSelected: {
      default: false
    }
  }
})
</script>

<style lang="less" scoped>
.custom-item {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  width: 132px;
  height: 107px;
  background-color: #f6f8fb;
  border-radius: 5px;
  img {
    margin: 5px;
    width: 122px;
    height: 69px;
    border-radius: 4px;
  }
  .custom-name {
    color: #353535;
    text-align: left;
    font-size: 10px;
    font-weight: bolder;
    margin: 0px 7px;
    line-height: 10px;
    margin-bottom: 0px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .custom-desc {
    color: #b3b6c5;
    font-size: 8px;
    line-height: 9px;
    font-weight: bold;
    margin: 4px 7px 0px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-align: left;
  }
}
.custom-selected-item {
  background-color: #def1ea !important;
}
</style>
