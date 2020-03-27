<template>
  <div class="transport-header-view">
    <basic-tabs :tabs="taskCategorys" v-on:tabChange="handleTabChange"/>
    <div class="bottom-bar">
      <div class="left-bar">
        <span class="normal" v-bind:class="{ special: currentTask === 'down' }" @click="changeTransport('down')">{{currentTag === 'download' ? '正在下载' : '正在上传'}}（{{downloadCount}}）</span>
        <span class="normal" style="margin-right: 7px;">/</span>
        <span class="normal" v-bind:class="{ special: currentTask === 'fin' }" @click="changeTransport('fin')">{{currentTag === 'download' ? '下载完成' : '上传完成'}}（{{computedCount}}）</span>
      </div>
      <div class="right-bar">
        <a-button class="right-button" v-if="currentTask === 'down'" @click="sendInfoForTransport('stop')">全部暂停</a-button>
        <a-button class="right-button" v-if="currentTask === 'down'" @click="sendInfoForTransport('cancel')">全部取消</a-button>
        <a-button class="right-button" v-if="currentTask === 'fin'" @click="sendInfoForTransport('clearAll')">清除所有记录</a-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import BasicTabs from '../../components/BasicTabs/index.vue'
import { EventBus, EventType } from '../../utils/eventBus';
import { TRANSFORM_INFO } from '../../common/constants';
import { taskCategorys } from '../../model/categoryList'

export default Vue.extend({
  name: 'transport-header-view',
  components: {
    BasicTabs
  },
  data () {
    return {
      taskCategorys,
      currentTask: 'down',
      downloadCount: 0,
      computedCount: 0,
      currentTag: 'download'
    }
  },
  watch: {
    $route (to, from) {
      if (to.name === 'transport') {  // 仅任务管理下有变化
        // this.isTaskVisiable = true;
        this.currentTask = 'down';
        this.changeProgress()
      } else {
        // this.isTaskVisiable = false;
      }
    }
  },
  beforeMount () {
    this.observerEventBus()
  },
  destroyed () {
    EventBus.$off(EventType.transportChangeAction)
    EventBus.$off(EventType.downloadChangeAction)
  },
  methods: {
    observerEventBus () {
      EventBus.$on(EventType.downloadChangeAction, () => {
        this.changeProgress()
      })
      EventBus.$on(EventType.categoryChangeAction, (type) => {
        if (['download', 'upload', 'offline', 'remote'].indexOf(type) > -1) {
          this.currentTag = type
        }
        this.changeProgress()
      })
    },
    handleTabChange (index: number) {
      console.log(index)
    },
    changeTransport (type) {
      this.currentTask = type
      EventBus.$emit(EventType.transportChangeAction, { type: type })
    },
    changeProgress() {
      const temp:any = localStorage.getItem(TRANSFORM_INFO) !== null ? localStorage.getItem(TRANSFORM_INFO) : []
      if (temp !== 'null') {
        this.downloadCount = JSON.parse(temp).filter(item => item.trans_type === this.currentTag).filter(item => item.state === 'interrupted' || item.state === 'progressing').length
        this.computedCount = JSON.parse(temp).filter(item => item.trans_type === this.currentTag).filter(item => item.state === 'completed').length
      }
    },
    sendInfoForTransport(data) {
      EventBus.$emit(EventType.transportChangeAction, { action: data })
    }
  }
})
</script>

<style lang="less" scoped>
.transport-header-view {
  background-color: white;
  .bottom-bar {
    height: 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0px 15px;
    padding-top: 15px;
    border-bottom: 1px solid #dcdcdc;
    .left-bar {
      line-height: 32px;
      display: flex;
      align-items: center;
      span {
        color: #484848;
        font-size: 12px;
        line-height: 22px;
      }
      .normal {
        font-size: 14px;
        line-height: 22px;
        color: #484848;
        cursor: pointer;
      }
      .special {
        color: #06B650;
      }
    }
    .right-bar {
      line-height: 15px;
      margin-right: 2px;
      .right-button {
        border: 1px solid #e5e5e5;
        border-radius: 0px;
        margin-right: 7px;
      }
    }
  }
}
</style>
