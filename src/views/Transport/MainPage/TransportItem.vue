<template>
  <div
    class="transport-item"
    v-bind:class="{ 'transport-item-odd': isOdd }"
  >
    <img class="task-icon" :src="model.icon">
    <div class="item-content">
      <div class="item-top">
        <span class="item-name">{{ model.name }}</span>
        <span v-if="showError" class="item-error">传输失败</span>
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
      <div v-if="!isCompleted" class="item-bottom">
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
    showError: function () {
      const model = this.model as TransportModel
      const result: boolean = model.status === TaskStatus.error
      return result
    }
  },
  methods: {
    handleOperationAction (index: number) {
      const item = this.showItems[index]
      this.$emit('operationAction', item.command, this.index)
      this.showItems = this.showItems.map((item, aIndex) => {
        item.disable = index === aIndex
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
    width: 23px;
    height: 19px;
    margin: 0px 15px 0px 20px;
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
      .item-name {
        font-size: 14px;
        color: #484848;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 300px;
      }
      .item-error {
        margin-left: 12px;
        font-size: 14px;
        color: #ff183e;
        flex: 1;
        text-align: left;
      }
      .operate-item {
        width: 19px;
        height: 19px;
        margin-left: 20px;
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
