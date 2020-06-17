<template>
  <div>
    <a-spin :spinning="loading">
      <header-view
        :categorys="categorys"
        v-on:categroyChange="handleCategoryChange"
        v-on:batchAction="handleBatchAction"
      />
      <basic-list
        :adjust="122"
        :dataSource="dataSource"
      >
        <template v-slot:renderItem="{ item, index }">
          <slot name="renderItem" :item="item" :index="index">
            <transport-item
              :key="item.id"
              :model="item"
              :index="index"
              v-on:operationAction="handleItemAction"
            />
          </slot>
        </template>
      </basic-list>
    </a-spin>
    <main-bottom-view/>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import HeaderView from './HeaderView.vue'
import BasicList from '@/components/BasicList/index.vue'
import { TransportTask } from '@/api/NasFileModel'
import MainBottomView from '../../MainView/MainBottomView.vue'
import TransportItem from './TransportItem.vue'

export default Vue.extend({
  name: 'transport-main-page',
  components: {
    HeaderView,
    BasicList,
    MainBottomView,
    TransportItem
  },
  props: {
    loading: Boolean,
    dataSource: Array, // 列表数据
    categorys: Array // 表头数据
  },
  methods: {
    handleCategoryChange (index: number) {
      this.$emit('categoryChange', index)
    },
    handleBatchAction (command: string) {
      this.$emit('batchAction', command)
    },
    handleItemAction (command: string, taskId: number) {
      this.$emit('itemAction', command, taskId)
    }
  }
})
</script>
