<template>
  <div class="silder-menu">
    <ul>
      <li
        v-for="(item, index) in silderItems"
        :key="index"
        class="menu-item"
        v-bind:class="{ 'menu-item-selected': item.meta.isSelected }"
        @click="onSelectAction(index)"
      >
        <div v-if="item.meta.icon !== undefined" class="silder-item">
          <img :src="item.meta.isSelected ? item.meta.selectedIcon : item.meta.icon"/>
          <span class="silder-item-title">{{ item.meta.title }}</span>
          <a-badge v-show="item.name === 'transport'" :count="taskCount"/>
        </div>
        <span v-else class="silder-type-item">{{ item.meta.title }}</span>
      </li>
    </ul>
    <div class="silder-storage">
      <span class="storage-name">{{ nasInfo.name }}</span>
      <a-progress
        class="progress"
        :percent="storageInfo.precent"
        :showInfo="false"
        :strokeColor="'#7C7C7C'"
        :strokeWidth="6"
      />
      <div class="storage-info">
        <span>存储空间</span>
        <span>{{ storageInfo.info }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { FuncListItem } from '@/router/modules/HomeList'
import { StorageInfo } from '../../api/NasFileModel'
import { NasInfo } from '@/api/ClientModel'

export default Vue.extend({
  name: 'sider-menu',
  props: {
    silderItems: Array,
    taskCount: {
      default: 0
    }
  },
  data () {
    return {
      storageInfo: {} as any
    }
  },
  computed: {
    ...mapGetters('Resource', ['storages']),
    ...mapGetters('NasServer', ['nasInfo'])
  },
  watch: {
    storages: function () {
      this.getStorageInfo()
    }
  },
  mounted () {
    this.getStorageInfo()
  },
  methods: {
    getStorageInfo () {
      const storage = (this.storages as StorageInfo[])[0]
      if (_.isEmpty(storage)) return
      const precent = storage.showProgress
      const info = storage.showSize
      this.storageInfo = { precent, info }
    },
    onSelectAction (index: number) {
      const item = this.silderItems[index] as FuncListItem
      if (item.meta!.isSelected) {
        this.$emit('popTop', index)
        return
      }
      this.$emit('change', index)
    },
    showTypeItem (item: FuncListItem) {
      return item.meta!.icon !== undefined
    }
  }
})
</script>

<style lang="less" scoped>
.silder-menu {
  height: 100%;
  width: 100%;
  padding-top: 14px;
  background-color: #F8F9FC;
  border-right: 1px solid #BCC0CE40;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  .menu-item {
    .silder-item {
      display: flex;
      align-items: center;
      height: 32px;
      img {
        width: 20px;
        margin:0px 18px 0px 32px;
      }
      .silder-item-title {
        display: inline-block;
        font-size: 13px;
        color: black;
        width: 70px;
        text-align: left;
      }
    }
    .silder-type-item {
      line-height: 30px;
      height: 30px;
      font-size: 13px;
      color: black;
    }
  }
  .menu-item:hover {
    background-color: #06B65010;
    .silder-item {
      .silder-item-title {
        color: #007934;
      }
    }
    .silder-type-item {
      color: #007934;
    }
  }
  .menu-item-selected, .menu-item-selected:hover {
    background-color: #06B65019;
    .silder-item {
      .silder-item-title {
        color: #007934;
      }
    }
    .silder-type-item {
      color: #007934;
    }
  }
  .silder-storage {
    margin: 0px 18px 20px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    .storage-name {
      color: black;
      font-size: 12px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .progress {
      height: 20px;
      line-height: 20px;
    }
    .storage-info {
      span:first-child {
        color: black;
        font-size: 9px;
        width: 36px;
      }
      span:last-child {
        color: black;
        font-size: 9px;
        margin-left: 12px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
    }
  }
}
</style>

<style>
.silder-menu .silder-storage .ant-progress-inner {
  border: 1px solid #9B9FA9;
}
</style>
