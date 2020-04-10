<template>
  <div>
    <header-view
      :categorys="category"
      :currentTab="currentTab"
      v-on:categroyChange="handleCategoryChange"
      v-on:batchAction="handleBatchAction"
    />
    <basic-list
      :adjust="122"
      :dataSource="dataSource"
    >
      <template v-slot:renderItem="{ item, index}">
        <transport-item
          :model="item"
          :index="index"
          :status="status"
          v-on:CallbackControl="handleControl"
        />
      </template>
    </basic-list>
    <main-bottom-view/>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import HeaderView from './HeaderView.vue'
import BasicList from '../../../components/BasicList/index.vue'
import { TransportTask } from '../../../api/NasFileModel'
import TransportItem from './TransportItem.vue'
import MainBottomView from '../../MainView/MainBottomView.vue'

export default Vue.extend({
  name: 'transport-main-page',
  components: {
    HeaderView,
    BasicList,
    TransportItem,
    MainBottomView
  },
  props: {
    dataSource: Array,
    category: Array,
    currentTab: String
  },
  data () {
    return {
      status: this.category[0]
    }
  },
  methods: {
    handleCategoryChange (index: number) {
      this.status = this.category[index]
      this.$emit('categoryChange', index)
    },
    handleBatchAction (command: string) {
      this.$emit('transportOperateAction', command)
    },
    handleControl (model, ...args: any[]) {
      this.$emit('CallbackControl', model, args[0])
    }
  }
})
</script>

<style lang="less" scoped>

</style>
