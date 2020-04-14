<template>
  <div>
    <header-view
      :categorys="category"
      :currentTab="currentTab"
      v-on:categroyChange="handleCategoryChange"
      v-on:batchAction="handleBatchAction"
    />
    <a-spin :spinning="loading">
      <basic-list
        :adjust="122"
        :dataSource="dataSource"
      >
        <template v-slot:renderItem="{ item, index}">
          <slot name="renderItem"
            :item="item"
            :index="index"
            :status="status"
            v-on:CallbackControl="handleControl"
          />
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
import BasicList from '../../../components/BasicList/index.vue'
import { TransportTask } from '../../../api/NasFileModel'
import MainBottomView from '../../MainView/MainBottomView.vue'
import { TransportCategory } from '../../../model/categoryList'

export default Vue.extend({
  name: 'transport-main-page',
  components: {
    HeaderView,
    BasicList,
    MainBottomView
  },
  props: {
    dataSource: Array,
    category: Array,
    currentTab: String
  },
  data () {
    return {
      status: this.category[0],
      loading: false
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
