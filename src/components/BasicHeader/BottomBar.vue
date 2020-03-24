<template>
  <div class="bottom-bar">
    <template v-if="!isTaskVisiable">
      <div class="left-bar">
        <custom-button
          :image="operateFuncList.back"
          class="back-icon-style"
          iconWidth="6px"
          @click.native="backAction"
        />
        <span>{{ directory }}</span>
      </div>
      <div class="right-bar">
        <custom-button
          :image="operateFuncList.search"
          :selectedBackgroundImage="operateFuncList.selectedBg"
          iconWidth="13px"
          class="right-item"
        />
        <custom-button
          :image="operateFuncList.refresh"
          iconWidth="12px"
          class="right-item"
          @click.native="refreshAction"
        />
        <a-popover
          trigger="click"
          v-model="visible"
          overlayClassName="sortPopover"
        >
          <sort-popover-list
            slot="content"
            v-on:sortWayChange="sortWayChange"
          />
          <span>
            <custom-button
              ref="sortButton"
              :image="operateFuncList.sort"
              :selectedBackgroundImage="operateFuncList.selectedBg"
              iconWidth="14px"
              class="right-item"
            />
          </span>
        </a-popover>
        <custom-button
          :image="operateFuncList.arrange"
          :selectedBackgroundImage="operateFuncList.selectedBg"
          iconWidth="14px"
          class="right-item"
          ref="arrangeBtn"
          @click.native="arrangeBtnClick"
        />
      </div>
    </template>
    <template v-if="isTaskVisiable">
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
    </template>
  </div>
</template>

<script lang="ts">
import Vue, { Component } from 'vue'
import { mapGetters } from 'vuex'
import CustomButton from '../../components/CustomButton/index.vue'
import SortPopoverList from './SortPopoverList.vue'
import { SortWay } from './Model/sortList'
import { operateFuncList } from './Model/operateIconList'
import { EventBus, EventType } from '../../utils/eventBus'
import { ArrangeWay } from '../../api/NasFileModel'
import { TRANSFORM_INFO } from '../../common/constants'

interface ArrangeData {
  isSelected: boolean
}

export default Vue.extend({
  name: 'bottom-bar',
  components: {
    CustomButton,
    SortPopoverList,
  },
  created () {
    this.changeProgress()
  },
  data () {
    return {
      visible: false,
      operateFuncList,
      isTaskVisiable: false,
      currentTask: 'down',
      downloadCount: 0,
      computedCount: 0,
      currentTag: 'download'
    }
  },
  computed: {
    ...mapGetters('Resource', ['directory'])
  },
  watch: {
    $route (to, from) {
      if (to.name === 'transport') {  // 仅任务管理下有变化
        this.isTaskVisiable = true;
        this.currentTask = 'down';
        this.changeProgress()
      } else {
        this.isTaskVisiable = false;
      }
    }
  },
  beforeMount () {
    this.observerEventBus()
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
    sortWayChange (sender: SortWay) {
      // hide popover
      this.visible = false
      // reset sort button state
      const sortBtn: any = this.$refs.sortButton
      sortBtn.isSelected = false
    },
    backAction () {
      // TODO: 一级目录不能返回，应该是置灰button
      if (this.directory === '网盘') {
        return
      }
      EventBus.$emit(EventType.backAction)
    },
    refreshAction() {
      EventBus.$emit(EventType.refreshAction)
    },
    arrangeBtnClick () {
      const arrangeBtn: any = this.$refs.arrangeBtn
      const selected: boolean = arrangeBtn.isSelected
      const arrangeWay = selected ? ArrangeWay.vertical : ArrangeWay.horizontal
      EventBus.$emit(EventType.arrangeChangeAction, arrangeWay)
    },
    sendInfoForTransport(data) {
      EventBus.$emit(EventType.transportChangeAction, { action: data })
    }
  },
  destroyed () {
    EventBus.$off(EventType.transportChangeAction)
    EventBus.$off(EventType.arrangeChangeAction)
    EventBus.$off(EventType.refreshAction)
    EventBus.$off(EventType.backAction)
    EventBus.$off(EventType.downloadChangeAction)
    EventBus.$off(EventType.categoryChangeAction)
  }
})
</script>

<style lang="less" scoped>
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
    .back-icon-style {
      height: 22px;
      width: 30px;
      vertical-align: middle;
      margin-right: 3px;
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
    .right-item {
      height: 22px;
      width: 22px;
      margin-right: 2px;
    }
    .right-button {
      border: 1px solid #e5e5e5;
      border-radius: 0px;
      margin-right: 7px;
    }
  }
}
</style>

<style>
.bottom-bar > .right-bar > .ant-btn {
  border: 1px solid #e5e5e5;
  border-radius: 0px;
  font-size: 13px;
  padding: 0 7px;
  height: 25px;
  margin-right: 10px;
}
.sortPopover .ant-popover-inner-content {
  padding: 8px 0px;
}
</style>
