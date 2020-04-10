<template>
  <div>
    <main-page
      :category="category"
      :dataSource="dataArray"
      :currentTab="'upload'"
      v-on:categoryChange="handleCategoryChange"
      v-on:transportOperateAction="handleOperateAction"
      v-on:CallbackControl="handleControl"
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
      state: 'progressing'
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
      const _this = this as any
      switch (command) {
        case 'pauseAll':  // 全部暂停
          let pauseCount = 0
          this.uploadInfo.forEach(item => {
            if (item.state === 'progressing') {
              pauseCount++
            }
          })
          if (pauseCount === 0) {
            _this.$message.warning('无可暂停任务')
          }
          break;
        case 'resumeAll':  // 全部开始
          let resumeCount = 0
          this.uploadInfo.forEach(item => {
            if (item.state === 'interrupted') {
              resumeCount++
            }
          })
          if (resumeCount === 0) {
            _this.$message.warning('无可开始任务')
          }
          break;
        case 'cancelAll': // 全部取消
          let cancelCount = 0
          this.uploadInfo.forEach(item => {
            if (item.state === 'progressing') {
              cancelCount++
            }
          })
          if (cancelCount === 0) {
            _this.$message.warning('无可取消任务')
          } else {
            setTimeout(() => { _this.getListData() }, 1000);
          }
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
      console.log(JSON.parse(JSON.stringify(this.uploadInfo)));
      uploadCategorys[0].count = list.filter(item => item.trans_type === 'upload' && (item.state === 'progressing' || item.state === 'interrupted')).length  // 正在上传
      uploadCategorys[1].count = list.filter(item => item.trans_type === 'upload' && item.state === 'completed').length  // 上传完成
      this.dataArray = list.filter(item => {
        if (item.state === 'progressing' || item.state === 'completed') {
          return item.trans_type === 'upload' && item.state === this.state
        } else if (item.state === 'interrupted') {
          return item.trans_type === 'upload' && item.state === 'interrupted'
        }
      })
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
    },
    handleControl(model, ...args: any[]) {
      const _this = this as any
      switch (args[0]) {
        case 'deleteFile':
          _this.$electron.shell.beep()
          _this.$confirm({
            title: '删除',
            content: '是否将所选文件彻底删除',
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
              // _this.$electron.shell.moveItemToTrash(item.path)  // 暂时不把本地文件删除了
              const index = _this.uploadInfo.map(o => o.name).indexOf(model.name)
              _this.uploadInfo.splice(index, 1)
              _this.getListData()
            }
          });
          break;
        case 'refresh':
          _this.getListData()
          break;
        case 'cancel':
          // _this.$ipc.send('download', 'cancel', model.id)
          setTimeout(() => {
            _this.getListData()
          }, 1000);
          break;
        case 'pause':
          let commend = model.state === 'progressing' ? 'pause' : 'resume';
          // _this.$ipc.send('download', commend, model.id);
          break;
        default:
          break;
      }
    }
  }
})
</script>

<style lang="less" scoped>

</style>
