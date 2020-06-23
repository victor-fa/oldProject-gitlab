<template>
  <div class="transport-header-view">
    <div class="left-view">
      <div
        v-for="(item, index) in categorys"
        :key="index"
        class="left-view-item"
      >
        <a-button
          :class="{ 'ant-btn-selected': item.isSelected }"
          @click="handleCategoryChange(index)"
        >
          {{ item.name + ` (${item.count})` }}
        </a-button>
        <span v-show="showSplitLine(index)" class="split-line">/</span>
      </div>
    </div>
    <div class="right-view">
      <a-button
        v-for="(item, index) in showBatchItems"
        :key="item.command"
        :disabled="item.disable === true"
        @click="handleBatchAction(index)"
      >
        {{ item.title }}
      </a-button>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { TransportCategory, BatchItem } from './TransportModel'

export default Vue.extend({
  name: 'transport-header-view',
  props: {
    categorys: Array
  },
  computed: {
    showBatchItems: function () {
      const categorys = this.categorys as TransportCategory[]
      for (let index = 0; index < categorys.length; index++) {
        const element = categorys[index]
        if (element.isSelected) {
          return element.batchItems.filter(item => {
            return item.isHidden !== true
          })
        }
      }
      return [] as BatchItem[]
    }
  },
  methods: {
    showSplitLine (index: number) {
      return index !== this.categorys.length - 1
    },
    handleCategoryChange (index: number) {
      const item = this.categorys[index] as TransportCategory
      if (item.isSelected) return
      this.$emit('categroyChange', index)
    },
    handleBatchAction (index: number) {
      const item = this.showBatchItems[index]
      item.disable = true
      this.showBatchItems.splice(index, 1, item)
      this.$emit('batchAction', item.command)
    },
  }
})
</script>

<style lang="less" scoped>
.transport-header-view {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #F8F9FC;
  border-bottom: 1px solid #BCC0CE40;
  .left-view {
    margin-left: 8px;
    height: 100%;
    display: flex;
    align-items: center;
    .left-view-item {
      display: inline-block;
      .ant-btn {
        max-width: 100px;
        border: none;
        color: #484848;
        font-size: 14px;
        font-weight: bold;
        line-height: 14px;
        padding: 0px;
        margin: 0px 10px;
        background-color: #F8F9FC;
      }
      .ant-btn-selected {
        color: #007934;
      }
      .split-line {
        color: #484848;
        font-size: 14px;
      }
    }
  }
  .right-view {
    height: 100%;
    padding-right: 4px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    .ant-btn {
      height: 22px;
      padding: 0px 10px;
      margin-left: 6px;
      font-size: 13px;
      color: black;
      border: 1px solid #e5e5e5;
    }
  }
}
</style>
