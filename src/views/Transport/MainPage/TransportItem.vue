<template>
  <a-layout
    :key="index"
    class="transport-item"
    v-bind:class="{ 'transport-item-odd': isOdd }"
  >
    <a-layout-sider class="icon-wrapper" :width="58">
      <img :src="searchResourceIcon(model)" class="item-icon">
    </a-layout-sider>
    <a-layout-content class="content">
      <div class="content-top">
        <span>{{ model.name }}</span>
        <div>
          <custom-button
            v-show="!isCompleted && model.state === 'progressing'"
            :image="operateIcon.pause"
            :hoverImage="operateIcon.hoverPause"
            iconWidth="7px"
            class="operate-item"
            @click.native="clickMethod('pause')"
          />
          <custom-button
            v-show="!isCompleted && model.state === 'interrupted'"
            :image="operateIcon.resume"
            :hoverImage="operateIcon.hoverResume"
            iconWidth="7px"
            class="operate-item"
            @click.native="clickMethod('pause')"
          />
          <custom-button
            v-show="!isCompleted"
            :image="operateIcon.cancel"
            :hoverImage="operateIcon.hoverCancel"
            iconWidth="7px"
            class="operate-item"
            @click.native="clickMethod('cancel')"
          />
          <custom-button
            v-show="isCompleted"
            :image="operateIcon.open"
            :hoverImage="operateIcon.hoverOpen"
            iconWidth="7px"
            class="operate-item"
            @click.native="clickMethod('openFile')"
          />
          <custom-button
            :image="operateIcon.openFolder"
            :hoverImage="operateIcon.hoverOpenFolder"
            iconWidth="7px"
            class="operate-item"
            @click.native="clickMethod('openFolder')"
          />
          <custom-button
            v-show="isCompleted"
            :image="operateIcon.detele"
            :hoverImage="operateIcon.hoverDelete"
            iconWidth="7px"
            class="operate-item"
            @click.native="clickMethod('deleteFile')"
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
        <span class="speed">{{ MathSpeend(model) }}</span>
        <span class="progress-value">{{model.chunk | filterSize}}/{{model.size | filterSize}}</span>
      </div>
      <div v-else class="completed-content-bottom">
        <span>{{model.size | filterSize}}</span>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
import Vue from 'vue'
import { ResourceType } from '../../../api/NasFileModel'
import ResourceHandler from '../../../views/MainView/ResourceHandler'
import CustomButton from '../../../components/CustomButton/index.vue'
import StringUtility from '../../../utils/StringUtility'

export default Vue.extend({
  name: 'transport-item',
  components: {
    CustomButton
  },
  props: {
    model: Object,
    index: Number,
    status: Object
  },
  filters: {
    filterSize (bytes) {
      return StringUtility.formatShowSize(bytes)
    }
  },
  data () {
    return {
      operateIcon,
    }
  },
  computed: {
    isOdd: function () {
      const _this = this as any
      return _this.index % 2
    },
    isCompleted: function () {
      const status = this.status as any
      return status.type === 'downloaded' || status.type === 'uploaded' || status.type === 'backuped'
    },
    progress: function () {
      const _this = this as any
      console.log(_this.model.chunk + '====' + _this.model.size);
      if (_this.model.chunk === _this.model.size) {
        this.$emit('CallbackControl', null, 'refresh')
      }
      return _this.model.chunk / _this.model.size * 100
    }
  },
  methods: {
    searchResourceIcon (item) {
      const _this = this as any
      return ResourceHandler.searchResourceIcon(_this.getTypeNum(item))
    },
		getTypeNum (data) {
      let typeName = 0
      const name = data.name ? data.name.substring(data.name.lastIndexOf('.')+1, data.name.length) : 'unknow'
			if (name === 'zip') {
				typeName = 0;
			} else if (name === 'pdf') {
				typeName = 5;
			} else if (["apng", "png", "jpg", "jpeg", "bmp", "gif"].indexOf(name) > -1) {
				typeName = 3;
			} else if (["mp4", "rmvb", "mkv"].indexOf(name) > -1) {
				typeName = 2;
			} else if (["m4a", "mp3", "ogg", "flac", "f4a", "wav", "ape"].indexOf(name) > -1) {
				typeName = 1;
			} else if (["ini", "txt", "xml", "aspx", "php", "phtml", "js", "c", "htm", "html", "log", "cpp", "java"].indexOf(name) > -1) {
				typeName = 4;
			} else {
        typeName = 0;
      }
			return typeName
    },
    clickMethod (flag) {
      const _this = this as any
      switch (flag) {
        case 'openFolder':
          _this.$electron.shell.showItemInFolder(this.model.path)
          break;
        case 'openFile':
          _this.$electron.shell.openItem(this.model.path)
          break;
        case 'deleteFile':
          _this.$emit('CallbackControl', this.model, flag)
          break;
        case 'cancel':
          _this.$emit('CallbackControl', this.model, flag)
          break;
        case 'pause':
          _this.$emit('CallbackControl', this.model, flag)
          break;
        default:
          break;
      }
    },
		MathSpeend(item) {
      const myThis = this as any
			let NowTime = new Date().getTime() / 1000;
      const res:any = item.chunk / (NowTime - item.time)
      let speed = parseFloat(res).toFixed(0);
			return StringUtility.formatShowSize(speed) + '/s';
		},
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
