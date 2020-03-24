<template>
  <div class="transport-list">
    <div
      v-for="(item, index) in TransportList"
      :key="index"
      class="transport-group"
      v-bind:style="{ 'marginBottom': (isDownOrFin === 'down' ? '-5' : '0') + 'px' }"
    >
      <template v-if="(item.state === 'interrupted' || item.state === 'progressing') && isDownOrFin === 'down' && item.trans_type === currentTag">
        <div class="left-icon">
          <img :src="itemIcon(item)">
        </div>
        <div class="right-panel">
          <div class="top">
            <p class="title">{{item.name}}</p>
            <div class="img-cell">
              <img v-if="item.state === 'progressing'" src="../../assets/pause_icon.png">
              <img v-else src="../../assets/start_icon.png">
              <img src="../../assets/cancle_icon.png">
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
import { EventBus, EventType } from '../../utils/eventBus'
import { TRANSFORM_INFO } from '../../common/constants'
import StringUtility from '../../utils/StringUtility'

export default Vue.extend({
  name: 'TransportList',
  data () {
    return {
      isDownOrFin: 'down',
      TransportList: [],
      currentTag: 'download'
    }
  },
  props: {
		data: {
			type: Array
		},
  },
  watch: {
		data: {
			handler() {
        this.setData()
			},
			deep: true
		}
  },
  created() {
    window.addEventListener('setItem', this.setData)
  },
  mounted () {
    this.setData()
  },
  filters: {
    filterSize (bytes) {
      return StringUtility.formatShowSize(bytes)
    }
  },
  methods: {
    setData() {
      const temp:any = localStorage.getItem(TRANSFORM_INFO)
      this.TransportList = JSON.parse(temp)
    },
		PercentCount(item) {
      let res = item.trans_type === 'download' ? (item.chunk / item.size) * 100 : (item.size * (item.chunk*0.01) / item.size) * 100
      return parseFloat((res).toFixed(1));
		},
    observerEventBus () {
      const myThis = this as any
      EventBus.$on(EventType.transportChangeAction, (data) => {
        if (data.type) {  // 上传、下载
          myThis.isDownOrFin = data.type
        }
        if (data.action) {  // 动作
          console.log(data.action);
          if (data.action === 'stop') {

          } else if (data.action === 'cancel') {
            
          } else if (data.action === 'clearAll') {  // 清空
            myThis.$electron.shell.beep()
            if (myThis.TransportList === null) {
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
                myThis.TransportList.filter(item => item.trans_type === myThis.currentTag).forEach(item => {
                  myThis.$electron.shell.moveItemToTrash(item.path)
                })
                myThis.$resetSetItem(TRANSFORM_INFO, JSON.stringify([]))
                EventBus.$emit(EventType.downloadChangeAction, null)  // 通知更新头部信息
                EventBus.$emit(EventType.transportChangeAction, { action: 'clearAllFinish' })
                myThis.setData()
              }
            });
          }
        }
      })
      EventBus.$on(EventType.downloadChangeAction, () => {
        this.setData()
      })
      EventBus.$on(EventType.categoryChangeAction, (type) => {
        const temp:any = localStorage.getItem(TRANSFORM_INFO)
        let tempArr:any = [];
        if (temp === null) return
        if (type === 'download') {
          JSON.parse(temp).forEach(item => {
            if (item.trans_type === 'download') tempArr.push(item)
          })
        } else if (type === 'upload') {
          JSON.parse(temp).forEach(item => {
            if (item.trans_type === 'upload') tempArr.push(item)
          })
        }
        this.currentTag = type
        this.TransportList = tempArr
      })
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
		ControlTrans(item, index) {
			this.$emit('ControlTrans', item, index);
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
          myThis.$electron.shell.moveItemToTrash(item.path)
          const temp:any = localStorage.getItem(TRANSFORM_INFO)
          let arr = JSON.parse(temp)
          arr.splice(index, 1); 
          myThis.$resetSetItem(TRANSFORM_INFO, JSON.stringify(arr))
          this.TransportList = arr;
          EventBus.$emit(EventType.downloadChangeAction, null)
        }
      });
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
  beforeDestroy() {
    window.removeEventListener('setItem', this.setData)
  },
  beforeMount () {
    this.observerEventBus()
  },
  destroyed () {
    EventBus.$off(EventType.transportChangeAction)
    EventBus.$off(EventType.downloadChangeAction)
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
    padding: 5px 0;
    .left-icon {
      width: 45px;
      height: 40px;
      padding-top: 8px;
      img {
        width: 22px;
      }
    }
    .right-panel {
      flex: 1;
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
  // .transport-group:nth-child(odd) {
  //   background: #FCFBFE;
  // }
}
</style>
