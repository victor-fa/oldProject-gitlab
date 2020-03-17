<template>
  <div>
    <div
      v-if="isHorizontalArrange"
      class="horizontal-item"
    >
      <img :src="searchResourceIcon(model.type)"/>
      <span>{{ model.path | filterPath }}</span>
    </div>
    <div
      v-else
      class="vertical-item"
      v-bind:class="{ oddVerticalItem: isOddStyle }"
    >
      <a-row type="flex" justify="space-around" align="middle">
        <a-col :span="13">
          <img :src="searchResourceIcon(model.type)">
          {{ model.path | filterPath }}
        </a-col>
        <a-col :span="6">{{ model.mtime | formatDate }}</a-col>
        <a-col :span="5">{{ model.size | filterSize }}</a-col>
      </a-row>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { ArrangeWay, ResourceItem } from './ResourceModel'

export default Vue.extend({
  name: 'resource-item',
  props: {
    model: Object,
    index: Number,
    arrangeWay: {
      required: true,
      type: Number,
      validator: (value) => {
        return [ArrangeWay.horizontal, ArrangeWay.vertical].indexOf(value) !== -1
      }
    }
  },
  filters: {
    formatDate (value) {
      let date: any = new Date(value);
      let y: any = date.getFullYear();
      let MM: any = date.getMonth() + 1;
      MM = MM < 10 ? ('0' + MM) : MM;
      let d = date.getDate();
      d = d < 10 ? ('0' + d) : d;
      let h = date.getHours();
      h = h < 10 ? ('0' + h) : h;
      let m = date.getMinutes();
      m = m < 10 ? ('0' + m) : m;
      let s = date.getSeconds();
      s = s < 10 ? ('0' + s) : s;
      return y + '-' + MM + '-' + d + ' ' + h + ':' + m + ':' + s;
    },
    filterPath (value) {
      return value.substr(1, value.length); ;
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
  computed: {
    isHorizontalArrange: function () {
      return this.arrangeWay === ArrangeWay.horizontal
    },
    isOddStyle: function () {
      const myThis = this as any
      return myThis.index % 2
    }
  },
  methods: {
    searchResourceIcon (type) {
      switch (type) {
        case 0:
          return require('../../assets/resource/html_icon.png')
        case 1:
          return require('../../assets/resource/video_icon.png')
        case 2:
          return require('../../assets/resource/audio_icon.png')
        case 3:
          return require('../../assets/resource/image_icon.png')
        case 4:
          return require('../../assets/resource/txt_icon.png')
        case 5:
          return require('../../assets/resource/pdf_icon.png')
        case 6:
          return require('../../assets/resource/folder_icon.png')
      }
      return require('../../assets/resource/unkonw_icon.png')
    }
  }
})
</script>

<style lang="less" scoped>
.horizontal-item {
  padding: 20px 0px;
  border-radius: 4px;
  cursor: pointer;
  img {
    width: 35px;
    height: 29px;
    margin-bottom: 20px;
  }
  span {
    display: block;
    font-size: 12px;
    line-height: 12px;
    color: #484848;
    text-overflow: -o-ellipsis-lastline;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
  }
}
.horizontal-item:hover {
  background-color: #ECECEC;
}
.vertical-item {
  color: #484848;
  font-size: 12px;
  text-align: left;
  background-color: white;
  cursor: pointer;
  img {
    width: 19px;
    height: 16px;
    margin: 10px 10px 10px 20px;
    vertical-align: middle;
  }
}
.vertical-item:hover {
  background-color: #F4F5F7;
}
.vertical-item:active {
  background-color: #ECECEC;
}
.oddVerticalItem {
  background-color: #FCFBFE;
}
</style>
