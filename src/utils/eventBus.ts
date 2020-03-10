import Vue from 'vue'

export const EventBus = new Vue()

enum EventType {
  backAction = 'back_action',
  categoryChangeAction = 'category_change_action',
  arrangeChangeAction = 'arrange_change_action',
  leftMenuChangeAction = 'left_menu_change_action',
  pushLoginSecondPage = 'push_login_second_page',
  showToast = 'show_toast'
}

export {
  EventType
}
