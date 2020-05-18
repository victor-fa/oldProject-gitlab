<template>
  <div class="first-directory">
    <span v-show="showDisk" class="separator-tip">磁盘</span>
    <storage-list-item
      v-for="(item, index) in storages"
      :key="index"
      id="disk-item"
      :model="item"
      :isSelected="item.isSelected"
      @click.native.stop="diskClick(index)"
      @dblclick.native.stop="diskDoubleClick(index)"
    />
    <span v-show="showCustom" class="separator-tip">精选</span>
    <div class="book-item">
      <custom-list-item
        v-for="(item, index) in customs"
        :key="index"
        id="custom-list-item"
        :index="index"
        :model="item"
        :isSelected="item.isSelected"
        @click.native.stop="customClick(index)"
        @dblclick.native.stop="customDoubleClick(index)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import StorageListItem from '@/views/Storage/StorageListItem.vue'
import CustomListItem from '@/views/Custom/CustomListItem.vue' 

export default Vue.extend({
  name: 'first-directory',
  components: {
    StorageListItem,
    CustomListItem
  },
  props: {
    storages: Array,
    customs: Array
  },
  computed: {
    showDisk: function () {
      const count = this.storages.length as number
      return count > 0
    },
    showCustom: function () {
      const count = this.customs.length as number
      return count > 0
    }
  },
  methods: {
    diskClick (aIndex: number) {
      this.$emit('callbackAction', 'diskClick', aIndex)
    },
    diskDoubleClick (index: number) {
      this.$emit('callbackAction', 'diskDoubleClick', index)
    },
    customClick (aIndex: number) {
      this.$emit('callbackAction', 'customClick', aIndex)
    },
    customDoubleClick (index: number) {
      this.$emit('callbackAction', 'customDoubleClick', index)
    }
  }
})
</script>

<style lang="less" scoped>
.first-directory {
  height: 259px;
  overflow: scroll;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  .separator-tip {
    color: #484848;
    font-size: 14px;
    text-align: left;
    padding-left: 13px;
    padding-top: 4px;
  }
  #disk-item {
    width: auto;
    border-radius: 8px;
    margin: 4px 10px 2px;
    justify-content: flex-start;
    cursor: default;
  }
  .book-item {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    margin-left: 10px;
    #custom-list-item {
      background-color: white;
      margin: 4px 3px;
      border-radius: 6px;
    }
  }
}
</style>
