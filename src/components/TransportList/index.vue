<template>
  <div class="transport-list" :style="{ height: scrollHeight + 'px' }">
    <div
      v-for="(item, index) in TransportList"
      :key="index"
      class="transport-group"
    >
      <template v-if="(item.state === 'interrupted' || item.state === 'progressing') && isDownOrFin === 'down' && item.trans_type === currentTag">
        <div class="left-icon">
          <img :src="itemIcon(item)">
        </div>
        <div class="right-panel">
          <div class="top">
            <p class="title">{{item.name}}</p>
            <div class="img-cell">
              <img v-if="item.state === 'progressing'" src="../../assets/pause_icon.png" @click="handleOperateChange('pause', item)">
              <img v-else src="../../assets/start_icon.png" @click="handleOperateChange('start', item, index)">
              <img src="../../assets/cancle_icon.png" @click="handleOperateChange('cancle', item, index)">
              <img src="../../assets/file_icon.png" @click="OpenDownPath(item)">
            </div>
          </div>
          <div class="buttom">
            <a-progress
              class="progress"
              :percent="PercentCount(item)"
              :showInfo="false"
              :strokeColor="'#06B650'"
              :status="item.state === 'progressing' ? 'active' : 'normal'"
            />
            <p class="speed">{{ MathSpeend(item) }}</p>
            <p v-if="item.trans_type === 'download'" class="size">{{item.chunk | filterSize}}/{{item.size | filterSize}}</p>
            <p v-else class="size">{{item.size*(item.chunk*0.01) | filterSize}}/{{item.size | filterSize}}</p>
          </div>
        </div>
      </template>
      <template v-if="item.state === 'completed' && isDownOrFin === 'fin' && item.trans_type === currentTag">
        <div class="left-icon">
          <img :src="itemIcon(item)">
        </div>
        <div class="right-panel">
          <div class="top">
            <p class="title">{{item.name}}</p>
            <div class="img-cell">
              <img src="../../assets/text_icon.png" @click="OpenFile(item)">
              <img src="../../assets/file_icon.png" @click="OpenDownPath(item)">
              <img src="../../assets/delete_icon.png" @click="Delete(item, index)">
            </div>
          </div>
          <div class="buttom">
            <p class="size text-left">{{item.size | filterSize}}</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { TRANSFORM_INFO } from '../../common/constants'
import StringUtility from '../../utils/StringUtility'

export default Vue.extend({
  name: 'TransportList',
  data () {
    return {
      TransportList: [],
      scrollHeight: document.body.clientHeight - 127
    }
  },
  props: {
    transformList: Array,
    currentTag: String,
    isDownOrFin: String
  },
  watch: {
    transformList: function (newValue) {
      this.TransportList = newValue
    },
    currentTag: function (newValue) {
      this.tagChange()
    }
  },
  mounted () {
    window.addEventListener('resize', this.observerWindowResize)
  },
  filters: {
    filterSize (bytes) {
      return StringUtility.formatShowSize(bytes)
    }
  },
  methods: {
    handleOperateChange (flag: string, item, index) {
      this.$emit('CallbackItemAction', flag, item, index) // call parent
    },
    observerWindowResize () {
      const newHeight = document.body.clientHeight - 127
      if (newHeight !== this.scrollHeight) {
        this.scrollHeight = newHeight
      }
    },
    tagChange () {
      let tempArr:any = [];
      if (this.TransportList === null) return
      this.TransportList.forEach((item: any) => {
        if (item.trans_type === this.currentTag) tempArr.push(item)
      })
      this.TransportList = tempArr
    },
		PercentCount(item) {
      let res = item.trans_type === 'download' ? (item.chunk / item.size) * 100 : (item.size * (item.chunk*0.01) / item.size) * 100
      return parseFloat((res).toFixed(1));
		},
		MathSpeend(item) {
      const myThis = this as any
			let NowTime = new Date().getTime() / 1000;
      const res:any = item.chunk / (NowTime - item.time)
      let speed = parseFloat(res).toFixed(0);
			return myThis.filterSize(speed) + '/s';
		},
    filterSize (bytes) {
      return StringUtility.formatShowSize(bytes)
    },
    OpenFile (item) {
      const myThis = this as any
      myThis.$electron.shell.openItem(item.path);
    },
		OpenDownPath(item) {
      const myThis = this as any
			myThis.$electron.shell.showItemInFolder(item.path);
    },
    handleTabChange () {
      
    },
    Delete(item, index) {
      const myThis = this as any
      myThis.$electron.shell.beep()
      myThis.$confirm({
        title: '删除',
        content: '是否将所选文件彻底删除',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk() {
          // myThis.$electron.shell.moveItemToTrash(item.path)  // 暂时不把本地文件删除了
          let arr = myThis.TransportList
          arr.splice(index, 1); 
          localStorage.setItem(TRANSFORM_INFO, JSON.stringify(arr))
          myThis.TransportList = arr;
        }
      });
      this.$emit('CallbackItemAction', 'refresh') // call parent
    },
		itemIcon(item) {
			const myThis = this as any
			let type = myThis.getTypeNam(item)
			return require(`../../assets/resource/${type}_icon.png`);
		},
		getTypeNam(data) {
      let typeName = 'unkonw'
      const name = data.name ? data.name.substring(data.name.lastIndexOf('.')+1, data.name.length) : 'unknow'
			if (name === 'zip') {
				typeName = 'unkonw';
			} else if (name === 'pdf') {
				typeName = 'pdf';
			} else if (["apng", "png", "jpg", "jpeg", "bmp", "gif"].indexOf(name) > -1) {
				typeName = 'image';
			} else if (["mp4", "rmvb", "mkv"].indexOf(name) > -1) {
				typeName = 'video';
			} else if (["m4a", "mp3", "ogg", "flac", "f4a", "wav", "ape"].indexOf(name) > -1) {
				typeName = 'audio';
			} else if (["ini", "txt", "xml", "aspx", "php", "phtml", "js", "c", "htm", "html", "log", "cpp", "java"].indexOf(name) > -1) {
				typeName = 'txt';
			} else {
        typeName = 'unkonw';
      }
			return typeName
		}
  },
  destroyed () {
    window.removeEventListener('resize', this.observerWindowResize)
  }
})
</script>

<style lang="less" scoped>
.transport-list {
  width: 100%;
  height: 100%;
  background-color: white;
  .transport-group {
    display: flex;
    justify-content: space-around;
    // padding: 5px 0;
    .left-icon {
      width: 45px;
      height: 40px;
      padding-top: 13px;
      img {
        width: 22px;
      }
    }
    .right-panel {
      flex: 1;
      padding: 6px 0;
      .top {
        display: flex;
        justify-content: space-around;
        height: 24px;
        .title {
          flex: 1;
          text-align: left;
        }
        .img-cell {
          flex: 0 0 15%;
          img {
            width: 12px;
            margin-left: 14%;
            cursor: pointer;
          }
        }
      }
      .buttom {
        display: flex;
        justify-content: space-around;
        .progress {
          flex: 1;;
        }
        .speed {
          flex: 0 0 10%;
          color: #06B650;
          margin-bottom: 0;
        }
        .size {
          flex: 0 0 10%;
          margin-bottom: 0;
        }
        .text-left {
          flex: 1;
          margin-bottom: 0;
          text-align: left;
          font-size: 11px;
        }
      }
    }
    p {
      color: #484848;
    }
  }
  .transport-group:nth-child(odd) {
    background: #FCFBFE;
  }
}
</style>
