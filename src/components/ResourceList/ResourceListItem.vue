<template>
  <div>
    <div
      v-if="isHorizontalArrange"
      class="horizontal-item"
    >
      <img :src="searchResourceIcon(model.type)"/>
      <span>{{ model.name }}</span>
    </div>
    <div
      v-else
      class="vertical-item"
      v-bind:class="{ oddVerticalItem: isOddStyle }"
    >
      <a-row type="flex" justify="space-around" align="middle">
        <a-col :span="13">
          <img :src="searchResourceIcon(model.type)">
          {{ model.name }}
        </a-col>
        <a-col :span="6">{{ model.modifyTime }}</a-col>
        <a-col :span="5">{{ model.memory }}</a-col>
      </a-row>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { ArrangeWay, ResourceType, ResourceItem } from './resourceModel'

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
  computed: {
    isHorizontalArrange: function () {
      return this.arrangeWay === ArrangeWay.horizontal
    },
    isOddStyle: function () {
      return this.index % 2
    }
  },
  methods: {
    searchResourceIcon (type: ResourceType) {
      switch (type) {
        case ResourceType.folder:
          return require('../../assets/resource/folder_icon.png')
        case ResourceType.html:
          return require('../../assets/resource/html_icon.png')
        case ResourceType.image:
          return require('../../assets/resource/image_icon.png')
        case ResourceType.audio:
          return require('../../assets/resource/audio_icon.png')
        case ResourceType.video:
          return require('../../assets/resource/video_icon.png')
        case ResourceType.pdf:
          return require('../../assets/resource/pdf_icon.png')
        case ResourceType.txt:
          return require('../../assets/resource/txt_icon.png')
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
  background-color: #f6f8fb;
}
</style>
