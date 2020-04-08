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
import { uploadCategorys } from '../../../model/categoryList'

export default Vue.extend({
  name: 'upload-list',
  components: {
    MainPage
  },
  data () {
    return {
      dataArray: [],
      category: uploadCategorys,
      state: 'interrupted'
    }
  },
  created () {
    this.getListData()
  },
  methods: {
    // handle views action
    handleCategoryChange (index: number) {  // 切换"正在上传"、"上传完成"
      if (index === 0) {
        this.state = 'progressing'
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
        return item.trans_type === 'upload' && item.state === this.state
      })
      uploadCategorys[(this.state === 'interrupted' ? 0 : 1)].count = this.dataArray.length
      console.log(JSON.parse(JSON.stringify(this.dataArray)));
    }
  }
})
</script>

<style lang="less" scoped>

</style>
