<template>
  <div
    class="storage-item"
    v-bind:class="{
      'storage-item-selected': isSelected,
      'storage-item-init': isInit
    }"
  >
    <img :src="model.showIcon"/>
    <div class="content">
      <label class="title">{{ model.showName }}</label>
      <label class="size">{{ isInit ? '未初始化' : model.showSize }}</label>
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
import { mapGetters } from 'vuex'
import { DeviceRole } from '@/api/UserModel'
import { PartitionInfo, StorageType } from '@/api/NasFileModel'

export default Vue.extend({
  name: 'storage-list-item',
  props: {
    model: {
      type: Object,
      required: true
    },
    index: Number,
    // 为什么不直接在model中绑定isSelected
    // 在界面元素没有改变情况下，单独改变状态是不会导致model的改变
    isSelected: {
      default: false
    }
  },
  computed: {
    ...mapGetters('NasServer', ['accessInfo']),
    isInit: function () {
      const model = this.model as PartitionInfo
      const isAdmin = this.accessInfo.role === DeviceRole.admin
      const isInit = model.status === 1
      if (model.isInternal && isAdmin && isInit) return true
      return false
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
.storage-item-init {
  border-radius: 6px;
  background-color: #F1F2F7;
  pointer-events: none;
}
</style>

<style>
.storage-item .content .ant-progress-inner {
  border-radius: 0;
  width: 130px;
}
</style>
