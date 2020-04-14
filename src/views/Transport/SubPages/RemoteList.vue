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
import { remoteCategorys, TransportStatus } from '../../../model/categoryList'
import { ResourceType, RemoteTask, RemoteTaskStatus } from '../../../api/NasFileModel'
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
          
          break;
        case 'cancelAll':
          
          break;
        case 'clearAll':
          
          break;
      }
    },
    handleItemAction (command: string, ...args: any[]) {
      const item = this.showArray[args[0]]
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
          
          break;
        case 'open':
          
          break;
        case 'openInFinder':
          
          break;
        case 'delete':
          this.cancelRemoteTask(item.id)
          break;
      }
    },
    // private methods
    fetchRemoteList () {
      this.loading = true
      NasFileAPI.fetchRemoteTaskList().then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        // const tasks = _.get(response.data.data, 'list') as RemoteTask[] 
        const tasks: RemoteTask[] = [
          { id: 1, status: RemoteTaskStatus.prerunning, type: ResourceType.folder, uid: 1, errmsg: '', total_num: 100, total_size: 100 * 1024 * 1024, curr_num: 50, curr_size: 40 * 1024 * 1024, curr_src_path: '/a1', curr_dst_path: '/b1', speed: 20 * 1024 },
          { id: 2, status: RemoteTaskStatus.running, type: ResourceType.folder, uid: 1, errmsg: '', total_num: 200, total_size: 200 * 1024 * 1024, curr_num: 60, curr_size: 50 * 1024 * 1024, curr_src_path: '/a2', curr_dst_path: '/b2', speed: 30 * 1024 },
          { id: 3, status: RemoteTaskStatus.error, type: ResourceType.folder, uid: 1, errmsg: 'error', total_num: 300, total_size: 300 * 1024 * 1024, curr_num: 60, curr_size: 60 * 1024 * 1024, curr_src_path: '/a3', curr_dst_path: '/b3', speed: 40 * 1024 },
          { id: 4, status: RemoteTaskStatus.pause, type: ResourceType.folder, uid: 1, errmsg: 'error', total_num: 400, total_size: 400 * 1024 * 1024, curr_num: 70, curr_size: 70 * 1024 * 1024, curr_src_path: '/a4', curr_dst_path: '/b4', speed: 50 * 1024 },
          { id: 5, status: RemoteTaskStatus.completed, type: ResourceType.folder, uid: 1, errmsg: 'error', total_num: 500, total_size: 500 * 1024 * 1024, curr_num: 80, curr_size: 80 * 1024 * 1024, curr_src_path: '/a5', curr_dst_path: '/b5', speed: 60 * 1024 }
        ]
        this.dataArray = tasks.map(item => {
          return TransportHandler.convertRemoteTask(item)
        })
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    filterDataArray (status: TransportStatus) {
      return this.dataArray.filter(item => {
        return item.status === status
      })
    },
    updateCategoryCount (status: TransportStatus) {
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
