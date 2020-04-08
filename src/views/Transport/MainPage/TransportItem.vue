<template>
  <a-layout
    :key="index"
    class="transport-item"
    v-bind:class="{ 'transport-item-odd': isOdd }"
  >
    <a-layout-sider class="icon-wrapper" :width="58">
      <img :src="searchResourceIcon(model.type)" class="item-icon">
    </a-layout-sider>
    <a-layout-content class="content">
      <div class="content-top">
        <span>{{ model.name }}</span>
        <div>
          <custom-button
            :image="operateIcon.pause"
            :hoverImage="operateIcon.hoverPause"
            iconWidth="7px"
            class="operate-item"
          />
          <custom-button
            :image="operateIcon.cancel"
            :hoverImage="operateIcon.hoverCancel"
            iconWidth="7px"
            class="operate-item"
          />
          <custom-button
            :image="operateIcon.openFolder"
            :hoverImage="operateIcon.hoverOpenFolder"
            iconWidth="7px"
            class="operate-item"
          />
        </div>
      </div>
      <div v-if="!isCompleted" class="content-bottom">
        <a-progress
          class="progress"
          :percent="progress"
          :showInfo="false"
          :strokeColor="'#06B650'"
          :strokeWidth="6"
        />
        <span class="speed">514Kb/s</span>
        <span class="progress-value">990K/200MB</span>
      </div>
      <div v-else class="completed-content-bottom">
        <span>200MB</span>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
import Vue from 'vue'
import { ResourceType } from '../../../api/NasFileModel'
import ResourceHandler from '../../../views/MainView/ResourceHandler'
import CustomButton from '../../../components/CustomButton/index.vue'

export default Vue.extend({
  name: 'transport-item',
  components: {
    CustomButton
  },
  props: {
    model: Object,
    index: Number,
    status: {
      default: 'downloading'
    }
  },
  data () {
    return {
      operateIcon,
      progress: 50
    }
  },
  computed: {
    isOdd: function () {
      return this.index % 2
    },
    isCompleted: function () {
      return this.status === 'downloaded'
    }
  },
  methods: {
    searchResourceIcon (type: ResourceType) {
      return ResourceHandler.searchResourceIcon(type)
    }
  }
})
const operateIcon = {
  pause: require('../../../assets/pause_icon.png'),
  hoverPause: require('../../../assets/pause_icon_selected.png'),
  resume: require('../../../assets/start_icon.png'),
  hoverResume: require('../../../assets/start_icon_selected.png'),
  cancel: require('../../../assets/cancle_icon.png'),
  hoverCancel: require('../../../assets/cancle_icon_selected.png'),
  openFolder: require('../../../assets/file_icon.png'),
  hoverOpenFolder: require('../../../assets/file_icon_selected.png'),
  detele: require('../../../assets/delete_icon.png'),
  hoverDelete: require('../../../assets/delete_icon_selected.png'),
  open: require('../../../assets/text_icon.png'),
  hoverOpen: require('../../../assets/text_icon_selected.png')
}
</script>

<style lang="less" scoped>
.transport-item {
  height: 58px;
  width: 100%;
  background-color: #f6f8fb;
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
        width: 20px;
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
