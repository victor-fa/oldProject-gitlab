<template>
  <div
    class="transport-item"
    v-bind:class="{ 'transport-item-odd': isOdd }"
  >
    <img class="task-icon" :src="model.icon">
    <div class="item-content">
      <div class="item-top">
        <div class="item-top-tip">
          <span
            class="item-name"
            :title="model.name"
            :style="{ width: nameWidth + 'px' }"
          >
            {{ model.name }}
          </span>
          <span
            v-if="showTip"
            class="item-tip"
            v-bind:class="{ 'item-error': showErrorStyle }"
          >
            {{ tipTitle }}
          </span>
        </div>
        <div class="item-buttons">
          <custom-button
            v-for="(item, index) in showItems"
            :key="item.command"
            :image="item.icon"
            :hoverImage="item.hoverIcon"
            :highlightImage="item.hoverIcon"
            :iconWidth="item.iconWidth"
            :disable="item.disable"
            :disableImage="item.disableIcon"
            class="operate-item"
            @click.native="handleOperationAction(index)"
          />
        </div>
      </div>
      <div v-if="!isCompleted" class="item-bottom">
        <a-progress
          class="progress"
          :percent="model.progressPercent"
          :showInfo="false"
          :strokeColor="'#06B650'"
          :strokeWidth="6"
          :title="progressTitle"
        />
        <span class="speed">{{ model.speed }}</span>
        <span class="progress-value">{{ model.progress }}</span>
      </div>
      <div v-else class="item-completed-bottom">
        <span>{{ model.total }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { runningOperateItems, TransportModel, TransportStatus } from './TransportModel'
import ResourceHandler from '../../../views/MainView/ResourceHandler'
import CustomButton from '../../../components/CustomButton/index.vue'
import StringUtility from '../../../utils/StringUtility'
import { TaskStatus } from '../../../api/Transport/BaseTask'

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
    return {
      showItems: (this.model as TransportModel).controlItems
    }
  },
  watch: {
    model: function (newValue: TransportModel) {
      this.showItems = newValue.controlItems
    }
  },
  computed: {
    isOdd: function () {
      const result: boolean = this.index % 2 === 1
      return result
    },
    isCompleted: function () {
      const model = this.model as TransportModel
      const result: boolean = model.category === TransportStatus.done
      return result
    },
    showErrorStyle: function () {
      const model = this.model as TransportModel
      const result: boolean = model.status === TaskStatus.error
      return result
    },
    progressTitle: function () {
      const model = this.model as TransportModel
      return model.progressPercent.toFixed(2) + '%'
    },
    showTip: function () {
      const model = this.model as TransportModel
      const result: boolean = model.status === TaskStatus.error || model.status === TaskStatus.prepare
      return result
    },
    tipTitle: function () {
      const model = this.model as TransportModel
      if (model.status === TaskStatus.error) return '传输失败'
      if (model.status === TaskStatus.prepare) return '数据准备中...'
      return ''
    },
    nameWidth: function () {
      const showTip = this.showTip as boolean
      const adjust = showTip ? 466 : 376
      return document.body.offsetWidth - adjust
    }
  },
  methods: {
    handleOperationAction (index: number) {
      const item = this.showItems[index]
      this.$emit('operationAction', item.command, this.index)
      const syncCommands = ['jump', 'open', 'openInFinder']
      this.showItems = this.showItems.map((item, aIndex) => {
        if (syncCommands.indexOf(item.command) === -1) {
          item.disable = index === aIndex
        }
        return item
      })
    }
  }
})
</script>

<style lang="less" scoped>
.transport-item {
  height: 64px;
  width: 100%;
  background-color: #f6f8fb;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  .task-icon {
    width: 30px;
    height: 30px;
    margin-left: 20px;
  }
  .item-content {
    flex: 1;
    height: 100%;
    padding: 0px 12px;
    .item-top {
      height: 50%;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      .item-top-tip {
        flex: 1;
        display: flex;
        justify-content: space-between;
        .item-name {
          font-size: 14px;
          color: #484848;
          text-align: left;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .item-tip {
          font-size: 14px;
          color: #484848;
          white-space: nowrap;
        }
        .item-error {
          color: #ff183e;
        }
      }
      .item-buttons {
        display: flex;
        align-items: center;
        .operate-item {
          width: 19px;
          height: 19px;
          margin-left: 20px;
        }
      }
    }
    .item-bottom {
      height: 50%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      .progress {
        flex: 1;
      }
      .speed {
        color: #007934;
        font-size: 11px;
        padding: 0px 10px;
      }
      .progress-value {
        text-align: right;
        font-size: 11px;
        color: #484848;
        width: 100px;
      }
    }
    .item-completed-bottom {
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
