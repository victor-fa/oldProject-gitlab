<template>
  <div>
    <div class="window-menu" style="-webkit-app-region: drag">
      <custom-button
        v-if="closable"
        :image="menuIcons.close"
        iconWidth="9px"
        class="close-item"
        @click.native="handleCallbackModal('askClose')"
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
    <close-choice-model :visiable="showChoiceModal" v-on:choiceCallback="handleCallbackModal"/>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import CustomButton from '../CustomButton/index.vue'
import { menuIcons } from './MenuIcons'
import CloseChoiceModel from '../WindowMenu/CloseChoiceModel.vue'
import { CLOSE_CHOICE } from '@/common/constants'

const { BrowserWindow } = require('electron').remote

export default Vue.extend({
  name: 'window_menu',
  components: {
    CustomButton,
    CloseChoiceModel
  },
  data () {
    return {
      menuIcons,
			ButtonState: 'sf-icon-window-maximize',
      win: false as any,
      zoomChange: false,
      showChoiceModal: false
    }
  },
	props: {
		configure: {
			type: String
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
    },
    ...mapGetters('Setting', ['closeInfo'])
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
    },
    handleCallbackModal (callback) {
      switch (callback) {
        case 'askClose':  // 仅windows下有托盘概念
          this.handleClose()
          break;
        case 'close':
          this.showChoiceModal = false
          break;
        case 'tray':
          this.showChoiceModal = false
          setTimeout(() => this.win.hide(), 500);
          break;
        case 'exit':
          this.closeAction()
          break;
        default:
          break;
      }
    },
    handleClose () {
      if (process.platform !== 'win32') {
        this.closeAction()
        return
      }
      const closeChoice = localStorage.getItem(CLOSE_CHOICE) as any
      if (_.isEmpty(closeChoice)) {
        this.configure === 'unable' ? this.closeAction() : this.showChoiceModal = true
        return
      }
      const closeChoiceJson = JSON.parse(closeChoice)
      if (closeChoiceJson.remember) {
        closeChoiceJson.trayOrExit === 'tray' ? this.handleCallbackModal('tray') : this.closeAction()
      } else {
        this.configure === 'unable' ? this.closeAction() : this.showChoiceModal = true
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
