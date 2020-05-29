<template>
  <div class="window-menu" style="-webkit-app-region: drag">
    <custom-button
      v-if="closable"
      :image="menuIcons.close"
      iconWidth="9px"
      class="close-item"
      @click.native="closeAction"
    />
    <custom-button
      v-if="resizable"
      :image="menuIcons.maximize"
      :selectedImage="menuIcons.minimun"
      :isSelected="zoomChange"
      iconWidth="11px"
      class="resize-item"
      @click.native="resizeAction"
    />
    <custom-button
      v-if="minimizable"
      :image="menuIcons.hide"
      iconWidth="10px"
      class="hide-item"
      @click.native="hideAction"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import CustomButton from '../CustomButton/index.vue'
import { menuIcons } from './MenuIcons'

const { BrowserWindow } = require('electron').remote

export default Vue.extend({
  name: 'window_menu',
  components: {
    CustomButton
  },
  data () {
    return {
      menuIcons,
			ButtonState: 'sf-icon-window-maximize',
      win: false as any,
      zoomChange: false
    }
  },
  computed: {
    closable: function () {
      const win = BrowserWindow.getFocusedWindow()
      if (win !== null) {
        return win.closable
      }
      return true
    },
    resizable: function () {
      const win = BrowserWindow.getFocusedWindow()
      if (win !== null) {
        return win.resizable
      }
      return true
    },
    minimizable: function () {
      const win = BrowserWindow.getFocusedWindow()
      if (win !== null) {
        return win.minimizable
      }
      return true
    }
  },
	created() {
    const _this = this as any
    this.win = _this.$electron.remote.getCurrentWindow();
		this.bind();
  },
  methods: {
		bind() {
			this.win.on('maximize', () => {
				this.ButtonState = 'sf-icon-window-restore';
			});
			this.win.on('unmaximize', () => {
				this.ButtonState = 'sf-icon-window-maximize';
			});
		},
    closeAction () {
      const win = BrowserWindow.getFocusedWindow()
      if (win !== null) {
        // this.$store.dispatch('Transform/saveTransInfo') // 关窗口时，对上传下载的store进行保存
        win.close()
      }
    },
    hideAction () {
      const win = BrowserWindow.getFocusedWindow()
      if (win !== null) {
        win.minimize()
      }
    },
    resizeAction () {
      if (this.win !== null) {
        this.win.isMaximized() ? this.win.restore() : this.win.maximize()
        this.zoomChange = !this.zoomChange
      }
    }
  }
})
</script>

<style lang="less" scoped>
.window-menu {
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
  .close-item {
    height: 20px;
    width: 20px;
    -webkit-app-region: no-drag;
  }
  .resize-item {
    height: 20px;
    width: 20px;
    margin-right: 5px;
    -webkit-app-region: no-drag;
  }
  .hide-item {
    height: 20px;
    width: 20px;
    margin-right: 8px;
    -webkit-app-region: no-drag;
  }
}
</style>
