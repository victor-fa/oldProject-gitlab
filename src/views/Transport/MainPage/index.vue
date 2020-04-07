<template>
  <div>
    <header-view
      :categorys="categorys"
      v-on:categroyChange="handleCategoryChange"
      v-on:batchAction="handleBatchAction"
    />
    <basic-list
      :adjust="122"
      :dataSource="dataSource"
    >
      <template v-slot:renderItem="{ item, index}">
        <transport-item :model="item" :index="index" :status="status"/>
      </template>
    </basic-list>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import HeaderView from './HeaderView.vue'
import BasicList from '../../../components/BasicList/index.vue'
import { transportCategorys } from '../../../model/categoryList'
import { TransportTask } from '../../../api/NasFileModel'
import TransportItem from './TransportItem.vue'

export default Vue.extend({
  name: 'transport-main-page',
  components: {
    HeaderView,
    BasicList,
    TransportItem
  },
  props: {
    dataSource: Array
  },
  data () {
    return {
      categorys: _.cloneDeep(transportCategorys),
      status: transportCategorys[0].type
    }
  },
  methods: {
    handleCategoryChange (index: number) {
      this.status = this.categorys[index].type
      this.$emit('categoryChange', index)
    },
    handleBatchAction (command: string) {
      this.$emit('transportOperateAction', command)
    }
  }
})
</script>

<style lang="less" scoped>

</style>
