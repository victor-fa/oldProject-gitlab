<template>
  <main-page
    v-on:categoryChange="handleCategoryChange"
    v-on:transportOperateAction="handleOperateAction"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import MainPage from '../MainPage/index.vue'
import { TRANSFORM_INFO } from '../../../common/constants'

export default Vue.extend({
  name: 'download-list',
  components: {
    MainPage
  },
  data () {
    return {
      dataArray: []
    }
  },
  created () {
    this.getListData()
  },
  methods: {
    // handle views action
    handleCategoryChange (index: number) {

    },
    handleOperateAction (command: string) {

    },
    // inner private methods
    getListData () {
      const listJson = localStorage.getItem(TRANSFORM_INFO)
      if (listJson === null) return
      const list = JSON.parse(listJson)
      console.log(list)
    }
  }
})
</script>

<style lang="less" scoped>

</style>
