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
import Vue from 'vue'
import MainView from '../MainView/index.vue'
import MainViewMixin from '../MainView/MainViewMixin'

export default Vue.extend({
  name: 'backup',
  components: {
    MainView
  },
  mixins: [MainViewMixin],
  data () {
    return {
      loading: false,
      currentPath: '备份',
      dataArray: [],
      page: 1,
      busy: false
    }
  }
})
</script>

<style scoped>

</style>
