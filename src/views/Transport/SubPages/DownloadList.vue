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
import { mapGetters } from 'vuex'

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
  computed: {
    ...mapGetters('Transform', ['downloadInfo'])
  },
  created () {
    this.getListData()
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
      // console.log(command);
      switch (command) {
        case 'pauseAll':  // 全部暂停
          
          break;
        case 'cancelAll': // 全部取消
          
          break;
        case 'clearAll': // 清除所有记录
          this.clearAllTrans()
          break;
        default:
          break;
      }
    },
    // inner private methods
    getListData () {
      const list = this.downloadInfo
      downloadCategorys[0].count = list.filter(item => item.trans_type === 'download' && item.state === 'interrupted').length  // 正在下载
      downloadCategorys[1].count = list.filter(item => item.trans_type === 'download' && item.state === 'completed').length  // 下载完成
      this.dataArray = list.filter(item => {
        return item.trans_type === 'download' && item.state === this.state
      })
      console.log(JSON.parse(JSON.stringify(this.dataArray)));
    },
    clearAllTrans() { // 清空所有记录
      const _this = this as any
      if (_this.downloadInfo.length === 0) {
        _this.$message.warning('当前无记录')
        return
      }
      _this.$electron.shell.beep()
      _this.$confirm({
        title: '删除',
        content: '是否将所所有记录清空',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk() {
          _this.$store.dispatch('Transform/updateTransDownloadInfo', [])
          _this.$store.dispatch('Transform/saveTransDownloadInfo') // 清空后要更新缓存，不然下次进来可能有问题
          _this.getListData()
        }
      });
    },
  }
})
</script>

<style lang="less" scoped>

</style>
