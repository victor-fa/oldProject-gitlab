<template>
  <div class="custom-button" :style="backgroundStyle">
    <a-button
      ghost
      block
      v-on:click.native="clickAction"
      v-on:mousedown="mousedownAction"
      v-on:mouseup="mouseupAction"
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
  props: {
    title: String,
    selectedTitle: String,
    iconWidth: String,
    image: {
      default: null
    },
    selectedImage: {
      default: null
    },
    backgroundImage: {
      default: null
    },
    selectedBackgroundImage: {
      default: null
    }
  },
  data () {
    return {
      currentTitle: this.title,
      currentImage: this.image,
      currentBackgroundImage: this.backgroundImage,
      isSelected: false,
      isHighlighted: false,
      isHover: false
    }
  },
  computed: {
    backgroundStyle: function (): object {
      return {
        backgroundImage: 'url(' + this.currentBackgroundImage + ')',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%'
      }
    },
    isShowLabel: function (): boolean {
      if (this.title || this.selectedTitle) {
        return true
      }
      return false
    }
  },
  watch: {
    isSelected: function (value: boolean) {
      this.isSelected = value
      value ? this.changeSelectStyle() : this.changeNormalStyle()
    },
    isHighlighted: function (value: boolean) {
      this.isHighlighted = value
    }
  },
  methods: {
    clickAction: function (event: MouseEvent) {
      this.isSelected = !this.isSelected
    },
    mousedownAction: function () {
      this.isHighlighted = true
    },
    mouseupAction: function () {
      this.isHighlighted = false
    },
    changeNormalStyle: function () {
      this.currentTitle = this.title
      this.currentImage = this.image
      this.currentBackgroundImage = this.backgroundImage
    },
    // 背景图片可有可无，标题和icon选中状态同默认状态
    changeSelectStyle: function () {
      this.selectedTitle && (this.currentTitle = this.selectedTitle)
      this.selectedImage && (this.currentImage = this.selectedImage)
      this.currentBackgroundImage = this.selectedBackgroundImage
    }
  }
})
</script>

<style lang="less" scoped>
.custom-button {
  display: inline-block;
  line-height: 100%;
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
  }
}
</style>
