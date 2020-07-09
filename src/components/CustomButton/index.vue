<template>
  <div 
    class="custom-button"
    :disabled="disable"
    :title="title"
    @click="clickAction"
    @mousedown="mousedownAction"
    @mouseup="mouseupAction"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    v-bind:class="{ 'highlight-style': isHighlight, 'disable-style': disable }"
  >
    <img :src="currentImage" :style="{ width: this.iconWidth }">
    <label class="button-title" v-if="isShowLabel">
      {{ currentTitle }}
    </label>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'

export default Vue.extend({
  name: 'custom-button',
  model: {
    prop: 'isSelected',
    event: 'changeSelect'
  },
  props: {
    title: String,
    text: String,
    selectedTitle: String,
    iconWidth: String,
    isSelected: {
      default: false
    },
    image: {
      default: null
    },
    selectedImage: {
      default: null
    },
    highlightImage: {
      default: null
    },
    hoverImage: {
      default: null
    },
    disable: {
      default: false
    },
    disableImage: {
      default: null
    }
  },
  data () {
    return {
      currentTitle: this.text,
      currentImage: this.image,
      isHover: false,
      isHighlight: false
    }
  },
  mounted () {
    if (this.disable === true) this.changeDisableStyle()
  },
  computed: {
    isShowLabel: function (): boolean {
      if (!_.isEmpty(this.text) || !_.isEmpty(this.selectedTitle)) {
        return true
      }
      return false
    }
  },
  watch: {
    isSelected: function (value: boolean) {
      if (this.selectedImage === null && this.selectedTitle === null) return
      value ? this.changeSelectStyle() : this.changeNormalStyle()
    },
    isHover: function (value: boolean) {
      if (this.hoverImage === null) return
      value ? this.changeHoverStyle() : this.changeNormalStyle()
    },
    isHighlight: function (value: boolean) {
      if (this.highlightImage === null) return
      value ? this.changeHighlightStyle() : this.changeNormalStyle()
    },
    disable: function (value: boolean) {
      value === true ? this.changeDisableStyle() : this.changeNormalStyle()
    }
  },
  methods: {
    clickAction (event: MouseEvent) {
      this.$emit('changeSelect', !this.isSelected)
    },
    mousedownAction () {
      if (this.disable) return
      this.isHighlight = true
    },
    mouseupAction () {
      if (this.disable) return
      this.isHighlight = false
      this.isHover = false
    },
    handleMouseEnter () {
      if (this.disable) return
      this.isHover = true
    },
    handleMouseLeave () {
      if (this.disable) return
      this.isHighlight = false
      this.isHover = false
    },
    changeNormalStyle () {
      this.currentTitle = this.text
      this.currentImage = this.image
    },
    // 背景图片可有可无，标题和icon选中状态同默认状态
    changeSelectStyle () {
      this.selectedTitle && (this.currentTitle = this.selectedTitle)
      this.selectedImage && (this.currentImage = this.selectedImage)
    },
    changeHighlightStyle () {
      this.highlightImage !== null && (this.currentImage = this.highlightImage)
    },
    changeHoverStyle () {
      this.hoverImage !== null && (this.currentImage = this.hoverImage)
    },
    changeDisableStyle () {
      this.disableImage !== null && (this.currentImage = this.disableImage)
    }
  }
})
</script>

<style lang="less" scoped>
.custom-button {
  -webkit-app-region: no-drag;
  border-radius: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  .button-title {
    font-size: 13px;
    color: black;
    margin-left: 6px;
  }
}
.custom-button:hover {
  cursor: pointer;
  .button-title:hover {
    cursor: pointer;
  }
}
.highlight-style {
  background-color: #EDEFF4;
}
.disable-style {
  pointer-events: none;
  cursor: default !important;
  .button-title {
    color: #00000080;
    cursor: default !important;
  }
}
</style>
