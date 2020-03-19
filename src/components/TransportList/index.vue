<template>
  <div class="transport-list">
    <div
      v-for="(item, index) in TransportList"
      :key="index"
      class="transport-group"
      v-bind:style="{ 'marginBottom': (isDownOrFin === 'down' ? '-5' : '0') + 'px' }"
    >
      <template v-if="(item.state === 'interrupted' || item.state === 'progressing') && isDownOrFin === 'down'">
        <div class="left-icon">
          <img :src="itemIcon(item)">
        </div>
        <div class="right-panel">
          <div class="top">
            <p class="title">{{item.name}}</p>
            <div class="img-cell">
              <!-- <img src="../../assets/pause_icon.png"> -->
              <img src="../../assets/start_icon.png">
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
            <p class="size">{{item.size*(item.chunk*0.01) | filterSize}}/{{item.size | filterSize}}</p>
          </div>
        </div>
      </template>
      <template v-if="item.state === 'completed' && isDownOrFin === 'fin'">
        <div class="left-icon">
          <img :src="itemIcon(item)">
        </div>
        <div class="right-panel">
          <div class="top">
            <p class="title">{{item.name}}</p>
            <div class="img-cell">
              <!-- <img src="../../assets/pause_icon.png"> -->
              <img src="../../assets/text_icon.png">
              <img src="../../assets/file_icon.png" @click="OpenDownPath(item)">
              <img src="../../assets/delete_icon.png" @click="Delete(index)">
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

export default Vue.extend({
  name: 'TransportList',
  data () {
    return {
      isDownOrFin: 'down',
      TransportList: []
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
      bytes = parseFloat(bytes);
      if (bytes === 0) return '0B';
      let k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'], i = Math.floor(Math.log(bytes) / Math.log(k));
      return (bytes / Math.pow(k, i)).toPrecision(3) + sizes[i];
    }
  },
  methods: {
    setData() {
      const temp:any = localStorage.getItem(TRANSFORM_INFO)
      this.TransportList = JSON.parse(temp)
    },
		PercentCount(item) {
			return parseFloat(((item.size * (item.chunk*0.01) / item.size) * 100).toFixed(1));
		},
    observerEventBus () {
      const myThis = this as any
      EventBus.$on(EventType.transportChangeAction, (type) => {
        myThis.isDownOrFin = type === 1 ? 'down' : 'fin'
      })
      EventBus.$on(EventType.downloadChangeAction, (data) => {
        this.setData()
      })
    },
		MathSpeend(item) {
      const myThis = this as any
			let NowTime = new Date().getTime() / 1000;
      const res:any = item.chunk / (NowTime - item.time)
      let speed = parseFloat(res).toFixed(1);
      console.log(speed);
			return myThis.filterSize(speed) + '/s';
		},
    filterSize (bytes) {
      bytes = parseFloat(bytes);
      if (bytes === 0) return '0B';
      let k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'], i = Math.floor(Math.log(bytes) / Math.log(k));
      console.log(i);
      return (bytes / Math.pow(k, i)).toPrecision(3) + (i !== -1 ? sizes[i] : 'B');
    },
		OpenDownPath(item) {
      const myThis = this as any
			myThis.$electron.shell.showItemInFolder(item.path);
		},
		ControlTrans(item, index) {
			this.$emit('ControlTrans', item, index);
    },
    Delete(index) {
      const myThis = this as any
      const temp:any = localStorage.getItem(TRANSFORM_INFO)
      let arr = JSON.parse(temp)
      arr.splice(index, 1); 
      myThis.$resetSetItem(TRANSFORM_INFO, JSON.stringify(arr))
      this.TransportList = arr;
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
  .transport-group:nth-child(odd) {
    background: #FCFBFE;
  }
}
</style>
