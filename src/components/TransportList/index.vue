<template>
  <div class="transport-list">
    <div
      v-for="(item, index) in transportList"
      :key="index"
      class="transport-group"
      v-bind:style="{ 'marginBottom': (isDownOrFin === 'down' ? '-5' : '0') + 'px' }"
    >
      <template v-if="isDownOrFin === 'down'">
        <div class="left-icon">
          <img src="../../assets/resource/folder_icon.png">
        </div>
        <div class="right-panel">
          <div class="top">
            <p class="title">{{item.path | filterPath}}</p>
            <div class="img-cell">
              <!-- <img src="../../assets/pause_icon.png"> -->
              <img src="../../assets/start_icon.png">
              <img src="../../assets/cancle_icon.png">
              <img src="../../assets/file_icon.png">
            </div>
          </div>
          <div class="buttom">
            <a-progress
              class="progress"
              :percent="50"
              :showInfo="false"
              :strokeColor="'#06B650'"
            />
            <p class="speed">514K/S</p>
            <p class="size">990K/20MB</p>
          </div>
        </div>
      </template>
      <template v-if="isDownOrFin === 'fin'">
        <div class="left-icon">
          <img src="../../assets/resource/folder_icon.png">
        </div>
        <div class="right-panel">
          <div class="top">
            <p class="title">{{item.path | filterPath}}</p>
            <div class="img-cell">
              <!-- <img src="../../assets/pause_icon.png"> -->
              <img src="../../assets/text_icon.png">
              <img src="../../assets/file_icon.png" @click="OpenDownPath(item)">
              <img src="../../assets/delete_icon.png">
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

export default Vue.extend({
  name: 'transport-list',
  data () {
    return {
      isDownOrFin: 'fin',
      transportList: []
    }
  },
  filters: {
    filterPath (value) {
      return value.substr(value.lastIndexOf("/") + 1, value.length); ;
    },
    filterSize (bytes) {
      bytes = parseFloat(bytes);
      if (bytes === 0) return '0B';
      let k = 1024,
        sizes = ['B', 'KB', 'MB', 'GB', 'TB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
      return (bytes / Math.pow(k, i)).toPrecision(3) + sizes[i];
    }
  },
  methods: {
    observerEventBus () {
      const myThis = this as any
      EventBus.$on(EventType.transportChangeAction, (type) => {
        myThis.isDownOrFin = type === 1 ? 'down' : 'fin'
      })
      EventBus.$on(EventType.downloadChangeAction, (data) => {
        myThis.transportList = data
        console.log(JSON.parse(JSON.stringify(data)));
      })
    },
		OpenDownPath(item) {
      console.log(item);
      const myThis = this as any
			myThis.$electron.shell.showItemInFolder(item.path);
		},
  },
  mounted () {
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
