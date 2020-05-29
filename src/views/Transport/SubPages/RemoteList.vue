<template>
  <main-page
    :dataSource="showArray"
    :category="categorys"
    v-on:categoryChange="handleCategoryChange"
    v-on:transportOperateAction="handleOperateAction"
  >
    <template v-slot:renderItem="{ item, index}">
      <transport-item
        :ref="'renderItem' + item.id"
        :key="item.id"
        :model="item"
        :index="index"
        v-on:operationAction="handleItemAction"
      />
    </template>
  </main-page>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainPage from '../MainPage/index.vue'
import { remoteCategorys, UploadStatus } from '../../../model/categoryList'
import { RemoteTask } from '../../../api/NasFileModel'
import TransportItem from '../MainPage/TransportItem.vue'
import NasFileAPI from '../../../api/NasFileAPI'
import { TransportModel } from '../MainPage/TransportModel'
import TransportHandler from '../TransportHandler'

let timer: NodeJS.Timeout | null = null

export default Vue.extend({
  name: 'remote-list',
  components: {
    MainPage,
    TransportItem
  },
  data () {
    let items: TransportModel[] = []
    return {
      loading: false,
      dataArray: items,
      showArray: items,
      categorys: remoteCategorys
    }
  },
  watch: {
    dataArray: function (value: TransportModel[]) {
      const item = this.categorys.filter(item => {
        return item.isSelected
      })[0]
      this.showArray = this.filterDataArray(item.status)
      this.updateCategoryCount(item.status)
    }
  },
  created () {
    this.resetSelected()
    this.fetchRemoteList()
  },
  mounted () {
    timer = setInterval(this.fetchRemoteList, 1000)
  },
  destroyed () {
    if (timer !== null) clearInterval(timer)
  },
  methods: {
    // handle subviews action
    handleCategoryChange (index: number) {
      const item = this.categorys[index]
      this.showArray = this.filterDataArray(item.status)
    },
    handleOperateAction (command: string) {
      switch (command) {
        case 'pauseAll':
          const pauseAllFlag = this.showArray.some(item => item.status !== UploadStatus.completed)
          if (!pauseAllFlag) {
            this.$message.error('无可暂停任务')
          } else {
            this.showArray.forEach(item => {
              if (item.status !== UploadStatus.completed) {
                this.pauseRemoteTask(item.id)
              }
            })
          }
          break;
        case 'cancelAll':
          const cancelAllFlag = this.showArray.some(item => item.status !== UploadStatus.completed)
          if (!cancelAllFlag) {
            this.$message.error('无可取消任务')
          } else {
            this.showArray.forEach(item => {
              if (item.status !== UploadStatus.completed) {
                this.cancelRemoteTask(item.id)
              }
            })
          }
          break;
        case 'clearAll':
          const clearAllFlag = this.showArray.some(item => item.status === UploadStatus.completed)
          const _this = this as any
          if (!clearAllFlag) {
            this.$message.error('无可清空任务')
          } else {
            _this.$electron.shell.beep()
            _this.$confirm({
              title: '删除',
              content: '是否将所有记录清空',
              okText: '删除',
              okType: 'danger',
              cancelText: '取消',
              onOk() {
                _this.showArray.forEach(item => {
                  if (item.status === UploadStatus.completed) {
                    _this.cancelRemoteTask(item.id)
                  }
                })
                setTimeout(() => { _this.fetchRemoteList() }, 1000);
              }
            });
          }
          break;
      }
    },
    handleItemAction (command: string, ...args: any[]) {
      const item = this.showArray[args[0]]
      const _this = this as any
      switch (command) {
        case 'pause':
          this.pauseRemoteTask(item.id)
          break;
        case 'continue':
          this.continueRemoteTask(item.id)
          break;
        case 'cancel':
          this.cancelRemoteTask(item.id)
          break;
        case 'jump':
          _this.$electron.shell.showItemInFolder(item.sourcePath)
          break;
        case 'delete':
          this.cancelRemoteTask(item.id)
          break;
      }
    },
    // private methods
    resetSelected() { // 重置默认选项
      remoteCategorys[0].isSelected = true
      remoteCategorys[1].isSelected = false
    },
    fetchRemoteList () {
      this.loading = true
      NasFileAPI.fetchRemoteTaskList().then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        const tasks = _.get(response.data.data, 'list') as RemoteTask[] 
        this.dataArray = tasks.map(item => {  // 1-1 / 2-2 / 4-4 / 8-8 / 10-16  对应16进制
          return TransportHandler.convertRemoteTask(item)
        })
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    filterDataArray (status: UploadStatus) {
      return this.dataArray.filter(item => {
        return item.status === status
      })
    },
    updateCategoryCount (status: UploadStatus) {
      this.categorys = this.categorys.map(aItem => {
        if (aItem.status === status) {
          aItem.count = this.showArray.length
        } else {
          aItem.count = this.dataArray.length - this.showArray.length
        }
        return aItem
      })
    },
    pauseRemoteTask (id: number) {
      const refKey = 'renderItem' + id
      const item: any = this.$refs[refKey]
      item.setOperateItemDisable('pause', true)
      NasFileAPI.pauseRemoteTask(id).then(response => {
        item.setOperateItemDisable('pause', false)
        if (response.data.code !== 200) return
        item.updatePauseItem()
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
        item.setOperateItemDisable('pause', false)
      })
    },
    continueRemoteTask (id: number) {
      const refKey = 'renderItem' + id
      const item: any = this.$refs[refKey]
      item.setOperateItemDisable('continue', true)
      NasFileAPI.continueRemoteTask(id).then(response => {
        item.setOperateItemDisable('continue', false)
        if (response.data.code !== 200) return
        item.updateContinueItem()
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
        item.setOperateItemDisable('continue', false)
      })
    },
    cancelRemoteTask (id: number) {
      const refKey = 'renderItem' + id
      const item: any = this.$refs[refKey]
      item.setOperateItemDisable('cancel', true)
      NasFileAPI.removeRemoteTask(id).then(response => {
        item.setOperateItemDisable('cancel', false)
        if (response.data.code !== 200) return
        this.removeTaskFromShowArray(id)
      }).catch(error => {
        console.log(error)
        this.$message.error('网络连接错误，请检测网络')
        item.setOperateItemDisable('cancel', false)
      })
    },
    removeTaskFromShowArray (id: number) {
      this.showArray = this.showArray.filter(item => {
        return item.id !== id
      })
    }
  }
})
</script>

<style lang="less" scoped>

</style>
