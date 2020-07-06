import Vue from 'vue'

export const EventBus = new Vue()

enum EventType {
  backAction = 'back_action',
  refreshAction = 'refresh_action',
  categoryChangeAction = 'category_change_action',
  sortWayChangeAction = 'sort_way_change_action',
  arrangeChangeAction = 'arrange_change_action',
  transportChangeAction = 'transport_change_action',
  leftMenuChangeAction = 'left_Menu_change_action',
  showToast = 'show_toast',
  downloadChangeAction = 'download_change_action',
  disconnect = 'disconnect_action'
}

export {
  EventType
}
