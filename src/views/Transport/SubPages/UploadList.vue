<template>
  <div>
    <main-page
      :category="category"
      :dataSource="dataArray"
      :currentTab="'upload'"
      v-on:categoryChange="handleCategoryChange"
      v-on:transportOperateAction="handleOperateAction"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import MainPage from '../MainPage/index.vue'
import { TRANSFORM_INFO } from '../../../common/constants'
import { uploadCategorys } from '../../../model/categoryList'
import { mapGetters } from 'vuex'

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
  computed: {
    ...mapGetters('Transform', ['uploadInfo'])
  },
  created () {
    this.resetSelected()
    this.getListData()
  },
  destroyed() {
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
      const list = this.uploadInfo
      uploadCategorys[0].count = list.filter(item => item.trans_type === 'upload' && item.state === 'interrupted').length  // 正在上传
      uploadCategorys[1].count = list.filter(item => item.trans_type === 'upload' && item.state === 'completed').length  // 上传完成
      this.dataArray = list.filter(item => {
        return item.trans_type === 'upload' && item.state === this.state
      })
      console.log(JSON.parse(JSON.stringify(this.dataArray)));
    },
    clearAllTrans() { // 清空所有记录
      const _this = this as any
      if (_this.uploadInfo.length === 0) {
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
          _this.$store.dispatch('Transform/updateTransUploadInfo', [])
          _this.$store.dispatch('Transform/saveTransUploadInfo') // 清空后要更新缓存，不然下次进来可能有问题
          _this.getListData()
        }
      });
    },
    resetSelected() { // 重置默认选项
      uploadCategorys[0].isSelected = true
      uploadCategorys[1].isSelected = false
    }
  }
})
</script>

<style lang="less" scoped>

</style>
