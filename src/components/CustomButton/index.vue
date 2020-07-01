<template>
  <div 
    class="custom-button" 
    :style="backgroundStyle"
  >
    <a-button
      ghost
      block
      :disabled="disable"
      :title="title"
      @click.native="clickAction"
      @mousedown="mousedownAction"
      @mouseup="mouseupAction"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <label class="button-title" v-if="isShowLabel">
        {{ currentTitle }}
      </label>
      <img :src="currentImage" :style="{width: this.iconWidth}">
    </a-button>
  </div>
</template>

<script lang="ts">
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
    backgroundImage: {
      default: null
    },
    selectedBackgroundImage: {
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
      currentBackgroundImage: this.backgroundImage,
      isHover: false,
      isHighlight: false
    }
  },
  mounted () {
    if (this.disable === true) this.changeDisableStyle()
  },
  computed: {
    backgroundStyle: function (): object {
      return {
        backgroundImage: require('../../assets/func_button_bg.png'),
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%'
      }
    },
    isShowLabel: function (): boolean {
      if (this.text || this.selectedTitle) {
        return true
      }
      return false
    }
  },
  watch: {
    isSelected: function (value: boolean) {
      if (this.selectedImage === null && this.selectedTitle === null && this.selectedBackgroundImage === null) return
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
      this.isHighlight = true
    },
    mouseupAction () {
      this.isHighlight = false
    },
    handleMouseEnter () {
      this.isHover = true
    },
    handleMouseLeave () {
      this.isHover = false
    },
    changeNormalStyle () {
      this.currentTitle = this.text
      this.currentImage = this.image
      this.currentBackgroundImage = this.backgroundImage
    },
    // 背景图片可有可无，标题和icon选中状态同默认状态
    changeSelectStyle () {
      this.selectedTitle && (this.currentTitle = this.selectedTitle)
      this.selectedImage && (this.currentImage = this.selectedImage)
      this.selectedBackgroundImage && (this.currentBackgroundImage = this.selectedBackgroundImage)
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
  display: inline-block;
  line-height: 100%;
  -webkit-app-region: no-drag;
  .button-title {
    font-size: 14px;
    color: #000;
    margin-right: 4px;
  }
  .ant-btn {
    height: 100%;
    padding: 0px;
    border: none;
    box-shadow: none;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>

<style>
.custom-button .ant-btn[disabled] {
  cursor: default;
}
</style>
