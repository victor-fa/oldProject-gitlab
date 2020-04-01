<template>
  <div>
    <transport-header-view
      :transformList="transformData"
      v-on:CallbackAction="handleHeaderViewAction"
    />
    <TransportList
      ref="realResourceList"
      :currentTag="currentTag"
      :isDownOrFin="isDownOrFin"
      :transformList="transformData"
      v-on:CallbackItemAction="handleListViewAction"
    />
    <main-bottom-view/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import TransportHeaderView from './TransportHeaderView.vue'
import MainBottomView from '../MainView/MainBottomView.vue'
import MainView from '../MainView/index.vue'
import TransportList from '../../components/TransportList/index.vue'
import { realResourceList } from '../MockData/index'
import { TaskCategoryType } from '../../model/categoryList'
import { TRANSFORM_INFO } from '../../common/constants';
import { EventBus, EventType } from '../../utils/eventBus'

export default {
  name: 'transport',
  extends: MainView,
  components: {
    TransportList,
    TransportHeaderView,
    MainBottomView
  },
  data () {
    return {
      dataArray: realResourceList,
      transformData: [],
      currentTag: '',
      isDownOrFin: ''
    }
  },
  watch: {
    $route (to, from) {
      const myThis = this as any
      if (to.name === 'transport') {  // 仅任务管理下有变化
        myThis.getData()
      }
    }
  },
  mounted () {
    const myThis = this as any
    myThis.getData()
  },
  methods: {
    handleHeaderViewAction (actionType: any, ...args: any[]) {
      const myThis = this as any
      switch (actionType) {
        case TaskCategoryType.download:
          myThis.currentTag = TaskCategoryType.download
          // myThis.handleArrangeChange(args[0])
          break;
        case TaskCategoryType.upload:
          myThis.currentTag = TaskCategoryType.upload
          // myThis.handleArrangeChange(args[0])
          break;
        // case TaskCategoryType.offline:
        //   break;
        // case TaskCategoryType.backup:
        //   break;
        // case TaskCategoryType.remote:
        //   break;
        case 'down':
          myThis.isDownOrFin = 'down' // 正在下载、正在上传
          break;
        case 'fin':
          myThis.isDownOrFin = 'fin' // 下载完成、上传完成
          break;
        case 'stopAll':  // 全部暂停
          break;
        case 'cancelAll':  // 全部取消
          break;
        case 'clearAll':  // 清除所有记录
          myThis.clearAllTrans()
          break;
      }
      myThis.getData()
    },
    handleListViewAction (actionType: any, ...args: any[]) {
      const myThis = this as any
      switch (actionType) {
        case 'refresh':
          myThis.getData()
          break;
      }
    },
    getData () {  // 获取最新值
      const myThis = this as any
      const temp:any = localStorage.getItem(TRANSFORM_INFO)
      let tempJson = JSON.parse(temp)
      myThis.transformData = tempJson !== null ? tempJson : []
    },
    clearAllTrans() { // 清空所有记录
      const myThis = this as any
      myThis.$electron.shell.beep()
      if (myThis.transformData === null) {
        myThis.$message.warning('当前无记录')
        return
      }
      myThis.$confirm({
        title: '删除',
        content: '是否将所所有记录清空',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk() {
          myThis.transformData.filter(item => item.trans_type === myThis.currentTag).forEach(item => {
            myThis.$electron.shell.moveItemToTrash(item.path)
          })
          localStorage.setItem(TRANSFORM_INFO, JSON.stringify([]))
          myThis.getData()
        }
      });
    }
  }
}
</script>

<style lang="less" scoped>

</style>
