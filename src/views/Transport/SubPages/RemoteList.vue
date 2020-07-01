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
import { RemoteTask, RemoteTaskStatus } from '../../../api/NasFileModel'
import NasFileAPI from '../../../api/NasFileAPI'
import { TransportModel, remoteCategorys, TransportStatus } from '../MainPage/TransportModel'
import TransportHandler from '../TransportHandler'
import { EventBus } from '../../../utils/eventBus'
import { EventName } from '../../../utils/processCenter'
import { TaskStatus } from '../../../api/Transport/BaseTask'
import { AxiosResponse } from 'axios'
import { BasicResponse } from '../../../api/UserModel'

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
      categorys: _.cloneDeep(remoteCategorys),
      status: TransportStatus.doing
    }
  },
  created () {
    this.fetchRemoteList()
  },
  destroyed () {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  },
  methods: {
    // handle subviews action
    handleCategoryChange (index: number) {
      this.status = this.categorys[index].status
      this.updateView()
    },
    handleOperateAction (command: string) {
      switch (command) {
        case 'pauseAll':
          this.pauseAllTask()
          break
        case 'continue':
          this.continueAllTask()
          break
        case 'cancelAll':
          this.cancelDoingTasks()
          break;
        case 'clearAll':
          this.cancelDoneTasks()
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
    fetchRemoteList (showLoading: boolean = true) {
      this.loading = showLoading
      NasFileAPI.fetchRemoteTaskList().then(response => {
        console.log(response)
        this.loading = false
        if (response.data.code !== 200) return
        const tasks = _.get(response.data.data, 'list') as RemoteTask[] 
        this.dataArray = tasks.map(item => {
          return TransportHandler.convertRemoteTask(item)
        })
        this.updateView()
        this.pollRemoteList()
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message.error('网络连接错误，请检测网络')
      })
    },
    updateView () {
      let canResumeAll = false
      this.showArray = this.dataArray.filter(model => {
        if (model.status !== TaskStatus.suspend && model.status !== TaskStatus.error) canResumeAll = false
        return model.category === this.status
      })
      this.categorys = this.categorys.map(item => {
        if (item.status === this.status) {
          item.count = this.showArray.length
        } else {
          item.count = this.dataArray.length - this.showArray.length
        }
        item.isSelected = item.status === this.status
        item.batchItems = item.batchItems.map(item => {
          item.disable = this.showArray.length === 0
          if (item.command === 'pauseAll') item.isHidden = canResumeAll
          if (item.command === 'resumeAll') item.isHidden = !canResumeAll
          return item
        })
        return item
      })
    },
    pollRemoteList () {
      let hasDoingTask = false
      for (let index = 0; index < this.dataArray.length; index++) {
        const task = this.dataArray[index]
        if (task.status === TaskStatus.progress || task.status === TaskStatus.pending) {
          hasDoingTask = true
          break
        }
      }
      if (hasDoingTask) {
        timer = setTimeout(() => {
          this.fetchRemoteList(false)
        }, 1500)
      } else {
        if (timer !== null) {
          clearTimeout(timer)
          timer = null
        }
      }
    },
    // batch operation
    pauseAllTask () {
      this.loading = true
      const status = RemoteTaskStatus.prerunning | RemoteTaskStatus.running
      NasFileAPI.pauseRemoteTask(undefined, status).then(response => {
        this.handleRequestSuccess(response)
      }).catch(error => {
        this.handleRequestError(error, '全部暂停失败')
      })
    },
    continueAllTask () {
      this.loading = true
      const status = RemoteTaskStatus.pause
      NasFileAPI.continueRemoteTask(undefined, status).then(response => {
        this.handleRequestSuccess(response)
      }).catch(error => {
        this.handleRequestError(error, '全部继续失败')
      })
    },
    cancelDoingTasks () {
      this.loading = true
      const status = RemoteTaskStatus.prerunning | RemoteTaskStatus.running | RemoteTaskStatus.error | RemoteTaskStatus.pause
      NasFileAPI.removeRemoteTask(undefined, status).then(response => {
        this.handleRequestSuccess(response)
      }).catch(error => {
        this.handleRequestError(error, '全部删除失败')
      })
    },
    cancelDoneTasks () {
      this.loading = true
      const status = RemoteTaskStatus.completed
      NasFileAPI.removeRemoteTask(undefined, status).then(response => {
        this.handleRequestSuccess(response)
      }).catch(error => {
        this.handleRequestError(error, '全部删除失败')
      })
    },
    // single operation
    pauseRemoteTask (id: number) {
      this.loading = true
      NasFileAPI.pauseRemoteTask(id).then(response => {
        this.handleRequestSuccess(response)
      }).catch(error => {
        this.handleRequestError(error, '暂停失败')
      })
    },
    continueRemoteTask (id: number) {
      this.loading = true
      NasFileAPI.continueRemoteTask(id).then(response => {
        this.handleRequestSuccess(response)
      }).catch(error => {
        this.handleRequestError(error, '继续失败')
      })
    },
    cancelRemoteTask (id: number) {
      this.loading = true
      NasFileAPI.removeRemoteTask(id).then(response => {
        this.handleRequestSuccess(response)
      }).catch(error => {
        this.handleRequestError(error, '删除失败')
      })
    },
    handleRequestSuccess (response: AxiosResponse<BasicResponse>) {
      console.log(response)
      this.loading = false
      if (response.data.code !== 200) return
      this.fetchRemoteList()
    },
    handleRequestError (error: any, tip: string) {
      console.log(error)
      this.loading = false
      this.$message.error(tip)
    }
  }
})
</script>

<style lang="less" scoped>

</style>
