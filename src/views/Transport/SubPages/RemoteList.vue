<template>
  <main-page
    :category="category"
    :dataSource="dataArray"
    :currentTab="'remote'"
    v-on:categoryChange="handleCategoryChange"
    v-on:transportOperateAction="handleOperateAction"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import MainPage from '../MainPage/index.vue'

export default Vue.extend({
  name: 'remote-list',
  components: {
    MainPage
  },
  data () {
    return {
      dataArray: [],
      category: [],
      state: 'interrupted'
    }
  },
  computed: {
  },
  created () {
  },
  methods: {
    // handle views action
    handleCategoryChange (index: number) {  // 切换"正在下载"、"下载完成"
      
    },
    handleOperateAction (command: string) {
      
    },
  }
})
</script>

<style lang="less" scoped>

</style>
