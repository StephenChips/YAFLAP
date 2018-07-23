import Vue from 'vue'

/** Bus for posting public message */
export var messageBus = new Vue()

/** Bus for posting public error */
export var errorBus = new Vue()
