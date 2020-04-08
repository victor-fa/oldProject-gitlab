<template>
  <div class="transport-header-view">
    <div class="left-view">
      <div
        v-for="(item, index) in showItems"
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
    <div v-if="status === 'doing'" class="right-view">
      <a-dropdown>
        <a-menu slot="overlay" @click="uploadBack">
          <a-menu-item key="backupFile">上传文件</a-menu-item>
          <a-menu-item key="backupFolder">上传文件夹</a-menu-item>
        </a-menu>
        <a-button class="right-button" style="margin-left: 8px"> 上传备份 <a-icon type="down" /> </a-button>
      </a-dropdown>
      <a-button @click="handleBtnClick('pauseAll')">全部暂停</a-button>
      <a-button @click="handleBtnClick('cancelAll')">全部取消</a-button>
    </div>
    <div v-else class="right-view">
      <a-button @click="handleBtnClick('clearAll')">清空所有记录</a-button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { TransportCategory } from '../../../model/categoryList'
export default Vue.extend({
  name: 'transport-header-view',
  props: {
    categorys: Array
  },
  data () {
    let items = this.categorys as TransportCategory[]
    return {
      showItems: items,
      status: 'doing'
    }
  },
  methods: {
    showSplitLine (index: number) {
      return index !== this.categorys.length - 1
    },
    handleCategoryChange (index: number) {
      this.showItems = this.showItems.map((item, aIndex) => {
        item.isSelected = index === aIndex
        return item
      })
      this.status = index === 0 ? 'doing' : 'done'
      this.$emit('categroyChange', index)
    },
    handleBtnClick (command: string) {
      this.$emit('batchAction', command)
    },
    uploadBack (e) {
      this.$emit('batchAction', e.key) // call parent
    }
  },
  filters: {
    formateName: function (value: string, count: number) {
      return count === 0 ? value : `${value}（${count}）`
    }
  }
})
</script>

<style lang="less" scoped>
.transport-header-view {
  height: 45px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  margin: 0px 15px;
  border-bottom: 1px solid #dcdcdc;
  .left-view {
    .left-view-item {
      display: inline-block;
      .ant-btn {
        max-width: 100px;
        border: none;
        height: 30px;
        color: #484848;
        font-size: 14px;
        line-height: 14px;
        padding: 0px;
        margin: 0px 10px;
      }
      .ant-btn-selected {
        color: #06B650;
      }
      .split-line {
        color: #484848;
        font-size: 14px;
      }
    }
  }
  .right-view {
    padding-right: 4px;
    .ant-btn {
      height: 22px;
      padding: 0px 10px;
      margin-left: 6px;
      font-size: 13px;
      color: #484848;
      border: 1px solid #e5e5e5;
    }
  }
}
</style>
