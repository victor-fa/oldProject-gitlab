import Vue from 'vue'

export const EventBus = new Vue()

enum EventType {
  backAction = 'back_action',
  categoryChangeAction = 'category_change_action',
  arrangeChangeAction = 'arrange_change_action'
}

export {
  EventType
}
