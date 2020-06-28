<template>
  <main-page
    :loading="loading"
    :categorys="categorys"
    :dataSource="showArray"
    v-on:itemAction="handleItemAction"
    v-on:categoryChange="handleCategoryChange"
    v-on:batchAction="handleOperateAction"
  />
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import MainPage from '../MainPage/index.vue'
import { RemoteTask } from '../../../api/NasFileModel'
import NasFileAPI from '../../../api/NasFileAPI'
import { TransportModel, remoteCategorys, TransportStatus } from '../MainPage/TransportModel'
import TransportHandler from '../TransportHandler'
import { EventBus } from '../../../utils/eventBus'
import { EventName } from '../../../utils/processCenter'
import { TaskStatus } from '../../../api/Transport/BaseTask'

let timer: NodeJS.Timeout | null = null

export default Vue.extend({
  name: 'remote-list',
  components: {
    MainPage
  },
  data () {
    return {
      loading: false,
      dataArray: [] as TransportModel[],
      showArray: [] as TransportModel[],
      categorys: _.cloneDeep(remoteCategorys)
    }
  },
  created () {
    this.fetchRemoteList()
  },
  destroyed () {
    if (timer !== null) clearInterval(timer)
  },
  methods: {
    // handle subviews action
    handleCategoryChange (aIndex: number) {
      this.categorys = this.categorys.map((item, index) => {
        item.isSelected = index === aIndex
        return item
      })
      this.updateView()
    },
    handleOperateAction (command: string) {
      switch (command) {
        case 'pauseAll':
          break
        case 'continue':
          break
        case 'cancelAll':
          break;
        case 'clearAll':
          break
      }
    },
    handleItemAction (command: string, index: number, ...args: any[]) {
      const model = this.showArray[index]
      switch (command) {
        case 'pause':
          this.pauseRemoteTask(model.id)
          break;
        case 'continue':
          this.continueRemoteTask(model.id)
          break;
        case 'cancel':
          this.cancelRemoteTask(model.id)
          break;
        case 'jump':
          EventBus.$emit(EventName.jump, { path: model.path, uuid: model.uuid })
          break;
        case 'delete':
          this.cancelRemoteTask(model.id)
          break;
      }
    },
    // private methods
    fetchRemoteList () {
      this.loading = true
      NasFileAPI.fetchRemoteTaskList().then(response => {
        this.loading = false
        if (response.data.code !== 200) return
        const tasks = _.get(response.data.data, 'list') as RemoteTask[] 
        this.dataArray = tasks.map(item => {
          return TransportHandler.convertRemoteTask(item)
        })
        if (!_.isEmpty(this.dataArray)) {
          timer = setInterval(this.fetchRemoteList, 2000)
          this.updateView()
        } else {
          if (timer !== null) clearInterval(timer)
        }
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    updateView () {
      const category = this.categorys.filter(item => {
        return item.isSelected
      })[0].status
      let canResumeAll = false
      this.showArray = this.dataArray.filter(model => {
        if (model.status !== TaskStatus.suspend && model.status !== TaskStatus.error) canResumeAll = false
        return model.category === category
      })
      this.categorys = this.categorys.map(item => {
        if (item.status === category) {
          item.count = this.showArray.length
        } else {
          item.count = this.dataArray.length - this.showArray.length
        }
        item.batchItems = item.batchItems.map(item => {
          item.disable = this.showArray.length === 0
          if (item.command === 'pauseAll') item.isHidden = canResumeAll
          if (item.command === 'resumeAll') item.isHidden = !canResumeAll
          return item
        })
        return item
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
