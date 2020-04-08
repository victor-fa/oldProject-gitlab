<template>
  <main-page
    :category="category"
    :dataSource="dataArray"
    v-on:categoryChange="handleCategoryChange"
    v-on:transportOperateAction="handleOperateAction"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import MainPage from '../MainPage/index.vue'
import { TRANSFORM_INFO } from '../../../common/constants'
import { downloadCategorys } from '../../../model/categoryList'

export default Vue.extend({
  name: 'download-list',
  components: {
    MainPage
  },
  data () {
    return {
      dataArray: [],
      category: downloadCategorys,
      state: 'interrupted'
    }
  },
  created () {
    this.getListData()
    downloadCategorys[(this.state === 'interrupted' ? 0 : 1)].count = this.dataArray.length
  },
  methods: {
    // handle views action
    handleCategoryChange (index: number) {  // 切换"正在下载"、"下载完成"
      if (index === 0) {
        this.state = 'interrupted'
      } else if (index === 1) {
        this.state = 'completed'
      }
      this.getListData()
    },
    handleOperateAction (command: string) {
      console.log(command);
      switch (command) {
        case 'pauseAll':  // 全部暂停
          
          break;
        case 'cancelAll': // 全部取消
          
          break;
        case 'clearAll': // 清除所有记录
          
          break;
        default:
          break;
      }
    },
    // inner private methods
    getListData () {
      const listJson = localStorage.getItem(TRANSFORM_INFO)
      if (listJson === null) return
      const list = JSON.parse(listJson)
      this.dataArray = list.filter(item => {
        return item.trans_type === 'download' && item.state === this.state
      })
      console.log(JSON.parse(JSON.stringify(this.dataArray)));
    }
  }
})
</script>

<style lang="less" scoped>

</style>
