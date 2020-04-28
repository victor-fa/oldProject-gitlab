<template>
  <main-view
    :loading="loading"
    :currentPath="currentPath"
    :dataSource="dataArray"
    v-on:headerCallbackActions="handleHeaderActions"
    v-on:listCallbackActions="handleListActions"
    v-on:itemCallbackActions="handleItemActions"
    v-on:contextMenuCallbackActions="handleContextMenuActions"
  />
</template>

<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import MainView from '../MainView/index.vue'
import MainViewMixin from '../MainView/MainViewMixin'

export default Vue.extend({
  name: 'custom',
  components: {
    MainView
  },
  mixins: [MainViewMixin],
  data () {
    return {
      loading: false,
      currentPath: '精选',
      dataArray: []
    }
  },
  computed: {
    ...mapGetters('User', ['user'])
  },
  methods: {
  }
})
interface PageConfig {
  path: string, 
  uuid: string
}
</script>

<style lang="less" scoped>

</style>
