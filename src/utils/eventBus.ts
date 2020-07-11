import Vue from 'vue'

export const EventBus = new Vue()

enum EventType {
  showToast = 'show_toast',
  disconnect = 'disconnect_action',
  reloginEncrypt = 'relogin_encrypt'
}

export {
  EventType
}
