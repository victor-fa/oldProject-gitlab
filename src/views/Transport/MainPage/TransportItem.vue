<template>
  <a-layout
    class="transport-item"
    v-bind:class="{ 'transport-item-odd': isOdd }"
  >
    <a-layout-sider class="icon-wrapper" :width="58">
      <img :src="searchResourceIcon(model)" class="item-icon">
    </a-layout-sider>
    <a-layout-content class="content">
      <div class="content-top">
        <span>{{ model.sourcePath }}</span>
        <div>
          <custom-button
            v-for="(item, index) in showItems"
            :key="item.command"
            :image="item.icon"
            :hoverImage="item.hoverIcon"
            :highlightImage="item.hoverIcon"
            :iconWidth="item.iconWidth"
            :disable="item.disable"
            class="operate-item"
            @click.native="handleOperationAction(index)"
          />
        </div>
      </div>
      <div v-if="!isCompleted" class="content-bottom">
        <a-progress
          class="progress"
          :percent="model.progressPercent"
          :showInfo="false"
          :strokeColor="'#06B650'"
          :strokeWidth="6"
          :title="model.progressPercent + '%'"
        />
        <span class="speed">{{ model.speed }}</span>
        <span class="progress-value">{{ model.progress }}</span>
      </div>
      <div v-else class="completed-content-bottom">
        <span>{{ model.total }}</span>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { ResourceType } from '../../../api/NasFileModel'
import ResourceHandler from '../../../views/MainView/ResourceHandler'
import CustomButton from '../../../components/CustomButton/index.vue'
import StringUtility from '../../../utils/StringUtility'
import { TransportStatus } from '../../../model/categoryList'
import { runningOperateItems, completedOperateItems, pauseItem, continueItem, TransportModel } from './TransportModel'

export default Vue.extend({
  name: 'transport-item',
  components: {
    CustomButton
  },
  props: {
    model: Object,
    index: Number
  },
  data () {
    let items = this.model.status === TransportStatus.running ? runningOperateItems : completedOperateItems
    return {
      showItems: _.cloneDeep(items)
    }
  },
  computed: {
    isOdd: function () {
      const _this = this as any
      return _this.index % 2
    },
    isCompleted: function () {
      return (this.model as TransportModel).status === TransportStatus.completed
    }
  },
  methods: {
    searchResourceIcon (type: ResourceType) {
      return ResourceHandler.searchResourceIcon(type)
    },
    handleOperationAction (index: number) {
      const item = this.showItems[index]
      this.$emit('operationAction', item.command, this.index)
    },
    updatePauseItem () {
      this.showItems = this.showItems.map(item => {
        item.disable = false
        return item.command === 'pause' ? continueItem : item
      })
    },
    updateContinueItem () {
      this.showItems = this.showItems.map(item => {
        item.disable = false
        return item.command === 'continue' ? pauseItem : item
      })
    },
    setOperateItemDisable (command: string, disable: boolean) {
      this.showItems = this.showItems.map(item => {
        if (item.command === command) item.disable = disable
        return item
      })
    }
  }
})
</script>

<style lang="less" scoped>
.transport-item {
  height: 58px;
  width: 100%;
  background-color: #FCFBFE;
  .icon-wrapper {
    margin-left: 6px;
    background-color: transparent;
    img {
      width: 23px;
      margin: auto;
    }
  }
  .content {
    padding-right: 30px;
    .content-top {
      height: 50%;
      display: flex;
      padding-top: 10px;
      justify-content: space-between;
      align-items: center;
      span {
        font-size: 14px;
        color: #484848;
      }
      .operate-item {
        width: 19px;
        height: 19px;
        margin-left: 20px;
      }
    }
    .content-bottom {
      height: 50%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      .progress {
        flex: 1;
      }
      .speed {
        color: #06B650;
        font-size: 11px;
        padding: 0px 10px;
      }
      .progress-value {
        text-align: right;
        font-size: 11px;
        color: #484848;
        width: 80px;
      }
    }
    .completed-content-bottom {
      height: 50%;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      span {
        color: #484848;
        font-size: 11px;
      }
    }
  }
}
.transport-item-odd {
  background-color: white;
}
</style>

<style>
.transport-item .ant-layout-sider-children {
  display: flex;
}
.transport-item .ant-progress-inner {
  background-color: #ececec;
}
</style>
