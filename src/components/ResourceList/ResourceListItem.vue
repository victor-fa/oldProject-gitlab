<template>
  <div>
    <div
      v-if="isHorizontalArrange"
      class="horizontal-item"
      v-bind:class="{ horizontalSelectedItem: isSelected }"
    >
      <img :src="searchResourceIcon(itemModel.type)"/>
      <span>{{ itemModel.name }}</span>
    </div>
    <div
      v-else
      class="vertical-item"
      v-bind:class="{ oddVerticalItem: isOddStyle, verticalSelectedItem: isSelected }"
    >
      <a-row type="flex" justify="space-around" align="middle">
        <a-col :span="13">
          <img :src="searchResourceIcon(itemModel.type)">
          {{ itemModel.name }}
        </a-col>
        <a-col :span="6">{{ itemModel.showMtime }}</a-col>
        <a-col :span="5">{{ itemModel.showSize }}</a-col>
      </a-row>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { ArrangeWay, ResourceItem, ResourceType } from '../../api/NasFileModel'
import StringUtility from '../../utils/StringUtility'

export default Vue.extend({
  name: 'resource-item',
  props: {
    model: Object,
    index: Number,
    isSelected: {
      default: false
    },
    arrangeWay: {
      required: true,
      type: Number,
      validator: (value) => {
        return [ArrangeWay.horizontal, ArrangeWay.vertical].indexOf(value) !== -1
      }
    }
  },
  data () {
    let item = this.model as ResourceItem
    item.name = StringUtility.formatName(item.path)
    item.showMtime = StringUtility.formatShowMtime(item.mtime)
    item.showSize = StringUtility.formatShowSize(item.size)
    return {
      itemModel: item
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
    searchResourceIcon (type: ResourceType) {
      switch (type) {
        case ResourceType.video:
          return require('../../assets/resource/video_icon.png')
        case ResourceType.audio:
          return require('../../assets/resource/audio_icon.png')
        case ResourceType.image:
          return require('../../assets/resource/image_icon.png')
        case ResourceType.document:
          return require('../../assets/resource/txt_icon.png')
        case ResourceType.archive:
          return require('../../assets/resource/pdf_icon.png')
        case ResourceType.floder:
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
.horizontalSelectedItem {
  background-color: #ececec;
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
.verticalSelectedItem {
  background-color: #ececec;
}
.oddVerticalItem {
  background-color: #FCFBFE;
}
</style>
